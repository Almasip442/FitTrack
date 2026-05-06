/**
 * Order success page — F9.8
 *
 * Shown after a successful Stripe Checkout.
 * Receives `session_id` from query params (Stripe appends it).
 *
 * Framer Motion confetti: a few floating/falling divs with randomised
 * trajectories — no external confetti package needed.
 * clearCart() is called via a client component wrapper.
 */

import Link from 'next/link'
import { CheckCircle, ShoppingBag } from 'lucide-react'

import { SuccessClient } from '@/components/shop/success-client'
import { cn } from '@/lib/utils'

interface SuccessPageProps {
  searchParams: Promise<{ session_id?: string }>
}

export const metadata = {
  title: 'Sikeres rendelés — FitTrack Pro',
}

export default async function OrderSuccessPage({ searchParams }: SuccessPageProps) {
  const { session_id } = await searchParams

  return (
    <div className="relative flex min-h-[60vh] flex-col items-center justify-center gap-8 py-16 text-center overflow-hidden">
      {/* Confetti + clearCart client wrapper */}
      <SuccessClient />

      {/* Success icon */}
      <div
        className={cn(
          'relative z-10 flex flex-col items-center gap-6',
        )}
      >
        <div
          className={cn(
            'rounded-full border-2 border-emerald-500/30 bg-emerald-500/10 p-6',
          )}
        >
          <CheckCircle
            className="size-16 text-emerald-500"
            strokeWidth={1.5}
          />
        </div>

        <div className="space-y-3">
          <h1 className="font-condensed text-4xl font-extrabold uppercase tracking-display text-foreground sm:text-5xl">
            <span className="text-brand-red">Sikeres</span> Rendelés!
          </h1>
          <p className="text-lg text-muted-foreground">
            Köszönjük a vásárlást! Rendelésed feldolgozás alatt áll.
          </p>
          {session_id && (
            <p className="font-condensed text-xs uppercase tracking-wide-display text-muted-foreground/60">
              Megrendelés azonosító: {session_id.slice(0, 16).toUpperCase()}
            </p>
          )}
        </div>

        <Link
          href="/shop"
          className={cn(
            'inline-flex items-center gap-2 rounded-xl px-6 py-3',
            'border border-[rgba(120,0,0,0.35)] bg-[rgba(120,0,0,0.1)]',
            'font-condensed text-sm font-semibold uppercase tracking-display text-brand-red',
            'transition-all duration-200 hover:bg-[rgba(120,0,0,0.2)]',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
          )}
        >
          <ShoppingBag className="size-4" strokeWidth={1.5} />
          Vissza a shopba
        </Link>
      </div>
    </div>
  )
}
