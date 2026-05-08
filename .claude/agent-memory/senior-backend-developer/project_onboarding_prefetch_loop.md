---
name: Onboarding gate + Link prefetch interaction
description: Why protected-layout Link components must skip prefetch on /onboarding to avoid an infinite RSC refetch loop
type: project
---

The protected layout's onboarding-gate redirects to /onboarding whenever `isProfileComplete(profile)` is false. This interacts badly with Next.js Link auto-prefetching: every visible `<Link>` to a protected route (`/dashboard`, `/workouts`, `/calories`, `/progress`, `/shop`) triggers an RSC prefetch, the gate redirects each prefetch back to /onboarding, and the rendered /onboarding RSC payload re-references the same five links — producing an infinite loop of ~280ms /onboarding 200 requests (App Router redirects in RSC payloads encode as 200, not 302, which is why every request shows 200 in the dev log).

**Why:** discovered when `/onboarding` was hit ~280ms continuously after the user landed there with an incomplete profile; navbar + mobile-tab-bar each render five `<Link>` components for protected sections that the layout always redirects to /onboarding while the profile is incomplete.

**How to apply:** EVERY `<Link>` rendered inside the protected layout that points to a profile-gated route must pass `prefetch={onOnboarding ? false : undefined}` where `onOnboarding` is derived from `usePathname()`. The known offenders are: navbar nav-routes (5 links to `/dashboard,/workouts,/calories,/progress,/shop`), mobile-tab-bar tabs (same 5 links), the navbar Logo (`/dashboard`), and the navbar avatar wrapper Link (`/profile`). When patching only some of them, the loop persists because any one un-patched cross-section Link is enough to keep re-prefetching. If a future surface inside the protected layout adds a new `<Link>` to one of these sections (or to anything else gated by profile completeness), it must follow the same pattern, OR the onboarding-gate must be moved out of the layout into per-route guards so prefetches no longer redirect. Note: `Logo` is server-rendered by default — when adding the prefetch gate it must be promoted to a client component (`'use client'`) so it can call `usePathname()`.
