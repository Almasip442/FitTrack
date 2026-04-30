import type { Metadata } from 'next'

import { AuthDecoration } from '@/components/auth/auth-decoration'

export const metadata: Metadata = {
  title: 'Belépés — FitTrack Pro',
  description:
    'Jelentkezz be vagy hozz létre fiókot a FitTrack Pro fitness alkalmazáshoz.',
}

/**
 * (auth) layout — split-screen shell shared by /login and /register.
 *
 *  - Mobile / tablet: form panel only, full-bleed, vertically centered.
 *  - Desktop (lg≥): left 50% form panel, right 50% decorative panel.
 *
 * The decorative panel is a Client Component (Framer Motion) and is
 * lazy-loaded only when the lg breakpoint is reached via `hidden lg:block`.
 */
export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="relative grid min-h-screen grid-cols-1 lg:grid-cols-2">
      {/* Form column */}
      <main className="relative flex min-h-screen items-center justify-center bg-background px-6 py-12 sm:px-10 lg:px-12">
        {/* subtle texture only in the form column — keeps light mode clean */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 hidden dark:block"
          style={{
            backgroundImage:
              'radial-gradient(80% 50% at 50% 0%, rgba(120,0,0,0.08) 0%, rgba(0,0,0,0) 60%)',
          }}
        />
        <div className="relative z-10 w-full max-w-md">{children}</div>
      </main>

      {/* Decorative column — desktop only */}
      <aside
        aria-hidden
        className="relative hidden border-l border-[#1a1a1a] lg:block"
      >
        <AuthDecoration />
      </aside>
    </div>
  )
}
