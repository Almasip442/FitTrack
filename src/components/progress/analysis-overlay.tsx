'use client'

import { AnimatePresence, motion } from 'framer-motion'
import {
  Dumbbell,
  Lightbulb,
  Star,
  Utensils,
  X,
} from 'lucide-react'
import { useEffect } from 'react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { WeeklyAnalysis } from '@/types/database'

interface AnalysisOverlayProps {
  analysis: WeeklyAnalysis | null
  open: boolean
  onClose: () => void
}

/** Pick an icon for a suggestion based on its text content. */
function suggestionIcon(text: string) {
  const lower = text.toLowerCase()
  if (lower.includes('edzés') || lower.includes('workout') || lower.includes('erő')) {
    return <Dumbbell className="size-4 shrink-0 text-brand-red" strokeWidth={1.5} />
  }
  if (lower.includes('táplálk') || lower.includes('kalória') || lower.includes('étel') || lower.includes('étrend')) {
    return <Utensils className="size-4 shrink-0 text-brand-red" strokeWidth={1.5} />
  }
  return <Lightbulb className="size-4 shrink-0 text-brand-red" strokeWidth={1.5} />
}

/** Format YYYY-MM-DD to Hungarian short label (e.g. "máj. 6.") */
function formatDate(iso: string): string {
  const months = [
    'jan.', 'febr.', 'márc.', 'ápr.', 'máj.', 'jún.',
    'júl.', 'aug.', 'szept.', 'okt.', 'nov.', 'dec.',
  ]
  const [y, m, d] = iso.split('-')
  return `${y}. ${months[parseInt(m, 10) - 1]} ${parseInt(d, 10)}.`
}

/**
 * Full-screen overlay displaying a single weekly AI analysis.
 * Opens with Framer Motion slide-up animation.
 */
export function AnalysisOverlay({ analysis, open, onClose }: AnalysisOverlayProps) {
  // Close on ESC
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  // Lock body scroll while open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  const rating = analysis?.ai_rating ?? 0
  const suggestions = analysis?.ai_suggestions ?? []
  const summary = analysis?.ai_analysis ?? ''

  return (
    <AnimatePresence>
      {open && analysis && (
        <>
          {/* Backdrop */}
          <motion.div
            key="overlay-backdrop"
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Panel */}
          <motion.div
            key="overlay-panel"
            role="dialog"
            aria-modal="true"
            aria-label="Heti AI elemzés"
            className={cn(
              'fixed inset-0 z-50 flex flex-col',
              'sm:inset-x-4 sm:inset-y-4 sm:rounded-xl',
              'md:inset-x-auto md:left-1/2 md:right-auto md:-translate-x-1/2',
              'md:w-full md:max-w-2xl md:inset-y-8',
              'overflow-hidden bg-brand-dark border border-border/50',
              'shadow-2xl shadow-black/60',
            )}
            initial={{ opacity: 0, y: 40, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.97 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Brand red top strip */}
            <div className="h-0.5 w-full bg-brand-red shrink-0" />

            {/* Header */}
            <div className="flex shrink-0 items-start justify-between border-b border-border/50 px-5 py-4 sm:px-6">
              <div>
                <span className="block font-condensed text-[10px] uppercase tracking-wide-display text-brand-red">
                  {'// heti elemzés'}
                </span>
                <h2 className="mt-0.5 font-condensed text-xl font-bold uppercase tracking-display text-foreground leading-none">
                  {formatDate(analysis.week_start)} — {formatDate(analysis.week_end)}
                </h2>
              </div>

              {/* Rating badge */}
              <div className="flex flex-col items-end gap-2">
                <div className="flex items-center gap-1.5 rounded-md border border-brand-red-border bg-brand-red-muted px-2.5 py-1">
                  <Star className="size-3 text-brand-red" strokeWidth={2} />
                  <span className="font-condensed text-sm font-bold uppercase tracking-display text-brand-red">
                    {rating}/10
                  </span>
                </div>
                {/* Rating dots */}
                <div className="flex gap-1" aria-label={`Értékelés: ${rating}/10`}>
                  {Array.from({ length: 10 }, (_, i) => (
                    <div
                      key={i}
                      className={cn(
                        'size-2 rounded-full transition-colors',
                        i < rating ? 'bg-brand-red' : 'bg-brand-gray/50',
                      )}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6">
              {/* Summary text */}
              <div className="mb-6">
                <span className="mb-2 block font-condensed text-[10px] uppercase tracking-wide-display text-muted-foreground/70">
                  Összefoglalás
                </span>
                <p className="font-sans text-sm leading-relaxed text-foreground/90">
                  {summary}
                </p>
              </div>

              {/* Suggestions */}
              {suggestions.length > 0 && (
                <div>
                  <span className="mb-3 block font-condensed text-[10px] uppercase tracking-wide-display text-muted-foreground/70">
                    Javaslatok
                  </span>
                  <ul className="space-y-2.5">
                    {suggestions.slice(0, 3).map((suggestion, i) => (
                      <motion.li
                        key={i}
                        className={cn(
                          'flex items-start gap-3 rounded-lg border border-border/50',
                          'bg-card/50 px-4 py-3',
                        )}
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{
                          duration: 0.3,
                          ease: [0.22, 1, 0.36, 1],
                          delay: 0.15 + i * 0.07,
                        }}
                      >
                        <div className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md bg-brand-red-muted border border-brand-red-border">
                          {suggestionIcon(suggestion)}
                        </div>
                        <p className="font-sans text-sm leading-snug text-foreground/85">
                          {suggestion}
                        </p>
                      </motion.li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="shrink-0 border-t border-border/50 px-5 py-4 sm:px-6">
              <Button
                onClick={onClose}
                variant="outline"
                className="w-full font-condensed uppercase tracking-display"
              >
                <X className="size-4" strokeWidth={1.5} />
                Bezár
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
