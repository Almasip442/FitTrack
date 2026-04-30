---
name: F1 design-system foundation — colors, fonts, layout shell
description: Where the FitTrack Pro design tokens, layout shell, and animation primitives live after F1
type: project
---

After F1 ships, the design system foundation is wired this way:

- **Brand color tokens** live in `src/app/globals.css` `@theme inline` as `--color-brand-red` (#780000), `--color-brand-red-muted` (rgba 0.1), `--color-brand-red-border` (rgba 0.35), `--color-brand-gray` (#404040), `--color-brand-dark` (#111111), `--color-brand-dark-secondary` (#1a1a1a), `--color-brand-text` (#e0e0e0), `--color-brand-text-muted` (#a0a0a0). Use Tailwind utilities: `bg-brand-red`, `text-brand-red`, `border-brand-red-border`. The shadcn semantic `--primary` is also mapped to #780000 via oklch in both light and dark `:root` blocks.

- **Fonts** are wired through `next/font/google`: Barlow (body, `--font-barlow`) and Barlow Condensed (display/headings, `--font-barlow-condensed`). Tailwind `font-sans` resolves to Barlow; `font-condensed` resolves to Barlow Condensed. Heading elements (`h1`–`h6`) globally inherit Barlow Condensed + `tracking-display` via the base layer in globals.css. Custom letter-spacing utilities: `tracking-display` (0.05em) and `tracking-wide-display` (0.07em).

- **Layout shell** lives in `src/components/layout/`:
  - `navbar.tsx` — desktop top bar, fixed, `h-16`, `z-50`, blur backdrop, with active-route underline animation.
  - `mobile-tab-bar.tsx` — fixed bottom tab bar (5 tabs), `md:hidden`, with `pb-safe` for iOS safe area. Active tab gets a small dot above the icon.
  - `nav-routes.ts` — single source of truth for desktopRoutes (5) and mobileTabs (5, with Shop before Fejlődés per backlog spec).
  - `logo.tsx`, `theme-toggle.tsx`, `user-avatar.tsx`, `sign-out-button.tsx`, `page-transition.tsx`.
  - `src/app/(protected)/layout.tsx` composes navbar + main (`max-w-7xl px-4 sm:px-6 lg:px-8 pt-20 pb-24 md:pb-12`) + mobile tab bar.

- **Animation primitives** in `src/lib/animations.ts`: `fadeIn`, `slideUp`, `slideUpSm`, `staggerChildren`, `pageTransition`, `scaleIn`. All use a custom ease curve `[0.22, 1, 0.36, 1]` (smooth easeOut) and short durations (0.3–0.4s). `prefers-reduced-motion` is enforced globally via a CSS media query in `globals.css` — don't re-implement that inside components.

- **Theme provider** at `src/components/providers/theme-provider.tsx` wraps `next-themes` with `attribute="class"`, `defaultTheme="dark"`, `enableSystem`, `disableTransitionOnChange`. Registered in root `src/app/layout.tsx` along with the Sonner `Toaster`.

**Why:** Future iterations need to know where to extend tokens, where layout chrome lives, and to NOT create a duplicate animation library or theme wrapper.

**How to apply:** When building feature pages, import animation variants from `@/lib/animations`, use `font-condensed`/`tracking-display` for headings, use brand color utilities (`text-brand-red`, etc.) or the semantic `--primary`. Active-state convention is brand red foreground + brand red underline/dot. Sign-out button is currently a visual placeholder — wiring lands in F2.
