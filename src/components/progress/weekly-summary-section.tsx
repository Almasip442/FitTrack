'use client'

import { Activity, ChevronLeft, ChevronRight } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import { WeeklySummaryCard } from '@/components/progress/weekly-summary-card'
import { Button } from '@/components/ui/button'
import type { WeeklyProgressBundle } from '@/lib/analysis/weekly-metrics'
import { cn } from '@/lib/utils'

function shiftWeek(iso: string, amount: number): string {
  const date = new Date(`${iso}T12:00:00`)
  date.setDate(date.getDate() + amount * 7)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function formatWeek(iso: string): string {
  const start = new Date(`${iso}T12:00:00`)
  const end = new Date(start)
  end.setDate(end.getDate() + 6)
  const format = (date: Date) => date.toLocaleDateString('hu-HU', { year: 'numeric', month: 'short', day: 'numeric' })
  return `${format(start)} – ${format(end)}`
}

export function WeeklySummarySection({ initialBundle }: { initialBundle: WeeklyProgressBundle }) {
  const [bundle, setBundle] = useState(initialBundle)
  const [selectedWeek, setSelectedWeek] = useState(initialBundle.current.weekStart)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const currentWeek = initialBundle.current.weekStart
  const options = useMemo(() => Array.from({ length: 12 }, (_, index) => {
    const weekStart = shiftWeek(currentWeek, -index)
    return { weekStart, label: index === 0 ? `Aktuális hét · ${formatWeek(weekStart)}` : formatWeek(weekStart) }
  }), [currentWeek])
  const selectedIndex = options.findIndex((option) => option.weekStart === selectedWeek)

  function selectWeek(weekStart: string) {
    setSelectedWeek(weekStart)
    setLoading(weekStart !== currentWeek)
    setError(null)
    if (weekStart === currentWeek) {
      setBundle(initialBundle)
    }
  }

  useEffect(() => {
    if (selectedWeek === currentWeek) return

    const controller = new AbortController()
    fetch(`/api/progress/weekly?week_start=${selectedWeek}`, { signal: controller.signal })
      .then(async (response) => {
        const body = await response.json()
        if (!response.ok) throw new Error(body.error ?? 'A hét betöltése sikertelen.')
        return body as WeeklyProgressBundle
      })
      .then(setBundle)
      .catch((cause: unknown) => {
        if (cause instanceof Error && cause.name === 'AbortError') return
        setError(cause instanceof Error ? cause.message : 'A hét betöltése sikertelen.')
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [currentWeek, selectedWeek])

  return (
    <section aria-labelledby="weekly-summary-title" className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-md bg-brand-red/10">
            <Activity className="size-4 text-brand-red" strokeWidth={1.5} />
          </div>
          <div>
            <span className="block font-condensed text-[10px] uppercase tracking-wide-display text-brand-red">
              {'// naplózott adatok'}
            </span>
            <h2 id="weekly-summary-title" className="font-condensed text-xl font-bold uppercase tracking-display">
              Heti áttekintés
            </h2>
            <p className="text-xs text-muted-foreground">
              A kiválasztott hét és az azt megelőző hét azonos adatforrásból készül.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 rounded-lg border border-border bg-card p-1">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Előző hét"
            disabled={selectedIndex >= options.length - 1 || loading}
            onClick={() => selectWeek(shiftWeek(selectedWeek, -1))}
          >
            <ChevronLeft />
          </Button>
          <label className="sr-only" htmlFor="weekly-summary-week">Kiválasztott hét</label>
          <select
            id="weekly-summary-week"
            value={selectedWeek}
            onChange={(event) => selectWeek(event.target.value)}
            className="h-8 max-w-[230px] bg-transparent px-2 text-xs text-foreground outline-none"
            aria-label="Hét kiválasztása"
          >
            {options.map((option) => (
              <option key={option.weekStart} value={option.weekStart}>
                {option.label}
              </option>
            ))}
          </select>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Következő hét"
            disabled={selectedIndex <= 0 || loading}
            onClick={() => selectWeek(shiftWeek(selectedWeek, 1))}
          >
            <ChevronRight />
          </Button>
        </div>
      </div>

      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <div className={cn('transition-opacity', loading && 'pointer-events-none opacity-50')} aria-busy={loading}>
        <WeeklySummaryCard current={bundle.current} previous={bundle.previous} />
      </div>
      {loading && <p className="text-xs text-muted-foreground" role="status">Heti adatok betöltése…</p>}
    </section>
  )
}
