'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { Sparkles, X, ChevronRight } from 'lucide-react'

import { Button, buttonVariants } from '@/components/ui/button'
import { slideUp, scaleIn } from '@/lib/animations'
import { cn } from '@/lib/utils'
import type { DashboardLatestAnalysis } from '@/lib/dashboard/queries'

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

interface AiAnalysisWidgetProps {
  analysis: DashboardLatestAnalysis | null
}

/* -------------------------------------------------------------------------- */
/*  Analysis overlay                                                           */
/* -------------------------------------------------------------------------- */

function AnalysisOverlay({
  analysis,
  onClose,
}: {
  analysis: DashboardLatestAnalysis
  onClose: () => void
}) {
  const ratingColor =
    (analysis.ai_rating ?? 0) >= 7
      ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30'
      : (analysis.ai_rating ?? 0) >= 5
        ? 'text-amber-500 bg-amber-500/10 border-amber-500/30'
        : 'text-red-500 bg-red-500/10 border-red-500/30'

  const weekStart = analysis.week_start
    ? new Date(analysis.week_start).toLocaleDateString('hu-HU', {
        month: 'long',
        day: 'numeric',
      })
    : null

  return (
    <motion.div
      key="overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        variants={scaleIn}
        initial="hidden"
        animate="visible"
        exit="hidden"
        className={cn(
          'relative w-full max-w-lg rounded-xl border p-6 shadow-2xl',
          'bg-[#1a1a1a] border-[#2a2a2a]',
          'bg-card border-border',
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 flex size-7 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          aria-label="Bezárás"
        >
          <X className="size-4 stroke-[1.5]" />
        </button>

        {/* Header */}
        <div className="flex items-start gap-3 mb-4 pr-8">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[rgba(120,0,0,0.1)] border border-[rgba(120,0,0,0.35)]">
            <Sparkles className="size-4 stroke-[1.5] text-brand-red" />
          </div>
          <div className="flex flex-col gap-0.5">
            <h3 className="font-condensed text-base font-bold uppercase tracking-display">
              AI Heti Elemzés
            </h3>
            {weekStart && (
              <p className="font-condensed text-xs text-muted-foreground">
                {weekStart}
              </p>
            )}
          </div>
          {analysis.ai_rating !== null && (
            <span
              className={cn(
                'ml-auto shrink-0 font-condensed text-lg font-extrabold px-3 py-1 rounded-full border',
                ratingColor,
              )}
            >
              {analysis.ai_rating}/10
            </span>
          )}
        </div>

        {/* Content */}
        <div className="rounded-lg bg-muted/50 p-4">
          <p className="text-sm leading-relaxed text-foreground">
            {analysis.ai_analysis ?? 'Nincs elemzés szöveg.'}
          </p>
        </div>
      </motion.div>
    </motion.div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Main component                                                             */
/* -------------------------------------------------------------------------- */

export function AiAnalysisWidget({ analysis }: AiAnalysisWidgetProps) {
  const [showOverlay, setShowOverlay] = useState(false)

  const ratingNum = analysis?.ai_rating ?? 0
  const ratingBadgeColor =
    ratingNum >= 7
      ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30'
      : ratingNum >= 5
        ? 'text-amber-500 bg-amber-500/10 border-amber-500/30'
        : 'text-red-500 bg-red-500/10 border-red-500/30'

  const summaryText = analysis?.ai_analysis
    ? analysis.ai_analysis.slice(0, 120) +
      (analysis.ai_analysis.length > 120 ? '...' : '')
    : null

  return (
    <>
      <motion.div
        variants={slideUp}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.2 }}
        className={cn(
          'flex flex-col gap-4 rounded-xl border bg-card p-5 text-card-foreground shadow-sm',
          'dark:bg-[#1a1a1a] dark:border-[#2a2a2a]',
        )}
      >
        {/* Header */}
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-full bg-[rgba(120,0,0,0.1)] border border-[rgba(120,0,0,0.35)]">
            <Sparkles className="size-3.5 stroke-[1.5] text-brand-red" />
          </div>
          <h3 className="font-condensed text-sm font-bold uppercase tracking-wide-display text-muted-foreground">
            AI Elemzés
          </h3>
          {analysis?.ai_rating !== null && analysis?.ai_rating !== undefined && (
            <span
              className={cn(
                'ml-auto font-condensed text-sm font-extrabold px-2.5 py-0.5 rounded-full border',
                ratingBadgeColor,
              )}
            >
              {analysis.ai_rating}/10
            </span>
          )}
        </div>

        {analysis ? (
          <>
            {/* Summary */}
            {summaryText && (
              <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
                {summaryText}
              </p>
            )}

            {/* Detail button */}
            <Button
              onClick={() => setShowOverlay(true)}
              className={cn(
                'w-full font-condensed uppercase tracking-wide-display',
                'bg-[rgba(120,0,0,0.1)] border border-[rgba(120,0,0,0.35)]',
                'text-brand-red hover:bg-[rgba(120,0,0,0.2)] hover:border-brand-red',
                'transition-all duration-200',
              )}
            >
              Részletek
              <ChevronRight className="size-3.5 stroke-[1.5]" />
            </Button>
          </>
        ) : (
          /* No analysis */
          <div className="flex flex-col items-center justify-center gap-3 py-3 text-center">
            <div className="flex flex-col gap-1">
              <p className="font-condensed text-sm font-bold uppercase tracking-display">
                Nincs elemzés
              </p>
              <p className="text-xs text-muted-foreground">
                Generálj heti AI elemzést a fejlődési oldalon.
              </p>
            </div>
            <Link
              href="/progress"
              className={cn(
                buttonVariants({ variant: 'outline', size: 'sm' }),
                'font-condensed uppercase tracking-wide-display text-xs',
              )}
            >
              Generálj elemzést
            </Link>
          </div>
        )}
      </motion.div>

      {/* Overlay portal */}
      <AnimatePresence>
        {showOverlay && analysis && (
          <AnalysisOverlay
            analysis={analysis}
            onClose={() => setShowOverlay(false)}
          />
        )}
      </AnimatePresence>
    </>
  )
}
