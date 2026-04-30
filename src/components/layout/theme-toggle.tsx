'use client'

import * as React from 'react'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'

import { cn } from '@/lib/utils'

/**
 * Theme toggle that avoids hydration mismatches by deferring the
 * icon-swap until `next-themes` has resolved the theme on the client.
 *
 * `resolvedTheme` is `undefined` on the server / first paint and becomes
 * 'light' | 'dark' after mount — we use that as the readiness signal,
 * so no `setState`-in-effect dance is needed.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme()
  const isReady = resolvedTheme === 'dark' || resolvedTheme === 'light'
  const isDark = resolvedTheme === 'dark'

  return (
    <button
      type="button"
      aria-label="Téma váltás"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className={cn(
        'relative inline-flex h-9 w-9 items-center justify-center rounded-md',
        'text-muted-foreground transition-colors',
        'hover:text-foreground hover:bg-muted/40',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
        className,
      )}
    >
      <Sun
        aria-hidden="true"
        className={cn(
          'h-5 w-5 transition-all duration-300',
          isReady && !isDark
            ? 'rotate-0 scale-100 opacity-100'
            : '-rotate-90 scale-0 opacity-0',
        )}
      />
      <Moon
        aria-hidden="true"
        className={cn(
          'absolute h-5 w-5 transition-all duration-300',
          isReady && isDark
            ? 'rotate-0 scale-100 opacity-100'
            : 'rotate-90 scale-0 opacity-0',
        )}
      />
      <span className="sr-only">Téma váltás</span>
    </button>
  )
}
