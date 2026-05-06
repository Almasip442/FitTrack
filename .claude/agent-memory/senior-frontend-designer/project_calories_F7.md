---
name: F7 calorie tracking — date nav, lazy daily-log, custom SVG bar chart
description: Where the FitTrack Pro calorie-tracking UI lives after F7 (date navigation, food search sheet, ring + macros, custom SVG weekly trend)
type: project
---

After F7 ships, the calorie-tracker surface is composed this way:

- **Page entry: `src/app/(protected)/calories/page.tsx`** — Server Component. Loads profile (for calorie target), `getDailyLog` for today (NOT `getOrCreate` — empty days don't pollute the table), `getFoodEntriesForLog`, and `getWeeklyCalorieTrend(7)`. Fallback target = 2000 kcal when profile is incomplete.

- **`src/components/calories/calories-client.tsx`** — Top-level client wrapper. Owns:
  - `date` state (local-tz `YYYY-MM-DD`) — initialised from server, mutable via `← / → / Ma`.
  - `dailyLog` / `entries` state — re-fetched via the **browser Supabase client** when `date` changes (NOT a server-action round-trip — keeps date nav snappy). The fetch effect uses an `isFirstRenderRef` guard so the initial mount keeps the SSR-hydrated state.
  - **Lazy daily-log creation** — `ensureDailyLog()` upserts on `(user_id, date)` only when the user actually opens the search sheet on a day with no row yet. Idempotent.
  - `trend` state — re-fetched via browser client after every successful add/delete/update via `refetchTrend()`. The trend is non-critical, so failures are silent.
  - Stale-write guard: `fetchSeqRef` + `seq === fetchSeqRef.current` checks before every setState.
  - Future-date guard: `compareIso(date, todayIso()) > 0` disables the next-day button.

- **`src/components/calories/daily-summary-card.tsx`** — The hero card. Custom **SVG calorie ring** with `motion.circle` driving `strokeDashoffset`. Bars below for protein (emerald-500), carbs (amber-500), fat (brand-red). Ring goes red when `consumed > target`. Skeleton state for date transitions.

- **`src/components/calories/meal-section.tsx`** — One per meal type. Collapsible accordion with `AnimatePresence` height tween. Header shows meta code (RG/EB/VC/SN) + label + kcal pill + add button. Empty state = dashed-border CTA inside the section. Holds the `FoodSearchSheet` instance (one per section, mounted only when `resolvedLogId` is non-null).

- **`src/components/calories/food-entry-row.tsx`** — Row card with brand-red left strip (intensifies on hover). Click on the gram amount → inline editor with check/cancel. Macros are scaled proportionally on amount change. Delete button is hover-revealed (`opacity-0 group-hover:opacity-100`). Optimistic delete + toast.

- **`src/components/calories/food-search-sheet.tsx`** — Bottom Sheet (mobile + desktop, intentionally — the search flow is a focused modal). Two-panel state machine driven by `selected: FoodSearchResult | null`:
  - **SearchPanel** — `useFoodSearch(query)` hook with 400ms debounce, `requestSeqRef` for race-resistance, `AbortController` cleanup. States: idle / loading (skeletons) / error / empty / results.
  - **SelectionPanel** — gram input with `>` prefix + 5 quick-presets (50/100/150/200/250). Live preview block recomputes calories+macros via `(grams / 100) * per100g`. "Hozzáadás" calls `addFoodEntry` server action. Submit button locked until `grams > 0`.

- **`src/components/calories/weekly-trend-chart.tsx`** — **Custom SVG bar chart** (recharts couldn't be installed in this env — npm cert failure). 7 bars with framer-motion height grow-in (60ms staggered). Y-axis ceiling = `max(maxBar, target) * 1.15`. Brand-red dashed reference line at `target`. Bars: emerald under, brand-red over. Hover tooltip is DOM-positioned (not SVG) for crisp text. Today gets a brand-red dot above the bar + bold red weekday label.

- **`src/lib/calories/format.ts`** — Pure formatting helpers. `todayIso()` / `addDays()` / `formatHungarianDate()` / `shortWeekday()` / `relativeLabel()` (returns "Ma" / "Tegnap" / null). All operate in **local timezone** to match the user's expectation when navigating days, even though the DB stores `date` in UTC. Be mindful: a user in UTC+2 just past midnight may see "today" differ from the server's UTC today.

- **`src/lib/calories/meal-types.ts`** — Single source of truth for the meal-type enum (`reggeli` / `ebéd` / `vacsora` / `snack`) with display labels and 2-letter "specimen" codes (RG/EB/VC/SN).

- **React 19 set-state-in-effect** — Several effects in F7 components defer setState via `queueMicrotask(() => setX(...))` to satisfy the `react-hooks/set-state-in-effect` rule. This is the canonical workaround in this repo (see also F6 workout planner library refetch).

- **No recharts in this repo** — Recharts is NOT installed and could not be installed (npm cert error). The custom SVG chart pattern in `weekly-trend-chart.tsx` is the canonical approach for any future visual telemetry. Prefer it over adding a charting library.

**Why:** Future work (F8 dashboard, possibly F11 nutrition reports) will reuse the date-navigator pattern, the custom SVG chart pattern, and the lazy daily-log creation pattern. Recording these prevents reaching for recharts/chart.js when it's not needed and codifies the local-tz date handling that diverges from the UTC `daily_logs.date` column.

**How to apply:** When building any future "per-day" surface (dashboard, weight log, sleep log): (1) keep the `date` URL/state local-tz with `todayIso()` from `format.ts`, (2) use a `compareIso(date, todayIso()) > 0` guard for "no future" navigation, (3) lazy-create the parent log row only on first mutation, (4) re-fetch via browser client (not server-action round-trip) for snappy date nav. For any future chart, copy the SVG pattern from `weekly-trend-chart.tsx` — viewBox + fixed PAD + framer-motion `motion.rect` for grow-in. Sheet-on-all-devices is appropriate for focused modal flows where the desktop experience also benefits from a panel rather than a centered dialog (e.g. food picker, exercise picker, etc.).
