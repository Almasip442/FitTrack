'use client'

import { motion, useReducedMotion } from 'framer-motion'
import Link from 'next/link'
import { Scale, TrendingDown, TrendingUp } from 'lucide-react'

import { buttonVariants } from '@/components/ui/button'
import { slideUp } from '@/lib/animations'
import { cn } from '@/lib/utils'
import type { DashboardWeightPoint } from '@/lib/dashboard/queries'

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

interface WeightTrendWidgetProps {
  weightTrend: DashboardWeightPoint[]
  currentWeight: number | null
  weightChange: number | null
}

/* -------------------------------------------------------------------------- */
/*  SVG Sparkline                                                              */
/* -------------------------------------------------------------------------- */

const SPARK_W = 220
const SPARK_H = 56
const SPARK_PAD = { t: 4, b: 4, l: 2, r: 2 }

function WeightSparkline({ points }: { points: DashboardWeightPoint[] }) {
  const reduceMotion = useReducedMotion()

  if (points.length < 2) return null

  const weights = points.map((p) => p.weight)
  const minW = Math.min(...weights)
  const maxW = Math.max(...weights)
  const rangeW = maxW - minW || 1

  const plotW = SPARK_W - SPARK_PAD.l - SPARK_PAD.r
  const plotH = SPARK_H - SPARK_PAD.t - SPARK_PAD.b

  const toX = (i: number) =>
    SPARK_PAD.l + (i / (points.length - 1)) * plotW
  const toY = (w: number) =>
    SPARK_PAD.t + plotH - ((w - minW) / rangeW) * plotH

  // Build polyline path
  const pathD = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${toX(i).toFixed(1)} ${toY(p.weight).toFixed(1)}`)
    .join(' ')

  // Area fill path
  const areaD = `${pathD} L ${toX(points.length - 1).toFixed(1)} ${(SPARK_PAD.t + plotH).toFixed(1)} L ${SPARK_PAD.l} ${(SPARK_PAD.t + plotH).toFixed(1)} Z`

  const lastX = toX(points.length - 1)
  const lastY = toY(points[points.length - 1].weight)

  return (
    <svg
      viewBox={`0 0 ${SPARK_W} ${SPARK_H}`}
      width="100%"
      height={SPARK_H}
      preserveAspectRatio="none"
      className="overflow-visible"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="spark-gradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#780000" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#780000" stopOpacity="0.03" />
        </linearGradient>
        <clipPath id="spark-clip">
          <motion.rect
            x={0}
            y={0}
            height={SPARK_H}
            initial={{ width: reduceMotion ? SPARK_W : 0 }}
            animate={{ width: SPARK_W }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
          />
        </clipPath>
      </defs>

      {/* Area fill */}
      <path
        d={areaD}
        fill="url(#spark-gradient)"
        clipPath="url(#spark-clip)"
      />

      {/* Line */}
      <path
        d={pathD}
        fill="none"
        stroke="#780000"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        clipPath="url(#spark-clip)"
      />

      {/* Last point dot */}
      <motion.circle
        cx={lastX}
        cy={lastY}
        r={3}
        fill="#780000"
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, delay: 0.9 }}
      />
    </svg>
  )
}

/* -------------------------------------------------------------------------- */
/*  Main component                                                             */
/* -------------------------------------------------------------------------- */

export function WeightTrendWidget({
  weightTrend,
  currentWeight,
  weightChange,
}: WeightTrendWidgetProps) {
  const hasData = weightTrend.length > 0 && currentWeight !== null

  const isGain = weightChange !== null && weightChange > 0
  const isLoss = weightChange !== null && weightChange < 0

  return (
    <motion.div
      variants={slideUp}
      initial="hidden"
      animate="visible"
      transition={{ delay: 0.15 }}
      className={cn(
        'flex flex-col gap-4 rounded-xl border bg-card p-5 text-card-foreground shadow-sm',
        'dark:bg-[#1a1a1a] dark:border-[#2a2a2a]',
      )}
    >
      {/* Header */}
      <h3 className="font-condensed text-sm font-bold uppercase tracking-wide-display text-muted-foreground">
        Testsúly trend
      </h3>

      {hasData ? (
        <>
          {/* Current weight + change */}
          <div className="flex items-end justify-between gap-2">
            <div className="flex flex-col gap-0.5">
              <span className="font-condensed text-3xl font-extrabold leading-none tracking-display">
                {currentWeight!.toFixed(1)}
              </span>
              <span className="font-condensed text-[11px] uppercase tracking-wide-display text-muted-foreground">
                kg
              </span>
            </div>

            {weightChange !== null && weightChange !== 0 && (
              <div
                className={cn(
                  'flex items-center gap-1 rounded-full px-2.5 py-1 font-condensed text-xs font-bold',
                  isLoss
                    ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/30'
                    : 'bg-red-500/10 text-red-500 border border-red-500/30',
                )}
              >
                {isLoss ? (
                  <TrendingDown className="size-3.5 stroke-[1.5]" />
                ) : (
                  <TrendingUp className="size-3.5 stroke-[1.5]" />
                )}
                <span>
                  {isGain ? '+' : ''}
                  {weightChange.toFixed(1)} kg
                </span>
              </div>
            )}

            {weightChange === 0 && (
              <span className="font-condensed text-xs text-muted-foreground">
                Változatlan
              </span>
            )}
          </div>

          {/* Sparkline */}
          <div className="-mx-1">
            <WeightSparkline points={weightTrend} />
          </div>

          <p className="font-condensed text-[10px] uppercase tracking-wide-display text-muted-foreground">
            Utolsó 30 nap
          </p>
        </>
      ) : (
        /* Empty state */
        <div className="flex flex-col items-center justify-center gap-3 py-4 text-center">
          <div className="flex size-10 items-center justify-center rounded-full bg-muted">
            <Scale className="size-5 stroke-[1.5] text-muted-foreground" />
          </div>
          <div className="flex flex-col gap-1">
            <p className="font-condensed text-sm font-bold uppercase tracking-display">
              Nincs testsúly adat
            </p>
            <p className="text-xs text-muted-foreground">
              Rögzítsd rendszeresen a súlyod.
            </p>
          </div>
          <Link
            href="/progress"
            className={cn(
              buttonVariants({ variant: 'outline', size: 'sm' }),
              'font-condensed uppercase tracking-wide-display text-xs',
            )}
          >
            Fejlődés
          </Link>
        </div>
      )}
    </motion.div>
  )
}
