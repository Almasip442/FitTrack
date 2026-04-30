import type { NextRequest } from 'next/server'

import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  return updateSession(request)
}

/**
 * Run the middleware on every request EXCEPT:
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
