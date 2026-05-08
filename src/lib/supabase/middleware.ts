import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

import type { Database } from '@/types/database'

/**
 * Routes that require an authenticated session.
 * If the current request matches any of these prefixes and the user
 * is not authenticated, the middleware redirects to /login.
 */
const PROTECTED_PREFIXES = [
  '/dashboard',
  '/workouts',
  '/calories',
  '/progress',
  '/shop',
  '/profile',
  '/onboarding',
] as const

/**
 * Auth pages — accessible only when NOT authenticated.
 * If the user is authenticated, they are redirected to /dashboard.
 */
const AUTH_PAGES = ['/login', '/register'] as const

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  )
}

function isAuthPath(pathname: string): boolean {
  return AUTH_PAGES.some(
    (page) => pathname === page || pathname.startsWith(`${page}/`),
  )
}

/**
 * `updateSession` follows the @supabase/ssr middleware pattern:
 *
 *   1. Build a mutable NextResponse around the incoming request.
 *   2. Wire request + response cookies into the Supabase server client
 *      so that any refreshed session token is written back to both.
 *   3. Call `supabase.auth.getUser()` to refresh the session.
 *   4. Apply route-level auth redirects.
 *
 * The returned `NextResponse` MUST be returned from the middleware
 * unchanged (or re-cloned with the same cookies copied across) — this is
 * how Supabase keeps cookies in sync between the browser and the server.
 */
export async function updateSession(
  request: NextRequest,
): Promise<NextResponse> {
  // Propagate the current pathname into a request header so server
  // layouts (which cannot access the URL directly) can read it via
  // `headers().get('x-pathname')`. This is the canonical workaround
  // — without it the protected layout's onboarding-gate runs against
  // an empty pathname and bounces /onboarding back to /onboarding,
  // producing a redirect loop and a blank screen.
  //
  // Implementation note: we build a NEW Headers object from the
  // request headers and set `x-pathname` on it before passing it
  // through `NextResponse.next({ request: { headers } })`. Mutating
  // `request.headers` directly is unreliable in the App Router —
  // Next.js clones the request before downstream consumers read it,
  // so the mutation is sometimes lost. Constructing a fresh Headers
  // object and routing it via the `request.headers` option is the
  // pattern Next documents for forwarding headers from middleware.
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-pathname', request.nextUrl.pathname)

  let response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          )
          // Re-build the response so refreshed cookies are written, but
          // keep the same `requestHeaders` (with `x-pathname` set) so
          // downstream layouts still receive the pathname header.
          response = NextResponse.next({
            request: {
              headers: requestHeaders,
            },
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  // Refresh the session and read the authenticated user.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Unauthenticated user attempting to reach a protected route.
  if (!user && isProtectedPath(pathname)) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(url)
  }

  // Authenticated user landing on /login or /register — send them home.
  if (user && isAuthPath(pathname)) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    url.search = ''
    return NextResponse.redirect(url)
  }

  return response
}
