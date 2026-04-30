import { redirect } from 'next/navigation'

import { ProfileForm } from '@/components/profile/profile-form'
import { isProfileComplete } from '@/lib/profile/guards'
import { getProfile } from '@/lib/profile/queries'
import { createClient } from '@/lib/supabase/server'

export const metadata = {
  title: 'Onboarding · FitTrack Pro',
  description: 'Add meg az adataidat, hogy személyre szabott kalóriacélt számoljunk.',
}

/**
 * Onboarding — Frontend Iteration 3 / Tasks 3.1–3.4.
 *
 * The protected layout already enforces an auth gate. This page additionally:
 *   - Loads the (possibly empty) profile so the form can be pre-filled
 *     when the user re-opens onboarding mid-flow.
 *   - Sends users with an already-complete profile back to /dashboard so
 *     the form is never reachable as a "duplicate edit" surface.
 */
export default async function OnboardingPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    // Defence in depth — middleware should have caught this already.
    redirect('/login?redirectTo=/onboarding')
  }

  const profile = await getProfile(user.id)

  if (isProfileComplete(profile)) {
    redirect('/dashboard')
  }

  return (
    <div className="mx-auto max-w-3xl">
      {/* Header ------------------------------------------------------ */}
      <header className="mb-8 space-y-3 sm:mb-10">
        <p className="font-condensed text-[11px] uppercase tracking-wide-display text-brand-red">
          {'// 03 / Profil beállítása'}
        </p>
        <h1 className="font-condensed text-4xl font-extrabold uppercase tracking-display text-foreground sm:text-5xl">
          Mielőtt indulnál.
        </h1>
        <p className="max-w-prose text-sm text-muted-foreground">
          Pár adatra szükségünk van, hogy kiszámoljuk a napi kalóriacélodat és
          személyre szabjuk az edzéseket. Bármikor módosíthatod a profilodban.
        </p>
        <div className="h-px w-12 bg-brand-red" />
      </header>

      <ProfileForm
        initial={profile}
        redirectTo="/dashboard"
        submitLabel="Mentés és tovább"
        successMessage="Profil mentve!"
      />
    </div>
  )
}
