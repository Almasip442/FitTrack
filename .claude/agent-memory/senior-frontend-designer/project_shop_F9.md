---
name: F9 webshop — cart store, product grid, checkout flow
description: Where the FitTrack Pro webshop UI lives after F9 (Zustand cart, product grid, cart drawer, Stripe checkout, order history)
type: project
---

After F9 ships, the webshop is composed this way:

- **Zustand cart store** at `src/store/cart.ts`. Uses `zustand/middleware` `persist` with key `fittrack-cart` (localStorage). Exposes `addItem`, `removeItem`, `updateQuantity`, `clearCart`, `totalPrice()`, `totalItems()`. Must only be imported in `'use client'` components. `CartItem = { product: Product; quantity: number }`.

- **Product images use plain `<img>`** (not `next/image`) — same pattern as F3 avatar upload and F5 exercise cards. Supabase URL identity changes on re-upload; next/image caching misbehaves. Always add `// eslint-disable-next-line @next/next/no-img-element` comment.

- **`Product` type** (from `@/types/database`) uses `stock: number` (NOT `stock_quantity`). Category values: `'protein' | 'kreatin' | 'vitamin' | 'aminosav' | 'egyéb' | null`.

- **Shop page** at `src/app/(protected)/shop/page.tsx` — Server Component. Parallel fetches `getProducts()` + `getUserOrders()` via `Promise.all`. Passes products to `ShopClient` and orders to `OrderHistory`.

- **`ShopClient`** at `src/components/shop/shop-client.tsx` — client-side filter + sort (no additional API calls). Category chips + sort buttons pattern matches F5 chip filter style.

- **`ProductGrid`** at `src/components/shop/product-grid.tsx` — 1/2/3 col grid (mobile/tablet/desktop). Renders `ProductCard` per product. Empty state: ShoppingBag icon + "Hamarosan érkeznek termékeink!".

- **`ProductCard`** at `src/components/shop/product-card.tsx` — `<article>` role="button" pattern (whole card is clickable, navigates to `/shop/[id]`). "Kosárba" button calls `addItem` and `e.stopPropagation()` to prevent navigation. Hover: `scale-[1.02]` + shadow. Category badge in top-left corner of image.

- **Product detail page** at `src/app/(protected)/shop/[id]/page.tsx` — Server Component. Calls `getProduct(id)`, `notFound()` on null. `ProductAddToCart` at `src/components/shop/product-add-to-cart.tsx` is the client wrapper (stepper + add button + temporary success state via `setTimeout`).

- **`CartDrawer`** at `src/components/shop/cart-drawer.tsx` — radix Sheet (right side). Trigger button (ShoppingCart icon + red badge for item count) lives in the navbar. Checkout: `fetch('/api/checkout', POST)` → on success `window.location.href = data.url` (Stripe redirect).

- **Navbar integration**: `src/components/layout/navbar.tsx` imports and renders `<CartDrawer />` as the first element in the right cluster (before ThemeToggle).

- **Success page** at `src/app/(protected)/shop/success/page.tsx` — receives `session_id` from searchParams. `SuccessClient` at `src/components/shop/success-client.tsx` calls `clearCart()` on mount and renders Framer Motion confetti (10 pieces with randomised y-trajectories, brand-red + grey color scheme, no external confetti package).

- **Cancel page** at `src/app/(protected)/shop/cancel/page.tsx` — XCircle icon + "A rendelés megszakadt" + "Próbáld újra" → `/shop`.

- **`OrderHistory`** at `src/components/shop/order-history.tsx` — renders order list with date, status badge, total. Status labels: pending=Függőben, paid=Fizetve, cancelled=Törölve. Empty state: "Még nincs rendelésed".

- **Pre-existing build error** in `src/lib/supabase/server.ts` being imported by auth pages — unrelated to F9, existed before this iteration.

**Why:** The cart store must persist across navigation but NOT across logins — clearCart() on success page handles the post-order flush. The `stopPropagation` pattern on "Kosárba" within a navigating card is the correct way to handle nested interactive elements.

**How to apply:** For any future "add item" CTA inside a navigating card, use the article+role=button+stopPropagation pattern. For any client-only store access, always check that the importing component has `'use client'`.
