/**
 * Exercise taxonomy — single source of truth for the chips,
 * filter labels, color tokens and three-letter "specimen codes"
 * shown on the exercise cards.
 *
 * The values match the seed data in `supabase/migrations/...exercises_seed`
 * so a chip click filters via exact `eq` match on the API.
 */

export type Difficulty = 'kezdő' | 'haladó' | 'profi'

export interface MuscleGroup {
  /** API value — must match `exercises.muscle_group` exactly. */
  value: string
  /** Hungarian label shown on the chip. */
  label: string
  /** Three-letter code printed on cards as a "specimen tag". */
  code: string
}

export interface EquipmentOption {
  value: string
  label: string
}

export const MUSCLE_GROUPS: MuscleGroup[] = [
  { value: 'mellkas', label: 'Mellkas', code: 'CHE' },
  { value: 'hát', label: 'Hát', code: 'BCK' },
  { value: 'váll', label: 'Váll', code: 'SLD' },
  { value: 'bicepsz', label: 'Bicepsz', code: 'BIC' },
  { value: 'tricepsz', label: 'Tricepsz', code: 'TRI' },
  { value: 'quadriceps', label: 'Quadriceps', code: 'QUA' },
  { value: 'hamstring', label: 'Hamstring', code: 'HAM' },
  { value: 'vádli', label: 'Vádli', code: 'CLF' },
  { value: 'core', label: 'Core', code: 'CRE' },
]

export const EQUIPMENT_OPTIONS: EquipmentOption[] = [
  { value: 'súlyzó', label: 'Súlyzó' },
  { value: 'gép', label: 'Gép' },
  { value: 'testsúly', label: 'Testsúly' },
  { value: 'kötél', label: 'Kötél' },
  { value: 'rúd', label: 'Rúd' },
]

export const DIFFICULTIES: { value: Difficulty; label: string }[] = [
  { value: 'kezdő', label: 'Kezdő' },
  { value: 'haladó', label: 'Haladó' },
  { value: 'profi', label: 'Profi' },
]

/**
 * Difficulty → semantic color token for badges/dots.
 * - kezdő → emerald (success-ish)
 * - haladó → amber (warning-ish)
 * - profi → red-500 (error-ish, but a brighter red than the brand red)
 */
export const DIFFICULTY_DOT: Record<Difficulty, string> = {
  kezdő: 'bg-emerald-500',
  haladó: 'bg-amber-500',
  profi: 'bg-red-500',
}

export const DIFFICULTY_TEXT: Record<Difficulty, string> = {
  kezdő: 'text-emerald-500',
  haladó: 'text-amber-500',
  profi: 'text-red-500',
}

/**
 * Lookup a muscle-group by its API value.
 */
export function findMuscleGroup(value: string | null | undefined): MuscleGroup | null {
  if (!value) return null
  return MUSCLE_GROUPS.find((m) => m.value === value) ?? null
}

/**
 * Derive a three-letter "specimen code" for a muscle group.
 * Falls back to the first three uppercase letters of the value.
 */
export function muscleGroupCode(value: string | null | undefined): string {
  if (!value) return '—'
  const found = findMuscleGroup(value)
  if (found) return found.code
  return value.slice(0, 3).toUpperCase()
}
