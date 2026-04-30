import { LogOut } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { signOutAction } from '@/lib/supabase/auth-actions'

type SignOutButtonProps = {
  /**
   * Visual variant of the underlying Button. Defaults to "ghost" so the
   * control blends into navigation surfaces.
   */
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'destructive'
  /** Optional class names forwarded to the Button. */
  className?: string
  /** Optional custom label. Defaults to "Kijelentkezés". */
  children?: React.ReactNode
  /** Optionally hide the icon (e.g. when used inside a small menu). */
  hideIcon?: boolean
}

/**
 * Server-rendered sign-out control.
 *
 * Renders a real <form> bound to the `signOutAction` Server Action so
 * that sign-out works without client-side JavaScript. After Supabase
 * clears the session cookie, the action redirects to /login.
 */
export function SignOutButton({
  variant = 'ghost',
  className,
  children,
  hideIcon = false,
}: SignOutButtonProps) {
  return (
    <form action={signOutAction}>
      <Button
        type="submit"
        variant={variant}
        size="sm"
        className={className}
      >
        {!hideIcon && <LogOut aria-hidden="true" />}
        {children ?? 'Kijelentkezés'}
      </Button>
    </form>
  )
}
