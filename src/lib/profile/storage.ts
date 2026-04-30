/**
 * Avatar upload — Supabase Storage helper (server-only).
 *
 * Backend Iteration 5 / Task 5.4.
 *
 * Flow:
 *   1. Validate the file (type + size).
 *   2. Upload to the public `avatars` bucket at `{userId}/avatar.{ext}`,
 *      overwriting any previous file at that path.
 *   3. Resolve the public URL.
 *   4. Persist that URL onto `profiles.avatar_url` for the same user.
 *
 * RLS on the bucket (see migration 20260430000005_storage_buckets.sql)
 * restricts each user to their own `{userId}/...` prefix, so the path
 * convention here is load-bearing — do not change it without updating
 * the storage policies.
 */

import { createClient } from '@/lib/supabase/server'

export type UploadAvatarResult =
  | { success: true; url: string }
  | { success: false; error: string }

const MAX_BYTES = 5 * 1024 * 1024 // 5 MB
const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp'])
const BUCKET = 'avatars'

function extensionFor(file: File): string {
  // Derive the extension from the MIME type rather than the filename so
  // we never trust user-supplied extensions.
  switch (file.type) {
    case 'image/jpeg':
      return 'jpg'
    case 'image/png':
      return 'png'
    case 'image/webp':
      return 'webp'
    default:
      return 'bin'
  }
}

/**
 * Upload an avatar for `userId` and persist its public URL on the
 * matching `profiles` row.
 *
 * Returns the resolved public URL on success.
 */
export async function uploadAvatar(userId: string, file: File): Promise<UploadAvatarResult> {
  if (!ALLOWED_MIME.has(file.type)) {
    return { success: false, error: 'Csak JPEG, PNG vagy WebP kép tölthető fel.' }
  }

  if (file.size > MAX_BYTES) {
    return { success: false, error: 'A fájl mérete legfeljebb 5 MB lehet.' }
  }

  const supabase = await createClient()

  const path = `${userId}/avatar.${extensionFor(file)}`

  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: '3600',
    contentType: file.type,
    upsert: true,
  })

  if (uploadError) {
    return { success: false, error: `Feltöltés sikertelen: ${uploadError.message}` }
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET).getPublicUrl(path)

  // Cache-bust so the browser picks up the new image even though the
  // path is stable across uploads.
  const bustedUrl = `${publicUrl}?v=${Date.now()}`

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ avatar_url: bustedUrl, updated_at: new Date().toISOString() })
    .eq('id', userId)

  if (updateError) {
    return { success: false, error: `Profil frissítése sikertelen: ${updateError.message}` }
  }

  return { success: true, url: bustedUrl }
}
