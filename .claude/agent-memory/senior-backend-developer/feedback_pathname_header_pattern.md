---
name: Pathname forwarding from middleware to server layouts
description: How to surface the current pathname to a Server Component layout via x-pathname, and which Next.js headers to NEVER trust for it
type: feedback
---

To make the active pathname readable by an App Router server layout (e.g. for an onboarding gate in `(protected)/layout.tsx`), use this pattern:

1. In the middleware (`src/lib/supabase/middleware.ts`), build a NEW `Headers` object from `request.headers`, set `x-pathname` on it, and pass it via `NextResponse.next({ request: { headers: requestHeaders } })`. Do NOT mutate `request.headers` directly with `request.headers.set(...)` — Next.js clones the request before downstream readers and the mutation is silently lost in some flows.
2. If the Supabase `setAll` cookie callback rebuilds the response, it MUST reuse the same `requestHeaders` reference (not `request.headers`), otherwise the `x-pathname` is dropped on cookie-refresh requests.
3. In the layout, read it with `headers().get('x-pathname')` as the FIRST source. Only fall back to `x-invoke-path` and `referer`. NEVER consult the `next-url` header — Next.js sets it for internal RSC payload requests and its value is not a stable user-visible pathname.

**Why:** Both bugs were observed in this project:
- `request.headers.set('x-pathname', ...)` did not reach the layout, so the onboarding gate ran against `''` and incorrectly redirected complete-profile users to `/onboarding`.
- Reading `next-url` BEFORE `x-pathname` in a `??` chain caused the layout to act on the wrong pathname during RSC navigations, producing /onboarding bounces and redirect loops.

**How to apply:** Any time we need pathname (or other URL-derived state) inside a Server Component layout/page, route it through middleware-set request headers and read it with the `x-pathname` priority above. Same pattern works for forwarding things like locale, A/B variant, or feature flags.
