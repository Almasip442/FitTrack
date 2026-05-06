/**
 * Order cancel page — F9.9
 *
 * Shown when the user cancels out of Stripe Checkout.
 */

import Link from 'next/link'
import { XCircle, RotateCcw } from 'lucide-react'

import { cn } from '@/lib/utils'

export const metadata = {
  title: 'Rendelés megszakítva — FitTrack Pro',
}

export default function OrderCancelPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-8 py-16 text-center">
      {/* Cancel icon */}
      <div className="rounded-full border-2 border-destructive/30 bg-destructive/10 p-6">
        <XCircle className="size-16 text-destructive" strokeWidth={1.5} />
      </div>

      <div className="space-y-3">
        <h1 className="font-condensed text-4xl font-extrabold uppercase tracking-display text-foreground sm:text-5xl">
          A rendelés <span className="text-destructive">megszakadt</span>
        </h1>
        <p className="text-lg text-muted-foreground">
          A fizetési folyamat megszakadt. A kosarad változatlan maradt.
        </p>
      </div>

      <Link
        href="/shop"
        className={cn(
          'inline-flex items-center gap-2 rounded-xl px-6 py-3',
          'bg-brand-red text-white',
          'font-condensed text-sm font-semibold uppercase tracking-display',
          'transition-all duration-200 hover:bg-brand-red/80 active:scale-[0.99]',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
        )}
      >
        <RotateCcw className="size-4" strokeWidth={1.5} />
        Próbáld újra
      </Link>
    </div>
  )
}
