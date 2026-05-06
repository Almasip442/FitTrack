/**
 * ProductGrid — F9.3
 *
 * Responsive 3-col (desktop) / 2-col (tablet) / 1-col (mobile) grid.
 * Handles empty state.
 */

import { ShoppingBag } from 'lucide-react'
import { ProductCard } from './product-card'
import type { Product } from '@/types/database'

interface ProductGridProps {
  products: Product[]
}

export function ProductGrid({ products }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
        <div className="rounded-full border border-border bg-card p-6">
          <ShoppingBag
            className="size-12 text-muted-foreground/40"
            strokeWidth={1.5}
          />
        </div>
        <div className="space-y-1">
          <p className="font-condensed text-xl font-bold uppercase tracking-display text-foreground">
            Hamarosan érkeznek termékeink!
          </p>
          <p className="text-sm text-muted-foreground">
            Jelenleg nincs aktív termék ebben a kategóriában.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}
