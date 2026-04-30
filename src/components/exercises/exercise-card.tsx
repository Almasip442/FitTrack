'use client'

import { ChevronRight } from 'lucide-react'

import {
  DIFFICULTY_DOT,
  DIFFICULTY_TEXT,
  findMuscleGroup,
  muscleGroupCode,
  type Difficulty,
} from '@/lib/exercises/taxonomy'
import { cn } from '@/lib/utils'
import type { Exercise } from '@/types/database'

interface ExerciseCardProps {
  exercise: Exercise
  /** 1-based index — printed as "/ 042" specimen tag in the corner. */
  index?: number
  onSelect: (exercise: Exercise) => void
}

/**
 * Compact "specimen" card.
 *
 * Layout:  [thumb / glyph]  [name + meta]  [difficulty dot]  [>]
 *
 * - Thumbnail uses `<img>` (Supabase URLs change identity often, see F3 notes).
 * - When no image is available we fall back to a 3-letter muscle-group code
 *   set inside a bordered tile — keeps the row aligned and gives the page
 *   visual rhythm even on a fully-text dataset.
 * - Hover lifts the brand-red border on the left edge as a subtle "selectable
 *   row" affordance — matches the SpaceX/console mood without bouncing scale.
 */
export function ExerciseCard({ exercise, index, onSelect }: ExerciseCardProps) {
  const code = muscleGroupCode(exercise.muscle_group)
  const muscle = findMuscleGroup(exercise.muscle_group)
  const difficulty = exercise.difficulty as Difficulty | null

  return (
    <button
      type="button"
      onClick={() => onSelect(exercise)}
      className={cn(
        'group relative flex w-full items-stretch gap-4',
        'rounded-lg border border-border bg-card text-left',
        'p-3 sm:p-4',
        'transition-all duration-200',
        'hover:border-brand-red-border',
        'hover:shadow-[inset_2px_0_0_0_var(--color-brand-red)]',
        'focus-visible:outline-none focus-visible:border-brand-red',
        'focus-visible:shadow-[inset_2px_0_0_0_var(--color-brand-red)]',
        'focus-visible:ring-2 focus-visible:ring-ring/40',
      )}
      aria-label={`Gyakorlat részletei: ${exercise.name_hu}`}
    >
      {/* ---------- Thumb / Glyph ---------- */}
      <div
        className={cn(
          'relative shrink-0 overflow-hidden rounded-md border border-border',
          'h-16 w-16 sm:h-20 sm:w-20',
          'bg-gradient-to-br from-[#1a1a1a] to-[#0e0e0e]',
        )}
      >
        {exercise.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={exercise.image_url}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span
              className={cn(
                'font-condensed text-base sm:text-lg font-extrabold uppercase',
                'tracking-wide-display text-brand-red',
              )}
            >
              {code}
            </span>
          </div>
        )}
        {/* Inner stroke for that engineered, non-flat look */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-md ring-1 ring-inset ring-white/[0.04]"
        />
      </div>

      {/* ---------- Name + meta column ---------- */}
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
        {/* Top meta row: specimen index + muscle code */}
        <div className="flex items-center gap-2">
          {typeof index === 'number' && (
            <span className="font-condensed text-[10px] uppercase tracking-wide-display text-muted-foreground/50">
              / {String(index).padStart(3, '0')}
            </span>
          )}
          <span className="font-condensed text-[10px] uppercase tracking-wide-display text-brand-red/80">
            {code}
          </span>
          {exercise.equipment && (
            <>
              <span aria-hidden="true" className="text-muted-foreground/30">
                •
              </span>
              <span className="font-condensed text-[10px] uppercase tracking-wide-display text-muted-foreground/70">
                {exercise.equipment}
              </span>
            </>
          )}
        </div>

        {/* Name */}
        <h3
          className={cn(
            'truncate font-condensed text-base sm:text-lg font-bold uppercase',
            'tracking-display text-foreground',
            'transition-colors group-hover:text-brand-red',
          )}
        >
          {exercise.name_hu}
        </h3>

        {/* Bottom badges row */}
        <div className="flex flex-wrap items-center gap-2">
          {muscle && (
            <span
              className={cn(
                'inline-flex items-center rounded-sm border border-border/70',
                'px-1.5 py-0.5 font-condensed text-[10px] uppercase',
                'tracking-wide-display text-muted-foreground',
              )}
            >
              {muscle.label}
            </span>
          )}
          {difficulty && (
            <span
              className={cn(
                'inline-flex items-center gap-1.5',
                'font-condensed text-[10px] uppercase tracking-wide-display',
                DIFFICULTY_TEXT[difficulty],
              )}
            >
              <span
                className={cn(
                  'size-1.5 rounded-full',
                  DIFFICULTY_DOT[difficulty],
                )}
              />
              {difficulty}
            </span>
          )}
        </div>
      </div>

      {/* ---------- Affordance ---------- */}
      <div className="flex items-center pl-2 text-muted-foreground/40 transition-colors group-hover:text-brand-red">
        <ChevronRight className="size-5" />
      </div>
    </button>
  )
}
