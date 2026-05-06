---
name: F4 dashboard — widget grid, SVG ring, sparkline, AI overlay
description: Where the FitTrack Pro dashboard surface lives after F4 (widget grid, calories ring, workout completion, weekly circles, weight sparkline, AI overlay)
type: project
---

After F4 ships, the dashboard surface is composed this way:

- **Page entry: `src/app/(protected)/dashboard/page.tsx`** — Server Component. Runs `getDashboardData()` + a second Supabase query for `profiles.name`. Builds greeting bar with Hungarian day name. Passes each widget's data slice as a typed prop.

- **Skeleton: `src/app/(protected)/dashboard/loading.tsx`** — Static Suspense skeleton. Mirrors the 3-column grid layout with matching `<Skeleton>` placeholders for ring, exercise rows, activity circles, sparkline, and quick-nav cards.

- **Grid layout**: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`. Workout widget gets `sm:col-span-2 lg:col-span-2`. All widgets are individual Framer Motion `motion.div` with `variants={slideUp}` and staggered `delay` values (0, 0.05, 0.1, 0.15, 0.2).

- **`src/components/dashboard/calories-widget.tsx`** — Calorie ring with custom SVG (NOT recharts). Ring goes red when consumed > target. MacroBar sub-component uses `motion.div` width animation for bar fill. Macro targets derived from calorie target using macronutrient distribution (30/45/25 P/C/F split).

- **`src/components/dashboard/workout-widget.tsx`** — `'use client'`. Optimistic completion: `useState(workout.isCompleted)` flips immediately on click, `useTransition` for the server action call. Calls `completeTodayWorkout()` from `src/lib/dashboard/actions.ts` (NOT `markWorkoutCompleted` from calories/actions — the new action handles upsert). Three states: no plan (link to /workouts), rest day (Moon icon), exercises list.

- **`src/components/dashboard/weekly-activity-widget.tsx`** — 7 circles (Hé–Va). Uses `new Date().toLocaleDateString('sv-SE')` for local-tz today ISO. Completed = brand-red fill, today = white border ring, empty = `border-[#404040]` (brand-gray).

- **`src/components/dashboard/weight-trend-widget.tsx`** — Custom SVG sparkline with `motion.rect clipPath` width-grow animation (same pattern as F7 bar chart but for a line). Area fill with gradient. Last point dot animates in separately. `TrendingDown` = emerald, `TrendingUp` = red.

- **`src/components/dashboard/ai-analysis-widget.tsx`** — `'use client'`. `useState(showOverlay)` for the detail modal. `AnalysisOverlay` component uses `AnimatePresence` + `motion.div` with `scaleIn` variant. Rating badge color: ≥7 emerald, ≥5 amber, <5 red.

- **`src/components/dashboard/quick-nav.tsx`** — `'use client'`. 4 link cards in `grid-cols-2 sm:grid-cols-4`. Icon color transitions to brand-red on hover. Uses `staggerChildren` + `slideUp` for entry animation.

- **`src/lib/dashboard/actions.ts`** — New server action file. `completeTodayWorkout()` upserts `daily_logs(user_id, date, workout_completed:true)` with `onConflict:'user_id,date'` then calls `revalidatePath('/dashboard')`. Required because `DashboardTodayWorkout` does NOT expose a `daily_log_id` — the upsert approach is idempotent and avoids needing the row ID.

- **`markWorkoutCompleted` API note**: lives in `src/lib/calories/actions.ts` with signature `(dailyLogId: string, completed: boolean)`. Dashboard bypasses it by directly upserting in `completeTodayWorkout()` to avoid needing the log ID.

- **Pre-existing build error**: The `next build` fails due to a pre-existing issue in `src/app/(auth)/register/page.tsx` importing `next/headers` in a context Turbopack treats as Pages Router. This is NOT introduced by F4 — `tsc --noEmit` passes clean on all F4 files.

**Why:** F8 (progress page) and any future widget-based dashboard extensions need to know the widget grid convention, the SVG ring/sparkline patterns, and the daily-log upsert-on-complete strategy.

**How to apply:** When adding new dashboard widgets, use `variants={slideUp}` with an incrementing `delay` prop. For any "mark complete" type action on a date-keyed row, upsert with `onConflict` rather than requiring a row ID. The `toLocaleDateString('sv-SE')` trick reliably produces `YYYY-MM-DD` in the user's local timezone.
