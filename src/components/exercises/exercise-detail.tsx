'use client'

import { useEffect, useState } from 'react'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  DIFFICULTY_DOT,
  DIFFICULTY_TEXT,
  findMuscleGroup,
  muscleGroupCode,
  type Difficulty,
} from '@/lib/exercises/taxonomy'
import { cn } from '@/lib/utils'
import type { Exercise } from '@/types/database'

interface ExerciseDetailProps {
  exercise: Exercise | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * Tracks viewport width to render the right surface.
 * `md` breakpoint is 768px (Tailwind default).
 */
function useIsDesktop(): boolean {
  const [isDesktop, setIsDesktop] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)')
    const update = () => setIsDesktop(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  return isDesktop
}

function MetaRow({
  label,
  value,
}: {
  label: string
  value: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border/60 py-2.5 last:border-0">
      <span className="font-condensed text-[10px] uppercase tracking-wide-display text-muted-foreground/60">
        {label}
      </span>
      <span className="font-condensed text-xs uppercase tracking-wide-display text-foreground text-right">
        {value}
      </span>
    </div>
  )
}

/**
 * The visual body — surface-agnostic. Both Dialog and Sheet wrappers
 * inject their own `*Title` / `*Description` (visually hidden) for a11y,
 * and let this body render the on-screen heading.
 */
function DetailBody({ exercise }: { exercise: Exercise }) {
  const code = muscleGroupCode(exercise.muscle_group)
  const muscle = findMuscleGroup(exercise.muscle_group)
  const difficulty = exercise.difficulty as Difficulty | null

  return (
    <div className="flex flex-col gap-6">
      {/* ---------- Hero / specimen panel ---------- */}
      <div
        className={cn(
          'relative aspect-[16/9] w-full overflow-hidden rounded-md',
          'border border-border bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a]',
        )}
      >
        {exercise.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={exercise.image_url}
            alt={exercise.name_hu}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span
              className={cn(
                'font-condensed text-6xl sm:text-7xl font-extrabold uppercase',
                'tracking-wide-display text-brand-red/80',
              )}
            >
              {code}
            </span>
          </div>
        )}
        {/* Engineered crosshair markers */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/[0.05]"
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-3 h-3 w-3 border-l border-t border-brand-red/70"
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute right-3 top-3 h-3 w-3 border-r border-t border-brand-red/70"
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-3 bottom-3 h-3 w-3 border-l border-b border-brand-red/70"
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute right-3 bottom-3 h-3 w-3 border-r border-b border-brand-red/70"
        />

        {/* Specimen code overlay (top-left) */}
        <div className="absolute left-6 top-5">
          <span className="font-condensed text-[10px] uppercase tracking-wide-display text-muted-foreground/70">
            {'// specimen'}
          </span>
          <div className="font-condensed text-lg font-extrabold uppercase tracking-wide-display text-brand-red">
            {code}
          </div>
        </div>
      </div>

      {/* ---------- Title + difficulty ---------- */}
      <div className="space-y-2">
        <span className="font-condensed text-[11px] uppercase tracking-wide-display text-brand-red">
          {'// gyakorlat'}
        </span>
        <h2
          className={cn(
            'font-condensed text-3xl sm:text-4xl font-extrabold uppercase',
            'tracking-display text-foreground leading-none',
          )}
        >
          {exercise.name_hu}
        </h2>
        {exercise.name_en && (
          <p
            className={cn(
              'font-condensed text-sm uppercase tracking-wide-display',
              'text-muted-foreground',
            )}
          >
            {exercise.name_en}
          </p>
        )}
        <span aria-hidden="true" className="block h-px w-12 bg-brand-red" />
      </div>

      {/* ---------- Description ---------- */}
      {exercise.description_hu && (
        <p className="font-sans text-sm leading-relaxed text-foreground/90">
          {exercise.description_hu}
        </p>
      )}

      {/* ---------- Muscles secondary ---------- */}
      {exercise.muscles_secondary && exercise.muscles_secondary.length > 0 && (
        <div>
          <span className="mb-2 block font-condensed text-[10px] uppercase tracking-wide-display text-muted-foreground/60">
            Másodlagos izomcsoportok
          </span>
          <div className="flex flex-wrap gap-1.5">
            {exercise.muscles_secondary.map((m) => (
              <span
                key={m}
                className={cn(
                  'inline-flex items-center rounded-sm border border-border/70',
                  'bg-card/50 px-2 py-1 font-condensed text-[11px] uppercase',
                  'tracking-wide-display text-muted-foreground',
                )}
              >
                {m}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ---------- Telemetry meta block ---------- */}
      <div className="rounded-md border border-border bg-card/40 px-4 py-1">
        <MetaRow
          label="Elsődleges izomcsoport"
          value={muscle?.label ?? exercise.muscle_group ?? '—'}
        />
        <MetaRow label="Eszköz" value={exercise.equipment ?? '—'} />
        <MetaRow label="Kategória" value={exercise.category ?? '—'} />
        <MetaRow
          label="Nehézség"
          value={
            difficulty ? (
              <span
                className={cn(
                  'inline-flex items-center gap-1.5',
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
            ) : (
              '—'
            )
          }
        />
      </div>
    </div>
  )
}

/**
 * Renders the exercise detail surface — Dialog on desktop, Sheet on mobile.
 *
 * Each surface owns its accessibility title/description (rendered visually
 * hidden via `sr-only`) — the visible heading lives inside `DetailBody`.
 * This split is required because `DialogTitle` / `SheetTitle` are tied to
 * their respective Radix roots.
 */
export function ExerciseDetail({
  exercise,
  open,
  onOpenChange,
}: ExerciseDetailProps) {
  const isDesktop = useIsDesktop()

  if (!exercise) return null

  const a11yDescription = exercise.description_hu ?? 'Gyakorlat részletei'

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className={cn(
            'max-w-2xl bg-background p-0',
            'max-h-[88vh] overflow-hidden',
          )}
        >
          <DialogTitle className="sr-only">{exercise.name_hu}</DialogTitle>
          <DialogDescription className="sr-only">
            {a11yDescription}
          </DialogDescription>
          <div className="max-h-[88vh] overflow-y-auto p-6 sm:p-8">
            <DetailBody exercise={exercise} />
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="max-h-[92vh] overflow-hidden bg-background p-0"
      >
        <SheetTitle className="sr-only">{exercise.name_hu}</SheetTitle>
        <SheetDescription className="sr-only">
          {a11yDescription}
        </SheetDescription>
        <div className="max-h-[92vh] overflow-y-auto p-5">
          <DetailBody exercise={exercise} />
        </div>
      </SheetContent>
    </Sheet>
  )
}
