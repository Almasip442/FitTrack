---
name: F2 auth pages — split-screen layout, validation pattern, shared building blocks
description: Where the FitTrack Pro auth UI primitives live after F2 (login, register, decoration, password strength, error mapping)
type: project
---

After F2 ships, the auth surface is composed this way:

- **`src/app/(auth)/layout.tsx`** — server component shell, `grid grid-cols-1 lg:grid-cols-2`. Left = form column (`bg-background`, dark-mode-only soft red radial top-glow). Right = `<AuthDecoration />`, `hidden lg:block`. Page metadata (`title`, `description`) is set here.

- **`src/components/auth/auth-decoration.tsx`** — Client Component, Framer Motion. Always renders on the brand `#111111` backdrop regardless of theme (intentional brand consistency). Layered as: solid base → off-center radial brand-red glow (top-right 78%/18%) → faint orthogonal grid (64×64, masked-to-bottom) → SVG fractal-noise overlay (`opacity-[0.06]`, `mix-blend-overlay`, `id="auth-noise"`) → vignette → content. Content is "mission console" styled: top-left ping-dot status tag, center-left oversized Barlow Condensed extrabold uppercase quote with brand-red second line, bottom telemetry coordinates. Uses `staggerChildren` + `slideUp` + `fadeIn` from `@/lib/animations`.

- **`src/components/auth/password-strength.tsx`** — Reusable 4-segment meter. Exports `scorePassword(pw): 0..4` (length + character-class heuristic) and `<PasswordStrength password showLabel? />`. Segment colors: red-500 / amber-500 / lime-500 / emerald-500. Has `role="meter"` ARIA. Hungarian labels: "Gyenge / Közepes / Erős / Nagyon erős".

- **`src/lib/auth-errors.ts`** — `mapAuthError(AuthError): string` — maps Supabase `code`/message to friendly Hungarian copy (`invalid_credentials`, `email_not_confirmed`, `user_already_exists`, `weak_password`, `over_request_rate_limit`, network heuristics, generic fallback).

- **`src/app/(auth)/forgot-password/page.tsx`** — client component, single email field. Calls `supabase.auth.resetPasswordForEmail(email, { redirectTo: ${origin}/reset-password })` via the browser client (`@/lib/supabase/client`). On success sets an emerald success notice ("Jelszó visszaállítási linket küldtünk az email címedre.") and locks the input + button (`isSent` flag) — Supabase returns no error even for non-existent emails, so we always show success to avoid email enumeration. Heading prefix: `// 03 / Jelszó visszaállítása`. Footer link: "Vissza a bejelentkezéshez" with ArrowLeft icon. The login page links here via a `text-xs uppercase tracking-wide-display text-muted-foreground hover:text-brand-red` "Elfelejtett jelszó?" between the submit button and the register footer link.

- **Two SignOutButton components — intentional, do not consolidate:**
  - `src/components/layout/sign-out-button.tsx` — used by `Navbar`. Custom ghost-red button (compact `h-9`, brand-red border/bg, Barlow Condensed uppercase, hides "Kilépés" label below `sm:`). Wraps a `<form action={signOutAction}>`.
  - `src/components/auth/sign-out-button.tsx` — generic, shadcn Button-based variant (variant/size/className props, optional children + hideIcon). For use inside menus, settings pages, profile dropdowns. Also wraps `<form action={signOutAction}>`.
  - Both bind to `signOutAction` from `src/lib/supabase/auth-actions.ts`. The action calls `supabase.auth.signOut()` then `redirect('/login')`. **Why two:** the navbar one is a tightly-tuned visual primitive matching the F1 layout shell aesthetic; the auth one is a flexible button. They are not duplicates — they are different design surfaces.

- **`src/app/(auth)/login/page.tsx`** + **`src/app/(auth)/register/page.tsx`** — both client components. Form-state pattern: `email`/`password`(`/confirm`) state + `touched: { ...: boolean }` state. `errors` is a `useMemo` derived object (validation runs every render). A field error renders ONLY if `touched[field] && errors[field]`. Submit forces `setTouched({ all: true })`. Submit button is disabled when `isPending || !isValid`. Server errors go through `mapAuthError`. Register handles "no session returned" (email confirm required) by showing an emerald success notice instead of navigating.

- **Visual conventions established here that future pages should reuse:**
  - Field labels: `font-condensed text-[11px] uppercase tracking-wide-display text-muted-foreground`, with a right-aligned `[ required ]` / `[ min 6 ]` / `[ match ]` meta tag in `text-muted-foreground/50` — gives the "console" feel.
  - Section heading pattern: tiny brand-red prefix `{'// 01 / Bejelentkezés'}` (must be JSX-string-wrapped, NOT raw `// ...`, otherwise `react/jsx-no-comment-textnodes` lint error), then a 4xl/5xl `font-condensed font-extrabold uppercase tracking-display` headline, then a 12px brand-red divider (`h-px w-12 bg-brand-red`).
  - Inputs use `h-11 bg-card font-sans text-base placeholder:text-muted-foreground/60` — the bumped height + `bg-card` (oklch 0.2) reads more cinematic than the shadcn default.
  - Submit buttons use `font-condensed text-sm uppercase tracking-wide-display` — heading-ish CTA voice.

**Why:** Future iterations (e.g. F3 onboarding, F11 password-reset, F-future MFA) will reuse the form patterns, the error mapper, the strength meter, and likely the decoration panel as a marketing/empty-state asset. Recording the conventions prevents drift.

**How to apply:** When building any auth-adjacent or "focused single-task" page (onboarding, settings, billing), reuse `font-condensed` + uppercase labels with bracketed meta-tags, the brand-red divider rhythm, and the validate-on-touch + memoised-errors pattern. For ANY new Supabase Auth call, route the error through `mapAuthError` rather than rendering `error.message` directly. The decoration component can be reused (or duplicated as a sibling) for marketing/empty surfaces — it is theme-independent.
