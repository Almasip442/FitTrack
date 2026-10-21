# FitTrack Pro

FitTrack Pro is a Next.js App Router and Supabase web application for tracking workouts, nutrition, and body weight. Its main SZD II workflow compares a user's planned and completed workouts, recorded nutrition, and weight trends, then presents a transparent rule-based weekly assessment alongside an optional AI explanation.

## Requirements

- Node.js 22.22.2+ (or 24.15.0+) and npm. Use a currently supported LTS release.
- A Supabase project for authentication and database access.
- OpenRouter key for AI explanations (optional: deterministic assessment works without it).
- Stripe test keys only if testing the shop.

## Local setup

1. Clone the repository and enter its root directory.
2. Install the exact lockfile dependencies:

   ```bash
   npm ci
   ```

3. Copy `.env.example` to `.env.local` and fill in the Supabase Project URL and anon key. Add the service role key only for seed scripts. Add OpenRouter and Stripe variables only for the features being tested. Never commit `.env.local` or expose the service role key in browser code.
4. Apply all SQL files in `supabase/migrations/` in timestamp order. For an already initialized database, also apply new migrations `20261021000009_workout_exercise_skip.sql` and `20261021000010_weekly_analysis_comparison.sql`.
5. Populate the exercise catalog if needed:

   ```bash
   npm run seed:exercises
   ```

6. For a deterministic evaluation account, run `npm run seed:demo-user`. **This script resets data belonging to `demo@fittrack.hu`**; it does not touch catalog tables. It requires `SUPABASE_SERVICE_ROLE_KEY` and an exercise catalog. The generated login is printed by the script. The two closed weeks have expected recorded calorie averages of 2,050 and 2,150 kcal/day, completed workouts of 2/4 and 3/4, workout volumes of 9,000 and 14,400 kg, and average weight change of -0.5 kg. Weight averages are 82.2 and 81.7 kg. Nutrition coverage is 4/7 and 6/7.
7. Start the development server:

   ```bash
   npm run dev
   ```

   Open <http://localhost:3000>.

## Verification

```bash
npm run lint
npx tsc --noEmit
npm test
npm run build
```

The automated tests verify missing-day handling, recorded-day averages, completed versus planned workouts, set/repetition/load volume, weight averages, and deterministic fallback output.

## Manual evaluation workflow

1. Sign in with the seeded demo account and open `/progress`.
2. Use the week selector above the weekly summary to move between the current week and up to 11 earlier weeks. The selected week and its preceding week are shown side by side.
3. Select the two seeded weeks and confirm nutrition coverage of 4/7 and 6/7 and calorie averages of 2,050 and 2,150 kcal. Empty days must not lower the averages.
4. Confirm completed/plan counts 2/4 and 3/4, with 9,000 and 14,400 kg recorded workout volume. Check that skipped or unlogged exercises do not contribute volume.
5. Confirm the weekly weight averages (82.2 and 81.7 kg) and the -0.5 kg change.
6. Generate a weekly analysis. When OpenRouter is available, compare its explanation and score with the deterministic assessment. Temporarily omit/fail the OpenRouter key in a local test environment to verify that the fallback remains useful and the comparison panel identifies the fallback. Restore the key after testing.
7. Capture screenshots of `/progress`, the analysis comparison panel, and the workout logger with saved and skipped exercises. Record the browser viewport and test data state for the thesis evidence.

## Project docs

- `docs/SZD2_AI_EXECUTION_PLAN.md` — development scope, sequence, and completion state.
- `docs/AI_ANALYSIS_RULES.md` — system instructions and safety rules for the AI analysis.
- `docs/DEPLOYMENT.md` — Supabase, environment, seed, and deployment instructions.
- `docs/BUGFIX_BACKLOG.md` — known and resolved defects.
- `docs/thesis/SZD2_DOLGOZAT_ELSO_VALTOZAT.md` — first thesis text draft with source references and current application figures.
- `docs/thesis/MI_HASZNALATI_NAPLO.md` — concise log of development-time AI use, human decisions, and verification.

### Seed migration/schema-cache hiba

A seed ellenőrzi a szükséges adatbázis-oszlopokat, mielőtt létrehozná vagy törölné a demó felhasználó adatait. Ha a `weekly_analyses.ai_status` hiányzik, futtasd le a `20261021000010_weekly_analysis_comparison.sql` migrációt a Supabase SQL Editorban. Ha a migráció már lefutott, frissítsd a PostgREST sémát:

```sql
NOTIFY pgrst, 'reload schema';
```

Ezután várj néhány másodpercet, majd futtasd újra a `npm run seed:demo-user` parancsot. A seed újrafuttatása a félbemaradt demóadatokat is törli és újra létrehozza.
