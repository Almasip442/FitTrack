/**
 * Calorie tracking client-side formatting helpers.
 *
 * Pure utilities — safe to import from server and client code.
 */

const HUN_MONTHS = [
  'január',
  'február',
  'március',
  'április',
  'május',
  'június',
  'július',
  'augusztus',
  'szeptember',
  'október',
  'november',
  'december',
] as const

const HUN_WEEKDAYS_SHORT = ['Va', 'Hé', 'Ke', 'Sze', 'Csü', 'Pé', 'Szo'] as const

/** Returns today's date as `YYYY-MM-DD` in the *local* timezone. */
export function todayIso(): string {
  const d = new Date()
  return toIsoDate(d)
}

/** Format a Date as `YYYY-MM-DD` in the local timezone. */
export function toIsoDate(d: Date): string {
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

/** Parse an ISO `YYYY-MM-DD` date string into a local-timezone Date. */
export function fromIsoDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map((s) => Number(s))
  return new Date(y, (m ?? 1) - 1, d ?? 1)
}

/**
 * Add (or subtract) `days` to an ISO date string, preserving local
 * timezone semantics so day-boundaries don't drift across DST.
 */
export function addDays(iso: string, days: number): string {
  const d = fromIsoDate(iso)
  d.setDate(d.getDate() + days)
  return toIsoDate(d)
}

/** Hungarian long-form date: "2026. május 5." */
export function formatHungarianDate(iso: string): string {
  const d = fromIsoDate(iso)
  return `${d.getFullYear()}. ${HUN_MONTHS[d.getMonth()]} ${d.getDate()}.`
}

/** Hungarian short weekday for trend chart labels. */
export function shortWeekday(iso: string): string {
  const d = fromIsoDate(iso)
  return HUN_WEEKDAYS_SHORT[d.getDay()]
}

/** Returns true if `iso` is today (local). */
export function isToday(iso: string): boolean {
  return iso === todayIso()
}

/** Compare two ISO dates: -1 / 0 / 1. */
export function compareIso(a: string, b: string): number {
  if (a < b) return -1
  if (a > b) return 1
  return 0
}

/** Hungarian "Ma / Tegnap / weekday" label for date navigator. */
export function relativeLabel(iso: string): string | null {
  const today = todayIso()
  if (iso === today) return 'Ma'
  if (iso === addDays(today, -1)) return 'Tegnap'
  return null
}
