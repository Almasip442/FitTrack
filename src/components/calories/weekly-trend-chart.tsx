'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { useMemo, useState } from 'react'

import { isToday, shortWeekday } from '@/lib/calories/format'
import type { CalorieTrendPoint } from '@/lib/calories/queries'
import { cn } from '@/lib/utils'

interface WeeklyTrendChartProps {
  /** Last 7 days, oldest first. Empty days appear as zero. */
  data: CalorieTrendPoint[]
  /** Goal-adjusted calorie target — drawn as a horizontal reference line. */
  target: number
}

/**
 * Industrial-minimalist 7-day calorie bar chart. Implemented with raw SVG +
 * Framer Motion for the bar grow-in animation. Bars under target render
 * in emerald, over target in brand-red. The target is a dashed horizontal
 * reference line spanning the chart.
 */
export function WeeklyTrendChart({ data, target }: WeeklyTrendChartProps) {
  const reduceMotion = useReducedMotion()
  const [hovered, setHovered] = useState<number | null>(null)

  // Y-axis ceiling. We stretch to max(largest bar, target) * 1.15 so the
  // target line never sits on the very top edge.
  const max = useMemo(() => {
    const dataMax = data.reduce(
      (acc, d) => Math.max(acc, d.total_calories),
      0,
    )
    const ceil = Math.max(dataMax, target) * 1.15
    return ceil > 0 ? ceil : 100
  }, [data, target])

  // Friendly Y-axis ticks at 0 / target / max-rounded.
  const yTicks = useMemo(() => {
    const round = (n: number) => Math.round(n / 100) * 100
    const top = round(max)
    return [0, round(target), top].filter(
      (v, i, arr) => arr.indexOf(v) === i,
    )
  }, [max, target])

  if (data.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-border/60 bg-card/30 px-6 py-12 text-center">
        <p className="font-condensed text-sm uppercase tracking-wide-display text-muted-foreground">
          Még nincs heti adat
        </p>
        <p className="mt-1 font-sans text-xs text-muted-foreground/70">
          Adj hozzá ételeket az adatok megjelenéséhez.
        </p>
      </div>
    )
  }

  return (
    <section
      className={cn(
        'relative overflow-hidden rounded-md border border-border bg-card/40',
        'p-5 sm:p-6',
      )}
      aria-label="Heti kalória trend"
    >
      {/* Header */}
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <span className="font-condensed text-[11px] uppercase tracking-wide-display text-brand-red">
            {'// heti trend'}
          </span>
          <h3 className="mt-1 font-condensed text-xl font-extrabold uppercase tracking-display text-foreground leading-none">
            7 nap kalóriái
          </h3>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3">
          <span className="flex items-center gap-1.5 font-condensed text-[10px] uppercase tracking-wide-display text-muted-foreground">
            <span className="size-2 rounded-sm bg-emerald-500" />
            Cél alatt
          </span>
          <span className="flex items-center gap-1.5 font-condensed text-[10px] uppercase tracking-wide-display text-muted-foreground">
            <span className="size-2 rounded-sm bg-brand-red" />
            Cél felett
          </span>
          <span className="flex items-center gap-1.5 font-condensed text-[10px] uppercase tracking-wide-display text-muted-foreground">
            <span className="h-px w-3 bg-brand-red [mask-image:repeating-linear-gradient(90deg,#000_0,#000_2px,transparent_2px,transparent_4px)]" />
            Cél: {target.toLocaleString('hu-HU')}
          </span>
        </div>
      </div>

      <Chart
        data={data}
        max={max}
        target={target}
        yTicks={yTicks}
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

function Chart({
  data,
  max,
  target,
  yTicks,
  hovered,
  setHovered,
  reduceMotion,
}: {
  data: CalorieTrendPoint[]
  max: number
  target: number
  yTicks: number[]
  hovered: number | null
  setHovered: (i: number | null) => void
  reduceMotion: boolean
}) {
  // Geometry — fixed viewBox so the chart scales cleanly via CSS `width:100%`.
  const VB_WIDTH = 700
  const VB_HEIGHT = 260
  const PAD = { top: 16, right: 16, bottom: 36, left: 44 }
  const innerW = VB_WIDTH - PAD.left - PAD.right
  const innerH = VB_HEIGHT - PAD.top - PAD.bottom
  const slotW = innerW / data.length
  const barW = Math.min(36, slotW * 0.55)

  const yFor = (kcal: number) => PAD.top + innerH * (1 - kcal / max)
  const targetY = yFor(target)

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${VB_WIDTH} ${VB_HEIGHT}`}
        role="img"
        aria-label="Heti kalória bevitel oszlopdiagram"
        className="block w-full"
      >
        {/* Y-axis grid lines + labels */}
        {yTicks.map((t) => {
          const y = yFor(t)
          return (
            <g key={t}>
              <line
                x1={PAD.left}
                x2={VB_WIDTH - PAD.right}
                y1={y}
                y2={y}
                stroke="currentColor"
                className="text-border/40"
                strokeWidth={1}
              />
              <text
                x={PAD.left - 8}
                y={y + 3}
                textAnchor="end"
                className="fill-muted-foreground/60 font-condensed text-[10px] uppercase"
                style={{ letterSpacing: '0.07em' }}
              >
                {t.toLocaleString('hu-HU')}
              </text>
            </g>
          )
        })}

        {/* Target reference line (brand-red, dashed) */}
        <line
          x1={PAD.left}
          x2={VB_WIDTH - PAD.right}
          y1={targetY}
          y2={targetY}
          stroke="var(--color-brand-red)"
          strokeWidth={1.5}
          strokeDasharray="4 4"
          opacity={0.85}
        />

        {/* Bars */}
        {data.map((point, i) => {
          const isOver = point.total_calories > target
          const barH = Math.max(0, innerH - (yFor(point.total_calories) - PAD.top))
          const x = PAD.left + slotW * i + (slotW - barW) / 2
          const baseY = PAD.top + innerH
          const y = baseY - barH
          const today = isToday(point.date)
          const isHovered = hovered === i

          return (
            <g key={point.date}>
              {/* Hover hit area — full slot column */}
              <rect
                x={PAD.left + slotW * i}
                y={PAD.top}
                width={slotW}
                height={innerH}
                fill="transparent"
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
                onFocus={() => setHovered(i)}
                onBlur={() => setHovered(null)}
                tabIndex={0}
                role="button"
                aria-label={`${shortWeekday(point.date)} ${point.date}: ${Math.round(point.total_calories)} kcal`}
                style={{ outline: 'none', cursor: 'default' }}
              />

              {/* Bar */}
              <motion.rect
                x={x}
                width={barW}
                rx={2}
                ry={2}
                fill={isOver ? 'var(--color-brand-red)' : 'rgb(16 185 129)'}
                opacity={isHovered ? 1 : 0.85}
                initial={
                  reduceMotion
                    ? { y, height: barH }
                    : { y: baseY, height: 0 }
                }
                animate={{ y, height: barH }}
                transition={{
                  duration: 0.6,
                  ease: [0.22, 1, 0.36, 1],
                  delay: reduceMotion ? 0 : i * 0.06,
                }}
              />

              {/* Today indicator dot above bar */}
              {today && barH > 0 && (
                <circle
                  cx={x + barW / 2}
                  cy={y - 6}
                  r={2.5}
                  fill="var(--color-brand-red)"
                />
              )}

              {/* X-axis weekday label */}
              <text
                x={PAD.left + slotW * i + slotW / 2}
                y={VB_HEIGHT - PAD.bottom + 16}
                textAnchor="middle"
                className={cn(
                  'font-condensed text-[10px] uppercase',
                  today ? 'fill-brand-red font-bold' : 'fill-muted-foreground/70',
                )}
                style={{ letterSpacing: '0.07em' }}
              >
                {shortWeekday(point.date)}
              </text>

              {/* X-axis date number */}
              <text
                x={PAD.left + slotW * i + slotW / 2}
                y={VB_HEIGHT - PAD.bottom + 28}
                textAnchor="middle"
                className="fill-muted-foreground/40 font-condensed text-[9px] uppercase"
                style={{ letterSpacing: '0.05em' }}
              >
                {point.date.slice(8, 10)}
              </text>
            </g>
          )
        })}

        {/* Tooltip — rendered absolutely positioned outside SVG for crisp text. */}
      </svg>

      {/* Hover tooltip overlay — DOM, not SVG */}
      {hovered != null && data[hovered] && (
        <Tooltip
          point={data[hovered]}
          target={target}
          slotIndex={hovered}
          totalSlots={data.length}
        />
      )}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Tooltip                                                                    */
/* -------------------------------------------------------------------------- */

function Tooltip({
  point,
  target,
  slotIndex,
  totalSlots,
}: {
  point: CalorieTrendPoint
  target: number
  slotIndex: number
  totalSlots: number
}) {
  // Position the tooltip horizontally based on the slot fraction.
  // The chart fills 100% width, so we use the slot index as a fraction.
  const fraction = (slotIndex + 0.5) / totalSlots
  const isOver = point.total_calories > target
  const delta = point.total_calories - target

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'pointer-events-none absolute -top-2 z-10 -translate-x-1/2 rounded-md',
        'border border-brand-red-border bg-background px-3 py-2 shadow-lg',
        'shadow-[0_0_0_1px_rgba(120,0,0,0.25)]',
      )}
      style={{ left: `${fraction * 100}%` }}
    >
      <p className="font-condensed text-[10px] uppercase tracking-wide-display text-muted-foreground/70">
        {shortWeekday(point.date)} · {point.date}
      </p>
      <p className="mt-0.5 font-condensed text-base font-bold uppercase tracking-display text-foreground tabular-nums">
        {Math.round(point.total_calories).toLocaleString('hu-HU')}
        <span className="ml-1 text-[10px] text-muted-foreground/70">kcal</span>
      </p>
      <p
        className={cn(
          'mt-0.5 font-condensed text-[10px] uppercase tracking-wide-display tabular-nums',
          isOver ? 'text-red-500/90' : 'text-emerald-500/90',
        )}
      >
        {isOver
          ? `+${Math.round(delta).toLocaleString('hu-HU')} célon felül`
          : point.total_calories === 0
            ? 'nincs adat'
            : `${Math.round(-delta).toLocaleString('hu-HU')} célig`}
      </p>
    </div>
  )
}
