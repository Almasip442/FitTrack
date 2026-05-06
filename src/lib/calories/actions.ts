'use server'

/**
 * Calorie tracking mutation Server Actions.
 *
 * Backend Iteration 9 / Task 9.2.
 *
 * Auth is enforced via the cookie-bound Supabase server client + RLS.
 * Each action explicitly short-circuits with a clean Hungarian error
 * string for the unauthenticated case. Ownership of `food_entries` is
 * validated through the parent `daily_logs.user_id` relationship before
 * the mutation, so callers get a deterministic "not found / not allowed"
 * response instead of a silent no-op from RLS.
 */

import { revalidatePath } from 'next/cache'

import { createClient } from '@/lib/supabase/server'
import type { FoodEntry } from '@/types/database'

/* -------------------------------------------------------------------------- */
/*  Result types                                                               */
/* -------------------------------------------------------------------------- */

export type ActionResult<T = void> =
  | (T extends void ? { success: true } : { success: true; data: T })
  | { success: false; error: string }

export type FoodEntryInput = {
  food_name: string
  calories: number
  protein?: number
  carbs?: number
  fat?: number
  amount?: number
  meal_type?: 'reggeli' | 'ebéd' | 'vacsora' | 'snack'
}

/* -------------------------------------------------------------------------- */
/*  Internal helpers                                                           */
/* -------------------------------------------------------------------------- */

const AUTH_REQUIRED = 'Bejelentkezés szükséges.'
const NOT_FOUND = 'A kért elem nem található vagy nincs hozzáférésed.'

const VALID_MEAL_TYPES = ['reggeli', 'ebéd', 'vacsora', 'snack'] as const
type MealType = (typeof VALID_MEAL_TYPES)[number]

function isMealType(v: unknown): v is MealType {
  return typeof v === 'string' && (VALID_MEAL_TYPES as readonly string[]).includes(v)
}

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

/** Verify that a daily log row belongs to the given user. */
async function ownsDailyLog(
  dailyLogId: string,
  userId: string,
): Promise<boolean> {
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

/**
 * Verify that a food_entries row's parent daily log belongs to the
 * given user. Returns the parent `daily_log_id` when ownership holds,
 * otherwise `null`.
 */
async function ownsFoodEntry(
  entryId: string,
  userId: string,
): Promise<string | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('food_entries')
    .select('id, daily_log_id, daily_logs!inner(user_id)')
    .eq('id', entryId)
    .eq('daily_logs.user_id', userId)
    .maybeSingle()
  if (error || !data) return null
  return data.daily_log_id
}

/** Refresh server-rendered surfaces affected by a calorie mutation. */
function revalidateCalorieSurfaces(): void {
  revalidatePath('/calories')
  revalidatePath('/dashboard')
}

/* -------------------------------------------------------------------------- */
/*  Input validation                                                           */
/* -------------------------------------------------------------------------- */

/**
 * Validate a (partial) food-entry payload. Returns an error string when
 * a field fails validation, otherwise `null`. Only the fields actually
 * present in `data` are checked, so this works for both insert and
 * partial-update flows.
 */
function validateFoodEntryFields(
  data: Partial<FoodEntryInput>,
  options: { requireFoodName: boolean; requireCalories: boolean },
): string | null {
  if (data.food_name !== undefined) {
    if (typeof data.food_name !== 'string' || data.food_name.trim() === '') {
      return 'Az étel neve kötelező.'
    }
    if (data.food_name.length > 200) {
      return 'Az étel neve túl hosszú (max 200 karakter).'
    }
  } else if (options.requireFoodName) {
    return 'Az étel neve kötelező.'
  }

  if (data.calories !== undefined) {
    if (!Number.isFinite(data.calories) || data.calories < 0) {
      return 'Érvénytelen kalória érték.'
    }
  } else if (options.requireCalories) {
    return 'A kalória érték kötelező.'
  }

  for (const key of ['protein', 'carbs', 'fat', 'amount'] as const) {
    const v = data[key]
    if (v !== undefined && (!Number.isFinite(v) || v < 0)) {
      return 'Érvénytelen tápanyag/mennyiség érték.'
    }
  }

  if (data.meal_type !== undefined && !isMealType(data.meal_type)) {
    return 'Érvénytelen étkezés típus.'
  }

  return null
}

/* -------------------------------------------------------------------------- */
/*  9.2 — addFoodEntry                                                         */
/* -------------------------------------------------------------------------- */

export async function addFoodEntry(
  dailyLogId: string,
  data: FoodEntryInput,
): Promise<ActionResult<FoodEntry>> {
  const userId = await getAuthUserId()
  if (!userId) return { success: false, error: AUTH_REQUIRED }

  const validationError = validateFoodEntryFields(data, {
    requireFoodName: true,
    requireCalories: true,
  })
  if (validationError) {
    return { success: false, error: validationError }
  }

  if (!(await ownsDailyLog(dailyLogId, userId))) {
    return { success: false, error: NOT_FOUND }
  }

  const supabase = await createClient()
  const { data: row, error } = await supabase
    .from('food_entries')
    .insert({
      daily_log_id: dailyLogId,
      food_name: data.food_name.trim(),
      calories: data.calories,
      protein: data.protein ?? null,
      carbs: data.carbs ?? null,
      fat: data.fat ?? null,
      amount: data.amount ?? null,
      meal_type: data.meal_type ?? null,
    })
    .select('*')
    .single()

  if (error || !row) {
    return {
      success: false,
      error: `Mentés sikertelen: ${error?.message ?? 'ismeretlen hiba'}`,
    }
  }

  revalidateCalorieSurfaces()
  return { success: true, data: row }
}

/* -------------------------------------------------------------------------- */
/*  9.2 — updateFoodEntry                                                      */
/* -------------------------------------------------------------------------- */

export async function updateFoodEntry(
  entryId: string,
  data: Partial<FoodEntryInput>,
): Promise<ActionResult<FoodEntry>> {
  const userId = await getAuthUserId()
  if (!userId) return { success: false, error: AUTH_REQUIRED }

  // Ensure at least one field is being updated.
  const hasAnyField = (
    [
      'food_name',
      'calories',
      'protein',
      'carbs',
      'fat',
      'amount',
      'meal_type',
    ] as const
  ).some((k) => data[k] !== undefined)
  if (!hasAnyField) {
    return { success: false, error: 'Nincs frissítendő mező.' }
  }

  const validationError = validateFoodEntryFields(data, {
    requireFoodName: false,
    requireCalories: false,
  })
  if (validationError) {
    return { success: false, error: validationError }
  }

  if (!(await ownsFoodEntry(entryId, userId))) {
    return { success: false, error: NOT_FOUND }
  }

  // Build a sparse patch so unspecified fields stay untouched.
  const patch: {
    food_name?: string
    calories?: number
    protein?: number | null
    carbs?: number | null
    fat?: number | null
    amount?: number | null
    meal_type?: MealType | null
  } = {}
  if (data.food_name !== undefined) patch.food_name = data.food_name.trim()
  if (data.calories !== undefined) patch.calories = data.calories
  if (data.protein !== undefined) patch.protein = data.protein
  if (data.carbs !== undefined) patch.carbs = data.carbs
  if (data.fat !== undefined) patch.fat = data.fat
  if (data.amount !== undefined) patch.amount = data.amount
  if (data.meal_type !== undefined) patch.meal_type = data.meal_type

  const supabase = await createClient()
  const { data: row, error } = await supabase
    .from('food_entries')
    .update(patch)
    .eq('id', entryId)
    .select('*')
    .single()

  if (error || !row) {
    return {
      success: false,
      error: `Mentés sikertelen: ${error?.message ?? 'ismeretlen hiba'}`,
    }
  }

  revalidateCalorieSurfaces()
  return { success: true, data: row }
}

/* -------------------------------------------------------------------------- */
/*  9.2 — deleteFoodEntry                                                      */
/* -------------------------------------------------------------------------- */

export async function deleteFoodEntry(
  entryId: string,
): Promise<ActionResult> {
  const userId = await getAuthUserId()
  if (!userId) return { success: false, error: AUTH_REQUIRED }

  if (!(await ownsFoodEntry(entryId, userId))) {
    return { success: false, error: NOT_FOUND }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('food_entries')
    .delete()
    .eq('id', entryId)

  if (error) {
    return { success: false, error: `Törlés sikertelen: ${error.message}` }
  }

  revalidateCalorieSurfaces()
  return { success: true }
}

/* -------------------------------------------------------------------------- */
/*  9.2 — markWorkoutCompleted                                                 */
/* -------------------------------------------------------------------------- */

export async function markWorkoutCompleted(
  dailyLogId: string,
  completed: boolean,
): Promise<ActionResult> {
  const userId = await getAuthUserId()
  if (!userId) return { success: false, error: AUTH_REQUIRED }

  if (typeof completed !== 'boolean') {
    return { success: false, error: 'Érvénytelen érték.' }
  }

  if (!(await ownsDailyLog(dailyLogId, userId))) {
    return { success: false, error: NOT_FOUND }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('daily_logs')
    .update({ workout_completed: completed })
    .eq('id', dailyLogId)
    .eq('user_id', userId)

  if (error) {
    return { success: false, error: `Mentés sikertelen: ${error.message}` }
  }

  revalidateCalorieSurfaces()
  return { success: true }
}
