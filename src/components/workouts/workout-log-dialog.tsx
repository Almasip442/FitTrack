'use client'

import { useEffect, useMemo, useState, useTransition, type ReactNode } from 'react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Check, Loader2, Minus, Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import {
  getWorkoutLogsForDate,
  saveWorkoutSession,
} from '@/lib/workouts/actions'
import type { WorkoutSessionExerciseInput } from '@/lib/workouts/actions'
import type { WorkoutExerciseLog } from '@/types/database'
import { cn } from '@/lib/utils'

export type WorkoutLoggerExercise = {
  id: string
  name: string
  sets: number | null
  reps: number | null
}

type SetDraft = { reps: string; weight: string }
type ExerciseDraft = { skipped: boolean; sets: SetDraft[] }
type DraftMap = Record<string, ExerciseDraft>

type WorkoutLogDialogProps = {
  date: string
  dayId: string
  dayName: string
  exercises: WorkoutLoggerExercise[]
  trigger: ReactNode
}

function createDrafts(
  exercises: WorkoutLoggerExercise[],
  logs: WorkoutExerciseLog[],
): DraftMap {
  const logsByExercise = new Map(logs.map((log) => [log.exercise_id, log]))

  return Object.fromEntries(
    exercises.map((exercise) => {
      const log = logsByExercise.get(exercise.id)
      const count = Math.max(1, log?.sets_completed ?? exercise.sets ?? 3)
      const plannedReps = exercise.reps ?? 10
      const reps = log?.reps_completed ?? []
      const weights = log?.weight_used ?? []

      return [
        exercise.id,
        {
          skipped: log?.skipped ?? false,
          sets: Array.from({ length: count }, (_, index) => ({
            reps: String(reps[index] ?? plannedReps),
            weight: weights[index] == null ? '' : String(weights[index]),
          })),
        } satisfies ExerciseDraft,
      ]
    }),
  )
}

export function getLocalTodayIso(): string {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function WorkoutLogDialog({
  date,
  dayId,
  dayName,
  exercises,
  trigger,
}: WorkoutLogDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [retry, setRetry] = useState(0)
  const [loaded, setLoaded] = useState<{ key: string; drafts: DraftMap } | null>(null)
  const [loadError, setLoadError] = useState<{ key: string; message: string } | null>(null)
  const [isSaving, startSaving] = useTransition()

  const requestKey = useMemo(
    () =>
      JSON.stringify([
        date,
        dayId,
        exercises.map((exercise) => [exercise.id, exercise.sets, exercise.reps]),
      ]),
    [date, dayId, exercises],
  )

  useEffect(() => {
    if (!open) return
    let cancelled = false

    void getWorkoutLogsForDate(date).then((result) => {
      if (cancelled) return
      if (!result.success) {
        setLoadError({
          key: requestKey,
          message: result.error ?? 'A napló betöltése sikertelen.',
        })
        return
      }

      setLoadError(null)
      setLoaded({
        key: requestKey,
        drafts: createDrafts(exercises, result.logs),
      })
    }).catch(() => {
      if (cancelled) return
      setLoadError({
        key: requestKey,
        message: 'A napló betöltése sikertelen. Ellenőrizd a kapcsolatot, majd próbáld újra.',
      })
    })

    return () => {
      cancelled = true
    }
  }, [date, exercises, open, requestKey, retry])

  const currentDrafts = loaded?.key === requestKey ? loaded.drafts : null
  const currentError = loadError?.key === requestKey ? loadError.message : null
  const isLoading = open && currentDrafts === null && currentError === null

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen)
    if (nextOpen) {
      setLoaded(null)
      setLoadError(null)
      setRetry((value) => value + 1)
    }
  }

  function updateExercise(exerciseId: string, patch: Partial<ExerciseDraft>) {
    setLoaded((current) => {
      if (!current || current.key !== requestKey) return current
      const exercise = current.drafts[exerciseId]
      if (!exercise) return current
      return {
        ...current,
        drafts: {
          ...current.drafts,
          [exerciseId]: { ...exercise, ...patch },
        },
      }
    })
  }

  function updateSet(
    exerciseId: string,
    index: number,
    patch: Partial<SetDraft>,
  ) {
    const exercise = currentDrafts?.[exerciseId]
    if (!exercise) return
    updateExercise(exerciseId, {
      sets: exercise.sets.map((set, setIndex) =>
        setIndex === index ? { ...set, ...patch } : set,
      ),
    })
  }

  function handleSave() {
    if (!currentDrafts) return

    const entries: WorkoutSessionExerciseInput[] = []
    for (const exercise of exercises) {
      const draft = currentDrafts[exercise.id]
      if (!draft) continue
      if (draft.skipped) {
        entries.push({
          exercise_id: exercise.id,
          skipped: true,
          reps_completed: [],
          weight_used: [],
        })
        continue
      }

      const reps: number[] = []
      const weights: number[] = []
      for (const set of draft.sets) {
        if (!set.reps.trim() || !set.weight.trim()) {
          toast.error('Minden szériához add meg az ismétlést és a súlyt. Testsúlyos gyakorlatnál írj 0 kg-ot.')
          return
        }
        reps.push(Number(set.reps))
        weights.push(Number(set.weight.replace(',', '.')))
      }
      entries.push({
        exercise_id: exercise.id,
        skipped: false,
        reps_completed: reps,
        weight_used: weights,
      })
    }

    startSaving(async () => {
      const result = await saveWorkoutSession(date, dayId, entries)
      if (!result.success) {
        toast.error('Edzésnapló mentése sikertelen', { description: result.error })
        return
      }

      toast.success('Edzésnapló elmentve.')
      setOpen(false)
      router.refresh()
    })
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent
        side="bottom"
        className="h-[92dvh] max-h-[92dvh] overflow-y-auto rounded-t-2xl px-4 pb-safe sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:h-auto sm:max-h-[90vh] sm:w-full sm:max-w-2xl sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-xl sm:border"
      >
        <SheetHeader className="px-0 pt-2 text-left">
          <span className="font-condensed text-[10px] uppercase tracking-wide-display text-brand-red">
            {'// edzésnapló · '}{date}
          </span>
          <SheetTitle className="font-condensed text-2xl font-extrabold uppercase tracking-display">
            {dayName}
          </SheetTitle>
          <SheetDescription>
            Rögzítsd a tényleges ismétléseket és súlyokat. A mezők a terv alapján előre kitöltődnek.
          </SheetDescription>
        </SheetHeader>

        {isLoading ? (
          <div className="flex min-h-48 items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Napló betöltése…
          </div>
        ) : currentError ? (
          <div className="space-y-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4" role="alert">
            <p className="text-sm text-destructive">{currentError}</p>
            <Button
              variant="outline"
              onClick={() => {
                setLoadError(null)
                setRetry((value) => value + 1)
              }}
            >
              Újrapróbálás
            </Button>
          </div>
        ) : currentDrafts ? (
          <div className="space-y-4 pb-4">
            {exercises.map((exercise, exerciseIndex) => {
              const draft = currentDrafts[exercise.id]
              if (!draft) return null

              return (
                <section
                  key={exercise.id}
                  className={cn(
                    'rounded-xl border bg-card p-4 transition-colors',
                    draft.skipped ? 'border-border/60 opacity-70' : 'border-border',
                  )}
                  aria-label={`${exercise.name} naplózása`}
                >
                  <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-3">
                      <span className="font-condensed text-xs tabular-nums text-brand-red">
                        {String(exerciseIndex + 1).padStart(2, '0')}
                      </span>
                      <div className="min-w-0">
                        <h3 className="font-condensed text-lg font-bold uppercase tracking-wide-display">
                          {exercise.name}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          Terv: {exercise.sets ?? 3} × {exercise.reps ?? 10}
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant={draft.skipped ? 'outline' : 'ghost'}
                      size="sm"
                      disabled={isSaving}
                      onClick={() => updateExercise(exercise.id, { skipped: !draft.skipped })}
                      className="font-condensed text-[10px] uppercase tracking-wide-display"
                    >
                      {draft.skipped ? 'Visszaveszem' : 'Kihagyom'}
                    </Button>
                  </div>

                  {draft.skipped ? (
                    <p className="rounded-md bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
                      A kihagyott gyakorlat nem kerül be az elvégzett naplóba.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      <div className="grid grid-cols-[2.5rem_minmax(0,1fr)_minmax(0,1fr)_2.25rem] items-center gap-2 px-1 font-condensed text-[10px] uppercase tracking-wide-display text-muted-foreground">
                        <span>Széria</span>
                        <label htmlFor={`${exercise.id}-reps-0`}>Ismétlés</label>
                        <label htmlFor={`${exercise.id}-weight-0`}>Súly · kg</label>
                        <span className="sr-only">Széria törlése</span>
                      </div>
                      {draft.sets.map((set, setIndex) => (
                        <div
                          key={`${exercise.id}-set-${setIndex}`}
                          className="grid grid-cols-[2.5rem_minmax(0,1fr)_minmax(0,1fr)_2.25rem] items-center gap-2"
                        >
                          <span className="text-center font-condensed text-xs tabular-nums text-muted-foreground">
                            {String(setIndex + 1).padStart(2, '0')}
                          </span>
                          <Input
                            id={`${exercise.id}-reps-${setIndex}`}
                            type="number"
                            inputMode="numeric"
                            min={0}
                            max={1000}
                            step={1}
                            value={set.reps}
                            disabled={isSaving}
                            aria-label={`${exercise.name}, ${setIndex + 1}. széria, ismétlés`}
                            onChange={(event) => updateSet(exercise.id, setIndex, { reps: event.currentTarget.value })}
                            className="h-10 text-center tabular-nums"
                          />
                          <Input
                            id={`${exercise.id}-weight-${setIndex}`}
                            type="number"
                            inputMode="decimal"
                            min={0}
                            max={1000}
                            step="0.5"
                            value={set.weight}
                            disabled={isSaving}
                            aria-label={`${exercise.name}, ${setIndex + 1}. széria, súly kilogrammban`}
                            onChange={(event) => updateSet(exercise.id, setIndex, { weight: event.currentTarget.value })}
                            className="h-10 text-center tabular-nums"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            aria-label={`${setIndex + 1}. széria törlése`}
                            disabled={isSaving || draft.sets.length <= 1}
                            onClick={() => updateExercise(exercise.id, { sets: draft.sets.filter((_, index) => index !== setIndex) })}
                            className="size-9 text-muted-foreground hover:text-destructive"
                          >
                            <Minus className="size-4" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={isSaving}
                        onClick={() => {
                          const last = draft.sets[draft.sets.length - 1]
                          updateExercise(exercise.id, {
                            sets: [...draft.sets, { reps: last?.reps ?? String(exercise.reps ?? 10), weight: last?.weight ?? '' }],
                          })
                        }}
                        className="mt-2 w-full border-dashed border-brand-red-border font-condensed text-[10px] uppercase tracking-wide-display hover:bg-brand-red-muted"
                      >
                        <Plus className="size-3.5" />
                        Extra széria
                      </Button>
                    </div>
                  )}
                </section>
              )
            })}

            <Button
              type="button"
              onClick={handleSave}
              disabled={isSaving || exercises.length === 0}
              className="h-11 w-full bg-brand-red font-condensed font-bold uppercase tracking-wide-display text-white hover:bg-brand-red/90"
            >
              {isSaving ? (
                <><Loader2 className="size-4 animate-spin" /> Mentés…</>
              ) : (
                <><Check className="size-4" /> Edzésnapló mentése</>
              )}
            </Button>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}
