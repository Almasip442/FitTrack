'use client'

/**
 * ProductCard — F9.2 / F9.3
 *
 * Displays a single product with image (or placeholder), name, description,
 * price, and an "Add to Cart" button.
 *
 * Hover: scale(1.02) + shadow growth via CSS transitions.
 * Clicking the card body navigates to /shop/[id].
 * The cart button only adds to cart (does NOT navigate).
 */

import { useRouter } from 'next/navigation'
import { ShoppingBag, ShoppingCart } from 'lucide-react'

import { cn } from '@/lib/utils'
import { useCartStore } from '@/store/cart'
import type { Product } from '@/types/database'

interface ProductCardProps {
  product: Product
}

function formatHuf(price: number): string {
  return new Intl.NumberFormat('hu-HU').format(price) + ' Ft'
}

export function ProductCard({ product }: ProductCardProps) {
  const router = useRouter()
  const addItem = useCartStore((s) => s.addItem)

  const handleCardClick = () => {
    router.push(`/shop/${product.id}`)
  }

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation()
    addItem(product, 1)
  }

  return (
    <article
      onClick={handleCardClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          handleCardClick()
        }
      }}
      aria-label={`Termék: ${product.name}`}
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-xl',
        'border border-border bg-card',
        'cursor-pointer select-none',
        'transition-all duration-200 ease-out',
        'hover:scale-[1.02] hover:border-[rgba(120,0,0,0.35)]',
        'hover:shadow-[0_8px_32px_rgba(0,0,0,0.4)]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
      )}
    >
      {/* Product image */}
      <div className="relative aspect-square w-full overflow-hidden bg-gradient-to-br from-[#1a1a1a] to-[#111111]">
        {product.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.image_url}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <ShoppingBag
              className="size-16 text-brand-gray opacity-40"
              strokeWidth={1.5}
            />
          </div>
        )}
        {/* Category badge */}
        {product.category && (
          <span
            className={cn(
              'absolute left-3 top-3',
              'rounded-sm bg-brand-red px-2 py-0.5',
              'font-condensed text-[10px] font-semibold uppercase tracking-wide-display',
              'text-white',
            )}
          >
            {product.category}
          </span>
        )}
        {/* Inner ring for depth */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-none ring-1 ring-inset ring-white/[0.04]"
        />
      </div>

      {/* Card body */}
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3
          className={cn(
            'font-condensed text-base font-bold uppercase tracking-display',
            'text-foreground transition-colors duration-200',
            'group-hover:text-brand-red',
            'line-clamp-2',
          )}
        >
          {product.name}
        </h3>

        {product.description && (
          <p className="truncate text-sm text-muted-foreground">
            {product.description}
          </p>
        )}

        <div className="mt-auto flex items-center justify-between gap-3 pt-2">
          <span className="font-condensed text-lg font-bold tracking-display text-foreground">
            {formatHuf(product.price)}
          </span>

          <button
            type="button"
            onClick={handleAddToCart}
            aria-label={`${product.name} kosárba`}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5',
              'bg-brand-red text-white',
              'font-condensed text-sm font-semibold uppercase tracking-display',
              'transition-all duration-200',
              'hover:bg-brand-red/80 active:scale-95',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
            )}
          >
            <ShoppingCart className="size-3.5" strokeWidth={1.5} />
            Kosárba
          </button>
        </div>
      </div>
    </article>
  )
}
