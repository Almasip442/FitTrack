/**
 * Calorie target calculator — Mifflin-St Jeor.
 *
 * Backend Iteration 5 / Task 5.6.
 *
 * Pure utility (no IO, no Supabase). Safe to import from server and
 * client code.
 */

import type { Profile } from '@/types/database'

export type CalorieTargets = {
  /** Basal Metabolic Rate (kcal/day, rounded). */
  bmr: number
  /** Total Daily Energy Expenditure (BMR x activity multiplier, rounded). */
  tdee: number
  /** Goal-adjusted daily target (kcal, rounded). */
  target: number
}

/**
 * Activity multipliers applied to BMR to obtain TDEE.
 * Keys mirror `profiles.activity_level` enum values.
 */
const ACTIVITY_MULTIPLIERS: Record<NonNullable<Profile['activity_level']>, number> = {
  ülő: 1.2,
  mérsékelten_aktív: 1.375,
  aktív: 1.55,
  nagyon_aktív: 1.725,
}

/**
 * Goal-driven kcal delta applied on top of TDEE.
 * Keys mirror `profiles.goal` enum values.
 */
const GOAL_ADJUSTMENTS: Record<NonNullable<Profile['goal']>, number> = {
  fogyás: -500,
  izomnövelés: 300,
  erőnövelés: 200,
  egészség: 0,
}

/**
 * Compute BMR / TDEE / goal-adjusted target for a profile.
 *
 * Returns `null` if any of the four mandatory metric inputs (gender,
 * weight, height, age) is missing — without them the Mifflin-St Jeor
 * equation is undefined.
 *
 * If `activity_level` is missing the function falls back to the most
 * conservative multiplier (sedentary). If `goal` is missing TDEE is
 * returned as-is for `target`.
 */
export function calculateCalorieTarget(
  profile: Pick<Profile, 'gender' | 'weight' | 'height' | 'age' | 'activity_level' | 'goal'>
): CalorieTargets | null {
  const { gender, weight, height, age, activity_level, goal } = profile

  if (gender == null || weight == null || height == null || age == null) {
    return null
  }

  const w = Number(weight)
  const h = Number(height)
  const a = Number(age)

  if (!Number.isFinite(w) || !Number.isFinite(h) || !Number.isFinite(a)) {
    return null
  }

  // Mifflin-St Jeor
  const bmrRaw =
    gender === 'férfi'
      ? 10 * w + 6.25 * h - 5 * a + 5
      : 10 * w + 6.25 * h - 5 * a - 161

  const activityMultiplier = activity_level ? ACTIVITY_MULTIPLIERS[activity_level] : ACTIVITY_MULTIPLIERS.ülő
  const tdeeRaw = bmrRaw * activityMultiplier

  const goalAdjustment = goal ? GOAL_ADJUSTMENTS[goal] : 0
  const targetRaw = tdeeRaw + goalAdjustment

  return {
    bmr: Math.round(bmrRaw),
    tdee: Math.round(tdeeRaw),
    target: Math.round(targetRaw),
  }
}
