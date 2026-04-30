'use client'

/**
 * Activity-level selector — 4-card picker with descriptions.
 *
 * Frontend Iteration 3 / Task 3.1 (activity_level field).
 *
 * The four levels mirror the `profiles.activity_level` enum exactly:
 *   ülő, mérsékelten_aktív, aktív, nagyon_aktív
 * Display labels are humanised (with regular space, not underscore).
 *
 * Layout: 1 col on mobile (descriptions are wordy), 2 cols on md+.
 */

import { cn } from '@/lib/utils'

export type ActivityLevel =
  | 'ülő'
  | 'mérsékelten_aktív'
  | 'aktív'
  | 'nagyon_aktív'

const OPTIONS: ReadonlyArray<{
  value: ActivityLevel
  label: string
  description: string
  multiplier: string
}> = [
  {
    value: 'ülő',
    label: 'Ülő',
    description: 'Irodai munka, minimális mozgás',
    multiplier: '× 1.20',
  },
  {
    value: 'mérsékelten_aktív',
    label: 'Mérsékelten aktív',
    description: 'Heti 1–3 alkalom edzés',
    multiplier: '× 1.375',
  },
  {
    value: 'aktív',
    label: 'Aktív',
    description: 'Heti 3–5 alkalom edzés',
    multiplier: '× 1.55',
  },
  {
    value: 'nagyon_aktív',
    label: 'Nagyon aktív',
    description: 'Napi edzés vagy fizikai munka',
    multiplier: '× 1.725',
  },
]

interface ActivitySelectorProps {
  value: ActivityLevel | null
  onChange: (value: ActivityLevel) => void
  onBlur?: () => void
  name?: string
  disabled?: boolean
  invalid?: boolean
}

export function ActivitySelector({
  value,
  onChange,
  onBlur,
  name = 'activity_level',
  disabled,
  invalid,
}: ActivitySelectorProps) {
  return (
    <div
      role="radiogroup"
      aria-invalid={invalid || undefined}
      aria-label="Aktivitási szint"
      className="grid grid-cols-1 gap-3 sm:grid-cols-2"
    >
      {OPTIONS.map(({ value: optValue, label, description, multiplier }) => {
        const selected = value === optValue
        return (
          <label
            key={optValue}
            className={cn(
              'group relative flex cursor-pointer items-start gap-3 rounded-lg border bg-card p-4',
              'transition-all duration-200',
              'hover:border-brand-red/50',
              'focus-within:border-brand-red focus-within:ring-2 focus-within:ring-brand-red/30',
              selected
                ? 'border-brand-red bg-brand-red/[0.06] shadow-[0_0_0_1px_rgba(120,0,0,0.6)_inset]'
                : 'border-border',
              disabled && 'pointer-events-none opacity-50',
            )}
          >
            <input
              type="radio"
              name={name}
              value={optValue}
              checked={selected}
              onChange={() => onChange(optValue)}
              onBlur={onBlur}
              disabled={disabled}
              className="sr-only"
            />

            {/* Selection indicator dot */}
            <span
              aria-hidden="true"
              className={cn(
                'mt-1 h-2.5 w-2.5 shrink-0 rounded-full border transition-all',
                selected
                  ? 'border-brand-red bg-brand-red shadow-[0_0_8px_rgba(120,0,0,0.6)]'
                  : 'border-muted-foreground/40 bg-transparent',
              )}
            />

            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-baseline justify-between gap-2">
                <span
                  className={cn(
                    'font-condensed text-base font-semibold uppercase tracking-wide-display',
                    'text-foreground',
                  )}
                >
                  {label}
                </span>
                <span
                  className={cn(
                    'font-condensed text-[10px] uppercase tracking-wide-display tabular-nums',
                    selected
                      ? 'text-brand-red'
                      : 'text-muted-foreground/60',
                  )}
                >
                  {multiplier}
                </span>
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">
                {description}
              </p>
            </div>
          </label>
        )
      })}
    </div>
  )
}
