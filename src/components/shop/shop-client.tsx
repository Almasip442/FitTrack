'use client'

/**
 * ShopClient — F9.2
 *
 * Client wrapper for the shop page.
 * Receives initial products from the server component and handles
 * client-side filtering and sorting without additional API calls.
 */

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'

import { cn } from '@/lib/utils'
import { staggerChildren, slideUpSm } from '@/lib/animations'
import { ProductGrid } from './product-grid'
import type { Product } from '@/types/database'

type Category = 'összes' | 'protein' | 'kreatin' | 'vitamin' | 'aminosav' | 'egyéb'
type SortBy = 'name' | 'price_asc' | 'price_desc'

interface ShopClientProps {
  initialProducts: Product[]
}

const CATEGORIES: { value: Category; label: string }[] = [
  { value: 'összes', label: 'Összes' },
  { value: 'protein', label: 'Protein' },
  { value: 'kreatin', label: 'Kreatin' },
  { value: 'vitamin', label: 'Vitamin' },
  { value: 'aminosav', label: 'Aminosav' },
  { value: 'egyéb', label: 'Egyéb' },
]

const SORT_OPTIONS: { value: SortBy; label: string }[] = [
  { value: 'name', label: 'Név szerint' },
  { value: 'price_asc', label: 'Legolcsóbb' },
  { value: 'price_desc', label: 'Legdrágább' },
]

export function ShopClient({ initialProducts }: ShopClientProps) {
  const [activeCategory, setActiveCategory] = useState<Category>('összes')
  const [sortBy, setSortBy] = useState<SortBy>('name')

  const filtered = useMemo(() => {
    let result = [...initialProducts]

    // Filter by category
    if (activeCategory !== 'összes') {
      result = result.filter((p) => p.category === activeCategory)
    }

    // Sort
    switch (sortBy) {
      case 'price_asc':
        result.sort((a, b) => a.price - b.price)
        break
      case 'price_desc':
        result.sort((a, b) => b.price - a.price)
        break
      case 'name':
      default:
        result.sort((a, b) => a.name.localeCompare(b.name, 'hu'))
        break
    }

    return result
  }, [initialProducts, activeCategory, sortBy])

  return (
    <motion.div
      variants={staggerChildren}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Filter bar */}
      <motion.div variants={slideUpSm} className="space-y-3">
        {/* Category chips */}
        <div className="flex flex-wrap gap-2" role="group" aria-label="Kategória szűrő">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              type="button"
              onClick={() => setActiveCategory(cat.value)}
              aria-pressed={activeCategory === cat.value}
              className={cn(
                'rounded-lg px-3 py-1.5 transition-all duration-200',
                'font-condensed text-sm font-semibold uppercase tracking-display',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
                activeCategory === cat.value
                  ? 'bg-brand-red text-white'
                  : [
                      'border text-muted-foreground',
                      'border-[rgba(120,0,0,0.35)] bg-[rgba(120,0,0,0.1)]',
                      'hover:border-brand-red hover:text-foreground',
                    ],
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Sort row */}
        <div className="flex items-center gap-3">
          <span className="font-condensed text-xs uppercase tracking-wide-display text-muted-foreground">
            Rendezés:
          </span>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Rendezés">
            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setSortBy(opt.value)}
                aria-pressed={sortBy === opt.value}
                className={cn(
                  'rounded-md px-2.5 py-1 transition-all duration-200',
                  'font-condensed text-xs font-semibold uppercase tracking-display',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
                  sortBy === opt.value
                    ? 'bg-brand-gray text-foreground'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Count */}
          <span className="ml-auto font-condensed text-xs uppercase tracking-wide-display text-muted-foreground">
            {filtered.length} termék
          </span>
        </div>
      </motion.div>

      {/* Product grid */}
      <motion.div variants={slideUpSm}>
        <ProductGrid products={filtered} />
      </motion.div>
    </motion.div>
  )
}
