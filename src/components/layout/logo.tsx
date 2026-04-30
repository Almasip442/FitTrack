import Link from 'next/link'
import { cn } from '@/lib/utils'

export function Logo({
  href = '/dashboard',
  className,
}: {
  href?: string
  className?: string
}) {
  return (
    <Link
      href={href}
      className={cn(
        'inline-flex items-baseline font-condensed font-extrabold uppercase',
        'tracking-wide-display text-xl select-none',
        'transition-opacity hover:opacity-90 focus-visible:outline-none',
        'focus-visible:ring-2 focus-visible:ring-ring/50 rounded-sm',
        className,
      )}
      aria-label="FitTrack Pro főoldal"
    >
      <span className="text-[#780000]">FITTRACK</span>
      <span className="ml-1.5 text-foreground">PRO</span>
    </Link>
  )
}
