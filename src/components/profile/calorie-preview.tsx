'use client'

/**
 * Real-time calorie target preview.
 *
 * Frontend Iteration 3 / Task 3.3.
 *
 * Reads form-state values (gender, weight, height, age, activity_level,
 * goal) directly and re-runs `calculateCalorieTarget` on every change.
 * The pure utility lives in `src/lib/calories.ts` and returns `null` if
 * any of the four mandatory metric inputs is missing — that is rendered
 * as the empty state.
 *
 * Visual: console-styled card with brand-red accents, oversized kcal
 * number in Barlow Condensed extrabold. BMR / TDEE are surfaced as
 * smaller secondary stats so the user sees how the goal adjustment
 * derives from their TDEE.
 */

import { Flame } from 'lucide-react'
import { useMemo } from 'react'

import { calculateCalorieTarget } from '@/lib/calories'
import { cn } from '@/lib/utils'
import type { ActivityLevel } from './activity-selector'
import type { Gender } from './gender-selector'
import type { Goal } from './goal-selector'

interface CaloriePreviewProps {
  gender: Gender | null
  weight: number | null
  height: number | null
  age: number | null
  activityLevel: ActivityLevel | null
  goal: Goal | null
  className?: string
}

export function CaloriePreview({
  gender,
  weight,
  height,
  age,
  activityLevel,
  goal,
  className,
}: CaloriePreviewProps) {
  const targets = useMemo(
    () =>
      calculateCalorieTarget({
        gender,
        weight,
        height,
        age,
        activity_level: activityLevel,
        goal,
      }),
    [gender, weight, height, age, activityLevel, goal],
  )

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl border bg-card p-5 sm:p-6',
        targets ? 'border-brand-red/40' : 'border-border',
        className,
      )}
    >
      {/* Decorative top-right red glow when targets are present */}
      {targets && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-brand-red/15 blur-2xl"
        />
      )}

      {/* Header line */}
      <div className="relative mb-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Flame
            aria-hidden="true"
            className={cn(
              'h-4 w-4',
              targets ? 'text-brand-red' : 'text-muted-foreground',
            )}
            strokeWidth={1.5}
          />
          <span className="font-condensed text-[11px] uppercase tracking-wide-display text-muted-foreground">
            {'// Kalória előnézet'}
          </span>
        </div>
        <span
          className={cn(
            'font-condensed text-[10px] uppercase tracking-wide-display',
            targets ? 'text-brand-red' : 'text-muted-foreground/60',
          )}
        >
          {targets ? '[ live ]' : '[ pending ]'}
        </span>
      </div>

      {targets ? (
        <div className="relative space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">
              Az ajánlott napi kalóriabeviteled:
            </p>
            <div className="mt-1 flex items-baseline gap-3">
              <span className="font-condensed text-5xl font-extrabold uppercase tracking-display text-brand-red sm:text-6xl">
                {targets.target.toLocaleString('hu-HU')}
              </span>
              <span className="font-condensed text-base uppercase tracking-wide-display text-muted-foreground">
                kcal
              </span>
            </div>
          </div>

          {/* Sub-metrics: BMR / TDEE */}
          <div className="grid grid-cols-2 gap-3 border-t border-border pt-4">
            <Metric label="BMR" value={targets.bmr} />
            <Metric label="TDEE" value={targets.tdee} />
          </div>
        </div>
      ) : (
        <div className="relative flex min-h-[7rem] flex-col justify-center gap-2">
          <p className="font-condensed text-base uppercase tracking-wide-display text-foreground/80">
            Töltsd ki az adatokat
          </p>
          <p className="text-xs text-muted-foreground">
            A kalóriacél megjelenítéséhez add meg a nemed, korod, súlyod és
            magasságod.
          </p>
        </div>
      )}
    </div>
  )
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="font-condensed text-[10px] uppercase tracking-wide-display text-muted-foreground/70">
        {label}
      </p>
      <p className="mt-0.5 font-condensed text-xl font-semibold tabular-nums text-foreground">
        {value.toLocaleString('hu-HU')}
        <span className="ml-1 text-[11px] font-normal uppercase tracking-wide-display text-muted-foreground">
          kcal
        </span>
      </p>
    </div>
  )
}
