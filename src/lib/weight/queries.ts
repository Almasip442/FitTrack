/**
 * Weight-log read-side queries — server-only.
 *
 * Backend Iteration 11 / Tasks 11.2, 11.3.
 *
 * Uses the cookie-bound Supabase server client so RLS evaluates against
 * the caller's session. Callers should be Server Components, Server
 * Actions, or Route Handlers.
 */

import { createClient } from '@/lib/supabase/server'
import type { WeightLog } from '@/types/database'

/* -------------------------------------------------------------------------- */
/*  Constants & helpers                                                        */
/* -------------------------------------------------------------------------- */

/** Default lookback window for getWeightLogs (in days). */
const DEFAULT_LOOKBACK_DAYS = 60

/**
 * Resolve the current authenticated user id, or `null` if the request is
 * unauthenticated.
 */
async function requireUserId(): Promise<string | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user?.id ?? null
}

/** Format a Date as `YYYY-MM-DD` in local time. */
function toIsoDateString(d: Date): string {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Return the Monday of the week containing `d` (week starts on Monday,
 * Hungarian convention) at local midnight.
 */
function startOfWeekMonday(d: Date): Date {
  const out = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  // getDay(): 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  const day = out.getDay()
  const diff = day === 0 ? -6 : 1 - day
  out.setDate(out.getDate() + diff)
  return out
}

/** Add `days` days to a date and return a new Date. */
function addDays(d: Date, days: number): Date {
  const out = new Date(d)
  out.setDate(out.getDate() + days)
  return out
}

/** Compute the arithmetic mean of a numeric array, or `null` if empty. */
function average(values: number[]): number | null {
  if (values.length === 0) return null
  const sum = values.reduce((acc, v) => acc + v, 0)
  return sum / values.length
}

/* -------------------------------------------------------------------------- */
/*  11.2 — getWeightLogs / getLatestWeightLog                                  */
/* -------------------------------------------------------------------------- */

/**
 * Return the user's weight logs from the last `days` days, sorted by
 * date ascending. Defaults to the last 60 days.
 *
 * Returns an empty array when the user is unauthenticated or has no
 * matching logs.
 */
export async function getWeightLogs(
  days: number = DEFAULT_LOOKBACK_DAYS,
): Promise<WeightLog[]> {
  const userId = await requireUserId()
  if (!userId) return []

  const window = Number.isInteger(days) && days > 0 ? days : DEFAULT_LOOKBACK_DAYS
  const since = toIsoDateString(addDays(new Date(), -window))

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('weight_logs')
    .select('*')
    .eq('user_id', userId)
    .gte('date', since)
    .order('date', { ascending: true })

  if (error) {
    throw new Error(`Failed to load weight logs: ${error.message}`)
  }

  return data ?? []
}

/**
 * Return the most recent weight log for the current user, or `null` if
 * there is none.
 */
export async function getLatestWeightLog(): Promise<WeightLog | null> {
  const userId = await requireUserId()
  if (!userId) return null

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('weight_logs')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    throw new Error(`Failed to load latest weight log: ${error.message}`)
  }

  return data
}

/* -------------------------------------------------------------------------- */
/*  11.3 — getWeightChangeSummary                                              */
/* -------------------------------------------------------------------------- */

export type WeightChangeSummary = {
  currentWeekAvg: number | null
  previousWeekAvg: number | null
  changeKg: number | null
  changePercent: number | null
}

/**
 * Compare the current week's average weight against the previous week's
 * average.
 *
 * - "Current week" = Monday of this week (00:00) through today, inclusive.
 * - "Previous week" = the Monday–Sunday before that, inclusive.
 *
 * If either week has no logged weight, that week's average is `null` and
 * `changeKg` / `changePercent` are also `null`.
 */
export async function getWeightChangeSummary(): Promise<WeightChangeSummary> {
  const empty: WeightChangeSummary = {
    currentWeekAvg: null,
    previousWeekAvg: null,
    changeKg: null,
    changePercent: null,
  }

  const userId = await requireUserId()
  if (!userId) return empty

  const today = new Date()
  const currentWeekStart = startOfWeekMonday(today)
  const previousWeekStart = addDays(currentWeekStart, -7)
  const previousWeekEnd = addDays(currentWeekStart, -1)

  const fromDate = toIsoDateString(previousWeekStart)
  const toDate = toIsoDateString(today)
  const currentStartIso = toIsoDateString(currentWeekStart)
  const previousEndIso = toIsoDateString(previousWeekEnd)

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('weight_logs')
    .select('date, weight')
    .eq('user_id', userId)
    .gte('date', fromDate)
    .lte('date', toDate)

  if (error) {
    throw new Error(`Failed to load weight change summary: ${error.message}`)
  }

  const rows = data ?? []
  const currentValues: number[] = []
  const previousValues: number[] = []

  for (const row of rows) {
    if (row.date >= currentStartIso) {
      currentValues.push(row.weight)
    } else if (row.date <= previousEndIso) {
      previousValues.push(row.weight)
    }
  }

  const currentWeekAvg = average(currentValues)
  const previousWeekAvg = average(previousValues)

  if (currentWeekAvg === null || previousWeekAvg === null) {
    return {
      currentWeekAvg,
      previousWeekAvg,
      changeKg: null,
      changePercent: null,
    }
  }

  const changeKg = currentWeekAvg - previousWeekAvg
  const changePercent =
    previousWeekAvg === 0 ? null : (changeKg / previousWeekAvg) * 100

  return {
    currentWeekAvg,
    previousWeekAvg,
    changeKg,
    changePercent,
  }
}
