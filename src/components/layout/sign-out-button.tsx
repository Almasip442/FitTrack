import { LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'
import { signOutAction } from '@/lib/supabase/auth-actions'

/**
 * Navbar sign-out trigger.
 *
 * Renders a real <form> bound to the `signOutAction` Server Action so that
 * sign-out works without client-side JavaScript. After Supabase clears the
 * session cookie, the action redirects to /login.
 *
 * Visually preserves the F1 layout shell ghost-red look (compact, h-9,
 * uppercase Barlow Condensed) — distinct from the more generic Button-based
 * variant in `src/components/auth/sign-out-button.tsx`.
 */
export function SignOutButton({ className }: { className?: string }) {
  return (
    <form action={signOutAction}>
      <button
        type="submit"
        aria-label="Kijelentkezés"
        className={cn(
          'group inline-flex items-center gap-2 rounded-md px-2.5 h-9',
          'border border-[#780000]/35 bg-[#780000]/10 text-[#780000]',
          'dark:text-[#e0e0e0]',
          'font-condensed text-xs font-semibold uppercase tracking-wide-display',
          'transition-colors hover:bg-[#780000]/20 hover:border-[#780000]/55',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
          'cursor-pointer',
          className,
        )}
      >
        <LogOut className="h-4 w-4" aria-hidden="true" />
        <span className="hidden sm:inline">Kilépés</span>
      </button>
    </form>
  )
}
