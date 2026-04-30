---
name: F5 exercise browser — taxonomy, URL-state pattern, surface-agnostic detail body
description: Where the FitTrack Pro exercise browsing UI lives after F5 (chip filters, debounced search, dialog/sheet detail, load-more pagination)
type: project
---

After F5 ships, the exercise browser is composed this way:

- **Page entry: `src/app/(protected)/exercises/page.tsx`** is a Server Component that reads filter URL params (`q`, `muscle_group`, `equipment`, `difficulty`), pre-fetches the first page via `fetchExercises(...)`, and hands the response to the client wrapper. Page size is `20` (passed as a prop so the wrapper can correctly pluralise / load-more). On API failure the page renders the wrapper with an empty `ExercisesListResponse` so the user can recover by adjusting filters — never throw out of the server component.

- **`src/components/exercises/exercise-browser.tsx`** is the client wrapper. URL is the single source of truth for filter state — `searchParams.get(...) ?? initialQuery.x` is read on every render, then `router.replace(...)` writes back. Filters are wrapped in `useMemo` against `[searchParams, initialQuery]` to keep `useCallback` deps stable (otherwise react-hooks/exhaustive-deps warns). `currentKeyRef` tracks which queryKey the rendered list belongs to so the URL-driven refetch effect skips the initial mount when SSR data already matches the URL.

- **`src/lib/exercises/api.ts`** owns `fetchExercises` / `fetchExercise` and `buildExerciseQuery`. The fetcher is universal — `getBaseUrl()` returns `''` on the client and an absolute URL on the server (NEXT_PUBLIC_SITE_URL → VERCEL_URL → localhost:PORT). All callers must use `cache: 'no-store'` (already inside the helper) because filters change too quickly for the route cache to be useful.

- **`src/lib/exercises/taxonomy.ts`** is the taxonomy single-source-of-truth: `MUSCLE_GROUPS` (each entry has a 3-letter `code` like `CHE`/`BCK`/`SLD` printed as the "specimen tag" on cards), `EQUIPMENT_OPTIONS`, `DIFFICULTIES`, plus `DIFFICULTY_DOT` (bg- color) and `DIFFICULTY_TEXT` (text- color) maps — emerald/amber/red. The `value` field on each entry MUST match the seed data exactly (the API filters with `eq`).

- **`src/components/exercises/exercise-search-bar.tsx`** uses the `useDebounce` hook (`src/hooks/use-debounce.ts`, generic `<T>`, default 300ms). The input value is mirrored synchronously for UX; only the *propagated* value via `onDebouncedChange` is debounced. A `lastReportedRef` guard prevents a re-fire loop when the prop syncs back from the URL. Visual idiom: `> ` console prefix + `Search` icon + native input + `X` clear, all wrapped in a single bordered shell so the border can light up `brand-red` on focus-within.

- **`src/components/exercises/exercise-filters.tsx`** renders chip groups (Izomcsoport, Eszköz, Nehézség). Single-select per group (clicking the active chip clears it — no multi-select inside one group). Active chip = `bg-brand-red text-white` + inset shadow `0_0_0_1px_rgba(120,0,0,0.5)_inset` + a 1.5px white dot. On `md:hidden` it collapses to a "Szűrők [N]" trigger button + bottom Sheet (`SheetContent side="bottom" max-h-[85vh]`). `EMPTY_FILTERS = { muscle_group: '', equipment: '', difficulty: '' }` is the canonical reset shape — copy-paste this when adding a new "clear all" action.

- **`src/components/exercises/exercise-card.tsx`** is a row-style card (NOT a vertical poster). Layout: thumbnail/glyph (16/20×16/20) → name + meta column → `ChevronRight`. When `image_url` is null the thumb shows the muscle 3-letter code in brand-red. Hover effect is an INSET 2px brand-red left edge (`shadow-[inset_2px_0_0_0_var(--color-brand-red)]`), not a border or scale — it reads as a "selectable list row" cue. The card is a `<button type="button">`, not a Link, because the click opens a Dialog/Sheet, not a navigation.

- **`src/components/exercises/exercise-detail.tsx`** uses `useIsDesktop()` (`window.matchMedia('(min-width: 768px)')`) to switch between Dialog (desktop) and Sheet (mobile, side="bottom"). CRITICAL convention: the visible heading lives in the surface-agnostic `DetailBody`; each surface wrapper renders its own `DialogTitle`/`SheetTitle` + Description as `sr-only` for a11y. DO NOT put `DialogTitle` inside `DetailBody` — it would be an invalid Radix nesting when the body is rendered inside a Sheet. The hero panel has corner crosshair markers (`border-l border-t border-brand-red/70` on each corner) that give the "specimen card" feel.

- **`src/components/exercises/exercise-empty-state.tsx`** uses `SearchX` (lucide) inside a brand-red glow circle. Receives `hasActiveFilters` + `onClearFilters` so the CTA only renders when there's something to clear.

- **Stagger animation:** the list uses `motion.ul` with `staggerChildren` + `slideUpSm` from `@/lib/animations`. The `key={queryKey}` on the `motion.ul` re-triggers the stagger every time the user changes a filter — this is intentional. Cards within a load-more append don't re-stagger because `key` is unchanged.

- **`/exercises` is NOT in the navbar yet.** F5 doesn't request a nav entry; the entry point is expected to come from F6 (workout planner). Don't add it to `nav-routes.ts` proactively.

**Why:** F6 (workout planner) and F8 (workout day editor) will reuse this list pattern and the detail surface as the picker for "add exercise to workout day". Recording the URL-as-source-of-truth pattern + the surface-agnostic `DetailBody` convention prevents drift when the same UI gets embedded into a sheet picker.

**How to apply:** When building any future "browse + filter + open detail" surface (foods, workout plans, products), copy: (1) URL-as-state pattern with `currentKeyRef` to avoid double-fetching the SSR page on mount; (2) `useDebounce` hook for any free-text input; (3) chip-toggle pattern with single-select per group + `EMPTY_FILTERS` reset; (4) Dialog-on-desktop / Sheet-on-mobile via `useMediaQuery('(min-width: 768px)')` with surface-agnostic body + sr-only Title/Description owned by each wrapper. The 3-letter "specimen code" pattern can be reused on any taxonomy where rows lack thumbnails.
