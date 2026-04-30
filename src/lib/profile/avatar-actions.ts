'use server'

/**
 * Avatar upload — Server Action wrapper.
 *
 * Frontend Iteration 3 / Task 3.7.
 *
 * `src/lib/profile/storage.ts::uploadAvatar` is a server-only helper that
 * works against the cookie-bound Supabase client. Wrapping it in a Server
 * Action gives Client Components a typed, FormData-friendly entry point
 * without re-exporting any server modules to the bundle.
 *
 * The action additionally:
 *   1. Authenticates the caller (defence-in-depth on top of RLS).
 *   2. Calls `uploadAvatar` with the resolved user id.
 *   3. Revalidates `/profile` and `/dashboard` so the new avatar URL
 *      propagates to any server-rendered surface (e.g. the navbar).
 */

import { revalidatePath } from 'next/cache'

import { createClient } from '@/lib/supabase/server'
import { uploadAvatar, type UploadAvatarResult } from './storage'

export async function uploadAvatarAction(
  formData: FormData,
): Promise<UploadAvatarResult> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { success: false, error: 'Bejelentkezés szükséges.' }
  }

  const file = formData.get('avatar')
  if (!(file instanceof File) || file.size === 0) {
    return { success: false, error: 'Nincs kiválasztva fájl.' }
  }

  const result = await uploadAvatar(user.id, file)

  if (result.success) {
    revalidatePath('/profile')
    revalidatePath('/dashboard')
    revalidatePath('/onboarding')
  }

  return result
}
