'use client'

import { LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Visual-only sign-out trigger for F1 layout shell.
 * The actual auth wiring lands in a later iteration (F2 — Auth flow).
 */
export function SignOutButton({ className }: { className?: string }) {
  return (
    <button
      type="button"
      aria-label="Kijelentkezés"
      onClick={() => {
        // Wiring deferred to auth iteration (F2).
        // For now this is a visually-correct placeholder.
      }}
      className={cn(
        'group inline-flex items-center gap-2 rounded-md px-2.5 h-9',
        'border border-[#780000]/35 bg-[#780000]/10 text-[#780000]',
        'dark:text-[#e0e0e0]',
        'font-condensed text-xs font-semibold uppercase tracking-wide-display',
        'transition-colors hover:bg-[#780000]/20 hover:border-[#780000]/55',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
        className,
      )}
    >
      <LogOut className="h-4 w-4" aria-hidden="true" />
      <span className="hidden sm:inline">Kilépés</span>
    </button>
  )
}
