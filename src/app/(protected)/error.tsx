'use client'

/**
 * Protected segment error boundary — F11.4.
 *
 * Renders inside the protected shell (navbar + tab bar stay mounted) so the
 * user can recover or navigate away without bouncing to the global error
 * page. Logs the error to the browser console for development visibility.
 */

import { useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, RefreshCcw, TriangleAlert } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ProtectedErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function ProtectedError({ error, reset }: ProtectedErrorProps) {
  useEffect(() => {
    console.error('[protected segment error]', error)
  }, [error])

  return (
    <section
      role="alert"
      aria-live="assertive"
      className={cn(
        'relative mx-auto flex max-w-xl flex-col items-center text-center',
        'overflow-hidden rounded-xl border border-border bg-card/60',
        'px-6 py-14 sm:py-20',
      )}
    >
      {/* Crosshair markers */}
      <span aria-hidden="true" className="pointer-events-none absolute left-4 top-4 size-3 border-l border-t border-brand-red/70" />
      <span aria-hidden="true" className="pointer-events-none absolute right-4 top-4 size-3 border-r border-t border-brand-red/70" />
      <span aria-hidden="true" className="pointer-events-none absolute left-4 bottom-4 size-3 border-l border-b border-brand-red/70" />
      <span aria-hidden="true" className="pointer-events-none absolute right-4 bottom-4 size-3 border-r border-b border-brand-red/70" />

      <span
        className={cn(
          'flex size-14 items-center justify-center rounded-full',
          'bg-brand-red-muted text-brand-red',
          'shadow-[0_0_0_1px_rgba(120,0,0,0.35)_inset]',
        )}
      >
        <TriangleAlert className="size-6" strokeWidth={1.5} />
      </span>

      <p className="mt-6 font-condensed text-[11px] uppercase tracking-wide-display text-brand-red">
        {'// hiba'}
      </p>

      <h1 className="mt-1 font-condensed text-3xl font-extrabold uppercase tracking-display text-foreground sm:text-4xl">
        Valami nem stimmel
      </h1>

      <p className="mt-2 max-w-md font-sans text-sm text-muted-foreground">
        Váratlan hiba történt az oldal betöltése közben. Próbáld újra, vagy
        térj vissza a dashboardra.
      </p>

      {error.digest && (
        <code className="mt-3 inline-block rounded-md bg-muted/40 px-2 py-1 font-mono text-[10px] text-muted-foreground/70">
          ref: {error.digest}
        </code>
      )}

      <span aria-hidden="true" className="mt-5 block h-px w-12 bg-brand-red" />

      <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
        <Button
          onClick={reset}
          className={cn(
            'font-condensed uppercase tracking-display',
            'border-brand-red-border bg-brand-red-muted text-brand-red',
            'hover:bg-brand-red hover:text-white',
          )}
        >
          <RefreshCcw className="size-3.5" />
          Újrapróbálás
        </Button>
        <Link
          href="/dashboard"
          className={cn(
            'inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5',
            'border border-border bg-background text-sm font-medium text-foreground',
            'transition-colors hover:bg-muted',
            'font-condensed uppercase tracking-display',
          )}
        >
          <ArrowLeft className="size-3.5" />
          Vissza a dashboardra
        </Link>
      </div>
    </section>
  )
}
