'use server'

/**
 * Workout-plan mutation Server Actions.
 *
 * Backend Iteration 7 / Tasks 7.1, 7.4 – 7.10.
 *
 * Auth is enforced via the cookie-bound Supabase server client + RLS.
 * Each action explicitly short-circuits with a clean error string for
 * the unauthenticated case. Ownership of nested rows (days, exercises,
 * logs) is validated before the mutation so callers get a deterministic
 * "not found / not allowed" response instead of a silent no-op from
 * RLS.
 */

import { revalidatePath } from 'next/cache'

import { createClient } from '@/lib/supabase/server'
import type {
  WorkoutDay,
  WorkoutDayExercise,
  WorkoutExerciseLog,
  WorkoutPlan,
} from '@/types/database'

/* -------------------------------------------------------------------------- */
/*  Result types                                                               */
/* -------------------------------------------------------------------------- */

export type ActionResult<T = void> =
  | (T extends void ? { success: true } : { success: true; data: T })
  | { success: false; error: string }

/* -------------------------------------------------------------------------- */
/*  Internal helpers                                                           */
/* -------------------------------------------------------------------------- */

const AUTH_REQUIRED = 'Bejelentkezés szükséges.'
const NOT_FOUND = 'A kért elem nem található vagy nincs hozzáférésed.'

/**
 * Resolve the current authenticated user id, or return `null` if the
 * request is unauthenticated.
 */
async function getAuthUserId(): Promise<string | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user?.id ?? null
}

/** Verify that a workout plan belongs to the given user. */
async function ownsPlan(planId: string, userId: string): Promise<boolean> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('workout_plans')
    .select('id')
    .eq('id', planId)
    .eq('user_id', userId)
    .maybeSingle()
  if (error) return false
  return !!data
}

/**
 * Verify that a workout day's parent plan belongs to the given user,
 * and return the parent plan id when ownership holds.
 */
async function ownsDay(
  dayId: string,
  userId: string,
): Promise<string | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('workout_days')
    .select('id, plan_id, workout_plans!inner(user_id)')
    .eq('id', dayId)
    .eq('workout_plans.user_id', userId)
    .maybeSingle()
  if (error || !data) return null
  return data.plan_id
}

/**
 * Verify that a workout_day_exercises row's plan belongs to the given
 * user. Returns the parent workout_day_id when ownership holds.
 */
async function ownsDayExercise(
  rowId: string,
  userId: string,
): Promise<string | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('workout_day_exercises')
    .select(
      'id, workout_day_id, workout_days!inner(plan_id, workout_plans!inner(user_id))',
    )
    .eq('id', rowId)
    .eq('workout_days.workout_plans.user_id', userId)
    .maybeSingle()
  if (error || !data) return null
  return data.workout_day_id
}

/** Verify that a daily log row belongs to the given user. */
async function ownsDailyLog(dailyLogId: string, userId: string): Promise<boolean> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('daily_logs')
    .select('id')
    .eq('id', dailyLogId)
    .eq('user_id', userId)
    .maybeSingle()
  if (error) return false
  return !!data
}

/** Refresh server-rendered surfaces affected by a workout-plan mutation. */
function revalidateWorkoutSurfaces(): void {
  revalidatePath('/workouts')
  revalidatePath('/dashboard')
}

/* -------------------------------------------------------------------------- */
/*  7.1 — createWorkoutPlan                                                    */
/* -------------------------------------------------------------------------- */

export async function createWorkoutPlan(
  name: string,
): Promise<ActionResult<WorkoutPlan>> {
  const userId = await getAuthUserId()
  if (!userId) return { success: false, error: AUTH_REQUIRED }

  const trimmed = name.trim()
  if (!trimmed) return { success: false, error: 'A terv neve kötelező.' }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('workout_plans')
    .insert({ user_id: userId, name: trimmed })
    .select('*')
    .single()

  if (error || !data) {
    return { success: false, error: `Mentés sikertelen: ${error?.message ?? 'ismeretlen hiba'}` }
  }

  revalidateWorkoutSurfaces()
  return { success: true, data }
}

/* -------------------------------------------------------------------------- */
/*  7.4 — Workout day CRUD                                                     */
/* -------------------------------------------------------------------------- */

export async function addWorkoutDay(
  planId: string,
  dayName: string,
  dayOrder: number,
  dayOfWeek?: number,
): Promise<ActionResult<WorkoutDay>> {
  const userId = await getAuthUserId()
  if (!userId) return { success: false, error: AUTH_REQUIRED }

  const trimmedName = dayName.trim()
  if (!trimmedName) return { success: false, error: 'A nap neve kötelező.' }
  if (!Number.isInteger(dayOrder) || dayOrder < 0) {
    return { success: false, error: 'Érvénytelen sorrend.' }
  }
  if (
    dayOfWeek !== undefined &&
    (!Number.isInteger(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6)
  ) {
    return { success: false, error: 'Érvénytelen nap (0–6).' }
  }

  if (!(await ownsPlan(planId, userId))) {
    return { success: false, error: NOT_FOUND }
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('workout_days')
    .insert({
      plan_id: planId,
      day_name: trimmedName,
      day_order: dayOrder,
      day_of_week: dayOfWeek ?? null,
    })
    .select('*')
    .single()

  if (error || !data) {
    return { success: false, error: `Mentés sikertelen: ${error?.message ?? 'ismeretlen hiba'}` }
  }

  revalidateWorkoutSurfaces()
  return { success: true, data }
}

export type WorkoutDayUpdates = {
  day_name?: string
  day_of_week?: number | null
}

export async function updateWorkoutDay(
  dayId: string,
  updates: WorkoutDayUpdates,
): Promise<ActionResult> {
  const userId = await getAuthUserId()
  if (!userId) return { success: false, error: AUTH_REQUIRED }

  if (
    updates.day_name === undefined &&
    updates.day_of_week === undefined
  ) {
    return { success: false, error: 'Nincs frissítendő mező.' }
  }
  if (
    updates.day_name !== undefined &&
    updates.day_name.trim() === ''
  ) {
    return { success: false, error: 'A nap neve nem lehet üres.' }
  }
  if (
    updates.day_of_week !== undefined &&
    updates.day_of_week !== null &&
    (!Number.isInteger(updates.day_of_week) ||
      updates.day_of_week < 0 ||
      updates.day_of_week > 6)
  ) {
    return { success: false, error: 'Érvénytelen nap (0–6).' }
  }

  if (!(await ownsDay(dayId, userId))) {
    return { success: false, error: NOT_FOUND }
  }

  const patch: { day_name?: string; day_of_week?: number | null } = {}
  if (updates.day_name !== undefined) patch.day_name = updates.day_name.trim()
  if (updates.day_of_week !== undefined) patch.day_of_week = updates.day_of_week

  const supabase = await createClient()
  const { error } = await supabase
    .from('workout_days')
    .update(patch)
    .eq('id', dayId)

  if (error) {
    return { success: false, error: `Mentés sikertelen: ${error.message}` }
  }

  revalidateWorkoutSurfaces()
  return { success: true }
}

export async function deleteWorkoutDay(
  dayId: string,
): Promise<ActionResult> {
  const userId = await getAuthUserId()
  if (!userId) return { success: false, error: AUTH_REQUIRED }

  if (!(await ownsDay(dayId, userId))) {
    return { success: false, error: NOT_FOUND }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('workout_days')
    .delete()
    .eq('id', dayId)

  if (error) {
    return { success: false, error: `Törlés sikertelen: ${error.message}` }
  }

  revalidateWorkoutSurfaces()
  return { success: true }
}

/* -------------------------------------------------------------------------- */
/*  7.5 — addExerciseToDay                                                     */
/* -------------------------------------------------------------------------- */

export async function addExerciseToDay(
  workoutDayId: string,
  exerciseId: string,
  sets: number,
  reps: number,
  restSeconds: number,
  exerciseOrder: number,
): Promise<ActionResult<WorkoutDayExercise>> {
  const userId = await getAuthUserId()
  if (!userId) return { success: false, error: AUTH_REQUIRED }

  if (!Number.isInteger(sets) || sets <= 0) {
    return { success: false, error: 'Érvénytelen szettszám.' }
  }
  if (!Number.isInteger(reps) || reps <= 0) {
    return { success: false, error: 'Érvénytelen ismétlésszám.' }
  }
  if (!Number.isInteger(restSeconds) || restSeconds < 0) {
    return { success: false, error: 'Érvénytelen pihenőidő.' }
  }
  if (!Number.isInteger(exerciseOrder) || exerciseOrder < 0) {
    return { success: false, error: 'Érvénytelen sorrend.' }
  }

  if (!(await ownsDay(workoutDayId, userId))) {
    return { success: false, error: NOT_FOUND }
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('workout_day_exercises')
    .insert({
      workout_day_id: workoutDayId,
      exercise_id: exerciseId,
      sets,
      reps,
      rest_seconds: restSeconds,
      exercise_order: exerciseOrder,
    })
    .select('*')
    .single()

  if (error || !data) {
    return {
      success: false,
      error: `Mentés sikertelen: ${error?.message ?? 'ismeretlen hiba'}`,
    }
  }

  revalidateWorkoutSurfaces()
  return { success: true, data }
}

/* -------------------------------------------------------------------------- */
/*  7.5b — updateDayExercise (inline sets/reps/rest editing)                  */
/* -------------------------------------------------------------------------- */

export type DayExerciseUpdates = {
  sets?: number
  reps?: number
  rest_seconds?: number
  notes?: string | null
}

/**
 * Inline edit of an existing workout_day_exercises row — used by the
 * workout planner's stepper inputs (sets / reps / rest seconds).
 */
export async function updateDayExercise(
  rowId: string,
  updates: DayExerciseUpdates,
): Promise<ActionResult> {
  const userId = await getAuthUserId()
  if (!userId) return { success: false, error: AUTH_REQUIRED }

  const patch: {
    sets?: number
    reps?: number
    rest_seconds?: number
    notes?: string | null
  } = {}

  if (updates.sets !== undefined) {
    if (!Number.isInteger(updates.sets) || updates.sets <= 0 || updates.sets > 50) {
      return { success: false, error: 'Érvénytelen szettszám.' }
    }
    patch.sets = updates.sets
  }
  if (updates.reps !== undefined) {
    if (!Number.isInteger(updates.reps) || updates.reps <= 0 || updates.reps > 500) {
      return { success: false, error: 'Érvénytelen ismétlésszám.' }
    }
    patch.reps = updates.reps
  }
  if (updates.rest_seconds !== undefined) {
    if (!Number.isInteger(updates.rest_seconds) || updates.rest_seconds < 0 || updates.rest_seconds > 3600) {
      return { success: false, error: 'Érvénytelen pihenőidő.' }
    }
    patch.rest_seconds = updates.rest_seconds
  }
  if (updates.notes !== undefined) {
    patch.notes = updates.notes
  }

  if (Object.keys(patch).length === 0) {
    return { success: false, error: 'Nincs frissítendő mező.' }
  }

  if (!(await ownsDayExercise(rowId, userId))) {
    return { success: false, error: NOT_FOUND }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('workout_day_exercises')
    .update(patch)
    .eq('id', rowId)

  if (error) {
    return { success: false, error: `Mentés sikertelen: ${error.message}` }
  }

  revalidateWorkoutSurfaces()
  return { success: true }
}

/* -------------------------------------------------------------------------- */
/*  7.6 — removeExerciseFromDay                                                */
/* -------------------------------------------------------------------------- */

export async function removeExerciseFromDay(
  workoutDayExerciseId: string,
): Promise<ActionResult> {
  const userId = await getAuthUserId()
  if (!userId) return { success: false, error: AUTH_REQUIRED }

  if (!(await ownsDayExercise(workoutDayExerciseId, userId))) {
    return { success: false, error: NOT_FOUND }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('workout_day_exercises')
    .delete()
    .eq('id', workoutDayExerciseId)

  if (error) {
    return { success: false, error: `Törlés sikertelen: ${error.message}` }
  }

  revalidateWorkoutSurfaces()
  return { success: true }
}

/* -------------------------------------------------------------------------- */
/*  7.7 — updateExerciseOrder (batch via RPC)                                  */
/* -------------------------------------------------------------------------- */

export type ExerciseOrderUpdate = {
  id: string
  exercise_order: number
}

export async function updateExerciseOrder(
  updates: ExerciseOrderUpdate[],
): Promise<ActionResult> {
  const userId = await getAuthUserId()
  if (!userId) return { success: false, error: AUTH_REQUIRED }

  if (!Array.isArray(updates) || updates.length === 0) {
    return { success: false, error: 'Üres frissítési lista.' }
  }
  for (const u of updates) {
    if (!u.id || typeof u.id !== 'string') {
      return { success: false, error: 'Érvénytelen sor azonosító.' }
    }
    if (!Number.isInteger(u.exercise_order) || u.exercise_order < 0) {
      return { success: false, error: 'Érvénytelen sorrend érték.' }
    }
  }

  const supabase = await createClient()
  const { error } = await supabase.rpc('update_exercise_order', {
    updates: updates as unknown as never,
  })

  if (error) {
    return { success: false, error: `Sorrend mentése sikertelen: ${error.message}` }
  }

  revalidateWorkoutSurfaces()
  return { success: true }
}

/* -------------------------------------------------------------------------- */
/*  7.8 — setActivePlan (transactional via RPC)                                */
/* -------------------------------------------------------------------------- */

export async function setActivePlan(
  planId: string,
): Promise<ActionResult> {
  const userId = await getAuthUserId()
  if (!userId) return { success: false, error: AUTH_REQUIRED }

  if (!(await ownsPlan(planId, userId))) {
    return { success: false, error: NOT_FOUND }
  }

  const supabase = await createClient()
  const { error } = await supabase.rpc('set_active_workout_plan', {
    p_plan_id: planId,
    p_user_id: userId,
  })

  if (error) {
    return {
      success: false,
      error: `Aktív terv beállítása sikertelen: ${error.message}`,
    }
  }

  revalidateWorkoutSurfaces()
  return { success: true }
}

/* -------------------------------------------------------------------------- */
/*  7.9 — deleteWorkoutPlan                                                    */
/* -------------------------------------------------------------------------- */

export async function deleteWorkoutPlan(
  planId: string,
): Promise<ActionResult> {
  const userId = await getAuthUserId()
  if (!userId) return { success: false, error: AUTH_REQUIRED }

  if (!(await ownsPlan(planId, userId))) {
    return { success: false, error: NOT_FOUND }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('workout_plans')
    .delete()
    .eq('id', planId)
    .eq('user_id', userId)

  if (error) {
    return { success: false, error: `Törlés sikertelen: ${error.message}` }
  }

  revalidateWorkoutSurfaces()
  return { success: true }
}

/* -------------------------------------------------------------------------- */
/*  7.10 — workout_exercise_logs upsert                                        */
/* -------------------------------------------------------------------------- */

export type WorkoutExerciseLogInput = {
  sets_completed: number
  reps_completed: number[]
  weight_used: number[]
  notes?: string
}

export type WorkoutSessionExerciseInput = {
  exercise_id: string
  skipped: boolean
  reps_completed: number[]
  weight_used: number[]
}

function isIsoDate(value: string): boolean {
  if (typeof value !== 'string') return false
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const parsed = new Date(`${value}T00:00:00.000Z`)
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value
}

/** Load this user's detailed exercise logs for a calendar date, if present. */
export async function getWorkoutLogsForDate(date: string): Promise<{
  success: boolean
  logs: WorkoutExerciseLog[]
  error?: string
}> {
  const userId = await getAuthUserId()
  if (!userId) return { success: false, logs: [], error: AUTH_REQUIRED }
  if (!isIsoDate(date)) {
    return { success: false, logs: [], error: 'Érvénytelen dátum.' }
  }

  const supabase = await createClient()
  const { data: dailyLog, error: dailyLogError } = await supabase
    .from('daily_logs')
    .select('id')
    .eq('user_id', userId)
    .eq('date', date)
    .maybeSingle()

  if (dailyLogError) {
    return { success: false, logs: [], error: 'A napi edzésnapló nem tölthető be.' }
  }
  if (!dailyLog) return { success: true, logs: [] }

  const { data, error } = await supabase
    .from('workout_exercise_logs')
    .select('*')
    .eq('daily_log_id', dailyLog.id)
    .order('created_at', { ascending: true })

  if (error) {
    return { success: false, logs: [], error: 'A részletes edzésadatok nem tölthetők be.' }
  }

  return { success: true, logs: data ?? [] }
}

/** Save or update the detailed exercise log for a user-owned workout day. */
export async function saveWorkoutSession(
  date: string,
  workoutDayId: string,
  entries: WorkoutSessionExerciseInput[],
): Promise<ActionResult> {
  const userId = await getAuthUserId()
  if (!userId) return { success: false, error: AUTH_REQUIRED }
  if (!isIsoDate(date)) return { success: false, error: 'Érvénytelen dátum.' }
  if (!workoutDayId || !Array.isArray(entries) || entries.length === 0) {
    return { success: false, error: 'Nincs naplózható gyakorlat.' }
  }
  if (
    entries.some(
      (entry) =>
        !entry ||
        typeof entry.exercise_id !== 'string' ||
        typeof entry.skipped !== 'boolean' ||
        !Array.isArray(entry.reps_completed) ||
        !Array.isArray(entry.weight_used),
    )
  ) {
    return { success: false, error: 'Érvénytelen edzésnapló adat.' }
  }

  const exerciseIds = entries.map((entry) => entry.exercise_id)
  if (
    exerciseIds.some((id) => typeof id !== 'string' || id.length === 0) ||
    new Set(exerciseIds).size !== exerciseIds.length
  ) {
    return { success: false, error: 'Érvénytelen vagy ismétlődő gyakorlat.' }
  }
  if (entries.every((entry) => entry.skipped)) {
    return { success: false, error: 'Legalább egy gyakorlatot rögzíts elvégzettként.' }
  }
  for (const entry of entries) {
    if (entry.skipped) continue
    if (
      !Array.isArray(entry.reps_completed) ||
      !Array.isArray(entry.weight_used) ||
      entry.reps_completed.length === 0 ||
      entry.reps_completed.length !== entry.weight_used.length ||
      entry.reps_completed.some(
        (reps) => !Number.isInteger(reps) || reps < 0 || reps > 1000,
      ) ||
      entry.weight_used.some(
        (weight) => !Number.isFinite(weight) || weight < 0 || weight > 1000,
      )
    ) {
      return { success: false, error: 'Ellenőrizd a szériák ismétléseit és súlyait.' }
    }
  }

  const supabase = await createClient()
  const { data: day, error: dayError } = await supabase
    .from('workout_days')
    .select('id, workout_plans!inner(user_id)')
    .eq('id', workoutDayId)
    .eq('workout_plans.user_id', userId)
    .maybeSingle()
  if (dayError || !day) return { success: false, error: NOT_FOUND }

  const { data: plannedExercises, error: plannedError } = await supabase
    .from('workout_day_exercises')
    .select('exercise_id')
    .eq('workout_day_id', workoutDayId)
  if (plannedError) {
    return { success: false, error: 'Az edzésterv gyakorlatai nem ellenőrizhetők.' }
  }
  const plannedIds = new Set((plannedExercises ?? []).map((row) => row.exercise_id))
  if (exerciseIds.some((id) => !plannedIds.has(id))) {
    return { success: false, error: 'A napló olyan gyakorlatot tartalmaz, amely nincs ezen az edzésnapon.' }
  }

  const { error: createLogError } = await supabase
    .from('daily_logs')
    .upsert(
      { user_id: userId, date },
      { onConflict: 'user_id,date', ignoreDuplicates: true },
    )
  if (createLogError) {
    return { success: false, error: `A napi napló létrehozása sikertelen: ${createLogError.message}` }
  }

  const { data: dailyLog, error: findLogError } = await supabase
    .from('daily_logs')
    .select('id')
    .eq('user_id', userId)
    .eq('date', date)
    .single()
  if (findLogError || !dailyLog) {
    return { success: false, error: 'A napi napló nem található.' }
  }

  for (const entry of entries) {
    if (entry.skipped) {
      const { error } = await supabase.from('workout_exercise_logs').upsert(
        {
          daily_log_id: dailyLog.id,
          exercise_id: entry.exercise_id,
          skipped: true,
          sets_completed: 0,
          reps_completed: [],
          weight_used: [],
        },
        { onConflict: 'daily_log_id,exercise_id' },
      )
      if (error) {
        return { success: false, error: `A kihagyott gyakorlat frissítése sikertelen: ${error.message}` }
      }
      continue
    }

    const { error } = await supabase.from('workout_exercise_logs').upsert(
      {
        daily_log_id: dailyLog.id,
        exercise_id: entry.exercise_id,
        skipped: false,
        sets_completed: entry.reps_completed.length,
        reps_completed: entry.reps_completed,
        weight_used: entry.weight_used,
      },
      { onConflict: 'daily_log_id,exercise_id' },
    )
    if (error) {
      return { success: false, error: `A részletes edzésnapló mentése sikertelen: ${error.message}` }
    }
  }

  const { error: completeError } = await supabase
    .from('daily_logs')
    .update({ workout_completed: true })
    .eq('id', dailyLog.id)
    .eq('user_id', userId)
  if (completeError) {
    return { success: false, error: `Az edzés befejezésének jelölése sikertelen: ${completeError.message}` }
  }

  revalidateWorkoutSurfaces()
  return { success: true }
}

export async function upsertWorkoutExerciseLog(
  dailyLogId: string,
  exerciseId: string,
  data: WorkoutExerciseLogInput,
): Promise<ActionResult<WorkoutExerciseLog>> {
  const userId = await getAuthUserId()
  if (!userId) return { success: false, error: AUTH_REQUIRED }

  if (!Number.isInteger(data.sets_completed) || data.sets_completed < 0) {
    return { success: false, error: 'Érvénytelen szettszám.' }
  }
  if (!Array.isArray(data.reps_completed) || !Array.isArray(data.weight_used)) {
    return { success: false, error: 'Érvénytelen log adatok.' }
  }
  if (
    data.reps_completed.some(
      (r) => !Number.isFinite(r) || !Number.isInteger(r) || r < 0,
    )
  ) {
    return { success: false, error: 'Érvénytelen ismétlésszám érték.' }
  }
  if (data.weight_used.some((w) => !Number.isFinite(w) || w < 0)) {
    return { success: false, error: 'Érvénytelen súly érték.' }
  }

  if (!(await ownsDailyLog(dailyLogId, userId))) {
    return { success: false, error: NOT_FOUND }
  }

  const supabase = await createClient()
  const { data: row, error } = await supabase
    .from('workout_exercise_logs')
    .upsert(
      {
        daily_log_id: dailyLogId,
        exercise_id: exerciseId,
        skipped: false,
        sets_completed: data.sets_completed,
        reps_completed: data.reps_completed,
        weight_used: data.weight_used,
        notes: data.notes ?? null,
      },
      { onConflict: 'daily_log_id,exercise_id' },
    )
    .select('*')
    .single()

  if (error || !row) {
    return {
      success: false,
      error: `Mentés sikertelen: ${error?.message ?? 'ismeretlen hiba'}`,
    }
  }

  revalidateWorkoutSurfaces()
  return { success: true, data: row }
}
