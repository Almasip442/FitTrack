'use client'

/**
 * CartDrawer — F9.6
 *
 * ShoppingCart icon button that opens a right-side Sheet.
 * Displays cart items, quantity steppers, totals, and checkout button.
 * Handles checkout via POST /api/checkout → Stripe redirect URL.
 */

import Image from 'next/image'
import { useState } from 'react'
import { ShoppingCart, Plus, Minus, X, ShoppingBag, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetTrigger,
} from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import { useCartStore } from '@/store/cart'

function formatHuf(price: number): string {
  return new Intl.NumberFormat('hu-HU').format(price) + ' Ft'
}

export function CartDrawer() {
  const [isLoading, setIsLoading] = useState(false)
  const [open, setOpen] = useState(false)

  const items = useCartStore((s) => s.items)
  const totalItems = useCartStore((s) => s.totalItems)
  const totalPrice = useCartStore((s) => s.totalPrice)
  const removeItem = useCartStore((s) => s.removeItem)
  const updateQuantity = useCartStore((s) => s.updateQuantity)

  const itemCount = totalItems()
  const total = totalPrice()

  const handleCheckout = async () => {
    if (items.length === 0) return

    setIsLoading(true)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((item) => ({
            product_id: item.product.id,
            quantity: item.quantity,
          })),
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error ?? 'Hiba történt a fizetés előkészítésekor.')
        return
      }

      // Redirect to Stripe Checkout
      window.location.href = data.url
    } catch {
      toast.error('Hiba történt a fizetés során. Kérjük, próbáld újra.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          aria-label={`Kosár (${itemCount} tétel)`}
          className={cn(
            'relative inline-flex items-center justify-center',
            'rounded-lg p-2 transition-colors duration-200',
            'text-muted-foreground hover:text-foreground hover:bg-muted/50',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
          )}
        >
          <ShoppingCart className="size-5" strokeWidth={1.5} />
          {itemCount > 0 && (
            <span
              aria-hidden="true"
              className={cn(
                'absolute -right-0.5 -top-0.5',
                'flex size-4 items-center justify-center',
                'rounded-full bg-brand-red',
                'font-condensed text-[10px] font-bold text-white',
              )}
            >
              {itemCount > 99 ? '99+' : itemCount}
            </span>
          )}
        </button>
      </SheetTrigger>

      <SheetContent
        side="right"
        showCloseButton
        className="flex flex-col bg-card p-0 sm:max-w-md"
      >
        <SheetHeader className="border-b border-border px-6 py-4">
          <SheetTitle className="flex items-center gap-2 font-condensed text-xl font-bold uppercase tracking-display">
            <ShoppingCart className="size-5 text-brand-red" strokeWidth={1.5} />
            Kosár
            {itemCount > 0 && (
              <span className="ml-auto font-condensed text-sm font-normal text-muted-foreground">
                {itemCount} tétel
              </span>
            )}
          </SheetTitle>
        </SheetHeader>

        {/* Cart items */}
        <div className="flex-1 overflow-y-auto">
          {items.length === 0 ? (
            /* Empty state */
            <div className="flex flex-col items-center justify-center gap-4 py-16 text-center px-6">
              <div className="rounded-full border border-border bg-background p-5">
                <ShoppingCart
                  className="size-10 text-muted-foreground/40"
                  strokeWidth={1.5}
                />
              </div>
              <div className="space-y-1">
                <p className="font-condensed text-lg font-bold uppercase tracking-display text-foreground">
                  A kosarad üres
                </p>
                <p className="text-sm text-muted-foreground">
                  Fedezd fel termékeinket és adj valamit a kosaradba!
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className={cn(
                  'mt-2 inline-flex items-center gap-1.5 rounded-lg px-4 py-2',
                  'border border-[rgba(120,0,0,0.35)] bg-[rgba(120,0,0,0.1)]',
                  'font-condensed text-sm font-semibold uppercase tracking-display text-brand-red',
                  'transition-all duration-200 hover:bg-[rgba(120,0,0,0.2)]',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
                )}
              >
                <ShoppingBag className="size-4" strokeWidth={1.5} />
                Böngéssz a termékeink között
              </button>
            </div>
          ) : (
            <ul className="divide-y divide-border" role="list">
              {items.map((item) => (
                <li key={item.product.id} className="flex gap-4 px-6 py-4">
                  {/* Product image */}
                  <div className="relative size-16 shrink-0 overflow-hidden rounded-lg border border-border bg-background">
                    {item.product.image_url ? (
                      <Image
                        src={item.product.image_url}
                        alt={item.product.name}
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <ShoppingBag
                          className="size-7 text-brand-gray opacity-40"
                          strokeWidth={1.5}
                        />
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex flex-1 flex-col gap-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-condensed text-sm font-bold uppercase tracking-display text-foreground line-clamp-2">
                        {item.product.name}
                      </h4>
                      <button
                        type="button"
                        onClick={() => removeItem(item.product.id)}
                        aria-label={`${item.product.name} eltávolítása`}
                        className="shrink-0 rounded p-0.5 text-muted-foreground transition-colors hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                      >
                        <X className="size-4" strokeWidth={1.5} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      {/* Quantity stepper */}
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() =>
                            updateQuantity(item.product.id, item.quantity - 1)
                          }
                          aria-label="Mennyiség csökkentése"
                          disabled={item.quantity <= 1}
                          className={cn(
                            'flex size-6 items-center justify-center rounded',
                            'border border-border text-muted-foreground',
                            'transition-colors hover:border-brand-red hover:text-brand-red',
                            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
                            'disabled:opacity-40 disabled:cursor-not-allowed',
                          )}
                        >
                          <Minus className="size-3" strokeWidth={2} />
                        </button>
                        <span className="min-w-[2rem] text-center font-condensed text-sm font-bold text-foreground">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            updateQuantity(item.product.id, item.quantity + 1)
                          }
                          aria-label="Mennyiség növelése"
                          disabled={item.quantity >= 99}
                          className={cn(
                            'flex size-6 items-center justify-center rounded',
                            'border border-border text-muted-foreground',
                            'transition-colors hover:border-brand-red hover:text-brand-red',
                            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
                            'disabled:opacity-40 disabled:cursor-not-allowed',
                          )}
                        >
                          <Plus className="size-3" strokeWidth={2} />
                        </button>
                      </div>

                      <span className="font-condensed text-sm font-bold text-foreground">
                        {formatHuf(item.product.price * item.quantity)}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer with totals + checkout */}
        {items.length > 0 && (
          <SheetFooter className="border-t border-border px-6 py-4">
            <div className="w-full space-y-3">
              {/* Total row */}
              <div className="flex items-center justify-between">
                <span className="font-condensed text-sm uppercase tracking-display text-muted-foreground">
                  Összesen
                </span>
                <span className="font-condensed text-xl font-bold tracking-display text-foreground">
                  {formatHuf(total)}
                </span>
              </div>

              {/* Checkout button */}
              <button
                type="button"
                onClick={handleCheckout}
                disabled={isLoading || items.length === 0}
                className={cn(
                  'w-full rounded-xl px-4 py-3',
                  'bg-brand-red text-white',
                  'font-condensed text-base font-bold uppercase tracking-display',
                  'transition-all duration-200',
                  'hover:bg-brand-red/80 active:scale-[0.99]',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
                  'disabled:cursor-not-allowed disabled:opacity-60',
                  'flex items-center justify-center gap-2',
                )}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" strokeWidth={2} />
                    Feldolgozás...
                  </>
                ) : (
                  'Megrendelés'
                )}
              </button>

              <p className="text-center text-xs text-muted-foreground">
                Biztonságos fizetés Stripe-on keresztül
              </p>
            </div>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  )
}
