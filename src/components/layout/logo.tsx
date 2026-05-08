'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

export function Logo({
  href = '/dashboard',
  className,
}: {
  href?: string
  className?: string
}) {
  // The Logo lives inside the protected navbar, so by default it
  // auto-prefetches its target (`/dashboard`). When the user is on
  // /onboarding with an incomplete profile, that prefetch hits the
  // protected layout's onboarding-gate and is redirected back to
  // /onboarding — and the rendered RSC payload re-references this same
  // Link, producing a tight infinite loop of /onboarding requests.
  // See navbar.tsx / mobile-tab-bar.tsx for the full explanation; the
  // same mitigation applies here.
  const pathname = usePathname()
  const onOnboarding =
    pathname === '/onboarding' || pathname.startsWith('/onboarding/')

  return (
    <Link
      href={href}
      prefetch={onOnboarding ? false : undefined}
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
