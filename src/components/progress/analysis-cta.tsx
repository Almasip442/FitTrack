'use client'

import { Brain, CheckCircle, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'

import { AnalysisOverlay } from '@/components/progress/analysis-overlay'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { WeeklyAnalysis } from '@/types/database'

interface AnalysisCtaProps {
  latestAnalysis: WeeklyAnalysis | null
}

/** Return the Monday (ISO YYYY-MM-DD) of the current week (local time). */
function currentWeekMonday(): string {
  const today = new Date()
  const day = today.getDay() // 0 = Sun
  const diff = day === 0 ? -6 : 1 - day
  const monday = new Date(today.getFullYear(), today.getMonth(), today.getDate() + diff)
  const y = monday.getFullYear()
  const m = String(monday.getMonth() + 1).padStart(2, '0')
  const d = String(monday.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** Shape of the successful POST /api/analysis response. */
interface AnalysisApiResponse {
  id: string
  summary: string
  suggestions: string[]
  rating: number
  week_start: string
  week_end: string
}

/**
 * Maps an AnalysisApiResponse to a partial WeeklyAnalysis shape
 * (for display in the overlay immediately after generation).
 */
function apiResponseToAnalysis(
  res: AnalysisApiResponse,
): WeeklyAnalysis {
  return {
    id: res.id,
    user_id: '',
    week_start: res.week_start,
    week_end: res.week_end,
    workouts_completed: 0,
    avg_calories: null,
    weight_change: null,
    ai_analysis: res.summary,
    ai_suggestions: res.suggestions,
    ai_rating: res.rating,
    created_at: new Date().toISOString(),
  }
}

/**
 * AI analysis CTA card. Handles three states:
 * 1. No analysis yet this week → active "Generálás" button
 * 2. Analysis already exists for this week → disabled + info message
 * 3. Loading → spinner
 */
export function AnalysisCta({ latestAnalysis }: AnalysisCtaProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [rateLimitHit, setRateLimitHit] = useState(false)
  const [newAnalysis, setNewAnalysis] = useState<WeeklyAnalysis | null>(null)
  const [overlayOpen, setOverlayOpen] = useState(false)

  const weekMonday = currentWeekMonday()
  const hasCurrentWeekAnalysis =
    latestAnalysis?.week_start === weekMonday || rateLimitHit

  async function handleGenerate() {
    if (loading) return
    setLoading(true)
    setRateLimitHit(false)

    try {
      const res = await fetch('/api/analysis', { method: 'POST' })

      if (res.status === 429) {
        const body = await res.json().catch(() => ({}))
        setRateLimitHit(true)
        toast.info(
          body?.error ?? 'Már generáltál elemzést ezen a héten.',
        )
        return
      }

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        toast.error('Elemzés generálása sikertelen', {
          description: body?.error ?? `HTTP ${res.status}`,
        })
        return
      }

      const data: AnalysisApiResponse = await res.json()
      const mapped = apiResponseToAnalysis(data)
      setNewAnalysis(mapped)
      setOverlayOpen(true)
      router.refresh()
    } catch {
      toast.error('Váratlan hiba az elemzés generálása közben.')
    } finally {
      setLoading(false)
    }
  }

  const isDisabled = hasCurrentWeekAnalysis || loading

  return (
    <>
      <section
        className={cn(
          'relative overflow-hidden rounded-xl border bg-card p-5 sm:p-6',
          hasCurrentWeekAnalysis
            ? 'border-border'
            : 'border-brand-red-border',
        )}
      >
        {/* Glow accent — only when actionable */}
        {!hasCurrentWeekAnalysis && (
          <div className="absolute -right-8 -top-8 size-32 rounded-full bg-brand-red/5 blur-2xl pointer-events-none" />
        )}

        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div
              className={cn(
                'mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg',
                hasCurrentWeekAnalysis
                  ? 'bg-muted/50 border border-border'
                  : 'bg-brand-red-muted border border-brand-red-border',
              )}
            >
              {hasCurrentWeekAnalysis ? (
                <CheckCircle
                  className="size-4 text-emerald-500"
                  strokeWidth={1.5}
                />
              ) : (
                <Brain
                  className="size-4 text-brand-red"
                  strokeWidth={1.5}
                />
              )}
            </div>

            <div>
              <span className="block font-condensed text-[10px] uppercase tracking-wide-display text-brand-red">
                {'// AI elemzés'}
              </span>
              <h3 className="mt-0.5 font-condensed text-lg font-bold uppercase tracking-display text-foreground leading-none">
                {hasCurrentWeekAnalysis
                  ? 'Elemzés kész'
                  : 'Heti elemzés generálása'}
              </h3>
              <p className="mt-1.5 font-sans text-xs text-muted-foreground leading-relaxed">
                {hasCurrentWeekAnalysis
                  ? 'Már generáltál elemzést ezen a héten. Jövő héten újra elérhető.'
                  : 'Az AI elemzi az edzéseidet, kalóriáidat és testsúly-változásodat, és személyre szabott javaslatokat ad.'}
              </p>
            </div>
          </div>

          {/* CTA button */}
          <Button
            onClick={handleGenerate}
            disabled={isDisabled}
            className={cn(
              'shrink-0 font-condensed uppercase tracking-display',
              !isDisabled && [
                'border border-brand-red-border',
                'bg-brand-red-muted text-brand-red',
                'hover:bg-brand-red hover:text-primary-foreground',
                'transition-colors duration-200',
              ],
            )}
            variant={isDisabled ? 'outline' : 'ghost'}
          >
            {loading ? (
              <>
                <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                AI gondolkodik...
              </>
            ) : hasCurrentWeekAnalysis ? (
              'Kész'
            ) : (
              'Generálás'
            )}
          </Button>
        </div>
      </section>

      {/* Overlay for newly generated analysis */}
      <AnalysisOverlay
        analysis={newAnalysis}
        open={overlayOpen}
        onClose={() => setOverlayOpen(false)}
      />
    </>
  )
}
