'use client'

/**
 * ProductAddToCart — F9.4 client wrapper
 *
 * Quantity stepper + "Kosárba" button for the product detail page.
 * Calls the Zustand cart store.
 */

import { useState } from 'react'
import { Plus, Minus, ShoppingCart, Check } from 'lucide-react'
import { toast } from 'sonner'

import { cn } from '@/lib/utils'
import { useCartStore } from '@/store/cart'
import type { Product } from '@/types/database'

interface ProductAddToCartProps {
  product: Product
}

export function ProductAddToCart({ product }: ProductAddToCartProps) {
  const [quantity, setQuantity] = useState(1)
  const [added, setAdded] = useState(false)
  const addItem = useCartStore((s) => s.addItem)

  const handleAdd = () => {
    addItem(product, quantity)
    toast.success(`${product.name} a kosárba került!`)
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  const decrement = () => setQuantity((q) => Math.max(1, q - 1))
  const increment = () => setQuantity((q) => Math.min(99, q + 1))

  return (
    <div className="flex flex-col gap-4">
      {/* Quantity stepper */}
      <div className="flex items-center gap-4">
        <span className="font-condensed text-sm uppercase tracking-display text-muted-foreground">
          Mennyiség
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={decrement}
            disabled={quantity <= 1}
            aria-label="Mennyiség csökkentése"
            className={cn(
              'flex size-9 items-center justify-center rounded-lg',
              'border border-border bg-card',
              'text-foreground transition-all duration-200',
              'hover:border-brand-red hover:text-brand-red',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
              'disabled:cursor-not-allowed disabled:opacity-40',
            )}
          >
            <Minus className="size-4" strokeWidth={2} />
          </button>

          <span
            className="min-w-[3rem] text-center font-condensed text-xl font-bold tracking-display text-foreground"
            aria-live="polite"
            aria-label={`Mennyiség: ${quantity}`}
          >
            {quantity}
          </span>

          <button
            type="button"
            onClick={increment}
            disabled={quantity >= 99}
            aria-label="Mennyiség növelése"
            className={cn(
              'flex size-9 items-center justify-center rounded-lg',
              'border border-border bg-card',
              'text-foreground transition-all duration-200',
              'hover:border-brand-red hover:text-brand-red',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
              'disabled:cursor-not-allowed disabled:opacity-40',
            )}
          >
            <Plus className="size-4" strokeWidth={2} />
          </button>
        </div>
      </div>

      {/* Add to cart button */}
      <button
        type="button"
        onClick={handleAdd}
        className={cn(
          'inline-flex items-center justify-center gap-2',
          'w-full rounded-xl px-6 py-3',
          'font-condensed text-base font-bold uppercase tracking-display',
          'transition-all duration-200',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
          added
            ? 'bg-emerald-600 text-white'
            : 'bg-brand-red text-white hover:bg-brand-red/80 active:scale-[0.99]',
        )}
      >
        {added ? (
          <>
            <Check className="size-5" strokeWidth={2.5} />
            Kosárba téve!
          </>
        ) : (
          <>
            <ShoppingCart className="size-5" strokeWidth={1.5} />
            Kosárba — {quantity} db
          </>
        )}
      </button>
    </div>
  )
}
