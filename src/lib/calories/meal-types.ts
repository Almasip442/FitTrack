/**
 * Single source of truth for meal-type taxonomy used across the
 * calorie-tracking surface. Mirrors the `food_entries.meal_type` enum
 * defined in the schema.
 */

export type MealType = 'reggeli' | 'ebéd' | 'vacsora' | 'snack'

export interface MealTypeMeta {
  /** DB enum value — matches the column constraint exactly. */
  value: MealType
  /** Display label (already title-cased). */
  label: string
  /** Two-letter specimen code for visual flair. */
  code: string
  /** Display order on the page. */
  order: number
}

export const MEAL_TYPES: readonly MealTypeMeta[] = [
  { value: 'reggeli', label: 'Reggeli', code: 'RG', order: 0 },
  { value: 'ebéd', label: 'Ebéd', code: 'EB', order: 1 },
  { value: 'vacsora', label: 'Vacsora', code: 'VC', order: 2 },
  { value: 'snack', label: 'Snack', code: 'SN', order: 3 },
] as const

export function getMealTypeMeta(v: MealType): MealTypeMeta {
  // Safe non-null assertion — every enum value has an entry above.
  return MEAL_TYPES.find((m) => m.value === v)!
}
