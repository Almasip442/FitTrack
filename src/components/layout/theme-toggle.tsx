'use client'

import * as React from 'react'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'

import { cn } from '@/lib/utils'

/**
 * Theme toggle that avoids hydration mismatches by deferring the
 * theme-dependent icon render until after mount.
 *
 * The server (and the very first client render) cannot know the user's
 * resolved theme, so we render a neutral, fixed-size placeholder until
 * `mounted` flips to true. This guarantees identical server/client output
 * during hydration, then swaps in the real icons once we're safely past it.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const isDark = resolvedTheme === 'dark'

  if (!mounted) {
    // Neutral placeholder — same dimensions as the real button so layout
    // doesn't shift when the theme-dependent icons appear post-hydration.
    return (
      <div
        aria-hidden="true"
        className={cn(
          'relative inline-flex h-9 w-9 items-center justify-center rounded-md',
          className,
        )}
      />
    )
  }

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
          isDark
            ? '-rotate-90 scale-0 opacity-0'
            : 'rotate-0 scale-100 opacity-100',
        )}
      />
      <Moon
        aria-hidden="true"
        className={cn(
          'absolute h-5 w-5 transition-all duration-300',
          isDark
            ? 'rotate-0 scale-100 opacity-100'
            : 'rotate-90 scale-0 opacity-0',
        )}
      />
      <span className="sr-only">Téma váltás</span>
    </button>
  )
}
