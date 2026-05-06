---
name: F8 progress tracking & AI analysis
description: Where the progress page, weight chart, and AI analysis overlay live after F8
type: project
---

After F8 ships, the progress tracking surface is composed this way:

- **Page entry: `src/app/(protected)/progress/page.tsx`** — Server Component. Loads `getWeightLogs(60)`, `getLatestWeightLog()`, `getWeightChangeSummary()`, `getWeeklyAnalyses(12)`, `getLatestAnalysis()` in parallel via `Promise.all`. Error fallbacks on each with `.catch()`.

- **`src/components/progress/weight-input.tsx`** — Client component. Date + weight form. Calls `upsertWeightLog` server action. Validates: weight 20–500 kg, date not in future. `router.refresh()` after success to trigger server revalidation. Sonner toast on success/error.

- **`src/components/progress/weight-chart.tsx`** — Custom SVG line chart (no recharts). Framer Motion path draw-in animation (`strokeDashoffset`). Gradient area fill below the line. Interactive hover via transparent `<rect>` columns. DOM tooltip (not SVG) for crisp text. Optional `goalWeight` prop renders dashed emerald reference line. Empty state with `TrendingUp` icon.

- **`src/components/progress/weight-summary-card.tsx`** — Week-over-week delta card. Uses `WeightChangeSummary` from `@/lib/weight/queries`. Green for loss, amber for gain, neutral for unchanged. No client state — pure presentational Server-side rendered.

- **`src/components/progress/analysis-cta.tsx`** — Client. Handles three states: (1) no current-week analysis → active generate button, (2) already generated this week → disabled + info, (3) loading → spinner. Current week detection: compares `week_start` field to `currentWeekMonday()` (local tz). POSTs to `/api/analysis`, handles 429 rate-limit gracefully with `setRateLimitHit(true)`. On success, maps `AnalysisApiResponse` (`summary`/`suggestions`/`rating`) to `WeeklyAnalysis` (`ai_analysis`/`ai_suggestions`/`ai_rating`) DB fields. Opens overlay with new analysis immediately.

- **`src/components/progress/analysis-overlay.tsx`** — Client. Full-screen modal with Framer Motion AnimatePresence slide-up. ESC key + backdrop click close. Body scroll lock. Brand-red top strip. Rating shown as 10 dots + badge. Suggestions mapped to icons: Dumbbell (edzés/erő), Utensils (táplálk/kalória/étrend), Lightbulb (default). Uses `ai_analysis`, `ai_suggestions`, `ai_rating` DB fields.

- **`src/components/progress/analysis-history.tsx`** — Client. Vertical timeline with left vertical line + dot markers. Each row: date range, rating badge, summary preview (first 100 chars). Mini rating bar (10 segments). Click opens overlay. Staggered fade-in via `staggerChildren`/`slideUpSm` from `@/lib/animations`.

- **DB field name mismatch**: The `WeeklyAnalysis` type in `database.ts` uses `ai_analysis`, `ai_suggestions`, `ai_rating` — NOT `summary`/`suggestions`/`rating`. The POST `/api/analysis` response returns `summary`/`suggestions`/`rating`. The `analysis-cta.tsx` defines `AnalysisApiResponse` locally and maps via `apiResponseToAnalysis()` function.

- **Current week detection**: `currentWeekMonday()` in `analysis-cta.tsx` returns the Monday of the current local week as `YYYY-MM-DD`, matching `week_start` from the DB.

**Why:** Future iterations (F9 dashboard, F11 reports) will reuse the overlay pattern and the DB field name convention. The API-to-DB mapping pattern should be followed for any future AI analysis integrations.

**How to apply:** When reading analysis data from the DB (via queries), use `ai_analysis`/`ai_suggestions`/`ai_rating`. When reading from `/api/analysis` response, use `summary`/`suggestions`/`rating` and map accordingly. The overlay can be reused by passing any `WeeklyAnalysis` object.
