---
name: F3 onboarding & profile pages — guard, shared form, avatar pipeline
description: Where the FitTrack Pro onboarding/profile UI primitives live after F3 (guard, shared form, avatar upload, calorie preview)
type: project
---

After F3 ships, the onboarding/profile surface is composed this way:

- **Onboarding/profile gate lives in `src/app/(protected)/layout.tsx`.** It is now a Server Component that:
  1. Calls `supabase.auth.getUser()` (defence in depth on top of middleware).
  2. Loads the profile via `getProfile(user.id)`.
  3. Reads the current pathname from request headers (`x-invoke-path` → `x-pathname` → `next-url` → `referer`) — Next does not surface the pathname directly to a server layout.
  4. Redirects to `/onboarding` if `isProfileComplete(profile) === false` AND the user is not already on `/onboarding`.
  5. Passes `userName` + `avatarUrl` down to `<Navbar>`. The navbar avatar is wrapped in a `<Link href="/profile">`.

- **`src/components/profile/profile-form.tsx`** is the SHARED form used by both `/onboarding` and `/profile`. Props: `initial` (Pick of profile fields, nullable), `redirectTo`, `submitLabel`, `successMessage`. Validation pattern matches F2 auth pages (memoised `errors`, per-field `touched`, blur-to-touch, force-all-touched on submit). The submit gate is exactly the four backlog-mandated fields: `gender`, `weight`, `height`, `goal`. Submission goes through the `updateProfile` Server Action via `useTransition` + manually-built FormData (so the action result is consumable for toast branching).

- **`src/components/profile/{gender,goal,activity}-selector.tsx`** are visual radio-card pickers built on native hidden `<input type="radio">` (keyboard + screen-reader free). Selection style: `border-brand-red` + `bg-brand-red/[0.06]` + inner shadow `0_0_0_1px_rgba(120,0,0,0.6)_inset`. Goal cards carry a `/ NN` index pill in the top-right; activity cards carry the kcal multiplier (`× 1.20`, `× 1.375`, ...) — both are uppercase Barlow Condensed micro-typography to keep the console feel.

- **`src/components/profile/calorie-preview.tsx`** is a Client Component that calls `calculateCalorieTarget` (pure utility from `src/lib/calories.ts`) on every render against the form's live values. Two states:
  - Filled (≥ gender, weight, height, age): big 5xl/6xl extrabold target in `text-brand-red`, sub-metrics row showing BMR / TDEE.
  - Empty: muted "fill in your data" copy. Border switches between `border-brand-red/40` and `border-border` to telegraph readiness.

- **Avatar upload pipeline:**
  - **Server Action wrapper** at `src/lib/profile/avatar-actions.ts` (`uploadAvatarAction`) — the existing `uploadAvatar()` in `storage.ts` is server-only, so this `'use server'` wrapper authenticates, calls it, then `revalidatePath` on `/profile`, `/dashboard`, `/onboarding`.
  - **`src/components/profile/avatar-upload.tsx`** — clickable circular button hides a native file input. Optimistic UI is implemented as an `optimisticUrl` OVERRIDE state, not a synced copy of the prop (avoids `react-hooks/set-state-in-effect` lint and the derived-state-from-prop antipattern). Display URL = `optimisticUrl ?? currentUrl`. Object URLs are revoked on unmount and on every replacement.

- **Navbar/UserAvatar updates:**
  - `Navbar` now accepts `userName?` + `avatarUrl?` props. The avatar cluster is wrapped in `<Link href="/profile">` so the avatar doubles as the profile entry point.
  - `UserAvatar` now accepts `src?` and renders an `<img>` (plain, not `next/image` — Supabase public URL with cache-bust query string) when supplied; otherwise falls back to the two-letter initials it already rendered.

- **Tailwind v4 quirk reminder:** `next/image` was deliberately avoided for both the navbar avatar and the upload preview because the Supabase public URLs change identity (cache-bust suffix) more often than `next/image` likes; a plain `<img>` swaps instantly without going through the loader cache. ESLint disable comment is local (`@next/next/no-img-element`).

**Why:** F4+ pages (dashboard, calorie tracker, etc.) will reuse the radio-card pattern and the calorie-preview component. The onboarding gate now blocks every protected route, so future iterations must keep the gate in mind when adding new protected entry points (no extra logic needed — the layout handles it). The `optimisticUrl` override pattern is the canonical way to do "show local preview while server catches up" in this codebase — copy it into image-upload UIs going forward.

**How to apply:** When adding a new protected page, you can assume the layout has already enforced both auth and profile completeness — no need to repeat. When building radio-card pickers, mirror the `border-brand-red + inset shadow + brand-red bullet/index` selection style for visual consistency. For any future avatar/file-upload-with-preview UI, use the `optimisticUrl ?? currentUrl` override (NOT a `useEffect` that copies prop → state).
