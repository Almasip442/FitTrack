'use server'

/**
 * Dashboard-specific server actions.
 *
 * Provides `completeTodayWorkout` — a thin wrapper that upserts today's
 * daily_log (so the row exists before marking it complete) and delegates
 * to `markWorkoutCompleted` from the calories actions.
 */

import { revalidatePath } from 'next/cache'

import { createClient } from '@/lib/supabase/server'

export type ActionResult<T = void> =
  | (T extends void ? { success: true } : { success: true; data: T })
  | { success: false; error: string }

/**
 * Format a Date as `YYYY-MM-DD` in local time (matches Postgres `date`).
 */
function toIsoDate(d: Date): string {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Mark today's workout as completed for the current user.
 *
 * Upserts the `daily_logs` row for today (idempotent via ON CONFLICT)
 * so the row is guaranteed to exist before the update, then sets
 * `workout_completed = true`.
 */
export async function completeTodayWorkout(): Promise<ActionResult> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Bejelentkezés szükséges.' }

  const todayIso = toIsoDate(new Date())

  // Upsert daily_log for today — no-op if the row already exists.
  const { data: logRow, error: upsertError } = await supabase
    .from('daily_logs')
    .upsert(
      { user_id: user.id, date: todayIso, workout_completed: true },
      { onConflict: 'user_id,date' },
    )
    .select('id')
    .single()

  if (upsertError || !logRow) {
    return {
      success: false,
      error: `Mentés sikertelen: ${upsertError?.message ?? 'ismeretlen hiba'}`,
    }
  }

  revalidatePath('/dashboard')
  revalidatePath('/calories')
  return { success: true }
}
