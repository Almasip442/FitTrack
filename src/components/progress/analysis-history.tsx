'use client'

import { motion } from 'framer-motion'
import { Brain, Star } from 'lucide-react'
import { useState } from 'react'

import { AnalysisOverlay } from '@/components/progress/analysis-overlay'
import { staggerChildren, slideUpSm } from '@/lib/animations'
import { cn } from '@/lib/utils'
import type { WeeklyAnalysis } from '@/types/database'

interface AnalysisHistoryProps {
  analyses: WeeklyAnalysis[]
}

/** Format YYYY-MM-DD to Hungarian short label. */
function formatShortDate(iso: string): string {
  const months = [
    'jan.', 'febr.', 'márc.', 'ápr.', 'máj.', 'jún.',
    'júl.', 'aug.', 'szept.', 'okt.', 'nov.', 'dec.',
  ]
  const [y, m, d] = iso.split('-')
  return `${y}. ${months[parseInt(m, 10) - 1]} ${parseInt(d, 10)}.`
}

/**
 * Vertical timeline list of past weekly AI analyses.
 * Clicking a row opens the full analysis in the overlay.
 */
export function AnalysisHistory({ analyses }: AnalysisHistoryProps) {
  const [selected, setSelected] = useState<WeeklyAnalysis | null>(null)

  if (analyses.length === 0) {
    return (
      <section
        className={cn(
          'rounded-xl border border-dashed border-border/50 bg-card/20',
          'flex flex-col items-center justify-center px-6 py-12 text-center',
        )}
        aria-label="Korábbi elemzések"
      >
        <Brain
          className="mb-3 size-8 text-muted-foreground/25"
          strokeWidth={1.5}
        />
        <p className="font-condensed text-sm uppercase tracking-wide-display text-muted-foreground">
          Még nincsenek elemzéseid
        </p>
        <p className="mt-1.5 font-sans text-xs text-muted-foreground/60 max-w-xs">
          Rögzítsd az edzéseid és kalóriáid, majd generálj elemzést a hét végén!
        </p>
      </section>
    )
  }

  return (
    <>
      <section aria-label="Korábbi elemzések">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-condensed text-sm uppercase tracking-display text-muted-foreground">
            Korábbi elemzések
          </h3>
          <span className="font-condensed text-[10px] uppercase tracking-wide-display text-muted-foreground/50">
            {analyses.length} db
          </span>
        </div>

        {/* Timeline */}
        <motion.ol
          className="relative space-y-0"
          variants={staggerChildren}
          initial="hidden"
          animate="visible"
          aria-label="Elemzések listája"
        >
          {/* Vertical line */}
          <div className="absolute left-[11px] top-3 bottom-3 w-px bg-border/50" aria-hidden="true" />

          {analyses.map((analysis) => {
            const rating = analysis.ai_rating ?? 0
            const summary = analysis.ai_analysis ?? ''
            const preview = summary.length > 100
              ? `${summary.slice(0, 100)}…`
              : summary

            return (
              <motion.li
                key={analysis.id}
                variants={slideUpSm}
                className="relative pl-7"
              >
                {/* Timeline dot */}
                <div
                  className="absolute left-0 top-3.5 size-[10px] rounded-full border-2 border-brand-red bg-background"
                  aria-hidden="true"
                />

                {/* Card */}
                <button
                  type="button"
                  onClick={() => setSelected(analysis)}
                  className={cn(
                    'group mb-3 w-full rounded-xl border border-border bg-card',
                    'px-4 py-3.5 text-left',
                    'transition-colors duration-150',
                    'hover:border-brand-red-border hover:bg-card',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  )}
                  aria-label={`Elemzés megtekintése: ${formatShortDate(analysis.week_start)} — ${formatShortDate(analysis.week_end)}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-condensed text-[11px] uppercase tracking-wide-display text-muted-foreground/60">
                        {formatShortDate(analysis.week_start)} &mdash; {formatShortDate(analysis.week_end)}
                      </p>
                      {preview && (
                        <p className="mt-1 font-sans text-xs leading-snug text-muted-foreground line-clamp-2 group-hover:text-foreground/80 transition-colors">
                          {preview}
                        </p>
                      )}
                    </div>

                    {/* Rating badge */}
                    <div className="flex shrink-0 items-center gap-1 rounded-md border border-border bg-muted/30 px-2 py-1">
                      <Star className="size-2.5 text-brand-red" strokeWidth={2} />
                      <span className="font-condensed text-[11px] font-bold tracking-display text-muted-foreground tabular-nums">
                        {rating}/10
                      </span>
                    </div>
                  </div>

                  {/* Mini rating bar */}
                  <div className="mt-2.5 flex gap-0.5">
                    {Array.from({ length: 10 }, (_, i) => (
                      <div
                        key={i}
                        className={cn(
                          'h-0.5 flex-1 rounded-full transition-colors',
                          i < rating ? 'bg-brand-red/70' : 'bg-border',
                        )}
                        aria-hidden="true"
                      />
                    ))}
                  </div>
                </button>
              </motion.li>
            )
          })}
        </motion.ol>
      </section>

      {/* Detail overlay */}
      <AnalysisOverlay
        analysis={selected}
        open={selected != null}
        onClose={() => setSelected(null)}
      />
    </>
  )
}
