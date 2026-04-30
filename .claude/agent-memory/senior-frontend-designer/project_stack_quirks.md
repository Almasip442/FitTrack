---
name: FitTrack Pro stack quirks (Tailwind v4, base-ui Button, lucide-react v1)
description: Non-obvious stack choices in this repo that diverge from typical Next.js + shadcn/ui projects
type: project
---

The FitTrack Pro repo has three setup choices that surprise compared to a vanilla Next.js + shadcn/ui project. Knowing them prevents wasted effort:

1. **Tailwind v4, CSS-first config.** There is NO `tailwind.config.ts`. All theme tokens (colors, fonts, tracking, radius) live in `src/app/globals.css` inside an `@theme inline { ... }` block. To add a brand color you add a `--color-foo: #hex` CSS custom property there — Tailwind v4 auto-generates `bg-foo`, `text-foo`, `border-foo` utilities from it. PostCSS uses `@tailwindcss/postcss` (no `tailwindcss` plugin in postcss.config).

2. **shadcn/ui new-york style, but the Button is built on `@base-ui/react/button`, not Radix `Slot`.** Look at `src/components/ui/button.tsx` before assuming `asChild` works — it doesn't here. To make a button into a Link, either render `<Link>` with the `buttonVariants()` className, or wrap in a styled native `<button>`/`<a>`. The Button DOES accept native `onClick`/`type` props because base-ui's Button renders a real `<button>`.

3. **`lucide-react` is on v1.x (not the more familiar v0.4xx).** Same package, same icon API — just renumbered. Don't try to "downgrade" it.

**Why:** Avoid creating a `tailwind.config.ts` that gets ignored, avoid using `<Button asChild>` patterns that silently break, avoid bumping lucide-react thinking it's stale.

**How to apply:** When extending the design system, edit `src/app/globals.css` `@theme` block — never create a Tailwind config file. When making a Button-as-Link, render `<Link className={cn(buttonVariants({...}))}>` rather than `<Button asChild>`.
