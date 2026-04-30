import { cn } from '@/lib/utils'

function getInitials(name?: string | null) {
  if (!name) return 'FT'
  const parts = name.trim().split(/\s+/).slice(0, 2)
  return parts.map((p) => p.charAt(0).toUpperCase()).join('') || 'FT'
}

export function UserAvatar({
  name,
  className,
}: {
  name?: string | null
  className?: string
}) {
  const initials = getInitials(name)
  return (
    <div
      role="img"
      aria-label={name ? `Profil: ${name}` : 'Profil'}
      className={cn(
        'inline-flex h-9 w-9 items-center justify-center rounded-full',
        'bg-[#780000]/15 text-[#a0a0a0] dark:text-[#e0e0e0]',
        'border border-[#780000]/35',
        'font-condensed text-[11px] font-bold uppercase tracking-wide-display',
        'select-none',
        className,
      )}
    >
      {initials}
    </div>
  )
}
