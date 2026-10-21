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

  const rating = analysis?.ai_rating ?? analysis?.rule_based_rating ?? 0
  const suggestions = analysis?.ai_suggestions ?? []
  const summary = analysis?.ai_analysis ?? ''
  const ruleSummary = analysis?.rule_based_summary ?? ''
  const ruleSuggestions = analysis?.rule_based_suggestions ?? []
  const isFallback = analysis?.ai_status === 'fallback'
  const isSample = analysis?.ai_status === 'sample'

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
              <div className="grid gap-4 md:grid-cols-2">
                <section className="rounded-xl border border-border/60 bg-card/40 p-4">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className="font-condensed text-[10px] uppercase tracking-wide-display text-muted-foreground/70">
                      Szabályalapú értékelés
                    </span>
                    {analysis?.rule_based_rating != null && (
                      <span className="font-condensed text-xs font-bold text-muted-foreground">
                        {analysis.rule_based_rating}/10
                      </span>
                    )}
                  </div>
                  <p className="font-sans text-sm leading-relaxed text-foreground/90">
                    {ruleSummary || 'Ehhez a korábbi elemzéshez nem mentettünk szabályalapú összefoglalót.'}
                  </p>
                  {ruleSuggestions.length > 0 && (
                    <ul className="mt-3 list-disc space-y-1 pl-4 text-xs text-muted-foreground">
                      {ruleSuggestions.map((item, index) => <li key={index}>{item}</li>)}
                    </ul>
                  )}
                </section>

                <section className="rounded-xl border border-brand-red-border/50 bg-brand-red-muted/20 p-4">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className="font-condensed text-[10px] uppercase tracking-wide-display text-brand-red">
                      {isFallback ? 'AI nem elérhető' : isSample ? 'Mintaadat – nincs AI-válasz' : 'AI magyarázat'}
                    </span>
                    {!isFallback && rating > 0 && (
                      <span className="font-condensed text-xs font-bold text-brand-red">
                        {rating}/10
                      </span>
                    )}
                  </div>
                  <p className="font-sans text-sm leading-relaxed text-foreground/90">
                    {summary || (isSample
                      ? 'Ez a seedelt demóelemzés kizárólag a szabályalapú megjelenítés próbájára készült; AI-választ nem tartalmaz.'
                      : 'Az AI szolgáltatás nem adott értékelést. A szabályalapú összefoglaló ettől még használható.')}
                  </p>
                  {!isFallback && suggestions.length > 0 && (
                    <ul className="mt-3 space-y-2">
                      {suggestions.slice(0, 3).map((suggestion, i) => (
                        <motion.li
                          key={i}
                          className="flex items-start gap-2 text-xs leading-snug text-foreground/85"
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.25, delay: 0.1 + i * 0.06 }}
                        >
                          {suggestionIcon(suggestion)}
                          <span>{suggestion}</span>
                        </motion.li>
                      ))}
                    </ul>
                  )}
                </section>
              </div>

              {analysis?.risk_warning && (
                <p className="mt-4 rounded-lg border border-border/60 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
                  {analysis.risk_warning}
                </p>
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
