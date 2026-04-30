'use client'

/**
 * Goal selector — 4-card visual picker with Lucide icons.
 *
 * Frontend Iteration 3 / Task 3.1 (goal field).
 *
 * Cards: Fogyás (TrendingDown), Izomnövelés (Dumbbell),
 * Erőnövelés (Zap), Egészség (Heart).
 *
 * Layout: 2 cols on mobile, 4 cols on md+ — keeps each card
 * comfortably tappable on touch and avoids horizontal scroll.
 */

import { Dumbbell, Heart, TrendingDown, Zap, type LucideIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

export type Goal = 'fogyás' | 'izomnövelés' | 'erőnövelés' | 'egészség'

const OPTIONS: ReadonlyArray<{
  value: Goal
  label: string
  icon: LucideIcon
  hint: string
}> = [
  {
    value: 'fogyás',
    label: 'Fogyás',
    icon: TrendingDown,
    hint: 'Kalóriadeficit',
  },
  {
    value: 'izomnövelés',
    label: 'Izomnövelés',
    icon: Dumbbell,
    hint: 'Hipertrófia',
  },
  {
    value: 'erőnövelés',
    label: 'Erőnövelés',
    icon: Zap,
    hint: 'Maximumerő',
  },
  {
    value: 'egészség',
    label: 'Egészség',
    icon: Heart,
    hint: 'Fenntartás',
  },
]

interface GoalSelectorProps {
  value: Goal | null
  onChange: (value: Goal) => void
  onBlur?: () => void
  name?: string
  disabled?: boolean
  invalid?: boolean
}

export function GoalSelector({
  value,
  onChange,
  onBlur,
  name = 'goal',
  disabled,
  invalid,
}: GoalSelectorProps) {
  return (
    <div
      role="radiogroup"
      aria-invalid={invalid || undefined}
      aria-label="Cél"
      className="grid grid-cols-2 gap-3 md:grid-cols-4"
    >
      {OPTIONS.map(({ value: optValue, label, icon: Icon, hint }, index) => {
        const selected = value === optValue
        const padIndex = String(index + 1).padStart(2, '0')
        return (
          <label
            key={optValue}
            className={cn(
              'group relative flex cursor-pointer flex-col items-start gap-3 rounded-lg border bg-card p-4',
              'transition-all duration-200',
              'hover:border-brand-red/50 hover:-translate-y-px',
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

            <div className="flex w-full items-start justify-between">
              <Icon
                aria-hidden="true"
                className={cn(
                  'h-6 w-6 transition-colors',
                  selected
                    ? 'text-brand-red'
                    : 'text-muted-foreground group-hover:text-foreground',
                )}
                strokeWidth={1.5}
              />
              <span
                className={cn(
                  'font-condensed text-[10px] uppercase tracking-wide-display',
                  selected ? 'text-brand-red' : 'text-muted-foreground/60',
                )}
              >
                {`/ ${padIndex}`}
              </span>
            </div>

            <div className="space-y-0.5">
              <span
                className={cn(
                  'block font-condensed text-base font-semibold uppercase tracking-wide-display',
                  selected ? 'text-foreground' : 'text-foreground/90',
                )}
              >
                {label}
              </span>
              <span className="block text-xs text-muted-foreground">
                {hint}
              </span>
            </div>
          </label>
        )
      })}
    </div>
  )
}
