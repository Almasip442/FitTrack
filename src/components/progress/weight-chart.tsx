'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { TrendingUp } from 'lucide-react'
import { useMemo, useState } from 'react'

import { cn } from '@/lib/utils'
import type { WeightLog } from '@/types/database'

interface WeightChartProps {
  logs: WeightLog[]
  /** Optional goal weight — renders a horizontal reference line. */
  goalWeight?: number | null
}

/** Format a YYYY-MM-DD string to a short Hungarian date label (e.g. "máj. 6."). */
function formatShortDate(iso: string): string {
  const months = [
    'jan', 'feb', 'már', 'ápr', 'máj', 'jún',
    'júl', 'aug', 'sze', 'okt', 'nov', 'dec',
  ]
  const [, m, d] = iso.split('-')
  return `${months[parseInt(m, 10) - 1]}. ${parseInt(d, 10)}.`
}

/** Format a YYYY-MM-DD string to a full Hungarian date label. */
function formatFullDate(iso: string): string {
  const [y, m, d] = iso.split('-')
  return `${y}. ${parseInt(m, 10)}. ${parseInt(d, 10)}.`
}

/**
 * Custom SVG line chart for weight logs (last 60 days).
 * No external chart library — follows the WeeklyTrendChart pattern.
 */
export function WeightChart({ logs, goalWeight }: WeightChartProps) {
  const reduceMotion = useReducedMotion()
  const [hovered, setHovered] = useState<number | null>(null)

  const hasData = logs.length > 0

  if (!hasData) {
    return (
      <section
        className={cn(
          'rounded-xl border border-dashed border-border/60 bg-card/30',
          'flex flex-col items-center justify-center px-6 py-16 text-center',
        )}
        aria-label="Testsúly trend"
      >
        <TrendingUp
          className="mb-3 size-8 text-muted-foreground/30"
          strokeWidth={1.5}
        />
        <p className="font-condensed text-sm uppercase tracking-wide-display text-muted-foreground">
          Még nincs mért testsúly
        </p>
        <p className="mt-1 font-sans text-xs text-muted-foreground/60">
          Add hozzá az első bejegyzésed a fenti űrlapon!
        </p>
      </section>
    )
  }

  return (
    <section
      className={cn(
        'relative overflow-hidden rounded-xl border border-border bg-card/40',
        'p-5 sm:p-6',
      )}
      aria-label="Testsúly trend"
    >
      {/* Header */}
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <span className="font-condensed text-[11px] uppercase tracking-wide-display text-brand-red">
            {'// 60 nap'}
          </span>
          <h3 className="mt-0.5 font-condensed text-xl font-extrabold uppercase tracking-display text-foreground leading-none">
            Testsúly trend
          </h3>
        </div>

        {goalWeight != null && (
          <div className="flex items-center gap-1.5">
            <span className="h-px w-4 border-t border-dashed border-emerald-500/70" />
            <span className="font-condensed text-[10px] uppercase tracking-wide-display text-muted-foreground">
              Célsúly: {goalWeight} kg
            </span>
          </div>
        )}
      </div>

      <ChartBody
        logs={logs}
        goalWeight={goalWeight ?? null}
        hovered={hovered}
        setHovered={setHovered}
        reduceMotion={!!reduceMotion}
      />
    </section>
  )
}

/* -------------------------------------------------------------------------- */
/*  Chart body                                                                 */
/* -------------------------------------------------------------------------- */

function ChartBody({
  logs,
  goalWeight,
  hovered,
  setHovered,
  reduceMotion,
}: {
  logs: WeightLog[]
  goalWeight: number | null
  hovered: number | null
  setHovered: (i: number | null) => void
  reduceMotion: boolean
}) {
  // Geometry
  const VB_WIDTH = 700
  const VB_HEIGHT = 220
  const PAD = { top: 20, right: 16, bottom: 40, left: 48 }
  const innerW = VB_WIDTH - PAD.left - PAD.right
  const innerH = VB_HEIGHT - PAD.top - PAD.bottom

  const { minWeight, maxWeight, yTicks, pathD, points } = useMemo(() => {
    const weights = logs.map((l) => l.weight)
    const rawMin = Math.min(...weights)
    const rawMax = Math.max(...weights)

    // Padding: at least 2kg above and below for readability
    const padding = Math.max((rawMax - rawMin) * 0.25, 2)
    const minW = goalWeight != null
      ? Math.min(rawMin, goalWeight) - padding
      : rawMin - padding
    const maxW = goalWeight != null
      ? Math.max(rawMax, goalWeight) + padding
      : rawMax + padding

    const range = maxW - minW || 1

    // Y-axis ticks: 4 evenly spaced
    const step = range / 4
    const ticks: number[] = Array.from({ length: 5 }, (_, i) =>
      Math.round((minW + step * i) * 10) / 10,
    )

    // Map weight to Y coordinate
    const yFor = (w: number) =>
      PAD.top + innerH * (1 - (w - minW) / range)

    // Map log index to X coordinate
    const xFor = (i: number) =>
      PAD.left + (innerW / Math.max(logs.length - 1, 1)) * i

    // Points array
    const pts = logs.map((log, i) => ({
      x: xFor(i),
      y: yFor(log.weight),
      weight: log.weight,
      date: log.date,
    }))

    // SVG path string (smooth polyline via cardinal spline approach — simple line path)
    const pathStr = pts
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
      .join(' ')

    return {
      minWeight: minW,
      maxWeight: maxW,
      yTicks: ticks,
      pathD: pathStr,
      points: pts,
    }
  }, [logs, goalWeight, innerH, innerW, PAD])

  const range = maxWeight - minWeight || 1
  const yFor = (w: number) =>
    PAD.top + innerH * (1 - (w - minWeight) / range)

  // Decide which x-axis labels to show (max ~6 to avoid crowding)
  const labelStep = Math.ceil(logs.length / 6)
  const labelIndices = new Set(
    logs.map((_, i) => i).filter((i) => i % labelStep === 0),
  )
  // Always show last point label
  labelIndices.add(logs.length - 1)

  // Path total length — we use a fixed approx for the draw animation
  const estimatedPathLength = 3000

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${VB_WIDTH} ${VB_HEIGHT}`}
        role="img"
        aria-label="Testsúly vonaldiagram"
        className="block w-full"
      >
        {/* Y-axis grid + labels */}
        {yTicks.map((tick) => {
          const y = yFor(tick)
          return (
            <g key={tick}>
              <line
                x1={PAD.left}
                x2={VB_WIDTH - PAD.right}
                y1={y}
                y2={y}
                stroke="currentColor"
                className="text-border/30"
                strokeWidth={0.8}
              />
              <text
                x={PAD.left - 8}
                y={y + 3.5}
                textAnchor="end"
                className="fill-muted-foreground/50 font-condensed text-[9px] uppercase"
                style={{ letterSpacing: '0.06em' }}
              >
                {tick.toLocaleString('hu-HU', { minimumFractionDigits: 0, maximumFractionDigits: 1 })}
              </text>
            </g>
          )
        })}

        {/* Goal weight reference line */}
        {goalWeight != null && (
          <line
            x1={PAD.left}
            x2={VB_WIDTH - PAD.right}
            y1={yFor(goalWeight)}
            y2={yFor(goalWeight)}
            stroke="rgb(16 185 129)"
            strokeWidth={1.5}
            strokeDasharray="5 4"
            opacity={0.7}
          />
        )}

        {/* Area fill under the line */}
        {points.length > 1 && (
          <motion.path
            d={`${pathD} L ${points[points.length - 1].x.toFixed(2)} ${(PAD.top + innerH).toFixed(2)} L ${points[0].x.toFixed(2)} ${(PAD.top + innerH).toFixed(2)} Z`}
            fill="url(#weightGradient)"
            opacity={0.15}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.15 }}
            transition={{ duration: reduceMotion ? 0 : 0.8, ease: [0.22, 1, 0.36, 1] }}
          />
        )}

        {/* Gradient def */}
        <defs>
          <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-brand-red)" stopOpacity={1} />
            <stop offset="100%" stopColor="var(--color-brand-red)" stopOpacity={0} />
          </linearGradient>
        </defs>

        {/* Main line — animated draw */}
        {points.length > 1 && (
          <motion.path
            d={pathD}
            fill="none"
            stroke="var(--color-brand-red)"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={estimatedPathLength}
            initial={{ strokeDashoffset: reduceMotion ? 0 : estimatedPathLength }}
            animate={{ strokeDashoffset: 0 }}
            transition={{ duration: reduceMotion ? 0 : 1.2, ease: [0.22, 1, 0.36, 1] }}
          />
        )}

        {/* Data points */}
        {points.map((p, i) => {
          const isHovered = hovered === i
          return (
            <g key={logs[i].id}>
              {/* Hit area — equal-width column per data point */}
              <rect
                x={PAD.left + (innerW / Math.max(points.length - 1, 1)) * i - 8}
                y={PAD.top}
                width={Math.max(innerW / Math.max(points.length - 1, 1), 16)}
                height={innerH}
                fill="transparent"
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
                onFocus={() => setHovered(i)}
                onBlur={() => setHovered(null)}
                tabIndex={0}
                role="button"
                aria-label={`${formatFullDate(p.date)}: ${p.weight} kg`}
                style={{ outline: 'none', cursor: 'default' }}
              />

              {/* Dot */}
              <circle
                cx={p.x}
                cy={p.y}
                r={isHovered ? 5 : 3}
                fill={isHovered ? 'var(--color-brand-red)' : 'var(--color-card)'}
                stroke="var(--color-brand-red)"
                strokeWidth={isHovered ? 0 : 1.5}
                style={{ transition: 'r 0.15s ease, fill 0.15s ease' }}
              />
            </g>
          )
        })}

        {/* X-axis date labels */}
        {points.map((p, i) =>
          labelIndices.has(i) ? (
            <text
              key={`label-${i}`}
              x={p.x}
              y={VB_HEIGHT - PAD.bottom + 16}
              textAnchor="middle"
              className="fill-muted-foreground/50 font-condensed text-[9px] uppercase"
              style={{ letterSpacing: '0.04em' }}
            >
              {formatShortDate(logs[i].date)}
            </text>
          ) : null,
        )}
      </svg>

      {/* Hover tooltip */}
      {hovered != null && points[hovered] && (
        <WeightTooltip
          weight={points[hovered].weight}
          date={points[hovered].date}
          slotIndex={hovered}
          totalSlots={points.length}
          goalWeight={goalWeight}
        />
      )}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Tooltip                                                                    */
/* -------------------------------------------------------------------------- */

function WeightTooltip({
  weight,
  date,
  slotIndex,
  totalSlots,
  goalWeight,
}: {
  weight: number
  date: string
  slotIndex: number
  totalSlots: number
  goalWeight: number | null
}) {
  const fraction = (slotIndex + 0.5) / totalSlots
  const delta = goalWeight != null ? weight - goalWeight : null
  const isAboveGoal = delta != null && delta > 0

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'pointer-events-none absolute -top-2 z-10 -translate-x-1/2 rounded-md',
        'border border-brand-red-border bg-background px-3 py-2 shadow-lg',
        'shadow-[0_0_0_1px_rgba(120,0,0,0.2)]',
      )}
      style={{ left: `${Math.min(Math.max(fraction * 100, 8), 92)}%` }}
    >
      <p className="font-condensed text-[10px] uppercase tracking-wide-display text-muted-foreground/70">
        {formatFullDate(date)}
      </p>
      <p className="mt-0.5 font-condensed text-base font-bold uppercase tracking-display text-foreground tabular-nums">
        {weight.toLocaleString('hu-HU', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
        <span className="ml-1 text-[10px] text-muted-foreground/70">kg</span>
      </p>
      {delta != null && (
        <p
          className={cn(
            'mt-0.5 font-condensed text-[10px] uppercase tracking-wide-display tabular-nums',
            isAboveGoal ? 'text-amber-500/90' : 'text-emerald-500/90',
          )}
        >
          {isAboveGoal
            ? `+${delta.toFixed(1)} kg célon felül`
            : `${Math.abs(delta).toFixed(1)} kg még a célig`}
        </p>
      )}
    </div>
  )
}
