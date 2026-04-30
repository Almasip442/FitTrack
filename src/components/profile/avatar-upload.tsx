'use client'

/**
 * Avatar upload — clickable circular preview with optimistic UI.
 *
 * Frontend Iteration 3 / Task 3.7.
 *
 * Flow:
 *   1. User clicks the round avatar → triggers a hidden <input type="file">.
 *   2. On selection: an object URL is generated and shown immediately
 *      (optimistic UI) while the Server Action wrapper uploads the file.
 *   3. On success: the canonical public URL replaces the optimistic one.
 *   4. On failure: the optimistic preview is reverted and a Sonner toast
 *      surfaces the error message.
 *
 * Validation (mime + size) is duplicated client-side for instant feedback,
 * but the server-side `uploadAvatar` remains the source of truth.
 */

import { Camera, Loader2, User } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
// (useEffect kept for the unmount-only object-URL revoke cleanup.)

import { uploadAvatarAction } from '@/lib/profile/avatar-actions'
import { cn } from '@/lib/utils'

const MAX_BYTES = 5 * 1024 * 1024
const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp'])

function getInitials(name?: string | null): string {
  if (!name) return ''
  const parts = name.trim().split(/\s+/).slice(0, 2)
  return parts.map((p) => p.charAt(0).toUpperCase()).join('')
}

interface AvatarUploadProps {
  currentUrl: string | null
  name: string | null
}

export function AvatarUpload({ currentUrl, name }: AvatarUploadProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  // `optimisticUrl` is used to OVERRIDE `currentUrl` while an upload is
  // in flight (or just succeeded but the server URL hasn't propagated yet
  // through the layout's getProfile call). When `null`, we show the
  // server-supplied prop directly — no derived-state-from-prop bug.
  const [optimisticUrl, setOptimisticUrl] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  const previewUrl = optimisticUrl ?? currentUrl

  // Revoke any local object-URL on unmount to avoid leaks.
  const objectUrlRef = useRef<string | null>(null)
  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current)
        objectUrlRef.current = null
      }
    }
  }, [])

  const initials = getInitials(name)

  function openFileDialog() {
    if (isUploading) return
    fileInputRef.current?.click()
  }

  async function handleFileChange(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0]
    // Reset the input so picking the same file twice still fires `change`.
    event.target.value = ''
    if (!file) return

    if (!ALLOWED_MIME.has(file.type)) {
      toast.error('Csak JPEG, PNG vagy WebP kép tölthető fel.')
      return
    }
    if (file.size > MAX_BYTES) {
      toast.error('A fájl mérete legfeljebb 5 MB lehet.')
      return
    }

    // Optimistic preview.
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current)
    const objectUrl = URL.createObjectURL(file)
    objectUrlRef.current = objectUrl
    setOptimisticUrl(objectUrl)
    setIsUploading(true)

    const formData = new FormData()
    formData.append('avatar', file)

    const result = await uploadAvatarAction(formData)
    setIsUploading(false)

    if (!result.success) {
      // Rollback to the server-supplied URL by clearing the override.
      setOptimisticUrl(null)
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current)
        objectUrlRef.current = null
      }
      toast.error(result.error)
      return
    }

    // Hold the canonical URL ourselves until the next server render
    // brings it through `currentUrl` — this avoids a flicker where the
    // optimistic blob is revoked before the new server URL arrives.
    setOptimisticUrl(result.url)
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current)
      objectUrlRef.current = null
    }
    toast.success('Profilkép frissítve.')
  }

  return (
    <div className="flex flex-col items-center gap-3 sm:flex-row sm:gap-5">
      <button
        type="button"
        onClick={openFileDialog}
        aria-label="Profilkép feltöltése"
        disabled={isUploading}
        className={cn(
          'group relative h-24 w-24 shrink-0 overflow-hidden rounded-full',
          'border border-brand-red/40 bg-card',
          'transition-all duration-200',
          'hover:border-brand-red hover:shadow-[0_0_0_4px_rgba(120,0,0,0.12)]',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-red/50',
          'disabled:cursor-wait disabled:opacity-80',
        )}
      >
        {previewUrl ? (
          // Use a plain <img> rather than next/image — the URL is a
          // user-uploaded Supabase public URL with a cache-bust query
          // string, and we want it to swap instantly on optimistic
          // updates without going through the next/image loader.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={previewUrl}
            alt="Profilkép"
            className="h-full w-full object-cover"
          />
        ) : initials ? (
          <span
            aria-hidden="true"
            className="flex h-full w-full items-center justify-center font-condensed text-2xl font-bold uppercase tracking-wide-display text-brand-red"
          >
            {initials}
          </span>
        ) : (
          <span className="flex h-full w-full items-center justify-center text-muted-foreground">
            <User className="h-8 w-8" strokeWidth={1.5} aria-hidden="true" />
          </span>
        )}

        {/* Camera overlay on hover */}
        <span
          aria-hidden="true"
          className={cn(
            'pointer-events-none absolute inset-0 flex items-center justify-center',
            'bg-black/55 opacity-0 transition-opacity duration-200',
            'group-hover:opacity-100 group-focus-visible:opacity-100',
            isUploading && 'opacity-0',
          )}
        >
          <Camera className="h-6 w-6 text-white" strokeWidth={1.5} />
        </span>

        {/* Loading overlay */}
        {isUploading && (
          <span
            aria-live="polite"
            className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/65"
          >
            <Loader2
              className="h-6 w-6 animate-spin text-brand-red"
              strokeWidth={1.5}
            />
          </span>
        )}
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileChange}
        className="sr-only"
        aria-hidden="true"
        tabIndex={-1}
      />

      <div className="text-center sm:text-left">
        <p className="font-condensed text-[11px] uppercase tracking-wide-display text-brand-red">
          {'// Profilkép'}
        </p>
        <p className="mt-1 font-condensed text-base uppercase tracking-wide-display text-foreground">
          Kattints a kép cseréjéhez
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          JPEG, PNG vagy WebP — legfeljebb 5 MB
        </p>
      </div>
    </div>
  )
}
