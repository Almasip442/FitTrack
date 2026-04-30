/**
 * Workout-plan read-side queries — server-only.
 *
 * Backend Iteration 7 / Tasks 7.2, 7.3, 7.10 (read).
 *
 * Uses the Supabase server client (cookie-bound) so RLS evaluates against
 * the caller's session. Callers should be Server Components, Server
 * Actions, or Route Handlers.
 */

import { createClient } from '@/lib/supabase/server'
import type {
  Exercise,
  WorkoutDay,
  WorkoutDayExercise,
  WorkoutExerciseLog,
  WorkoutPlan,
} from '@/types/database'

/* -------------------------------------------------------------------------- */
/*  Composite return types                                                     */
/* -------------------------------------------------------------------------- */

/**
 * A `workout_day_exercises` row joined with its `exercises` catalog entry.
 */
export type WorkoutDayExerciseWithExercise = WorkoutDayExercise & {
  exercises: Exercise | null
}

/**
 * A `workout_days` row with all of its child exercise entries.
 */
export type WorkoutDayWithExercises = WorkoutDay & {
  workout_day_exercises: WorkoutDayExerciseWithExercise[]
}

/**
 * A `workout_plans` row with the full nested day + exercise tree.
 */
export type WorkoutPlanWithDays = WorkoutPlan & {
  workout_days: WorkoutDayWithExercises[]
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
/*  Plan list                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * Return every workout plan owned by the current user.
 *
 * Plans are sorted with the active plan first, then most recently
 * created. Returns an empty array when the user is unauthenticated or
 * has no plans.
 */
export async function getWorkoutPlans(): Promise<WorkoutPlan[]> {
  const userId = await requireUserId()
  if (!userId) return []

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('workout_plans')
    .select('*')
    .eq('user_id', userId)
    .order('is_active', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to load workout plans: ${error.message}`)
  }

  return data ?? []
}

/**
 * Return the currently active workout plan for the user, or `null` if
 * none is active.
 */
export async function getActiveWorkoutPlan(): Promise<WorkoutPlan | null> {
  const userId = await requireUserId()
  if (!userId) return null

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('workout_plans')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .maybeSingle()

  if (error) {
    throw new Error(`Failed to load active workout plan: ${error.message}`)
  }

  return data
}

/* -------------------------------------------------------------------------- */
/*  Plan with full day + exercise tree                                         */
/* -------------------------------------------------------------------------- */

/**
 * Load a single workout plan with all of its days and exercises in
 * deterministic order.
 *
 * Returns `null` if the plan does not exist or is hidden by RLS (i.e.
 * does not belong to the current user).
 */
export async function getWorkoutPlanWithDays(
  planId: string,
): Promise<WorkoutPlanWithDays | null> {
  const userId = await requireUserId()
  if (!userId) return null

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('workout_plans')
    .select(
      `
      *,
      workout_days (
        *,
        workout_day_exercises (
          *,
          exercises (*)
        )
      )
    `,
    )
    .eq('id', planId)
    .eq('user_id', userId)
    .order('day_order', { referencedTable: 'workout_days', ascending: true })
    .order('exercise_order', {
      referencedTable: 'workout_days.workout_day_exercises',
      ascending: true,
    })
    .maybeSingle()

  if (error) {
    throw new Error(`Failed to load workout plan: ${error.message}`)
  }

  return (data as WorkoutPlanWithDays | null) ?? null
}

/* -------------------------------------------------------------------------- */
/*  Workout exercise logs                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Return every per-exercise log row attached to a daily log.
 *
 * Ownership is enforced via RLS (workout_exercise_logs -> daily_logs).
 * Returns an empty array when the daily log does not belong to the
 * current user or has no logs.
 */
export async function getWorkoutExerciseLogs(
  dailyLogId: string,
): Promise<WorkoutExerciseLog[]> {
  const userId = await requireUserId()
  if (!userId) return []

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('workout_exercise_logs')
    .select('*')
    .eq('daily_log_id', dailyLogId)
    .order('created_at', { ascending: true })

  if (error) {
    throw new Error(`Failed to load workout exercise logs: ${error.message}`)
  }

  return data ?? []
}
