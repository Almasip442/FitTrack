import { redirect } from 'next/navigation'

import { AvatarUpload } from '@/components/profile/avatar-upload'
import { ProfileForm } from '@/components/profile/profile-form'
import { getProfile } from '@/lib/profile/queries'
import { createClient } from '@/lib/supabase/server'

export const metadata = {
  title: 'Profilom · FitTrack Pro',
  description: 'Profilod adatainak szerkesztése.',
}

/**
 * Profile editor — Frontend Iteration 3 / Tasks 3.6, 3.7.
 *
 * Pre-fills the same `<ProfileForm>` used by onboarding with the existing
 * profile row, and adds an avatar upload section above the form. Avatar
 * uploads go through the dedicated Server Action (revalidates relevant
 * paths so the navbar picks up the new URL).
 */
export default async function ProfilePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?redirectTo=/profile')
  }

  const profile = await getProfile(user.id)

  return (
    <div className="mx-auto max-w-3xl">
      {/* Header ------------------------------------------------------ */}
      <header className="mb-8 space-y-3 sm:mb-10">
        <p className="font-condensed text-[11px] uppercase tracking-wide-display text-brand-red">
          {'// User · Beállítások'}
        </p>
        <h1 className="font-condensed text-4xl font-extrabold uppercase tracking-display text-foreground sm:text-5xl">
          Profilom
        </h1>
        <p className="max-w-prose text-sm text-muted-foreground">
          Frissítsd az adataidat. A változások azonnal hatnak a napi
          kalóriacélra és az edzésajánlásokra.
        </p>
        <div className="h-px w-12 bg-brand-red" />
      </header>

      {/* Avatar upload ------------------------------------------------ */}
      <section className="mb-10 rounded-xl border border-border bg-card p-5 sm:p-6">
        <AvatarUpload
          currentUrl={profile?.avatar_url ?? null}
          name={profile?.name ?? null}
        />
      </section>

      {/* Form -------------------------------------------------------- */}
      <ProfileForm
        initial={profile}
        redirectTo="/profile"
        submitLabel="Változtatások mentése"
        successMessage="Profil frissítve!"
      />
    </div>
  )
}
