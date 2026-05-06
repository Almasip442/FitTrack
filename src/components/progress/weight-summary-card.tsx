import { ArrowDown, ArrowUp, Minus } from 'lucide-react'

import { cn } from '@/lib/utils'
import type { WeightChangeSummary } from '@/lib/weight/queries'

interface WeightSummaryCardProps {
  summary: WeightChangeSummary
}

/**
 * Week-over-week weight comparison card.
 * Shows current week avg vs previous week avg with change in kg and %.
 */
export function WeightSummaryCard({ summary }: WeightSummaryCardProps) {
  const { currentWeekAvg, previousWeekAvg, changeKg, changePercent } = summary
  const hasData = currentWeekAvg != null && previousWeekAvg != null

  // Direction: positive = gained, negative = lost
  const isUp = changeKg != null && changeKg > 0
  const isDown = changeKg != null && changeKg < 0
  const isNeutral = changeKg != null && changeKg === 0

  return (
    <section
      className={cn(
        'relative overflow-hidden rounded-xl border border-border bg-card',
        'p-5 sm:p-6',
      )}
    >
      {/* Accent strip */}
      <div className="absolute left-0 top-0 h-full w-0.5 rounded-l-xl bg-brand-gray/60" />

      <div className="mb-4">
        <span className="block font-condensed text-[11px] uppercase tracking-wide-display text-brand-red">
          {'// összesítő'}
        </span>
        <h2 className="mt-0.5 font-condensed text-xl font-bold uppercase tracking-display text-foreground leading-none">
          Heti változás
        </h2>
      </div>

      {!hasData ? (
        <div className="flex flex-col items-start">
          <p className="font-sans text-sm text-muted-foreground">
            Nincs elég adat az összehasonlításhoz.
          </p>
          <p className="mt-1 font-sans text-xs text-muted-foreground/60">
            Rögzítsd a testsúlyod legalább két héten keresztül.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Week averages */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-border bg-muted/30 px-3 py-2.5">
              <p className="font-condensed text-[10px] uppercase tracking-wide-display text-muted-foreground">
                Előző hét
              </p>
              <p className="mt-0.5 font-condensed text-xl font-bold tabular-nums text-foreground">
                {previousWeekAvg.toLocaleString('hu-HU', {
                  minimumFractionDigits: 1,
                  maximumFractionDigits: 1,
                })}
                <span className="ml-0.5 text-xs text-muted-foreground"> kg</span>
              </p>
            </div>

            <div className="rounded-lg border border-border bg-muted/30 px-3 py-2.5">
              <p className="font-condensed text-[10px] uppercase tracking-wide-display text-muted-foreground">
                Ezen a héten
              </p>
              <p className="mt-0.5 font-condensed text-xl font-bold tabular-nums text-foreground">
                {currentWeekAvg.toLocaleString('hu-HU', {
                  minimumFractionDigits: 1,
                  maximumFractionDigits: 1,
                })}
                <span className="ml-0.5 text-xs text-muted-foreground"> kg</span>
              </p>
            </div>
          </div>

          {/* Change indicator */}
          {changeKg != null && (
            <div
              className={cn(
                'flex items-center gap-2 rounded-lg px-3 py-2.5',
                isUp && 'bg-amber-500/10 border border-amber-500/20',
                isDown && 'bg-emerald-500/10 border border-emerald-500/20',
                isNeutral && 'bg-muted/30 border border-border',
              )}
            >
              <div
                className={cn(
                  'flex size-7 shrink-0 items-center justify-center rounded-md',
                  isUp && 'bg-amber-500/15',
                  isDown && 'bg-emerald-500/15',
                  isNeutral && 'bg-muted/50',
                )}
              >
                {isUp && <ArrowUp className="size-3.5 text-amber-500" strokeWidth={2.5} />}
                {isDown && <ArrowDown className="size-3.5 text-emerald-500" strokeWidth={2.5} />}
                {isNeutral && <Minus className="size-3.5 text-muted-foreground" strokeWidth={2.5} />}
              </div>

              <div>
                <p
                  className={cn(
                    'font-condensed text-sm font-bold uppercase tracking-display tabular-nums leading-none',
                    isUp && 'text-amber-500',
                    isDown && 'text-emerald-500',
                    isNeutral && 'text-muted-foreground',
                  )}
                >
                  {changeKg > 0 ? '+' : ''}{changeKg.toLocaleString('hu-HU', {
                    minimumFractionDigits: 1,
                    maximumFractionDigits: 1,
                  })} kg
                  {changePercent != null && (
                    <span className="ml-2 text-[11px] opacity-70">
                      ({changePercent > 0 ? '+' : ''}{changePercent.toFixed(1)}%)
                    </span>
                  )}
                </p>
                <p
                  className={cn(
                    'mt-0.5 font-sans text-[10px]',
                    isUp && 'text-amber-500/70',
                    isDown && 'text-emerald-500/70',
                    isNeutral && 'text-muted-foreground/70',
                  )}
                >
                  {isUp && 'Előző héthez képest növekedés'}
                  {isDown && 'Előző héthez képest csökkenés'}
                  {isNeutral && 'Nincs változás az előző héthez képest'}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  )
}
