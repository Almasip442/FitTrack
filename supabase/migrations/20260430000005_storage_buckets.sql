-- =====================================================================
-- FitTrack Pro — Storage Buckets
-- Migration: 20260430000005_storage_buckets.sql
-- Iteration: Backend I5 — Felhasználói Profil CRUD (task 5.4)
--
-- Creates the `avatars` storage bucket and the RLS policies that
-- govern access to objects in it.
--
-- Bucket model:
--   * `avatars` is PUBLIC for read so <img src="..."> works without a
--     signed URL — the contents are non-sensitive profile pictures.
--   * Writes (INSERT / UPDATE / DELETE) are restricted to authenticated
--     users, AND each user may only touch objects under their OWN
--     `{auth.uid()}/...` path prefix. This matches the path convention
--     used by `src/lib/profile/storage.ts::uploadAvatar`
--     (`{userId}/avatar.{ext}`).
--
-- Note: bucket creation uses ON CONFLICT DO NOTHING so the migration
-- is idempotent against existing local/staging databases that already
-- created the bucket via the Supabase Studio UI.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 5.4a — Create the bucket
-- ---------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;


-- ---------------------------------------------------------------------
-- 5.4b — Storage object policies for `avatars`
--
-- `storage.foldername(name)` returns the path segments as a text[].
-- The first segment must equal the caller's auth.uid() so the user can
-- only write into their own folder.
-- ---------------------------------------------------------------------

-- Public read: anyone (including anon) can fetch avatar images.
CREATE POLICY "Avatars are publicly readable"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

-- Authenticated upload: only into the user's own folder.
CREATE POLICY "Users can upload own avatar"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Authenticated overwrite (upsert): only on objects in the user's folder.
CREATE POLICY "Users can update own avatar"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Authenticated delete: only objects in the user's folder.
CREATE POLICY "Users can delete own avatar"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
