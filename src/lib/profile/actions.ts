'use server'

/**
 * Profile mutation Server Actions.
 *
 * Backend Iteration 5 / Tasks 5.2 + 5.3.
 *
 * Auth is enforced via the cookie-bound Supabase server client + RLS
 * (`Users can update own profile` policy on `profiles`). The action
 * additionally short-circuits with an explicit unauth response so the
 * client never sees a generic Postgres error for the no-session case.
 */

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { ProfileUpdate } from '@/types/database'

export type ProfileActionResult = { success: true } | { success: false; error: string }

const GENDERS = ['férfi', 'nő'] as const
const GOALS = ['fogyás', 'izomnövelés', 'erőnövelés', 'egészség'] as const
const ACTIVITY_LEVELS = ['ülő', 'mérsékelten_aktív', 'aktív', 'nagyon_aktív'] as const

type Gender = (typeof GENDERS)[number]
type Goal = (typeof GOALS)[number]
type ActivityLevel = (typeof ACTIVITY_LEVELS)[number]

/** Read a string field from FormData, treating empty strings as `null`. */
function readString(form: FormData, key: string): string | null {
  const raw = form.get(key)
  if (typeof raw !== 'string') return null
  const trimmed = raw.trim()
  return trimmed === '' ? null : trimmed
}

/** Read & validate an enum field. Returns `null` if absent, error string if invalid. */
function readEnum<T extends string>(
  form: FormData,
  key: string,
  allowed: readonly T[]
): { value: T | null } | { error: string } {
  const v = readString(form, key)
  if (v === null) return { value: null }
  if (!(allowed as readonly string[]).includes(v)) {
    return { error: `Érvénytelen érték: ${key}` }
  }
  return { value: v as T }
}

/** Read & validate an integer field. */
function readInt(form: FormData, key: string): { value: number | null } | { error: string } {
  const v = readString(form, key)
  if (v === null) return { value: null }
  const n = Number(v)
  if (!Number.isInteger(n) || n < 0) {
    return { error: `Érvénytelen szám: ${key}` }
  }
  return { value: n }
}

/** Read & validate a positive numeric (decimal) field. */
function readDecimal(form: FormData, key: string): { value: number | null } | { error: string } {
  const v = readString(form, key)
  if (v === null) return { value: null }
  const n = Number(v)
  if (!Number.isFinite(n) || n <= 0) {
    return { error: `Érvénytelen szám: ${key}` }
  }
  return { value: n }
}

/**
 * Update the current user's profile from a `<form>` submission.
 *
 * Accepted FormData keys: name, age, gender, weight, height, goal,
 * activity_level. Empty strings are treated as "clear this field"
 * (stored as NULL).
 */
export async function updateProfile(formData: FormData): Promise<ProfileActionResult> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { success: false, error: 'Bejelentkezés szükséges.' }
  }

  // ----- Parse + validate -----
  const name = readString(formData, 'name')

  const ageRes = readInt(formData, 'age')
  if ('error' in ageRes) return { success: false, error: ageRes.error }

  const genderRes = readEnum<Gender>(formData, 'gender', GENDERS)
  if ('error' in genderRes) return { success: false, error: genderRes.error }

  const weightRes = readDecimal(formData, 'weight')
  if ('error' in weightRes) return { success: false, error: weightRes.error }

  const heightRes = readDecimal(formData, 'height')
  if ('error' in heightRes) return { success: false, error: heightRes.error }

  const goalRes = readEnum<Goal>(formData, 'goal', GOALS)
  if ('error' in goalRes) return { success: false, error: goalRes.error }

  const activityRes = readEnum<ActivityLevel>(formData, 'activity_level', ACTIVITY_LEVELS)
  if ('error' in activityRes) return { success: false, error: activityRes.error }

  const update: ProfileUpdate = {
    name,
    age: ageRes.value,
    gender: genderRes.value,
    weight: weightRes.value,
    height: heightRes.value,
    goal: goalRes.value,
    activity_level: activityRes.value,
    // No DB trigger maintains updated_at on profiles — set it explicitly.
    updated_at: new Date().toISOString(),
  }

  const { error: updateError } = await supabase
    .from('profiles')
    .update(update)
    .eq('id', user.id)

  if (updateError) {
    return { success: false, error: `Mentés sikertelen: ${updateError.message}` }
  }

  // Refresh server-rendered surfaces that consume profile data.
  revalidatePath('/profile')
  revalidatePath('/dashboard')
  revalidatePath('/onboarding')

  return { success: true }
}
