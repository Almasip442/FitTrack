import { cn } from '@/lib/utils'

function getInitials(name?: string | null) {
  if (!name) return 'FT'
  const parts = name.trim().split(/\s+/).slice(0, 2)
  return parts.map((p) => p.charAt(0).toUpperCase()).join('') || 'FT'
}

/**
 * Compact circular avatar shown in the navbar.
 *
 * Renders a user-supplied avatar image when `src` is present; otherwise
 * falls back to two-letter initials derived from `name`. The component
 * is presentational only — file uploads happen in `AvatarUpload`.
 */
export function UserAvatar({
  name,
  src,
  className,
}: {
  name?: string | null
  src?: string | null
  className?: string
}) {
  const initials = getInitials(name)

  return (
    <div
      role="img"
      aria-label={name ? `Profil: ${name}` : 'Profil'}
      className={cn(
        'relative inline-flex h-9 w-9 items-center justify-center overflow-hidden rounded-full',
        'bg-[#780000]/15 text-[#a0a0a0] dark:text-[#e0e0e0]',
        'border border-[#780000]/35',
        'font-condensed text-[11px] font-bold uppercase tracking-wide-display',
        'select-none',
        className,
      )}
    >
      {src ? (
        // Plain <img> rather than next/image — the URL is a Supabase
        // public URL with a cache-bust query string and may change at
        // any time; we want the browser to handle revalidation rather
        // than going through the next/image loader cache.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt=""
          className="h-full w-full object-cover"
        />
      ) : (
        initials
      )}
    </div>
  )
}
