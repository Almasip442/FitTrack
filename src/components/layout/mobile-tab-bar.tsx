'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { cn } from '@/lib/utils'
import { mobileTabs } from './nav-routes'

/**
 * Fixed bottom tab bar for mobile.
 * Hidden on `md:` and above (desktop uses the top navbar instead).
 *
 * - Honors iOS safe area via `pb-safe` (env(safe-area-inset-bottom)).
 * - Active tab gets brand-red icon/label + tiny dot indicator above the icon.
 */
export function MobileTabBar() {
  const pathname = usePathname()
  // See navbar.tsx for the full explanation. While the user is on
  // /onboarding, each protected route's RSC prefetch is server-redirected
  // back to /onboarding (the onboarding-gate in the protected layout),
  // and the rendered RSC payload re-prefetches the same five links.
  // Disabling prefetch on this surface while on /onboarding breaks the
  // loop without affecting the regular UX on every other page.
  const onOnboarding =
    pathname === '/onboarding' || pathname.startsWith('/onboarding/')

  return (
    <nav
      aria-label="Mobil navigáció"
      className={cn(
        'fixed inset-x-0 bottom-0 z-50 md:hidden',
        'backdrop-blur-md',
        'bg-white/90 dark:bg-[#111111]/90',
        'border-t border-[#e0e0e0] dark:border-[#404040]/50',
        'pb-safe',
      )}
    >
      <ul className="grid grid-cols-5">
        {mobileTabs.map((tab) => {
          const Icon = tab.icon
          const active =
            pathname === tab.href || pathname.startsWith(`${tab.href}/`)
          return (
            <li key={tab.href} className="flex">
              <Link
                href={tab.href}
                prefetch={onOnboarding ? false : undefined}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'group relative flex w-full flex-col items-center justify-center',
                  'gap-1 pt-2 pb-1.5 transition-colors',
                  active
                    ? 'text-[#780000]'
                    : 'text-[#a0a0a0] hover:text-foreground',
                )}
              >
                {/* Active dot */}
                <span
                  aria-hidden="true"
                  className={cn(
                    'absolute top-1 h-1 w-1 rounded-full bg-[#780000]',
                    'transition-opacity duration-200',
                    active ? 'opacity-100' : 'opacity-0',
                  )}
                />
                <Icon
                  className="h-[22px] w-[22px]"
                  strokeWidth={1.75}
                  aria-hidden="true"
                />
                <span className="font-sans text-[10px] font-medium leading-none">
                  {tab.label}
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
