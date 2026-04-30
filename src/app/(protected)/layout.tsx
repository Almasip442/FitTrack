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
 * layout; the standard workaround is to read the `x-pathname` /
 * `x-invoke-path` header that Next sets on the inbound request.
 * We fall back to `x-url` / `referer` and finally `''` so the guard
 * defaults to "treat as protected" when the pathname is unknown.
 */
async function getCurrentPathname(): Promise<string> {
  const h = await headers()
  const direct =
    h.get('x-invoke-path') ??
    h.get('x-pathname') ??
    h.get('next-url') ??
    null
  if (direct) return direct

  const url = h.get('x-url') ?? h.get('referer')
  if (url) {
    try {
      return new URL(url).pathname
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
      <Navbar
        userName={profile?.name ?? null}
        avatarUrl={profile?.avatar_url ?? null}
      />
      <main
        className={
          'mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 ' +
          'pt-20 pb-24 md:pb-12'
        }
      >
        {children}
      </main>
      <MobileTabBar />
    </div>
  )
}
