'use client'

/**
 * Gender selector — 2-card visual picker.
 *
 * Frontend Iteration 3 / Task 3.1 (gender field).
 *
 * Renders two cards ("Férfi" / "Nő"). Selection toggles a brand-red border
 * and a subtle red glow. Native radio inputs are layered behind the cards
 * so the component is keyboard- and screen-reader-accessible without
 * pulling a heavier UI primitive.
 */

import { Mars, Venus } from 'lucide-react'

import { cn } from '@/lib/utils'

export type Gender = 'férfi' | 'nő'

const OPTIONS: ReadonlyArray<{
  value: Gender
  label: string
  icon: typeof Mars
}> = [
  { value: 'férfi', label: 'Férfi', icon: Mars },
  { value: 'nő', label: 'Nő', icon: Venus },
]

interface GenderSelectorProps {
  value: Gender | null
  onChange: (value: Gender) => void
  onBlur?: () => void
  name?: string
  disabled?: boolean
  invalid?: boolean
}

export function GenderSelector({
  value,
  onChange,
  onBlur,
  name = 'gender',
  disabled,
  invalid,
}: GenderSelectorProps) {
  return (
    <div
      role="radiogroup"
      aria-invalid={invalid || undefined}
      aria-label="Nem"
      className="grid grid-cols-2 gap-3"
    >
      {OPTIONS.map(({ value: optValue, label, icon: Icon }) => {
        const selected = value === optValue
        return (
          <label
            key={optValue}
            className={cn(
              'group relative flex cursor-pointer items-center gap-3 rounded-lg border bg-card px-4 py-3.5',
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
            <Icon
              aria-hidden="true"
              className={cn(
                'h-5 w-5 transition-colors',
                selected
                  ? 'text-brand-red'
                  : 'text-muted-foreground group-hover:text-foreground',
              )}
              strokeWidth={1.5}
            />
            <span
              className={cn(
                'font-condensed text-sm font-semibold uppercase tracking-wide-display',
                selected ? 'text-foreground' : 'text-muted-foreground',
              )}
            >
              {label}
            </span>
            {selected && (
              <span
                aria-hidden="true"
                className="absolute right-3 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-brand-red"
              />
            )}
          </label>
        )
      })}
    </div>
  )
}
