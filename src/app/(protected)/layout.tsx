import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

import { MobileTabBar } from '@/components/layout/mobile-tab-bar'
import { Navbar } from '@/components/layout/navbar'
import { isProfileComplete } from '@/lib/profile/guards'
import { getProfile } from '@/lib/profile/queries'
import { createClient } from '@/lib/supabase/server'

/**
 * Resolve the current pathname from the request headers.
 *
 * Next.js does not surface the active pathname directly to a server
 * layout. We rely on the `x-pathname` header that our own middleware
 * (`src/lib/supabase/middleware.ts`) writes onto every incoming request
 * — this is the only fully trustworthy source of the user-visible
 * pathname inside a Server Component.
 *
 * Fallbacks (`x-invoke-path`, `referer`) are kept defensively for the
 * edge case where the middleware did not run (e.g. assets matched by
 * the matcher exclusion). When nothing matches we return '' which
 * causes the onboarding-gate to assume "not on /onboarding" and act
 * conservatively.
 *
 * NOTE: `next-url` is intentionally NOT consulted. Next.js sets it
 * internally for RSC payload requests and its value is not a stable
 * user-visible pathname; reading it caused incomplete profiles to
 * always be redirected to /onboarding even after the user was already
 * on that page (and complete profiles to be misclassified during RSC
 * navigations).
 */
async function getCurrentPathname(): Promise<string> {
  const h = await headers()

  // Primary source — set by our middleware on every request.
  const fromMiddleware = h.get('x-pathname')
  if (fromMiddleware) return fromMiddleware

  // Defensive fallbacks for unusual request paths.
  const invokePath = h.get('x-invoke-path')
  if (invokePath) return invokePath

  const referer = h.get('referer')
  if (referer) {
    try {
      return new URL(referer).pathname
    } catch {
      return ''
    }
  }
  return ''
}

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    // Middleware should have already caught this, but defence in depth
    // matters — never render protected chrome to an anon caller.
    redirect('/login')
  }

  const profile = await getProfile(user.id)
  const profileComplete = isProfileComplete(profile)

  // Onboarding gate — Frontend Iteration 3 / Task 3.5.
  //   - If the profile is missing or incomplete, force the user onto
  //     /onboarding before they can reach any other protected surface.
  //   - When already on /onboarding we let the page render — its own
  //     server logic redirects users away once the profile is complete.
  const pathname = await getCurrentPathname()
  const onOnboardingPath =
    pathname === '/onboarding' || pathname.startsWith('/onboarding/')

  if (!profileComplete && !onOnboardingPath) {
    redirect('/onboarding')
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Skip-to-content — keyboard users only (a11y) */}
      <a href="#main-content" className="skip-to-content">
        Ugrás a tartalomra
      </a>
      <Navbar
        userName={profile?.name ?? null}
        avatarUrl={profile?.avatar_url ?? null}
      />
      <main
        id="main-content"
        tabIndex={-1}
        className={
          'mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 ' +
          'pt-20 pb-24 md:pb-12 outline-none'
        }
      >
        {children}
      </main>
      <MobileTabBar />
    </div>
  )
}
