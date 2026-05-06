'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Minus, Plus, Timer, X } from 'lucide-react'

import {
  findMuscleGroup,
  muscleGroupCode,
} from '@/lib/exercises/taxonomy'
import { cn } from '@/lib/utils'
import type { WorkoutDayExerciseWithExercise } from '@/lib/workouts/queries'

interface WorkoutDayExerciseCardProps {
  row: WorkoutDayExerciseWithExercise
  index: number
  onChange: (
    rowId: string,
    patch: { sets?: number; reps?: number; rest_seconds?: number },
  ) => void
  onRemove: (rowId: string) => void
}

const MIN_SETS = 1
const MAX_SETS = 20
const MIN_REPS = 1
const MAX_REPS = 100
const MIN_REST = 0
const MAX_REST = 600
const REST_STEP = 15

export function WorkoutDayExerciseCard({
  row,
  index,
  onChange,
  onRemove,
}: WorkoutDayExerciseCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({
      id: row.id,
      data: { type: 'day-exercise', rowId: row.id },
    })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 30 : undefined,
  }

  const exercise = row.exercises
  const code = muscleGroupCode(exercise?.muscle_group)
  const muscle = findMuscleGroup(exercise?.muscle_group)

  const sets = row.sets ?? 3
  const reps = row.reps ?? 10
  const rest = row.rest_seconds ?? 60

  const stepSets = (delta: number) => {
    const next = Math.max(MIN_SETS, Math.min(MAX_SETS, sets + delta))
    if (next !== sets) onChange(row.id, { sets: next })
  }
  const stepReps = (delta: number) => {
    const next = Math.max(MIN_REPS, Math.min(MAX_REPS, reps + delta))
    if (next !== reps) onChange(row.id, { reps: next })
  }
  const stepRest = (delta: number) => {
    const next = Math.max(
      MIN_REST,
      Math.min(MAX_REST, rest + delta * REST_STEP),
    )
    if (next !== rest) onChange(row.id, { rest_seconds: next })
  }

  const formatRest = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return secs === 0 ? `${mins}m` : `${mins}m ${secs}s`
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'relative flex items-stretch rounded-md border bg-card',
        'transition-all duration-150',
        isDragging
          ? 'border-brand-red shadow-[0_10px_30px_-8px_rgba(0,0,0,0.5),0_0_0_1px_rgba(120,0,0,0.4)_inset]'
          : 'border-border hover:border-brand-red-border',
      )}
    >
      {/* Drag handle (desktop) */}
      <button
        type="button"
        aria-label={`${exercise?.name_hu ?? 'Gyakorlat'} sorrendezése`}
        className={cn(
          'hidden md:flex items-center justify-center w-9 shrink-0 rounded-l-md',
          'cursor-grab active:cursor-grabbing select-none touch-none',
          'border-r border-border bg-background/30',
          'text-muted-foreground/50 transition-colors hover:text-brand-red',
          'focus-visible:outline-none focus-visible:text-brand-red',
        )}
        {...listeners}
        {...attributes}
      >
        <GripVertical className="size-4" />
      </button>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-3 px-3 py-3 sm:gap-4 sm:px-4 sm:py-4">
        {/* Top row: index + name + remove */}
        <div className="flex items-start gap-3">
          <span
            className={cn(
              'mt-0.5 inline-flex h-5 min-w-7 items-center justify-center rounded-sm px-1',
              'bg-brand-red-muted',
              'font-condensed text-[10px] font-bold uppercase tracking-wide-display text-brand-red',
            )}
          >
            {String(index + 1).padStart(2, '0')}
          </span>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-condensed text-[10px] uppercase tracking-wide-display text-brand-red/80">
                {code}
              </span>
              {muscle && (
                <>
                  <span aria-hidden="true" className="text-muted-foreground/30">
                    •
                  </span>
                  <span className="font-condensed text-[10px] uppercase tracking-wide-display text-muted-foreground/70">
                    {muscle.label}
                  </span>
                </>
              )}
            </div>
            <h4 className="truncate font-condensed text-base font-bold uppercase tracking-display text-foreground">
              {exercise?.name_hu ?? '—'}
            </h4>
          </div>

          <button
            type="button"
            aria-label="Gyakorlat eltávolítása"
            onClick={() => onRemove(row.id)}
            className={cn(
              'shrink-0 flex items-center justify-center size-7 rounded-md',
              'text-muted-foreground/60 transition-colors',
              'hover:bg-destructive/15 hover:text-destructive',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive/40',
            )}
          >
            <X className="size-3.5" />
          </button>
        </div>

        {/* Stepper row */}
        <div className="grid grid-cols-3 gap-2">
          <Stepper
            label="Szett"
            value={sets}
            onDec={() => stepSets(-1)}
            onInc={() => stepSets(1)}
            disabledDec={sets <= MIN_SETS}
            disabledInc={sets >= MAX_SETS}
          />
          <Stepper
            label="Ismétlés"
            value={reps}
            onDec={() => stepReps(-1)}
            onInc={() => stepReps(1)}
            disabledDec={reps <= MIN_REPS}
            disabledInc={reps >= MAX_REPS}
          />
          <Stepper
            label="Pihenő"
            valueDisplay={formatRest(rest)}
            value={rest}
            icon={<Timer className="size-3 text-muted-foreground/60" />}
            onDec={() => stepRest(-1)}
            onInc={() => stepRest(1)}
            disabledDec={rest <= MIN_REST}
            disabledInc={rest >= MAX_REST}
          />
        </div>
      </div>
    </div>
  )
}

interface StepperProps {
  label: string
  value: number
  /** When provided, displayed instead of `value` (e.g. "1m 30s"). */
  valueDisplay?: string
  icon?: React.ReactNode
  onDec: () => void
  onInc: () => void
  disabledDec?: boolean
  disabledInc?: boolean
}

function Stepper({
  label,
  value,
  valueDisplay,
  icon,
  onDec,
  onInc,
  disabledDec,
  disabledInc,
}: StepperProps) {
  return (
    <div className="flex flex-col gap-1">
      <span
        className={cn(
          'flex items-center gap-1',
          'font-condensed text-[10px] uppercase tracking-wide-display text-muted-foreground/70',
        )}
      >
        {icon}
        {label}
      </span>
      <div
        className={cn(
          'flex items-center justify-between rounded-md border border-border',
          'bg-background/60 px-1.5 py-1',
        )}
      >
        <button
          type="button"
          onClick={onDec}
          disabled={disabledDec}
          aria-label={`${label} csökkentése`}
          className={cn(
            'flex items-center justify-center size-6 rounded-sm',
            'text-muted-foreground transition-colors',
            'hover:bg-brand-red-muted hover:text-brand-red',
            'disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-muted-foreground',
            'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-red/40',
          )}
        >
          <Minus className="size-3" />
        </button>
        <span
          aria-live="polite"
          className={cn(
            'min-w-10 text-center font-condensed text-sm font-bold uppercase tracking-wide-display',
            'text-foreground tabular-nums',
          )}
        >
          {valueDisplay ?? value}
        </span>
        <button
          type="button"
          onClick={onInc}
          disabled={disabledInc}
          aria-label={`${label} növelése`}
          className={cn(
            'flex items-center justify-center size-6 rounded-sm',
            'text-muted-foreground transition-colors',
            'hover:bg-brand-red-muted hover:text-brand-red',
            'disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-muted-foreground',
            'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-red/40',
          )}
        >
          <Plus className="size-3" />
        </button>
      </div>
    </div>
  )
}
