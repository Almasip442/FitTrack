'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { cn } from '@/lib/utils'
import { Logo } from './logo'
import { ThemeToggle } from './theme-toggle'
import { UserAvatar } from './user-avatar'
import { SignOutButton } from './sign-out-button'
import { desktopRoutes } from './nav-routes'

interface NavbarProps {
  /** Display name from the user's profile (used for avatar initials). */
  userName?: string | null
  /** Optional avatar image URL — overrides the initials when present. */
  avatarUrl?: string | null
}

/**
 * Desktop top navbar + mobile mini top bar.
 *
 * - Desktop: full-width fixed bar with logo, centered nav, profile cluster.
 * - Mobile: just the logo + profile avatar (the bottom tab bar handles nav).
 *
 * The avatar links to /profile so the user can edit their info from any
 * protected surface.
 */
export function Navbar({ userName, avatarUrl }: NavbarProps = {}) {
  const pathname = usePathname()

  return (
    <header
      className={cn(
        'fixed top-0 inset-x-0 z-50',
        'h-16 backdrop-blur-md',
        'bg-white/85 dark:bg-[#111111]/85',
        'border-b border-[#e0e0e0] dark:border-[#404040]/50',
      )}
    >
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left: Logo */}
        <Logo />

        {/* Center: Desktop navigation */}
        <nav
          aria-label="Fő navigáció"
          className="hidden md:flex items-center gap-1"
        >
          {desktopRoutes.map((route) => {
            const active =
              pathname === route.href || pathname.startsWith(`${route.href}/`)
            return (
              <Link
                key={route.href}
                href={route.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'relative px-3 py-2 font-condensed text-sm font-semibold',
                  'uppercase tracking-display transition-colors',
                  active
                    ? 'text-[#780000]'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {route.label}
                <span
                  aria-hidden="true"
                  className={cn(
                    'pointer-events-none absolute left-3 right-3 -bottom-0.5 h-0.5',
                    'bg-[#780000] origin-left transition-transform duration-300',
                    active ? 'scale-x-100' : 'scale-x-0',
                  )}
                />
              </Link>
            )
          })}
        </nav>

        {/* Right: Theme toggle + avatar (links to /profile) + sign-out */}
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link
            href="/profile"
            aria-label="Profilom"
            className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            <UserAvatar name={userName} src={avatarUrl} />
          </Link>
          <SignOutButton />
        </div>
      </div>
    </header>
  )
}
