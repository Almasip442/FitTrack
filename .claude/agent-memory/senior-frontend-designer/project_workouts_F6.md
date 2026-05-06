---
name: F6 workout planner — drag & drop architecture, optimistic + auto-save
description: Where the FitTrack Pro workout-planner UI lives after F6 (plan list, dnd-kit drag/drop, sortable, debounced auto-save)
type: project
---

After F6 ships, the workout-planner surface is composed this way:

- **Routes:**
  - `src/app/(protected)/workouts/page.tsx` — Server Component. Loads `getWorkoutPlans()` and renders `<WorkoutPlanList>`.
  - `src/app/(protected)/workouts/[id]/page.tsx` — Server Component. Loads `getWorkoutPlanWithDays(id)` and redirects to `/workouts` when null. Renders `<WorkoutPlanEditor plan={...}>`.

- **`src/components/workouts/workout-plan-list.tsx`** — Tervlista. Optimistic active-flip for `setActivePlan`, then `router.refresh()`. Empty state has the corner-crosshair specimen card pattern + brand-red glow. Cards use a top brand-red scanline when `is_active`.

- **`src/components/workouts/workout-plan-editor.tsx`** — Single-file editor (~1100 lines). Holds the entire plan state locally (`useState<WorkoutPlanWithDays>`) and mutates optimistically. Layout is a `lg:grid lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)]` split with the library panel sticky-pinned to `top-20` on desktop and a stacked accordion on mobile. dnd-kit setup:
  - `DndContext` wraps everything; sensors are `MouseSensor` (distance: 6), `TouchSensor` (delay: 200ms, tolerance: 6) and `KeyboardSensor`.
  - Library cards use `useDraggable({ id: 'library:<exId>', data: { type: 'exercise', exercise } })`.
  - Each day is a `useDroppable({ id: 'day:<dayId>', data: { type: 'day', dayId } })` wrapper around a `<SortableContext strategy={verticalListSortingStrategy}>`.
  - Inside the sortable context, each row is a `useSortable({ id: row.id, data: { type: 'day-exercise', rowId } })`.
  - `<DragOverlay>` renders an `<ExerciseDragGhost>` (rotated -1.5deg, scaled 1.03, double border) for library drags, and a copy of the row card for sortable drags.
  - Drop handler distinguishes by `activeData.type`: `'exercise'` → `addExerciseToDay()`; `'day-exercise'` → `arrayMove()` + `updateExerciseOrder()`.

- **Auto-save / debounce pattern (NEW canonical pattern for this codebase):**
  - A `pendingPatchesRef = useRef<Map<rowId, patch>>` holds queued stepper edits.
  - On stepper change → optimistic state update + push to map + reset 800ms `setTimeout`.
  - When the timeout fires, `flushPendingPatches()` runs `Promise.all(updateDayExercise(...))` and surfaces only the first failure as a toast.
  - `saveStatus` state machine: `'idle' | 'saving' | 'saved' | 'error'`. Saved auto-flips back to idle after 1800ms via `saveStatusResetRef`. Status badge is rendered in the sticky plan header next to the meta row.
  - On unmount we BEST-EFFORT flush by capturing refs locally before the cleanup runs to satisfy `react-hooks/exhaustive-deps`.

- **`src/lib/workouts/actions.ts` got a new action: `updateDayExercise(rowId, { sets?, reps?, rest_seconds?, notes? })`** — the existing `addExerciseToDay` is insert-only, so this fills the gap for inline stepper edits. Validates ranges (sets 1-50, reps 1-500, rest 0-3600).

- **Optimistic patterns established here:**
  - **Temp rows** for newly-dropped exercises use `id: 'temp:<crypto.randomUUID()>'`. Anywhere we touch the API we filter or guard with `!rowId.startsWith('temp:')`. After the server returns the real row, we replace the temp by id.
  - **Removal-with-undo**: snapshot `{ dayId, row, index }` BEFORE `setPlan` (so closure carries strong types — TS narrows to `never` if you assign inside the setter callback). Toast `action.onClick` re-inserts via `addExerciseToDay`.
  - **Reorder rollback**: keep `snapshot = day.workout_day_exercises` from before `arrayMove`, restore in the failure branch.

- **`src/components/workouts/draggable-exercise-card.tsx`** — Compact (~64px) library card. Drag handle is `hidden md:flex` so mobile gets the `+` quick-add button instead. Exports both `DraggableExerciseCard` AND `ExerciseDragGhost` (visual-only, no listeners) for the DragOverlay.

- **`src/components/workouts/workout-day-exercise-card.tsx`** — Sortable practice card. Three-column stepper grid (Szett / Ismétlés / Pihenő). Pihenő uses 15s steps and formats to `"Xm Ys"`. Stepper is a self-contained internal component with `aria-live="polite"` on the value display.

- **`src/components/workouts/{add-day-dialog,create-plan-dialog}.tsx`** — Reuse the F2 form-control rhythm: `font-condensed text-[11px] uppercase tracking-wide-display` labels with `[ kötelező ]` / `[ opcionális ]` meta tags on the right. Day-of-week is a chip-row picker with "Nincs" + Hétfő..Vasárnap; already-taken days are `disabled` with `opacity-30`.

- **Library panel reuses `<ExerciseSearchBar>` and `<ExerciseFilters>` from F5 unchanged.** The sticky panel listens to its own internal filter state (NOT URL state — the editor URL belongs to the plan id) and refetches via `fetchExercises()` keyed on `searchQuery|filters`. The set-state-in-effect lint rule (new in this React 19 setup) requires deferring synchronous setStates inside an effect body to a `queueMicrotask`.

**Why:** F8 (workout day editor / live workout) and any later "build a routine" surfaces will reuse this drag-list pattern. The optimistic `temp:` row id convention + debounced auto-save pattern + snapshot-before-mutate pattern should be the default playbook for any list-of-rows admin surface in this codebase.

**How to apply:** When building a new admin/edit surface where rows are mutable: (1) hold the entire tree in local state, (2) use `temp:<uuid>` ids for optimistic inserts and replace by id after the server response, (3) wrap edits in a debounced `pendingPatchesRef` map flushed through `Promise.all`, (4) snapshot rollback fields BEFORE the optimistic state mutation so TS keeps strong types in the closure, (5) put the save-status badge in the sticky page header. For dnd-kit specifically, prefer the `data: { type, ... }` discriminator on draggable/droppable so `handleDragEnd` can branch cleanly on `activeData.type`.
