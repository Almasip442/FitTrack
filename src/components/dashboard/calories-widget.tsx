'use client'

import { motion, useReducedMotion } from 'framer-motion'

import { slideUp } from '@/lib/animations'
import { cn } from '@/lib/utils'
import type { DashboardTodayCalories } from '@/lib/dashboard/queries'

/* -------------------------------------------------------------------------- */
/*  SVG ring constants                                                         */
/* -------------------------------------------------------------------------- */

const RING_SIZE = 160
const RING_STROKE = 12
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

interface CaloriesWidgetProps {
  calories: DashboardTodayCalories
}

/* -------------------------------------------------------------------------- */
/*  Macro progress bar                                                         */
/* -------------------------------------------------------------------------- */

function MacroBar({
  label,
  value,
  max,
  color,
}: {
  label: string
  value: number
  max: number
  color: string
}) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="font-condensed text-[11px] uppercase tracking-wide-display text-muted-foreground">
          {label}
        </span>
        <span className="font-condensed text-[11px] text-muted-foreground">
          {Math.round(value)}g
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-border overflow-hidden">
        <motion.div
          className={cn('h-full rounded-full', color)}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
        />
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Main component                                                             */
/* -------------------------------------------------------------------------- */

export function CaloriesWidget({ calories }: CaloriesWidgetProps) {
  const reduceMotion = useReducedMotion()
  const { consumed, target, protein, carbs, fat } = calories

  const safeTarget = target > 0 ? target : 1
  const ratio = consumed / safeTarget
  const clamped = Math.min(1, Math.max(0, ratio))
  const isOver = ratio > 1
  const remaining = Math.max(0, target - consumed)

  const filledOffset = RING_CIRCUMFERENCE * (1 - clamped)

  // Approximate macro targets (rough distribution from calorie target)
  const proteinTarget = Math.round((target * 0.3) / 4)
  const carbTarget = Math.round((target * 0.45) / 4)
  const fatTarget = Math.round((target * 0.25) / 9)

  return (
    <motion.div
      variants={slideUp}
      initial="hidden"
      animate="visible"
      className={cn(
        'flex flex-col gap-5 rounded-xl border bg-card p-5 text-card-foreground shadow-sm',
        'dark:bg-[#1a1a1a] dark:border-[#2a2a2a]',
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-condensed text-sm font-bold uppercase tracking-wide-display text-muted-foreground">
          Kalóriamérleg
        </h3>
        <span
          className={cn(
            'font-condensed text-xs uppercase tracking-wide-display rounded-full px-2 py-0.5',
            isOver
              ? 'bg-red-500/10 text-red-500 border border-red-500/30'
              : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/30',
          )}
        >
          {isOver ? 'Túllépve' : 'Rendben'}
        </span>
      </div>

      {/* Ring + center text */}
      <div className="flex items-center justify-center">
        <div className="relative flex items-center justify-center">
          <svg
            width={RING_SIZE}
            height={RING_SIZE}
            viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
            className="-rotate-90"
          >
            {/* Track */}
            <circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RING_RADIUS}
              fill="none"
              stroke="currentColor"
              strokeWidth={RING_STROKE}
              className="text-border"
            />
            {/* Progress */}
            <motion.circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RING_RADIUS}
              fill="none"
              stroke={isOver ? '#ef4444' : '#780000'}
              strokeWidth={RING_STROKE}
              strokeLinecap="round"
              strokeDasharray={RING_CIRCUMFERENCE}
              initial={{ strokeDashoffset: RING_CIRCUMFERENCE }}
              animate={{ strokeDashoffset: reduceMotion ? filledOffset : filledOffset }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            />
          </svg>

          {/* Center text */}
          <div className="absolute flex flex-col items-center justify-center text-center">
            <span className="font-condensed text-3xl font-extrabold leading-none tracking-display">
              {Math.round(consumed)}
            </span>
            <span className="font-condensed text-[10px] uppercase tracking-wide-display text-muted-foreground mt-0.5">
              kcal
            </span>
            <div className="mt-1 h-px w-8 bg-border" />
            <span className="font-condensed text-sm text-muted-foreground mt-1">
              {target > 0
                ? isOver
                  ? `+${Math.round(consumed - target)} kcal`
                  : `${Math.round(remaining)} maradt`
                : 'nincs cél'}
            </span>
          </div>
        </div>
      </div>

      {/* Target label */}
      {target > 0 && (
        <p className="text-center font-condensed text-xs text-muted-foreground">
          Napi cél:{' '}
          <span className="text-foreground font-semibold">{target} kcal</span>
        </p>
      )}

      {/* Macros */}
      <div className="flex flex-col gap-2.5">
        <MacroBar
          label="Fehérje"
          value={protein}
          max={proteinTarget}
          color="bg-emerald-500"
        />
        <MacroBar
          label="Szénhidrát"
          value={carbs}
          max={carbTarget}
          color="bg-amber-500"
        />
        <MacroBar
          label="Zsír"
          value={fat}
          max={fatTarget}
          color="bg-brand-red"
        />
      </div>
    </motion.div>
  )
}
