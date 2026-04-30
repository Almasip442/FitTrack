---
name: FitTrack Auth Pattern
description: Module split and middleware shape used for Supabase Auth in FitTrack Pro
type: project
---

FitTrack Pro splits Supabase Auth helpers across three sibling modules under `src/lib/supabase/`:

- `auth.ts` — plain TS module, importable from BOTH Client and Server Components. Exposes `signUp` / `signIn` / `signOut` (use the browser client, must be called from Client Component context so cookies set client-side persist) and `getSession` / `getUser` (use the server client).
- `auth-actions.ts` — `'use server'` module. Houses Server Actions that need `redirect()` (currently `signOutAction`). Kept separate so `auth.ts` is not pulled into the Server Action bundle.
- `middleware.ts` — `updateSession(request)` helper following the exact `@supabase/ssr` cookie-rebuild pattern (rebuild `NextResponse` inside `setAll`). Also owns the `PROTECTED_PREFIXES` and `AUTH_PAGES` lists.

The Next.js entry `src/middleware.ts` only delegates to `updateSession` and exports a matcher that excludes `_next/static`, `_next/image`, favicon, and image asset extensions; API routes are intentionally INCLUDED so their session cookies refresh.

Protected route prefixes are exactly: `/dashboard`, `/workouts`, `/calories`, `/progress`, `/shop`, `/profile`, `/onboarding`. Auth pages (redirected away when authenticated) are: `/login`, `/register`. Unauthenticated redirects to `/login` carry the original path in `?redirectTo=...`; the login page reads it via `useSearchParams` and replaces to that target after sign-in.

**Why:** Mixing `'use server'` directives into a module that also exports browser-bound helpers caused bundling problems, and Server Components importing the auth module need it to stay framework-neutral.

**How to apply:** When adding a new auth helper, decide first whether it needs `redirect()` / `revalidatePath()` (→ `auth-actions.ts`) or just a session/user read or sign-in/up call (→ `auth.ts`). When adding a new protected feature area, append its top-level path prefix to `PROTECTED_PREFIXES` in `src/lib/supabase/middleware.ts`.
