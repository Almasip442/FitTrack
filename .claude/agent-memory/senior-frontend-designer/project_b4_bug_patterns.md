---
name: B4 bugfix patterns (hydration, drag overlay, race coalescing, request id)
description: Established patterns from the B4 bugfix round — apply when similar issues come up elsewhere in the app
type: project
---

The B4 bugfix round established four patterns that should be reused before reinventing solutions for the same problem class.

**Why:** These problems are recurring (hydration mismatches when persist stores meet SSR, ghost interactivity in drag overlays, parallel triggers of the same idempotent setup, stale paginated fetches) and the project now has a chosen approach for each.

**How to apply:**
- **Zustand persist + SSR**: every store wrapped in `persist(...)` that is consumed by an SSR-rendered client component should set `skipHydration: true`. The consumer triggers `useStore.persist.rehydrate()` inside a `useEffect`, flips a `mounted` flag, and gates persist-derived UI (badges, counts) behind `mounted ? real : fallback`. Pattern lives in `src/store/cart.ts` + `src/components/shop/cart-drawer.tsx`.
- **dnd-kit DragOverlay ghosts**: wrap the rendered card in `<div className="pointer-events-none">` so internal buttons don't show hover/active states or steal clicks while dragging. Don't pass no-op handlers expecting them to be inert — the styles still react. Pattern in `src/components/workouts/workout-plan-editor.tsx`.
- **Coalescing concurrent setup calls** (e.g. `ensureDailyLog`): use a `useRef<Promise<T> | null>(null)`. If the ref holds a promise, return it; otherwise create one, store it, and clear the ref in `.finally()`. Avoids parallel idempotent upserts during fast UI interactions. Pattern in `src/components/calories/calories-client.tsx`.
- **Stale paginated-fetch cancellation**: prefer a monotonically-increasing `requestIdRef` over a boolean stale flag. The base search effect bumps the id; `loadMore` snapshots it on entry and discards the response if the id has moved on. Cleaner than juggling AbortControllers when the underlying fetch helper doesn't accept signals. Pattern in `src/components/workouts/workout-plan-editor.tsx`.
