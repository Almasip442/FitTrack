'use client'

import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Plus } from 'lucide-react'

import {
  DIFFICULTY_DOT,
  DIFFICULTY_TEXT,
  findMuscleGroup,
  muscleGroupCode,
  type Difficulty,
} from '@/lib/exercises/taxonomy'
import { cn } from '@/lib/utils'
import type { Exercise } from '@/types/database'

interface DraggableExerciseCardProps {
  exercise: Exercise
  /** When provided, clicking the "+" tap-target adds the exercise to a day. */
  onQuickAdd?: (exercise: Exercise) => void
}

/**
 * Library-side draggable card. Compact (height ~ 64px), single-row layout
 * tuned for the planner's horizontal scroll lane / 2-col grid. The whole
 * card is the drag handle on desktop; on mobile the "+" button is the
 * primary affordance to add it to the currently-active day.
 */
export function DraggableExerciseCard({
  exercise,
  onQuickAdd,
}: DraggableExerciseCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: `library:${exercise.id}`,
      data: { type: 'exercise', exercise },
    })

  const code = muscleGroupCode(exercise.muscle_group)
  const muscle = findMuscleGroup(exercise.muscle_group)
  const difficulty = exercise.difficulty as Difficulty | null

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    // Hide the original while it's being represented by the DragOverlay.
    opacity: isDragging ? 0.3 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group relative flex items-stretch gap-3 rounded-md border border-border bg-card',
        'p-2.5 select-none touch-manipulation',
        'transition-all duration-150',
        'hover:border-brand-red-border hover:shadow-[inset_2px_0_0_0_var(--color-brand-red)]',
        isDragging && 'cursor-grabbing',
      )}
    >
      {/* Drag handle — desktop only */}
      <button
        type="button"
        aria-label={`Húzd át a ${exercise.name_hu} gyakorlatot egy edzésnapra`}
        className={cn(
          'hidden md:flex shrink-0 items-center justify-center w-6',
          'cursor-grab active:cursor-grabbing',
          'text-muted-foreground/40 transition-colors group-hover:text-brand-red',
          'focus-visible:outline-none focus-visible:text-brand-red',
        )}
        {...listeners}
        {...attributes}
      >
        <GripVertical className="size-4" />
      </button>

      {/* Glyph */}
      <div
        className={cn(
          'relative shrink-0 overflow-hidden rounded-md border border-border',
          'h-12 w-12',
          'bg-gradient-to-br from-[#1a1a1a] to-[#0e0e0e]',
        )}
      >
        {exercise.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={exercise.image_url}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="font-condensed text-xs font-extrabold uppercase tracking-wide-display text-brand-red">
              {code}
            </span>
          </div>
        )}
      </div>

      {/* Name + meta */}
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5">
        <div className="flex items-center gap-2">
          <span className="font-condensed text-[10px] uppercase tracking-wide-display text-brand-red/80">
            {code}
          </span>
          {difficulty && (
            <span
              className={cn(
                'inline-flex items-center gap-1',
                'font-condensed text-[9px] uppercase tracking-wide-display',
                DIFFICULTY_TEXT[difficulty],
              )}
            >
              <span className={cn('size-1 rounded-full', DIFFICULTY_DOT[difficulty])} />
              {difficulty}
            </span>
          )}
        </div>
        <h4
          className={cn(
            'truncate font-condensed text-sm font-bold uppercase tracking-display',
            'text-foreground transition-colors group-hover:text-brand-red',
          )}
        >
          {exercise.name_hu}
        </h4>
        {muscle && (
          <span className="font-condensed text-[9px] uppercase tracking-wide-display text-muted-foreground/70">
            {muscle.label}
          </span>
        )}
      </div>

      {/* Quick-add (mobile primary affordance) */}
      {onQuickAdd && (
        <button
          type="button"
          onClick={() => onQuickAdd(exercise)}
          aria-label={`${exercise.name_hu} hozzáadása az aktív naphoz`}
          className={cn(
            'shrink-0 flex items-center justify-center size-8 rounded-md',
            'border border-brand-red-border bg-brand-red-muted text-brand-red',
            'transition-colors hover:bg-brand-red hover:text-white',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-red/50',
          )}
        >
          <Plus className="size-3.5" />
        </button>
      )}
    </div>
  )
}

/**
 * Visual-only "ghost" of the draggable card — shown inside the dnd-kit
 * `<DragOverlay>` while the user is dragging. No drag handle, no listeners.
 */
export function ExerciseDragGhost({ exercise }: { exercise: Exercise }) {
  const code = muscleGroupCode(exercise.muscle_group)
  const muscle = findMuscleGroup(exercise.muscle_group)

  return (
    <div
      className={cn(
        'flex items-stretch gap-3 rounded-md border-2 border-brand-red bg-card',
        'p-2.5 cursor-grabbing',
        'shadow-[0_20px_50px_-12px_rgba(0,0,0,0.6),0_0_0_1px_rgba(120,0,0,0.5)_inset]',
        'rotate-[-1.5deg] scale-[1.03]',
      )}
    >
      <div className="flex shrink-0 items-center justify-center w-6 text-brand-red">
        <GripVertical className="size-4" />
      </div>
      <div
        className={cn(
          'relative shrink-0 overflow-hidden rounded-md border border-brand-red/40',
          'h-12 w-12',
          'bg-gradient-to-br from-[#1a1a1a] to-[#0e0e0e]',
        )}
      >
        {exercise.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={exercise.image_url} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="font-condensed text-xs font-extrabold uppercase tracking-wide-display text-brand-red">
              {code}
            </span>
          </div>
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5">
        <span className="font-condensed text-[10px] uppercase tracking-wide-display text-brand-red">
          {code}
        </span>
        <h4 className="truncate font-condensed text-sm font-bold uppercase tracking-display text-foreground">
          {exercise.name_hu}
        </h4>
        {muscle && (
          <span className="font-condensed text-[9px] uppercase tracking-wide-display text-muted-foreground/70">
            {muscle.label}
          </span>
        )}
      </div>
    </div>
  )
}
