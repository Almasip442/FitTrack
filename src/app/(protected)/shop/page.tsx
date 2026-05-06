/**
 * Shop page — F9.1
 *
 * Server Component. Loads products and order history in parallel,
 * then passes them to the client-side ShopClient and OrderHistory.
 */

import { Suspense } from 'react'

import { getProducts } from '@/lib/shop/queries'
import { getUserOrders } from '@/lib/shop/queries'
import { ShopClient } from '@/components/shop/shop-client'
import { OrderHistory } from '@/components/shop/order-history'
import { Skeleton } from '@/components/ui/skeleton'

export const metadata = {
  title: 'Webshop — FitTrack Pro',
  description: 'Fitness kiegészítők és táplálék-kiegészítők',
}

export default async function ShopPage() {
  // Parallel data fetching
  const [products, orders] = await Promise.all([
    getProducts(),
    getUserOrders(),
  ])

  return (
    <div className="space-y-12">
      {/* Page header */}
      <div className="space-y-1">
        <h1 className="font-condensed text-3xl font-bold uppercase tracking-display text-foreground sm:text-4xl">
          Webshop
        </h1>
        <p className="text-muted-foreground">
          Prémium fitness kiegészítők és táplálék-kiegészítők
        </p>
      </div>

      {/* Product browser with filters */}
      <ShopClient initialProducts={products} />

      {/* Order history section */}
      <section className="space-y-4" aria-labelledby="order-history-heading">
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <h2
            id="order-history-heading"
            className="font-condensed text-sm font-semibold uppercase tracking-wide-display text-muted-foreground"
          >
            Rendelési előzmények
          </h2>
          <div className="h-px flex-1 bg-border" />
        </div>

        <Suspense
          fallback={
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-20 rounded-xl" />
              ))}
            </div>
          }
        >
          <OrderHistory orders={orders} />
        </Suspense>
      </section>
    </div>
  )
}
