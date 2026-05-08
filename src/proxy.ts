import type { NextRequest } from 'next/server'

import { updateSession } from '@/lib/supabase/middleware'

/**
 * Next.js 16 renamed the `middleware` file convention to `proxy`.
 * The runtime expects `src/proxy.ts` exporting a `proxy` function;
 * the legacy `middleware.ts` location is deprecated and emits a warning.
 *
 * The implementation is unchanged — we still delegate to `updateSession`
 * (which lives under `lib/supabase/middleware.ts` for historical reasons
 * and because it is reused outside the proxy entry point).
 */
export async function proxy(request: NextRequest) {
  return updateSession(request)
}

/**
 * Run the proxy on every request EXCEPT:
 *   - Next.js internals (_next/static, _next/image)
 *   - Image / static asset extensions
 *   - Favicon
 *
 * API routes are intentionally included so that their session cookies
 * are also refreshed.
 */
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}
