---
name: F11 polish, accessibility, and image config
description: Where the polish-pass artifacts (skip link, focus ring, error/loading boundaries, next/image config) live after F11
type: project
---

After F11 ships, the polish layer is wired this way:

- **Skip-to-content link** lives directly in `src/app/(protected)/layout.tsx` as `<a href="#main-content" className="skip-to-content">`. The `<main>` element has `id="main-content"` and `tabIndex={-1}`. Styles are in `src/app/globals.css` under the `.skip-to-content` rule (translates off-screen until focus). Do not duplicate the skip link inside individual pages.

- **Brand-red focus ring** is enforced globally via a `@layer base { :where(button, a, input, select, textarea, [tabindex]):focus-visible { outline: 2px solid #780000; outline-offset: 2px; } }` rule in `globals.css`. Components that already define their own focus-visible classes (Button, ProductCard, etc.) override this through Tailwind's higher-specificity utilities. The `:where()` wrapper keeps the base rule at zero specificity so any explicit `focus-visible:*` utility wins automatically — do NOT remove the `:where()`.

- **Protected segment error boundary** at `src/app/(protected)/error.tsx`. Renders inside the protected shell so navbar + tab bar stay mounted. Use it for any segment-level errors; the global `src/app/error.tsx` is reserved for layout-level failures.

- **Loading skeletons** for every protected route now exist:
  - `dashboard/loading.tsx` (pre-existing)
  - `progress/loading.tsx` (pre-existing)
  - `shop/loading.tsx` (pre-existing)
  - `workouts/loading.tsx` (added F11)
  - `calories/loading.tsx` (added F11)
  - `exercises/loading.tsx` (added F11)
  - `(protected)/loading.tsx` is the generic fallback for everything else.

- **next/image is the only image primitive.** All `<img>` usages have been removed. `next.config.ts` declares `images.remotePatterns` for `*.supabase.co/storage/v1/**`, `*.supabase.in/storage/v1/**`, `images.unsplash.com`, `cdn.jsdelivr.net`, `placehold.co`. When introducing a new image source, append a `remotePatterns` entry rather than falling back to `<img>`.

- **Light-mode safety convention:** any hardcoded dark hex (`bg-[#1a1a1a]`, `bg-[#111111]`, etc.) MUST be `dark:` prefixed and paired with a semantic light-mode token (`bg-card`, `bg-background`). The exception is the landing page (`src/app/page.tsx`), which is intentionally dark-only — its child sections may use unprefixed dark hex values. In every protected/auth surface, always pair them.

- **Sonner Toaster** at `src/components/ui/sonner.tsx` is wired to `next-themes` (`useTheme()`) so toast variants automatically follow the active theme. It is registered once in the root `src/app/layout.tsx`. Use `toast.success()` / `toast.error()` from `sonner` directly — no extra wrapper needed.

**Why:** F11 is the last polish iteration. Future feature work should slot into these primitives without re-implementing them (no per-page skip links, no per-page error boundaries, no `<img>` shortcuts).

**How to apply:** When adding a new protected route, drop a `loading.tsx` next to `page.tsx` matching the page's actual layout (skeleton blocks should mirror real heights to prevent layout shift). When adding an external image source, edit `next.config.ts` `images.remotePatterns`. When pairing hardcoded dark hex with semantic tokens, follow the `bg-card dark:bg-[#1a1a1a]` ordering.
