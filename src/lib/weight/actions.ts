'use server'

/**
 * Weight-log mutation Server Actions.
 *
 * Backend Iteration 11 / Task 11.1.
 *
 * Auth is enforced via the cookie-bound Supabase server client + RLS.
 * Each action explicitly short-circuits with a clean error string for the
 * unauthenticated case. Ownership of the deleted row is validated before
 * the mutation so callers get a deterministic "not found / not allowed"
 * response instead of a silent no-op from RLS.
 */

import { revalidatePath } from 'next/cache'

import { createClient } from '@/lib/supabase/server'
import type { WeightLog } from '@/types/database'

/* -------------------------------------------------------------------------- */
/*  Result types                                                               */
/* -------------------------------------------------------------------------- */

export type ActionResult<T = void> =
  | (T extends void ? { success: true } : { success: true; data: T })
  | { success: false; error: string }

/* -------------------------------------------------------------------------- */
/*  Internal helpers / constants                                               */
/* -------------------------------------------------------------------------- */

const AUTH_REQUIRED = 'Bejelentkezés szükséges.'
const NOT_FOUND = 'A kért elem nem található vagy nincs hozzáférésed.'

/** Plausible human body-weight bounds in kilograms. */
const MIN_WEIGHT_KG = 20
const MAX_WEIGHT_KG = 500

/** Strict `YYYY-MM-DD` matcher. */
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/

async function getAuthUserId(): Promise<string | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user?.id ?? null
}

/** Format `Date` as `YYYY-MM-DD` in local time. */
function toIsoDateString(d: Date): string {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Validate a `YYYY-MM-DD` calendar-date string. The date must:
 *  - match the strict ISO format,
 *  - be a real calendar date (no Feb 30, etc.),
 *  - not be in the future (relative to local "today").
 */
function validateDate(date: string): string | null {
  if (typeof date !== 'string' || !ISO_DATE_RE.test(date)) {
    return 'A dátum formátuma érvénytelen (YYYY-MM-DD szükséges).'
  }
  const parsed = new Date(`${date}T00:00:00`)
  if (Number.isNaN(parsed.getTime()) || toIsoDateString(parsed) !== date) {
    return 'A dátum nem egy valós naptári nap.'
  }
  if (date > toIsoDateString(new Date())) {
    return 'A dátum nem lehet a jövőből.'
  }
  return null
}

/**
 * Validate a body-weight value in kilograms.
 */
function validateWeight(weight: number): string | null {
  if (typeof weight !== 'number' || !Number.isFinite(weight)) {
    return 'A súly értéke érvénytelen.'
  }
  if (weight < MIN_WEIGHT_KG || weight > MAX_WEIGHT_KG) {
    return `A súlynak ${MIN_WEIGHT_KG} és ${MAX_WEIGHT_KG} kg között kell lennie.`
  }
  return null
}

/** Verify that a weight-log row belongs to the given user. */
async function ownsWeightLog(
  logId: string,
  userId: string,
): Promise<boolean> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('weight_logs')
    .select('id')
    .eq('id', logId)
    .eq('user_id', userId)
    .maybeSingle()
  if (error) return false
  return !!data
}

/** Refresh server-rendered surfaces affected by a weight-log mutation. */
function revalidateWeightSurfaces(): void {
  revalidatePath('/progress')
  revalidatePath('/dashboard')
}

/* -------------------------------------------------------------------------- */
/*  11.1 — upsertWeightLog                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Insert or update the weight entry for `(user_id, date)`. Requires the
 * unique constraint on `weight_logs(user_id, date)` to be in place.
 */
export async function upsertWeightLog(
  date: string,
  weight: number,
): Promise<ActionResult<WeightLog>> {
  const userId = await getAuthUserId()
  if (!userId) return { success: false, error: AUTH_REQUIRED }

  const dateError = validateDate(date)
  if (dateError) return { success: false, error: dateError }

  const weightError = validateWeight(weight)
  if (weightError) return { success: false, error: weightError }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('weight_logs')
    .upsert(
      {
        user_id: userId,
        date,
        weight,
      },
      { onConflict: 'user_id,date' },
    )
    .select('*')
    .single()

  if (error || !data) {
    return {
      success: false,
      error: `Mentés sikertelen: ${error?.message ?? 'ismeretlen hiba'}`,
    }
  }

  revalidateWeightSurfaces()
  return { success: true, data }
}

/* -------------------------------------------------------------------------- */
/*  11.1 — deleteWeightLog                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Delete a single weight-log entry owned by the current user.
 */
export async function deleteWeightLog(
  logId: string,
): Promise<ActionResult> {
  const userId = await getAuthUserId()
  if (!userId) return { success: false, error: AUTH_REQUIRED }

  if (typeof logId !== 'string' || logId.trim() === '') {
    return { success: false, error: 'Érvénytelen azonosító.' }
  }

  if (!(await ownsWeightLog(logId, userId))) {
    return { success: false, error: NOT_FOUND }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('weight_logs')
    .delete()
    .eq('id', logId)
    .eq('user_id', userId)

  if (error) {
    return { success: false, error: `Törlés sikertelen: ${error.message}` }
  }

  revalidateWeightSurfaces()
  return { success: true }
}
