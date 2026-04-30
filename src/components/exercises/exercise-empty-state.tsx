'use client'

import { SearchX } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ExerciseEmptyStateProps {
  /**
   * Indicates whether the user has any active filters / query.
   * If true, the "clear filters" CTA is shown.
   */
  hasActiveFilters: boolean
  onClearFilters: () => void
}

/**
 * Empty state for the exercise browser — rendered when the API returns
 * zero results. SpaceX/console aesthetic: thin lines, brand-red accent,
 * uppercase Barlow Condensed micro-meta, generous negative space.
 */
export function ExerciseEmptyState({
  hasActiveFilters,
  onClearFilters,
}: ExerciseEmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        'rounded-lg border border-dashed border-border',
        'px-6 py-16 sm:py-24',
      )}
    >
      <span className="font-condensed text-[10px] uppercase tracking-wide-display text-brand-red">
        {'// 0 találat'}
      </span>

      <div
        aria-hidden="true"
        className={cn(
          'mt-6 flex size-16 items-center justify-center rounded-full',
          'border border-brand-red-border bg-brand-red-muted',
        )}
      >
        <SearchX className="size-7 text-brand-red" />
      </div>

      <h3
        className={cn(
          'mt-6 font-condensed text-2xl sm:text-3xl font-extrabold uppercase',
          'tracking-display text-foreground',
        )}
      >
        Nincs találat
      </h3>

      <p className="mt-2 max-w-sm font-sans text-sm text-muted-foreground">
        Nem találtunk gyakorlatot a megadott feltételekkel. Próbálj meg
        kevesebb szűrőt használni vagy módosítsd a keresést.
      </p>

      <span
        aria-hidden="true"
        className="mt-6 block h-px w-12 bg-brand-red"
      />

      {hasActiveFilters && (
        <Button
          variant="outline"
          onClick={onClearFilters}
          className={cn(
            'mt-6 font-condensed text-xs uppercase tracking-wide-display',
            'border-brand-red-border hover:bg-brand-red-muted',
          )}
        >
          Szűrők törlése
        </Button>
      )}
    </div>
  )
}
