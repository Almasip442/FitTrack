'use client'

import { motion, useReducedMotion } from 'framer-motion'

import { Skeleton } from '@/components/ui/skeleton'
import type { DailySummary } from '@/lib/calories/queries'
import { cn } from '@/lib/utils'

interface DailySummaryCardProps {
  /** kcal consumed so far today. */
  consumed: number
  /** Goal-adjusted daily calorie target. */
  target: number
  /** Macro totals (g) for today. */
  summary: DailySummary
  /** Render a skeleton instead of real data. */
  isLoading?: boolean
}

/* -------------------------------------------------------------------------- */
/*  Calorie ring                                                              */
/* -------------------------------------------------------------------------- */

const RING_SIZE = 196
const RING_STROKE = 14
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS

/**
 * Calorie ring — SVG circle with `stroke-dashoffset` driven by the
 * consumed/target ratio. Animates in on mount via Framer Motion (skipped
 * when `prefers-reduced-motion` is set).
 */
function CalorieRing({
  consumed,
  target,
}: {
  consumed: number
  target: number
}) {
  const reduceMotion = useReducedMotion()

  const safeTarget = target > 0 ? target : 1
  const ratio = Math.max(0, consumed / safeTarget)
  const clamped = Math.min(1, ratio)
  const isOver = ratio > 1
  const remaining = Math.max(0, target - consumed)

  // Stroke dashoffset = circumference * (1 - filled fraction).
  const filledOffset = RING_CIRCUMFERENCE * (1 - clamped)

  return (
    <div className="relative shrink-0" style={{ width: RING_SIZE, height: RING_SIZE }}>
      <svg
        width={RING_SIZE}
        height={RING_SIZE}
        viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
        className="-rotate-90"
        aria-hidden="true"
      >
        {/* Track */}
        <circle
          cx={RING_SIZE / 2}
          cy={RING_SIZE / 2}
          r={RING_RADIUS}
          fill="none"
          stroke="currentColor"
          strokeWidth={RING_STROKE}
          className="text-border/60"
        />
        {/* Fill */}
        <motion.circle
          cx={RING_SIZE / 2}
          cy={RING_SIZE / 2}
          r={RING_RADIUS}
          fill="none"
          strokeWidth={RING_STROKE}
          strokeLinecap="round"
          stroke={isOver ? 'rgb(239 68 68)' : 'var(--color-brand-red)'}
          strokeDasharray={RING_CIRCUMFERENCE}
          initial={
            reduceMotion
              ? { strokeDashoffset: filledOffset }
              : { strokeDashoffset: RING_CIRCUMFERENCE }
          }
          animate={{ strokeDashoffset: filledOffset }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>

      {/* Center label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="font-condensed text-[10px] uppercase tracking-wide-display text-muted-foreground/70">
          Bevitt
        </span>
        <span
          className={cn(
            'font-condensed text-4xl font-extrabold uppercase tracking-display leading-none mt-1',
            isOver ? 'text-red-500' : 'text-foreground',
          )}
        >
          {Math.round(consumed).toLocaleString('hu-HU')}
        </span>
        <span className="font-condensed text-[11px] uppercase tracking-wide-display text-muted-foreground mt-1.5">
          / {target.toLocaleString('hu-HU')} kcal
        </span>
        <span className="mt-2 block h-px w-8 bg-brand-red/70" aria-hidden="true" />
        <span
          className={cn(
            'font-condensed text-[10px] uppercase tracking-wide-display mt-2',
            isOver ? 'text-red-500/90' : 'text-brand-red',
          )}
        >
          {isOver
            ? `+${Math.round(consumed - target).toLocaleString('hu-HU')} kcal túl`
            : `${Math.round(remaining).toLocaleString('hu-HU')} kcal hátra`}
        </span>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Macro bar                                                                  */
/* -------------------------------------------------------------------------- */

function MacroBar({
  label,
  code,
  grams,
  /** Visual scale ceiling — used only for the bar fill width. */
  scale,
  accentClassName,
}: {
  label: string
  code: string
  grams: number
  scale: number
  accentClassName: string
}) {
  const reduceMotion = useReducedMotion()
  const fill = Math.max(0, Math.min(1, grams / Math.max(1, scale)))

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <div className="flex items-baseline gap-2">
          <span className="font-condensed text-[10px] uppercase tracking-wide-display text-muted-foreground/60">
            {code}
          </span>
          <span className="font-condensed text-xs uppercase tracking-wide-display text-foreground">
            {label}
          </span>
        </div>
        <span className="font-condensed text-base font-bold uppercase tracking-display text-foreground tabular-nums">
          {Math.round(grams)}
          <span className="ml-0.5 text-[10px] text-muted-foreground/70">g</span>
        </span>
      </div>
      <div
        className="relative h-1.5 w-full overflow-hidden rounded-full bg-border/50"
        aria-hidden="true"
      >
        <motion.div
          className={cn('absolute inset-y-0 left-0 rounded-full', accentClassName)}
          initial={reduceMotion ? { width: `${fill * 100}%` } : { width: 0 }}
          animate={{ width: `${fill * 100}%` }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
        />
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Card                                                                       */
/* -------------------------------------------------------------------------- */

export function DailySummaryCard({
  consumed,
  target,
  summary,
  isLoading,
}: DailySummaryCardProps) {
  if (isLoading) {
    return (
      <div className="relative overflow-hidden rounded-md border border-border bg-card/40 p-6 sm:p-8">
        <div className="grid items-center gap-8 sm:grid-cols-[auto_1fr]">
          <Skeleton className="h-[196px] w-[196px] rounded-full" />
          <div className="space-y-5">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-2 w-full" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-2 w-full" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-2 w-full" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <section
      className={cn(
        'relative overflow-hidden rounded-md border border-border bg-card/40',
        'p-5 sm:p-7',
      )}
      aria-label="Napi kalória összesítő"
    >
      {/* Engineered crosshair markers */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute left-3 top-3 h-3 w-3 border-l border-t border-brand-red/70"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute right-3 top-3 h-3 w-3 border-r border-t border-brand-red/70"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute left-3 bottom-3 h-3 w-3 border-l border-b border-brand-red/70"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute right-3 bottom-3 h-3 w-3 border-r border-b border-brand-red/70"
      />

      {/* Header */}
      <div className="mb-6 flex items-baseline justify-between">
        <span className="font-condensed text-[11px] uppercase tracking-wide-display text-brand-red">
          {'// napi mérleg'}
        </span>
        <span className="font-condensed text-[10px] uppercase tracking-wide-display text-muted-foreground/60">
          kcal · g
        </span>
      </div>

      <div className="grid items-center gap-8 sm:grid-cols-[auto_1fr] sm:gap-10">
        <div className="flex justify-center sm:justify-start">
          <CalorieRing consumed={consumed} target={target} />
        </div>

        {/* Macro bars */}
        <div className="space-y-5">
          <MacroBar
            label="Fehérje"
            code="P"
            grams={summary.total_protein}
            scale={Math.max(150, summary.total_protein * 1.1)}
            accentClassName="bg-emerald-500"
          />
          <MacroBar
            label="Szénhidrát"
            code="C"
            grams={summary.total_carbs}
            scale={Math.max(250, summary.total_carbs * 1.1)}
            accentClassName="bg-amber-500"
          />
          <MacroBar
            label="Zsír"
            code="F"
            grams={summary.total_fat}
            scale={Math.max(80, summary.total_fat * 1.1)}
            accentClassName="bg-brand-red"
          />
        </div>
      </div>
    </section>
  )
}
