/**
 * Profile completeness guard.
 *
 * Backend Iteration 5 / Task 5.5 — onboarding gate.
 *
 * Pure utility used by middleware / layouts to decide whether a freshly
 * registered user must be redirected to /onboarding before reaching the
 * dashboard.
 *
 * The required fields are exactly those needed by `calculateCalorieTarget`
 * to produce a valid number: gender, weight, height, goal. (Age and
 * activity_level are recommended but not strictly required by this
 * iteration's acceptance criteria.)
 */

import type { Profile } from '@/types/database'

type ProfileLike = Pick<Profile, 'gender' | 'weight' | 'height' | 'goal'>

/**
 * Returns true iff the four mandatory onboarding fields are present.
 * Accepts `null` / `undefined` (i.e. a missing profile row) — both yield
 * `false`.
 */
export function isProfileComplete(profile: ProfileLike | null | undefined): boolean {
  if (!profile) return false

  return (
    profile.gender != null &&
    profile.weight != null &&
    profile.height != null &&
    profile.goal != null
  )
}
