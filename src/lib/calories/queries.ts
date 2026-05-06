/**
 * Calorie tracking read-side queries — server-only.
 *
 * Backend Iteration 9 / Tasks 9.1, 9.2 (read).
 *
 * Uses the Supabase server client (cookie-bound) so RLS evaluates against
 * the caller's session. Callers should be Server Components, Server
 * Actions, or Route Handlers.
 *
 * Every function returns a safe default (`null`, `[]`, or zeroed
 * aggregates) when the user is unauthenticated, so callers never need
 * to special-case the missing-session path.
 */

import { createClient } from '@/lib/supabase/server'
import type { DailyLog, FoodEntry } from '@/types/database'

/* -------------------------------------------------------------------------- */
/*  Aggregate return types                                                     */
/* -------------------------------------------------------------------------- */

export type DailySummary = {
  total_calories: number
  total_protein: number
  total_carbs: number
  total_fat: number
}

export type CalorieTrendPoint = {
  date: string
  total_calories: number
}

/* -------------------------------------------------------------------------- */
/*  Auth helper                                                                */
/* -------------------------------------------------------------------------- */

async function requireUserId(): Promise<string | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user?.id ?? null
}

/* -------------------------------------------------------------------------- */
/*  Internal helpers                                                           */
/* -------------------------------------------------------------------------- */

/** Format a Date as `YYYY-MM-DD` in UTC (matches Postgres `date` columns). */
function toIsoDate(d: Date): string {
  const yyyy = d.getUTCFullYear()
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0')
  const dd = String(d.getUTCDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

/** Sum a numeric column safely, treating null/undefined as zero. */
function sumField(rows: FoodEntry[], field: keyof FoodEntry): number {
  let total = 0
  for (const r of rows) {
    const v = r[field]
    if (typeof v === 'number' && Number.isFinite(v)) total += v
  }
  return total
}

/* -------------------------------------------------------------------------- */
/*  9.1 — Daily log lookups                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Return the daily log for the current user on a given date, or `null`
 * if no row exists yet. Does NOT create a log.
 *
 * @param date ISO `YYYY-MM-DD` date string.
 */
export async function getDailyLog(date: string): Promise<DailyLog | null> {
  const userId = await requireUserId()
  if (!userId) return null

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('daily_logs')
    .select('*')
    .eq('user_id', userId)
    .eq('date', date)
    .maybeSingle()

  if (error) {
    throw new Error(`Failed to load daily log: ${error.message}`)
  }

  return data
}

/**
 * Return the daily log for the current user on a given date, creating
 * one with default values if it does not yet exist.
 *
 * Uses an UPSERT on the `(user_id, date)` unique constraint to avoid
 * the read-then-insert race where two concurrent callers would both
 * try to create the row.
 *
 * Throws if the user is unauthenticated.
 */
export async function getOrCreateDailyLog(date: string): Promise<DailyLog> {
  const userId = await requireUserId()
  if (!userId) {
    throw new Error('Bejelentkezés szükséges.')
  }

  const supabase = await createClient()

  // Upsert is idempotent on (user_id, date). `ignoreDuplicates: true`
  // ensures we don't bump `created_at` when the row already exists.
  const { error: upsertError } = await supabase
    .from('daily_logs')
    .upsert(
      { user_id: userId, date },
      { onConflict: 'user_id,date', ignoreDuplicates: true },
    )

  if (upsertError) {
    throw new Error(`Failed to create daily log: ${upsertError.message}`)
  }

  // Read back the canonical row so callers always get a non-null result.
  const { data, error } = await supabase
    .from('daily_logs')
    .select('*')
    .eq('user_id', userId)
    .eq('date', date)
    .single()

  if (error || !data) {
    throw new Error(
      `Failed to load daily log after upsert: ${error?.message ?? 'no row returned'}`,
    )
  }

  return data
}

/* -------------------------------------------------------------------------- */
/*  9.2 — Food entries for a log                                               */
/* -------------------------------------------------------------------------- */

/**
 * Return every food entry attached to a daily log, ordered by creation
 * time. Ownership is enforced by RLS via the parent `daily_logs.user_id`
 * relationship.
 */
export async function getFoodEntriesForLog(
  dailyLogId: string,
): Promise<FoodEntry[]> {
  const userId = await requireUserId()
  if (!userId) return []

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('food_entries')
    .select('*')
    .eq('daily_log_id', dailyLogId)
    .order('created_at', { ascending: true })

  if (error) {
    throw new Error(`Failed to load food entries: ${error.message}`)
  }

  return data ?? []
}

/* -------------------------------------------------------------------------- */
/*  9.2 — Aggregated daily macros                                              */
/* -------------------------------------------------------------------------- */

/**
 * Return the summed macro nutrients for a daily log.
 *
 * Aggregation is done client-side in JS: a typical day has well under
 * a hundred entries, so the extra trip is negligible and we avoid
 * adding another RPC. Returns zeroes for an empty log.
 */
export async function getDailySummary(
  dailyLogId: string,
): Promise<DailySummary> {
  const entries = await getFoodEntriesForLog(dailyLogId)

  return {
    total_calories: sumField(entries, 'calories'),
    total_protein: sumField(entries, 'protein'),
    total_carbs: sumField(entries, 'carbs'),
    total_fat: sumField(entries, 'fat'),
  }
}

/* -------------------------------------------------------------------------- */
/*  9.2 — Weekly calorie trend                                                 */
/* -------------------------------------------------------------------------- */

/**
 * Return a per-day calorie total covering the most recent `days` days
 * (default 7), inclusive of today and ordered chronologically (oldest
 * first). Days with no entries appear as zero so the consumer can render
 * a continuous time-series without gap-filling logic.
 *
 * Implementation note: a single nested-select query joins each
 * `daily_log` to its `food_entries`. Aggregation happens in JS to keep
 * the SQL surface small and avoid an extra RPC.
 */
export async function getWeeklyCalorieTrend(
  days: number = 7,
): Promise<CalorieTrendPoint[]> {
  const userId = await requireUserId()
  if (!userId) return []

  const span = Number.isInteger(days) && days > 0 ? days : 7

  // Build the inclusive date window [start, today] in UTC.
  const today = new Date()
  const start = new Date(today)
  start.setUTCDate(start.getUTCDate() - (span - 1))

  const startIso = toIsoDate(start)
  const endIso = toIsoDate(today)

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('daily_logs')
    .select('date, food_entries ( calories )')
    .eq('user_id', userId)
    .gte('date', startIso)
    .lte('date', endIso)

  if (error) {
    throw new Error(`Failed to load calorie trend: ${error.message}`)
  }

  // Map each log row to its summed calories, indexed by date.
  // The `Relationships: []` placeholders in `database.ts` mean nested
  // selects come back as `SelectQueryError`; we cast through `unknown`
  // because the runtime shape is correct (PostgREST resolves the FK).
  type LogWithEntries = {
    date: string
    food_entries: { calories: number | null }[] | null
  }
  const totals = new Map<string, number>()
  for (const row of (data as unknown as LogWithEntries[] | null) ?? []) {
    const sum = (row.food_entries ?? []).reduce(
      (acc, e) => acc + (typeof e.calories === 'number' ? e.calories : 0),
      0,
    )
    totals.set(row.date, sum)
  }

  // Emit a continuous series, filling missing days with zero.
  const series: CalorieTrendPoint[] = []
  for (let i = 0; i < span; i++) {
    const d = new Date(start)
    d.setUTCDate(start.getUTCDate() + i)
    const iso = toIsoDate(d)
    series.push({ date: iso, total_calories: totals.get(iso) ?? 0 })
  }

  return series
}
