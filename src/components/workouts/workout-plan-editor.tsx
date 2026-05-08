'use client'

import {
  closestCenter,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { motion } from 'framer-motion'
import {
  Activity,
  ArrowLeft,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  Loader2,
  PackageOpen,
  Pencil,
  Plus,
  SearchX,
  Star,
  Trash2,
  TriangleAlert,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from 'react'
import { toast } from 'sonner'

import { ExerciseFilters } from '@/components/exercises/exercise-filters'
import type { ExerciseFilterState } from '@/components/exercises/exercise-filters'
import { ExerciseSearchBar } from '@/components/exercises/exercise-search-bar'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { AddDayDialog } from '@/components/workouts/add-day-dialog'
import {
  DraggableExerciseCard,
  ExerciseDragGhost,
} from '@/components/workouts/draggable-exercise-card'
import { WorkoutDayExerciseCard } from '@/components/workouts/workout-day-exercise-card'
import { fetchExercises } from '@/lib/exercises/api'
import {
  addExerciseToDay,
  deleteWorkoutDay,
  deleteWorkoutPlan,
  removeExerciseFromDay,
  setActivePlan,
  updateDayExercise,
  updateExerciseOrder,
  updateWorkoutDay,
} from '@/lib/workouts/actions'
import type {
  WorkoutDayExerciseWithExercise,
  WorkoutDayWithExercises,
  WorkoutPlanWithDays,
} from '@/lib/workouts/queries'
import { slideUpSm } from '@/lib/animations'
import { cn } from '@/lib/utils'
import type { Exercise } from '@/types/database'

interface WorkoutPlanEditorProps {
  plan: WorkoutPlanWithDays
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

const DAY_OF_WEEK_LABEL: Record<number, string> = {
  0: 'Hétfő',
  1: 'Kedd',
  2: 'Szerda',
  3: 'Csütörtök',
  4: 'Péntek',
  5: 'Szombat',
  6: 'Vasárnap',
}

const LIBRARY_PAGE_SIZE = 20
const SAVE_DEBOUNCE_MS = 800

const EMPTY_FILTERS: ExerciseFilterState = {
  muscle_group: '',
  equipment: '',
  difficulty: '',
}

/**
 * Top-level workout plan editor.
 *
 * Layout:
 *   - Sticky plan header (name, active toggle, save status, delete).
 *   - Library panel (search + filters + draggable exercise list).
 *   - Day tabs (desktop) or accordion (mobile) — each day is a drop zone
 *     containing a SortableContext of WorkoutDayExerciseCards.
 *
 * State strategy:
 *   - `plan` is held locally and mutated optimistically. Server actions
 *     run in a transition; on failure we roll back to the snapshot.
 *   - Stepper edits debounce 800ms before flushing through `updateDayExercise`.
 */
export function WorkoutPlanEditor({ plan: initialPlan }: WorkoutPlanEditorProps) {
  const router = useRouter()

  // ---------- Plan state ----------
  const [plan, setPlan] = useState<WorkoutPlanWithDays>(initialPlan)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [, startTransition] = useTransition()

  // ---------- UI state ----------
  const [selectedDayId, setSelectedDayId] = useState<string | null>(
    initialPlan.workout_days[0]?.id ?? null,
  )
  // Mobile accordion: which day is open (only one at a time).
  const [mobileOpenDayId, setMobileOpenDayId] = useState<string | null>(
    initialPlan.workout_days[0]?.id ?? null,
  )
  const [activeDragExercise, setActiveDragExercise] = useState<Exercise | null>(
    null,
  )
  const [activeSortRowId, setActiveSortRowId] = useState<string | null>(null)
  const [confirmingDeletePlan, setConfirmingDeletePlan] = useState(false)
  const [confirmingDeleteDayId, setConfirmingDeleteDayId] = useState<string | null>(null)
  const [editingDayId, setEditingDayId] = useState<string | null>(null)
  const [editingDayName, setEditingDayName] = useState('')

  // ---------- Library state ----------
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState<ExerciseFilterState>(EMPTY_FILTERS)
  const [libraryItems, setLibraryItems] = useState<Exercise[]>([])
  const [libraryLoading, setLibraryLoading] = useState(true)
  const [libraryError, setLibraryError] = useState<string | null>(null)
  const [libraryHasMore, setLibraryHasMore] = useState(false)
  const [libraryPage, setLibraryPage] = useState(1)
  const [libraryLoadingMore, setLibraryLoadingMore] = useState(false)

  // ---------- Save debouncing ----------
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingPatchesRef = useRef<
    Map<string, { sets?: number; reps?: number; rest_seconds?: number }>
  >(new Map())
  const saveStatusResetRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ---------- Library request id (cancellation token for load-more) ----------
  // Bumped whenever the search/filter scope changes. `handleLoadMoreLibrary`
  // captures the id when it starts and discards its result if the id has
  // moved on by the time the response arrives — preventing duplicate items
  // from a stale page-2 fetch when the user types fast.
  const libraryRequestIdRef = useRef(0)

  // ---------- DnD sensors ----------
  // Keyboard sensor pulled from the sortable preset for accessible reordering.
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 6 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  /* ---------- Library data fetch ---------- */
  const libraryQueryKey = useMemo(
    () =>
      `${searchQuery}|${filters.muscle_group}|${filters.equipment}|${filters.difficulty}`,
    [searchQuery, filters.muscle_group, filters.equipment, filters.difficulty],
  )

  useEffect(() => {
    let cancelled = false
    // Invalidate any in-flight load-more request: by the time it resolves,
    // the library scope will have moved on and its data must not be merged.
    libraryRequestIdRef.current += 1
    const requestId = libraryRequestIdRef.current
    // Defer state updates to a microtask so the effect body itself doesn't
    // trigger a cascading render (react-hooks/set-state-in-effect).
    const start = () => {
      if (cancelled) return
      setLibraryLoading(true)
      setLibraryError(null)
      fetchExercises({
        q: searchQuery,
        muscle_group: filters.muscle_group,
        equipment: filters.equipment,
        difficulty: filters.difficulty,
        page: 1,
        limit: LIBRARY_PAGE_SIZE,
      })
        .then((res) => {
          if (cancelled || libraryRequestIdRef.current !== requestId) return
          setLibraryItems(res.data)
          setLibraryPage(res.page)
          setLibraryHasMore(res.hasMore)
        })
        .catch((err: unknown) => {
          if (cancelled || libraryRequestIdRef.current !== requestId) return
          setLibraryError(err instanceof Error ? err.message : 'Hiba történt')
        })
        .finally(() => {
          if (!cancelled && libraryRequestIdRef.current === requestId) {
            setLibraryLoading(false)
          }
        })
    }
    queueMicrotask(start)
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [libraryQueryKey])

  const handleLoadMoreLibrary = useCallback(async () => {
    if (libraryLoadingMore || !libraryHasMore) return
    // Snapshot the id at fetch start; if the user types or filters before
    // the request resolves, the search effect bumps `libraryRequestIdRef`
    // and we drop this stale page on the floor instead of appending it.
    const requestId = libraryRequestIdRef.current
    setLibraryLoadingMore(true)
    try {
      const next = libraryPage + 1
      const res = await fetchExercises({
        q: searchQuery,
        muscle_group: filters.muscle_group,
        equipment: filters.equipment,
        difficulty: filters.difficulty,
        page: next,
        limit: LIBRARY_PAGE_SIZE,
      })
      if (libraryRequestIdRef.current !== requestId) return
      setLibraryItems((prev) => [...prev, ...res.data])
      setLibraryPage(res.page)
      setLibraryHasMore(res.hasMore)
    } catch (err) {
      if (libraryRequestIdRef.current !== requestId) return
      const msg = err instanceof Error ? err.message : 'Hiba történt'
      toast.error(msg)
    } finally {
      if (libraryRequestIdRef.current === requestId) {
        setLibraryLoadingMore(false)
      }
    }
  }, [
    libraryLoadingMore,
    libraryHasMore,
    libraryPage,
    searchQuery,
    filters.muscle_group,
    filters.equipment,
    filters.difficulty,
  ])

  /* ---------- Save status helpers ---------- */
  const flashSaved = useCallback(() => {
    setSaveStatus('saved')
    if (saveStatusResetRef.current) clearTimeout(saveStatusResetRef.current)
    saveStatusResetRef.current = setTimeout(() => {
      setSaveStatus((s) => (s === 'saved' ? 'idle' : s))
    }, 1800)
  }, [])

  /* ---------- Plan helpers ---------- */
  const updateDayInState = useCallback(
    (
      dayId: string,
      mutator: (d: WorkoutDayWithExercises) => WorkoutDayWithExercises,
    ) => {
      setPlan((prev) => ({
        ...prev,
        workout_days: prev.workout_days.map((d) =>
          d.id === dayId ? mutator(d) : d,
        ),
      }))
    },
    [],
  )

  /* ---------- Exercise add (drop or quick-add) ---------- */
  const addExerciseToDayInPlan = useCallback(
    async (dayId: string, exercise: Exercise) => {
      const day = plan.workout_days.find((d) => d.id === dayId)
      if (!day) return

      // Optimistic temp row
      const tempId = `temp:${crypto.randomUUID()}`
      const order = day.workout_day_exercises.length
      const optimisticRow: WorkoutDayExerciseWithExercise = {
        id: tempId,
        workout_day_id: dayId,
        exercise_id: exercise.id,
        sets: 3,
        reps: 10,
        rest_seconds: 60,
        exercise_order: order,
        notes: null,
        created_at: new Date().toISOString(),
        exercises: exercise,
      }
      updateDayInState(dayId, (d) => ({
        ...d,
        workout_day_exercises: [...d.workout_day_exercises, optimisticRow],
      }))
      setSaveStatus('saving')

      const result = await addExerciseToDay(
        dayId,
        exercise.id,
        3,
        10,
        60,
        order,
      )
      if (result.success && result.data) {
        // Replace temp row with the real one.
        updateDayInState(dayId, (d) => ({
          ...d,
          workout_day_exercises: d.workout_day_exercises.map((row) =>
            row.id === tempId ? { ...result.data!, exercises: exercise } : row,
          ),
        }))
        flashSaved()
      } else {
        // Roll back: drop the temp row.
        updateDayInState(dayId, (d) => ({
          ...d,
          workout_day_exercises: d.workout_day_exercises.filter(
            (row) => row.id !== tempId,
          ),
        }))
        setSaveStatus('error')
        toast.error(result.success ? 'Ismeretlen hiba.' : result.error)
      }
    },
    [plan.workout_days, updateDayInState, flashSaved],
  )

  /* ---------- DnD handlers ---------- */
  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const data = event.active.data.current as
        | { type: 'exercise'; exercise: Exercise }
        | { type: 'day-exercise'; rowId: string }
        | undefined
      if (!data) return
      if (data.type === 'exercise') {
        setActiveDragExercise(data.exercise)
        setActiveSortRowId(null)
      } else if (data.type === 'day-exercise') {
        setActiveSortRowId(data.rowId)
        setActiveDragExercise(null)
      }
    },
    [],
  )

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event
      const activeData = active.data.current as
        | { type: 'exercise'; exercise: Exercise }
        | { type: 'day-exercise'; rowId: string }
        | undefined

      setActiveDragExercise(null)
      setActiveSortRowId(null)

      if (!over || !activeData) return

      // ---- Library exercise dropped onto a day ----
      if (activeData.type === 'exercise') {
        const overData = over.data.current as
          | { type: 'day'; dayId: string }
          | { type: 'day-exercise'; rowId: string }
          | undefined
        let targetDayId: string | null = null
        if (overData?.type === 'day') {
          targetDayId = overData.dayId
        } else if (overData?.type === 'day-exercise') {
          // Find the parent day.
          const parent = plan.workout_days.find((d) =>
            d.workout_day_exercises.some((r) => r.id === overData.rowId),
          )
          targetDayId = parent?.id ?? null
        }
        if (!targetDayId) return
        await addExerciseToDayInPlan(targetDayId, activeData.exercise)
        // Auto-focus to the receiving day.
        setSelectedDayId(targetDayId)
        setMobileOpenDayId(targetDayId)
        return
      }

      // ---- Sortable row reordering within the same day ----
      if (activeData.type === 'day-exercise') {
        const day = plan.workout_days.find((d) =>
          d.workout_day_exercises.some((r) => r.id === activeData.rowId),
        )
        if (!day) return
        const oldIndex = day.workout_day_exercises.findIndex(
          (r) => r.id === active.id,
        )
        const newIndex = day.workout_day_exercises.findIndex(
          (r) => r.id === over.id,
        )
        if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) return

        const reordered = arrayMove(
          day.workout_day_exercises,
          oldIndex,
          newIndex,
        ).map((row, idx) => ({ ...row, exercise_order: idx }))

        const snapshot = day.workout_day_exercises
        updateDayInState(day.id, (d) => ({
          ...d,
          workout_day_exercises: reordered,
        }))

        setSaveStatus('saving')
        const result = await updateExerciseOrder(
          reordered
            .filter((r) => !r.id.startsWith('temp:'))
            .map((r) => ({ id: r.id, exercise_order: r.exercise_order })),
        )
        if (result.success) {
          flashSaved()
        } else {
          updateDayInState(day.id, (d) => ({
            ...d,
            workout_day_exercises: snapshot,
          }))
          setSaveStatus('error')
          toast.error(result.error)
        }
      }
    },
    [plan.workout_days, addExerciseToDayInPlan, updateDayInState, flashSaved],
  )

  /* ---------- Stepper edits (auto-save with debounce) ---------- */
  const flushPendingPatches = useCallback(async () => {
    if (pendingPatchesRef.current.size === 0) return
    const entries = Array.from(pendingPatchesRef.current.entries())
    pendingPatchesRef.current.clear()
    setSaveStatus('saving')

    const results = await Promise.all(
      entries.map(([rowId, patch]) => updateDayExercise(rowId, patch)),
    )
    const firstFailure = results.find((r) => !r.success)
    if (firstFailure && !firstFailure.success) {
      setSaveStatus('error')
      toast.error(firstFailure.error)
    } else {
      flashSaved()
    }
  }, [flashSaved])

  const handleStepperChange = useCallback(
    (
      rowId: string,
      patch: { sets?: number; reps?: number; rest_seconds?: number },
    ) => {
      // Optimistic UI update.
      setPlan((prev) => ({
        ...prev,
        workout_days: prev.workout_days.map((d) => ({
          ...d,
          workout_day_exercises: d.workout_day_exercises.map((row) =>
            row.id === rowId ? { ...row, ...patch } : row,
          ),
        })),
      }))
      // Skip saving for not-yet-persisted rows.
      if (rowId.startsWith('temp:')) return

      // Merge into pending patch map.
      const existing = pendingPatchesRef.current.get(rowId) ?? {}
      pendingPatchesRef.current.set(rowId, { ...existing, ...patch })

      setSaveStatus('saving')
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
      saveTimeoutRef.current = setTimeout(() => {
        flushPendingPatches()
      }, SAVE_DEBOUNCE_MS)
    },
    [flushPendingPatches],
  )

  // Flush pending edits on unmount.
  useEffect(() => {
    // Capture refs locally so the cleanup callback doesn't dereference
    // the ref objects on every render (react-hooks/exhaustive-deps).
    const saveTimeoutRefLocal = saveTimeoutRef
    const saveStatusResetRefLocal = saveStatusResetRef
    const pendingPatchesRefLocal = pendingPatchesRef
    return () => {
      if (saveTimeoutRefLocal.current) {
        clearTimeout(saveTimeoutRefLocal.current)
      }
      if (saveStatusResetRefLocal.current) {
        clearTimeout(saveStatusResetRefLocal.current)
      }
      // Best-effort flush.
      const pending = pendingPatchesRefLocal.current
      if (pending.size > 0) {
        const entries = Array.from(pending.entries())
        pending.clear()
        for (const [rowId, patch] of entries) {
          updateDayExercise(rowId, patch).catch(() => undefined)
        }
      }
    }
  }, [])

  /* ---------- Removal with undo ---------- */
  const handleRemoveExercise = useCallback(
    async (rowId: string) => {
      // Locate the row + its parent day BEFORE mutating state so the
      // closure carries a strongly-typed snapshot for rollback / undo.
      type RemovedSnapshot = {
        dayId: string
        row: WorkoutDayExerciseWithExercise
        index: number
      }
      let removed: RemovedSnapshot | null = null
      for (const d of plan.workout_days) {
        const idx = d.workout_day_exercises.findIndex((r) => r.id === rowId)
        if (idx !== -1) {
          removed = {
            dayId: d.id,
            row: d.workout_day_exercises[idx],
            index: idx,
          }
          break
        }
      }
      if (!removed) return
      const snapshot: RemovedSnapshot = removed

      // Optimistic remove.
      setPlan((prev) => ({
        ...prev,
        workout_days: prev.workout_days.map((d) =>
          d.id === snapshot.dayId
            ? {
                ...d,
                workout_day_exercises: d.workout_day_exercises.filter(
                  (r) => r.id !== rowId,
                ),
              }
            : d,
        ),
      }))

      // Don't hit the API for unsaved temp rows — they were never persisted.
      if (rowId.startsWith('temp:')) {
        toast.success('Gyakorlat eltávolítva.')
        return
      }

      setSaveStatus('saving')
      const result = await removeExerciseFromDay(rowId)
      if (!result.success) {
        // Rollback: re-insert at original index.
        setPlan((prev) => ({
          ...prev,
          workout_days: prev.workout_days.map((d) => {
            if (d.id !== snapshot.dayId) return d
            const arr = [...d.workout_day_exercises]
            arr.splice(snapshot.index, 0, snapshot.row)
            return { ...d, workout_day_exercises: arr }
          }),
        }))
        setSaveStatus('error')
        toast.error(result.error)
        return
      }

      flashSaved()
      // Undo toast — re-inserts the row by re-creating it on the server.
      toast('Gyakorlat eltávolítva', {
        description: snapshot.row.exercises?.name_hu ?? '',
        duration: 4000,
        action: {
          label: 'Visszavonás',
          onClick: async () => {
            const r = snapshot.row
            const ex = r.exercises
            if (!ex) return
            const undoResult = await addExerciseToDay(
              snapshot.dayId,
              r.exercise_id,
              r.sets ?? 3,
              r.reps ?? 10,
              r.rest_seconds ?? 60,
              snapshot.index,
            )
            if (undoResult.success && undoResult.data) {
              setPlan((prev) => ({
                ...prev,
                workout_days: prev.workout_days.map((d) => {
                  if (d.id !== snapshot.dayId) return d
                  const arr = [...d.workout_day_exercises]
                  arr.splice(snapshot.index, 0, {
                    ...undoResult.data!,
                    exercises: ex,
                  })
                  return { ...d, workout_day_exercises: arr }
                }),
              }))
              toast.success('Visszavonva.')
            } else {
              toast.error(undoResult.success ? 'Ismeretlen hiba.' : undoResult.error)
            }
          },
        },
      })
    },
    [plan.workout_days, flashSaved],
  )

  const handleStartRenameDay = useCallback(
    (day: WorkoutDayWithExercises) => {
      setEditingDayId(day.id)
      setEditingDayName(day.day_name)
    },
    [],
  )

  const handleCommitRenameDay = useCallback(async () => {
    if (!editingDayId) return
    const dayId = editingDayId
    const trimmed = editingDayName.trim()
    setEditingDayId(null)
    if (!trimmed) return

    const original = plan.workout_days.find((d) => d.id === dayId)
    if (!original || original.day_name === trimmed) return

    updateDayInState(dayId, (d) => ({ ...d, day_name: trimmed }))
    setSaveStatus('saving')
    const result = await updateWorkoutDay(dayId, { day_name: trimmed })
    if (result.success) {
      flashSaved()
    } else {
      updateDayInState(dayId, (d) => ({ ...d, day_name: original.day_name }))
      setSaveStatus('error')
      toast.error(result.error)
    }
  }, [editingDayId, editingDayName, plan.workout_days, updateDayInState, flashSaved])

  const handleDeleteDay = useCallback(async (dayId: string) => {
    setConfirmingDeleteDayId(null)
    const removed = plan.workout_days.find((d) => d.id === dayId)
    if (!removed) return

    setPlan((prev) => ({
      ...prev,
      workout_days: prev.workout_days.filter((d) => d.id !== dayId),
    }))

    if (selectedDayId === dayId) {
      const remaining = plan.workout_days.filter((d) => d.id !== dayId)
      setSelectedDayId(remaining[0]?.id ?? null)
      setMobileOpenDayId(remaining[0]?.id ?? null)
    }

    setSaveStatus('saving')
    const result = await deleteWorkoutDay(dayId)
    if (result.success) {
      flashSaved()
      toast.success(`„${removed.day_name}” törölve.`)
    } else {
      // Re-insert.
      setPlan((prev) => ({
        ...prev,
        workout_days: [...prev.workout_days, removed].sort(
          (a, b) => a.day_order - b.day_order,
        ),
      }))
      setSaveStatus('error')
      toast.error(result.error)
    }
  }, [plan.workout_days, selectedDayId, flashSaved])

  /* ---------- Plan actions ---------- */
  const handleActivatePlan = useCallback(() => {
    if (plan.is_active) return
    startTransition(async () => {
      const result = await setActivePlan(plan.id)
      if (result.success) {
        setPlan((p) => ({ ...p, is_active: true }))
        toast.success('Terv aktiválva.')
        router.refresh()
      } else {
        toast.error(result.error)
      }
    })
  }, [plan.is_active, plan.id, router])

  const handleDeletePlan = useCallback(() => {
    setConfirmingDeletePlan(false)
    startTransition(async () => {
      const result = await deleteWorkoutPlan(plan.id)
      if (result.success) {
        toast.success('Terv törölve.')
        router.push('/workouts')
      } else {
        toast.error(result.error)
      }
    })
  }, [plan.id, router])

  const sortedDays = useMemo(
    () => [...plan.workout_days].sort((a, b) => a.day_order - b.day_order),
    [plan.workout_days],
  )

  const nextDayOrder = useMemo(
    () =>
      sortedDays.length === 0
        ? 0
        : Math.max(...sortedDays.map((d) => d.day_order)) + 1,
    [sortedDays],
  )

  const takenDaysOfWeek = useMemo(
    () =>
      sortedDays
        .map((d) => d.day_of_week)
        .filter((d): d is number => d !== null),
    [sortedDays],
  )

  const totalExercises = useMemo(
    () =>
      sortedDays.reduce(
        (acc, d) => acc + d.workout_day_exercises.length,
        0,
      ),
    [sortedDays],
  )

  const selectedDay = useMemo(
    () => sortedDays.find((d) => d.id === selectedDayId) ?? sortedDays[0] ?? null,
    [sortedDays, selectedDayId],
  )

  const activeRowExercise = useMemo(() => {
    if (!activeSortRowId) return null
    for (const d of sortedDays) {
      const r = d.workout_day_exercises.find((row) => row.id === activeSortRowId)
      if (r) return r
    }
    return null
  }, [activeSortRowId, sortedDays])

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => {
        setActiveDragExercise(null)
        setActiveSortRowId(null)
      }}
    >
      <div className="space-y-6">
        {/* ---------- Plan header ---------- */}
        <PlanHeader
          plan={plan}
          totalExercises={totalExercises}
          totalDays={sortedDays.length}
          saveStatus={saveStatus}
          onActivate={handleActivatePlan}
          onRequestDelete={() => setConfirmingDeletePlan(true)}
        />

        {/* ---------- Library + Day grid (responsive split) ---------- */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)] xl:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
          {/* ---------- Library panel ---------- */}
          <section
            className={cn(
              'lg:sticky lg:top-20 lg:self-start lg:flex lg:flex-col',
              'space-y-4 rounded-lg border border-border bg-card/40 p-4',
              'lg:max-h-[calc(100vh-7rem)]',
            )}
            aria-label="Gyakorlat-könyvtár"
          >
            <header className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="font-condensed text-[10px] uppercase tracking-wide-display text-brand-red">
                  {'// gyakorlat-könyvtár'}
                </span>
                <h2 className="font-condensed text-base font-extrabold uppercase tracking-display text-foreground">
                  Gyakorlatok
                </h2>
              </div>
              <span className="hidden md:inline-flex font-condensed text-[10px] uppercase tracking-wide-display text-muted-foreground/60">
                Húzd át egy napra
              </span>
            </header>

            <ExerciseSearchBar
              initialValue={searchQuery}
              onDebouncedChange={setSearchQuery}
              placeholder="Keresés..."
            />

            <ExerciseFilters filters={filters} onChange={setFilters} />

            {/* Library scroll area */}
            <div
              className={cn(
                'lg:flex-1 lg:min-h-0 lg:overflow-y-auto lg:pr-1',
                '-mx-1 px-1',
              )}
            >
              {libraryError ? (
                <div
                  role="alert"
                  className={cn(
                    'rounded-md border border-destructive/40 bg-destructive/10',
                    'px-3 py-2 font-sans text-xs text-destructive',
                  )}
                >
                  {libraryError}
                </div>
              ) : libraryLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-[68px] w-full rounded-md" />
                  ))}
                </div>
              ) : libraryItems.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-8 text-center">
                  <span className="flex size-10 items-center justify-center rounded-full bg-brand-red-muted text-brand-red">
                    <SearchX className="size-5" />
                  </span>
                  <p className="font-condensed text-[11px] uppercase tracking-wide-display text-muted-foreground">
                    Nincs találat
                  </p>
                </div>
              ) : (
                <ul className="space-y-2">
                  {libraryItems.map((ex) => (
                    <li key={ex.id}>
                      <DraggableExerciseCard
                        exercise={ex}
                        onQuickAdd={
                          selectedDayId
                            ? (exercise) =>
                                addExerciseToDayInPlan(
                                  selectedDayId,
                                  exercise,
                                )
                            : undefined
                        }
                      />
                    </li>
                  ))}
                </ul>
              )}

              {libraryHasMore && !libraryLoading && (
                <div className="pt-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleLoadMoreLibrary}
                    disabled={libraryLoadingMore}
                    className={cn(
                      'h-9 w-full font-condensed text-[11px] uppercase tracking-wide-display',
                      'border-brand-red-border hover:bg-brand-red-muted',
                    )}
                  >
                    {libraryLoadingMore ? (
                      <>
                        <Loader2 className="size-3.5 animate-spin" />
                        Betöltés…
                      </>
                    ) : (
                      'Még több'
                    )}
                  </Button>
                </div>
              )}
            </div>
          </section>

          {/* ---------- Days panel ---------- */}
          <section className="space-y-4" aria-label="Edzésnapok">
            {/* Desktop tab bar + Add day */}
            <div className="hidden md:flex items-center gap-2 overflow-x-auto pb-1">
              {sortedDays.map((day) => {
                const isActive = selectedDayId === day.id
                return (
                  <DayTab
                    key={day.id}
                    day={day}
                    active={isActive}
                    isEditing={editingDayId === day.id}
                    editingValue={editingDayName}
                    onEditingValueChange={setEditingDayName}
                    onCommitRename={handleCommitRenameDay}
                    onCancelRename={() => setEditingDayId(null)}
                    onSelect={() => setSelectedDayId(day.id)}
                    onStartRename={() => handleStartRenameDay(day)}
                    onRequestDelete={() => setConfirmingDeleteDayId(day.id)}
                  />
                )
              })}
              <AddDayDialog
                planId={plan.id}
                nextDayOrder={nextDayOrder}
                takenDaysOfWeek={takenDaysOfWeek}
                onAdded={() => router.refresh()}
              />
            </div>

            {/* Desktop: render only the selected day */}
            {sortedDays.length === 0 ? (
              <EmptyDaysState
                planId={plan.id}
                nextDayOrder={nextDayOrder}
                takenDaysOfWeek={takenDaysOfWeek}
              />
            ) : (
              <>
                <div className="hidden md:block">
                  {selectedDay && (
                    <DayDropZone
                      day={selectedDay}
                      onChange={handleStepperChange}
                      onRemove={handleRemoveExercise}
                    />
                  )}
                </div>

                {/* Mobile: accordion */}
                <div className="md:hidden space-y-3">
                  {sortedDays.map((day) => {
                    const isOpen = mobileOpenDayId === day.id
                    return (
                      <div key={day.id} className="rounded-lg border border-border bg-card/40">
                        <button
                          type="button"
                          onClick={() => {
                            setMobileOpenDayId(isOpen ? null : day.id)
                            if (!isOpen) setSelectedDayId(day.id)
                          }}
                          className={cn(
                            'flex w-full items-center justify-between gap-3 px-4 py-3',
                            'font-condensed text-sm font-bold uppercase tracking-display text-foreground',
                          )}
                        >
                          <span className="flex items-center gap-3 min-w-0">
                            <span className="font-condensed text-[10px] tracking-wide-display text-muted-foreground/60">
                              / {String(day.day_order + 1).padStart(2, '0')}
                            </span>
                            <span className="truncate">{day.day_name}</span>
                            {day.day_of_week !== null && (
                              <span className="shrink-0 font-condensed text-[10px] uppercase tracking-wide-display text-brand-red/80">
                                {DAY_OF_WEEK_LABEL[day.day_of_week]}
                              </span>
                            )}
                          </span>
                          <span className="flex shrink-0 items-center gap-2">
                            <span className="font-condensed text-[10px] uppercase tracking-wide-display text-muted-foreground/60">
                              {day.workout_day_exercises.length} gyak.
                            </span>
                            <ChevronDown
                              className={cn(
                                'size-4 transition-transform text-muted-foreground',
                                isOpen && 'rotate-180 text-brand-red',
                              )}
                            />
                          </span>
                        </button>
                        {isOpen && (
                          <div className="border-t border-border p-3">
                            <DayDropZone
                              day={day}
                              onChange={handleStepperChange}
                              onRemove={handleRemoveExercise}
                              compact
                            />
                            <div className="mt-3 flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleStartRenameDay(day)}
                                className={cn(
                                  'inline-flex h-8 items-center gap-1.5 rounded-md px-2.5',
                                  'border border-border bg-background',
                                  'font-condensed text-[10px] uppercase tracking-wide-display text-muted-foreground',
                                  'hover:text-foreground',
                                )}
                              >
                                <Pencil className="size-3" />
                                Átnevezés
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmingDeleteDayId(day.id)}
                                className={cn(
                                  'inline-flex h-8 items-center gap-1.5 rounded-md px-2.5',
                                  'border border-border bg-background',
                                  'font-condensed text-[10px] uppercase tracking-wide-display text-muted-foreground',
                                  'hover:text-destructive hover:border-destructive/40',
                                )}
                              >
                                <Trash2 className="size-3" />
                                Törlés
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                  <AddDayDialog
                    planId={plan.id}
                    nextDayOrder={nextDayOrder}
                    takenDaysOfWeek={takenDaysOfWeek}
                    onAdded={() => router.refresh()}
                    trigger={
                      <button
                        type="button"
                        className={cn(
                          'flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-brand-red-border',
                          'bg-brand-red-muted px-4 py-4 font-condensed text-[12px] font-semibold uppercase tracking-wide-display',
                          'text-brand-red transition-colors hover:bg-brand-red hover:text-white',
                        )}
                      >
                        <Plus className="size-4" />
                        Új edzésnap
                      </button>
                    }
                  />
                </div>
              </>
            )}

            {/* Mobile rename dialog (controlled inline by editingDayId !== null) */}
            <Dialog
              open={editingDayId !== null}
              onOpenChange={(open) => {
                if (!open) setEditingDayId(null)
              }}
            >
              <DialogContent className="bg-card sm:max-w-md md:hidden">
                <DialogHeader>
                  <DialogTitle className="font-condensed text-xl font-extrabold uppercase tracking-display">
                    Nap átnevezése
                  </DialogTitle>
                  <DialogDescription className="font-sans text-sm text-muted-foreground">
                    Válassz egy beszédes nevet az edzésnapnak.
                  </DialogDescription>
                </DialogHeader>
                <input
                  type="text"
                  autoFocus
                  value={editingDayName}
                  onChange={(e) => setEditingDayName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCommitRenameDay()
                    else if (e.key === 'Escape') setEditingDayId(null)
                  }}
                  className={cn(
                    'h-11 rounded-md border border-border bg-background px-3',
                    'font-sans text-base text-foreground',
                    'focus-visible:outline-none focus-visible:border-brand-red',
                  )}
                />
                <DialogFooter className="gap-2 sm:gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setEditingDayId(null)}
                    className="font-condensed text-xs uppercase tracking-wide-display"
                  >
                    Mégse
                  </Button>
                  <button
                    type="button"
                    onClick={handleCommitRenameDay}
                    className={cn(
                      'inline-flex h-9 items-center justify-center gap-2 rounded-md px-4',
                      'bg-brand-red text-white',
                      'font-condensed text-xs font-semibold uppercase tracking-wide-display',
                      'hover:bg-brand-red/85',
                    )}
                  >
                    <Check className="size-3.5" />
                    Mentés
                  </button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </section>
        </div>

        {/* Floating back link (mobile-friendly) */}
        <Link
          href="/workouts"
          className={cn(
            'inline-flex items-center gap-2 font-condensed text-[11px] uppercase tracking-wide-display',
            'text-muted-foreground hover:text-brand-red transition-colors',
          )}
        >
          <ArrowLeft className="size-3.5" />
          Vissza a tervekhez
        </Link>
      </div>

      {/* DragOverlay — ghost rendered while dragging */}
      <DragOverlay dropAnimation={{ duration: 200 }}>
        {activeDragExercise ? (
          <ExerciseDragGhost exercise={activeDragExercise} />
        ) : activeRowExercise ? (
          // The ghost is purely visual: disable pointer events so the
          // stepper/delete buttons inside don't show hover/active states
          // or capture clicks while the user is mid-drag.
          <div className="pointer-events-none opacity-95">
            <WorkoutDayExerciseCard
              row={activeRowExercise}
              index={0}
              onChange={() => undefined}
              onRemove={() => undefined}
            />
          </div>
        ) : null}
      </DragOverlay>

      {/* ---------- Confirm delete dialogs ---------- */}
      <Dialog
        open={confirmingDeletePlan}
        onOpenChange={setConfirmingDeletePlan}
      >
        <DialogContent className="bg-card sm:max-w-md">
          <DialogHeader>
            <span className="inline-flex items-center gap-2 font-condensed text-[10px] uppercase tracking-wide-display text-destructive">
              <TriangleAlert className="size-3" />
              {'// terv törlése'}
            </span>
            <DialogTitle className="font-condensed text-2xl font-extrabold uppercase tracking-display text-foreground">
              Biztosan törlöd?
            </DialogTitle>
            <DialogDescription className="font-sans text-sm text-muted-foreground">
              A „<span className="text-foreground">{plan.name}</span>” terv és az
              összes hozzá tartozó nap és gyakorlat véglegesen törlődik. Ez a
              művelet nem visszavonható.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              variant="outline"
              onClick={() => setConfirmingDeletePlan(false)}
              className="font-condensed text-xs uppercase tracking-wide-display"
            >
              Mégse
            </Button>
            <button
              type="button"
              onClick={handleDeletePlan}
              className={cn(
                'inline-flex h-9 items-center justify-center gap-2 rounded-md px-4',
                'bg-destructive text-white',
                'font-condensed text-xs font-semibold uppercase tracking-wide-display',
                'hover:bg-destructive/85',
              )}
            >
              <Trash2 className="size-3.5" />
              Törlés
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={confirmingDeleteDayId !== null}
        onOpenChange={(open) => {
          if (!open) setConfirmingDeleteDayId(null)
        }}
      >
        <DialogContent className="bg-card sm:max-w-md">
          <DialogHeader>
            <span className="inline-flex items-center gap-2 font-condensed text-[10px] uppercase tracking-wide-display text-destructive">
              <TriangleAlert className="size-3" />
              {'// nap törlése'}
            </span>
            <DialogTitle className="font-condensed text-2xl font-extrabold uppercase tracking-display text-foreground">
              Edzésnap törlése
            </DialogTitle>
            <DialogDescription className="font-sans text-sm text-muted-foreground">
              A nap és minden gyakorlata törlődik. Ez nem visszavonható.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              variant="outline"
              onClick={() => setConfirmingDeleteDayId(null)}
              className="font-condensed text-xs uppercase tracking-wide-display"
            >
              Mégse
            </Button>
            <button
              type="button"
              onClick={() =>
                confirmingDeleteDayId &&
                handleDeleteDay(confirmingDeleteDayId)
              }
              className={cn(
                'inline-flex h-9 items-center justify-center gap-2 rounded-md px-4',
                'bg-destructive text-white',
                'font-condensed text-xs font-semibold uppercase tracking-wide-display',
                'hover:bg-destructive/85',
              )}
            >
              <Trash2 className="size-3.5" />
              Törlés
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DndContext>
  )
}

/* ============================================================================
 *  Sub-components
 * ============================================================================ */

interface PlanHeaderProps {
  plan: WorkoutPlanWithDays
  totalExercises: number
  totalDays: number
  saveStatus: SaveStatus
  onActivate: () => void
  onRequestDelete: () => void
}

function PlanHeader({
  plan,
  totalExercises,
  totalDays,
  saveStatus,
  onActivate,
  onRequestDelete,
}: PlanHeaderProps) {
  return (
    <header
      className={cn(
        'sticky top-16 z-20 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8',
        'border-b border-border bg-background/85 backdrop-blur-md',
      )}
    >
      <div className="flex flex-col gap-3 py-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-col gap-1 min-w-0">
          <Link
            href="/workouts"
            className="inline-flex items-center gap-2 font-condensed text-[10px] uppercase tracking-wide-display text-brand-red hover:text-brand-red/80 transition-colors w-fit"
          >
            <ArrowLeft className="size-3" />
            {'// edzéstervező'}
          </Link>
          <h1
            className={cn(
              'font-condensed text-2xl sm:text-3xl md:text-4xl font-extrabold uppercase',
              'tracking-display text-foreground leading-tight truncate',
            )}
          >
            {plan.name}
          </h1>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
            <span className="inline-flex items-center gap-1.5 font-condensed text-[11px] uppercase tracking-wide-display text-muted-foreground">
              <Calendar className="size-3 text-muted-foreground/70" />
              {totalDays} nap
            </span>
            <span className="inline-flex items-center gap-1.5 font-condensed text-[11px] uppercase tracking-wide-display text-muted-foreground">
              <Activity className="size-3 text-muted-foreground/70" />
              {totalExercises} gyakorlat
            </span>
            <SaveStatusBadge status={saveStatus} />
          </div>
        </div>
        <div className="flex items-center gap-2">
          {plan.is_active ? (
            <span
              className={cn(
                'inline-flex h-9 items-center gap-2 rounded-md px-3',
                'border border-brand-red-border bg-brand-red-muted text-brand-red',
                'font-condensed text-[11px] font-semibold uppercase tracking-wide-display',
              )}
            >
              <CheckCircle2 className="size-3.5" />
              Aktív terv
            </span>
          ) : (
            <button
              type="button"
              onClick={onActivate}
              className={cn(
                'inline-flex h-9 items-center gap-2 rounded-md px-3',
                'border border-brand-red-border bg-brand-red-muted text-brand-red',
                'font-condensed text-[11px] font-semibold uppercase tracking-wide-display',
                'transition-colors hover:bg-brand-red hover:text-white',
              )}
            >
              <Star className="size-3.5" />
              Tedd aktívvá
            </button>
          )}
          <button
            type="button"
            onClick={onRequestDelete}
            aria-label="Terv törlése"
            className={cn(
              'inline-flex h-9 items-center justify-center size-9 rounded-md',
              'border border-border bg-background text-muted-foreground',
              'transition-colors hover:bg-destructive/10 hover:border-destructive/40 hover:text-destructive',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive/40',
            )}
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      </div>
    </header>
  )
}

function SaveStatusBadge({ status }: { status: SaveStatus }) {
  if (status === 'idle') return null
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5',
        'font-condensed text-[11px] uppercase tracking-wide-display',
        status === 'saving' && 'text-muted-foreground',
        status === 'saved' && 'text-emerald-500',
        status === 'error' && 'text-destructive',
      )}
      role="status"
      aria-live="polite"
    >
      {status === 'saving' && (
        <>
          <Loader2 className="size-3 animate-spin" />
          Mentés…
        </>
      )}
      {status === 'saved' && (
        <>
          <Check className="size-3" />
          Mentve
        </>
      )}
      {status === 'error' && (
        <>
          <TriangleAlert className="size-3" />
          Hiba
        </>
      )}
    </span>
  )
}

/* ---------- Day tab (desktop) ---------- */

interface DayTabProps {
  day: WorkoutDayWithExercises
  active: boolean
  isEditing: boolean
  editingValue: string
  onEditingValueChange: (next: string) => void
  onCommitRename: () => void
  onCancelRename: () => void
  onSelect: () => void
  onStartRename: () => void
  onRequestDelete: () => void
}

function DayTab({
  day,
  active,
  isEditing,
  editingValue,
  onEditingValueChange,
  onCommitRename,
  onCancelRename,
  onSelect,
  onStartRename,
  onRequestDelete,
}: DayTabProps) {
  if (isEditing) {
    return (
      <div
        className={cn(
          'inline-flex h-9 shrink-0 items-center rounded-md border border-brand-red bg-card px-2',
          'shadow-[0_0_0_1px_rgba(120,0,0,0.4)_inset]',
        )}
      >
        <input
          type="text"
          autoFocus
          value={editingValue}
          onChange={(e) => onEditingValueChange(e.target.value)}
          onBlur={onCommitRename}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onCommitRename()
            else if (e.key === 'Escape') onCancelRename()
          }}
          className={cn(
            'h-full bg-transparent px-2 outline-none',
            'font-condensed text-sm font-bold uppercase tracking-display text-foreground',
            'min-w-32',
          )}
          maxLength={60}
        />
      </div>
    )
  }

  return (
    <div
      className={cn(
        'group/tab relative inline-flex shrink-0 items-stretch rounded-md border',
        'transition-all',
        active
          ? cn(
              'border-brand-red-border bg-card',
              'shadow-[0_0_0_1px_rgba(120,0,0,0.35)_inset]',
            )
          : 'border-border bg-card/40 hover:border-brand-red-border',
      )}
    >
      {active && (
        <span
          aria-hidden="true"
          className="absolute -top-px left-2 right-2 h-px bg-brand-red"
        />
      )}
      <button
        type="button"
        onClick={onSelect}
        onDoubleClick={onStartRename}
        className={cn(
          'flex h-9 items-center gap-2 px-3',
          'font-condensed text-[12px] font-semibold uppercase tracking-wide-display',
          active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
        )}
      >
        <span className="font-condensed text-[10px] tracking-wide-display text-muted-foreground/50">
          / {String(day.day_order + 1).padStart(2, '0')}
        </span>
        <span className="max-w-44 truncate">{day.day_name}</span>
        {day.day_of_week !== null && (
          <span className="font-condensed text-[9px] uppercase tracking-wide-display text-brand-red/80">
            {DAY_OF_WEEK_LABEL[day.day_of_week]}
          </span>
        )}
        <span
          className={cn(
            'inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1',
            'bg-muted/60 text-[9px] font-bold tabular-nums',
            active && 'bg-brand-red/20 text-brand-red',
          )}
        >
          {day.workout_day_exercises.length}
        </span>
      </button>
      {active && (
        <span className="flex items-stretch border-l border-border">
          <button
            type="button"
            onClick={onStartRename}
            aria-label="Nap átnevezése"
            className={cn(
              'flex items-center justify-center w-7',
              'text-muted-foreground/60 transition-colors hover:text-brand-red',
            )}
          >
            <Pencil className="size-3" />
          </button>
          <button
            type="button"
            onClick={onRequestDelete}
            aria-label="Nap törlése"
            className={cn(
              'flex items-center justify-center w-7 border-l border-border',
              'text-muted-foreground/60 transition-colors hover:text-destructive',
            )}
          >
            <Trash2 className="size-3" />
          </button>
        </span>
      )}
    </div>
  )
}

/* ---------- Day drop-zone ---------- */

interface DayDropZoneProps {
  day: WorkoutDayWithExercises
  onChange: (
    rowId: string,
    patch: { sets?: number; reps?: number; rest_seconds?: number },
  ) => void
  onRemove: (rowId: string) => void
  compact?: boolean
}

function DayDropZone({ day, onChange, onRemove, compact }: DayDropZoneProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `day:${day.id}`,
    data: { type: 'day', dayId: day.id },
  })

  const isEmpty = day.workout_day_exercises.length === 0

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'relative rounded-lg border-2 border-dashed transition-colors',
        compact ? 'p-2' : 'p-3 sm:p-4',
        isOver
          ? 'border-brand-red bg-brand-red-muted/40'
          : isEmpty
            ? 'border-border/60 bg-card/20'
            : 'border-transparent bg-card/30',
      )}
      aria-label={`${day.day_name} — drop zone`}
    >
      <SortableContext
        items={day.workout_day_exercises.map((r) => r.id)}
        strategy={verticalListSortingStrategy}
      >
        <ul className="space-y-2">
          {day.workout_day_exercises.map((row, idx) => (
            <motion.li
              key={row.id}
              layout
              initial={
                row.id.startsWith('temp:')
                  ? { opacity: 0, y: 8, scale: 0.98 }
                  : false
              }
              animate={{ opacity: 1, y: 0, scale: 1 }}
              variants={slideUpSm}
              className="list-none"
            >
              <WorkoutDayExerciseCard
                row={row}
                index={idx}
                onChange={onChange}
                onRemove={onRemove}
              />
            </motion.li>
          ))}
        </ul>
      </SortableContext>

      {isEmpty && (
        <div className="flex flex-col items-center gap-3 py-10 text-center">
          <span
            className={cn(
              'flex size-10 items-center justify-center rounded-full',
              'bg-brand-red-muted text-brand-red',
              isOver && 'animate-pulse',
            )}
          >
            <PackageOpen className="size-5" />
          </span>
          <div className="space-y-1">
            <p className="font-condensed text-sm font-bold uppercase tracking-display text-foreground">
              {isOver ? 'Engedd el ide' : 'Üres edzésnap'}
            </p>
            <p className="hidden md:block font-sans text-xs text-muted-foreground">
              Húzz át gyakorlatokat a könyvtárból, vagy kattints a + gombra
              egy gyakorlat során.
            </p>
            <p className="md:hidden font-sans text-xs text-muted-foreground">
              Görgess fel a gyakorlat-könyvtárhoz, és érintsd meg a +
              gombot egy sor mellett.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

/* ---------- Empty days state ---------- */

interface EmptyDaysStateProps {
  planId: string
  nextDayOrder: number
  takenDaysOfWeek: number[]
}

function EmptyDaysState({ planId, nextDayOrder, takenDaysOfWeek }: EmptyDaysStateProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl border border-border bg-card/40',
        'px-6 py-12 sm:py-16 text-center',
      )}
    >
      <span aria-hidden="true" className="pointer-events-none absolute left-3 top-3 size-3 border-l border-t border-brand-red/70" />
      <span aria-hidden="true" className="pointer-events-none absolute right-3 top-3 size-3 border-r border-t border-brand-red/70" />
      <span aria-hidden="true" className="pointer-events-none absolute left-3 bottom-3 size-3 border-l border-b border-brand-red/70" />
      <span aria-hidden="true" className="pointer-events-none absolute right-3 bottom-3 size-3 border-r border-b border-brand-red/70" />

      <div className="flex flex-col items-center gap-3">
        <span className="flex size-12 items-center justify-center rounded-full bg-brand-red-muted text-brand-red">
          <Calendar className="size-5" />
        </span>
        <div className="space-y-1">
          <span className="font-condensed text-[11px] uppercase tracking-wide-display text-brand-red">
            {'// üres terv'}
          </span>
          <h2 className="font-condensed text-2xl font-extrabold uppercase tracking-display text-foreground">
            Adj hozzá egy edzésnapot
          </h2>
          <p className="mx-auto max-w-md font-sans text-sm text-muted-foreground">
            A tervezéshez először szervezd időbontásokra (pl. „Hétfő — Mell”,
            „Kedd — Hát”).
          </p>
        </div>
        <AddDayDialog
          planId={planId}
          nextDayOrder={nextDayOrder}
          takenDaysOfWeek={takenDaysOfWeek}
          trigger={
            <button
              type="button"
              className={cn(
                'mt-2 inline-flex h-10 items-center gap-2 rounded-md px-5',
                'bg-brand-red text-white',
                'font-condensed text-xs font-semibold uppercase tracking-wide-display',
                'transition-all hover:bg-brand-red/85',
              )}
            >
              <Plus className="size-3.5" />
              Nap hozzáadása
            </button>
          }
        />
      </div>
    </div>
  )
}
