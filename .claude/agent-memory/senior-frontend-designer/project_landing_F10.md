---
name: F10 landing page
description: Architecture and patterns for the F10 landing page (src/app/page.tsx + src/components/landing/)
type: project
---

Landing page is at `src/app/page.tsx` (root `/` route, fully public). The middleware's `PROTECTED_PREFIXES` does not include `/`, so no auth guard changes were needed.

**Dark-mode forcing:** The landing page always renders dark. Since the root `layout.tsx` uses next-themes with `defaultTheme="dark"`, wrapping the entire page in `<div className="dark">` scopes all design-system dark CSS variables into the page tree without mutating the user's stored theme.

**Components at `src/components/landing/`:**
- `landing-navbar.tsx` — `'use client'`, scroll-aware (transparent → `bg-[#111111]/90 backdrop-blur-md`), threshold at 50px, ghost + brand-red CTA links
- `hero-section.tsx` — staggered Framer Motion word-by-word reveal + animated background blobs with parallax (`useScroll` + `useTransform`), pulsing `ChevronDown` scroll indicator
- `features-section.tsx` — 4 alternating text/mock-UI rows, `whileInView` slide-in, CSS-only mock panels (WorkoutMockPanel, CalorieMockPanel, AiMockPanel, ShopMockPanel)
- `stats-section.tsx` — count-up animation using `useInView` + `animate(motionValue, target)` pattern
- `differentiators-section.tsx` — 3 icon cards with stagger whileInView
- `cta-section.tsx` — gradient section with animated glow blob
- `landing-footer.tsx` — server component, minimal, license links (wger CC-BY-SA 3.0, Open Food Facts ODbL)

**Framer Motion v12 type quirk:** Custom bezier arrays in `Variants` objects must be typed as `[number, number, number, number]`. String ease values like `'easeOut'` need `as const`. Declare `const MY_EASE = [...] as [number, number, number, number]` and reference it. Without this, `tsc --noEmit` fails on the `ease` property.

**Button-as-link pattern (confirmed):** `<Link href="..." className={cn('inline-flex items-center justify-center rounded-lg ...')}>` — no `buttonVariants` needed for landing since we use raw Tailwind classes there.

**Pre-existing build error:** The Turbopack build fails due to a Supabase `server.ts` import in `src/app/(auth)/register/page.tsx` — this existed before F10 and is unrelated.

**Why:** Landing page is fully static, no Supabase calls, always dark. Parallax disabled via `useReducedMotion()` check.

**How to apply:** If modifying the landing, preserve the `<div className="dark">` wrapper. Keep all landing components in `src/components/landing/`. New Framer Motion variants with custom easing must use the typed bezier pattern.
