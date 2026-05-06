/**
 * Shop loading skeleton — F9.1
 */

import { Skeleton } from '@/components/ui/skeleton'

export default function ShopLoading() {
  return (
    <div className="space-y-12">
      {/* Header skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-10 w-48 rounded-md" />
        <Skeleton className="h-4 w-72 rounded-md" />
      </div>

      {/* Filter chips skeleton */}
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-20 rounded-lg" />
          ))}
        </div>
        <div className="flex gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-6 w-24 rounded-md" />
          ))}
        </div>
      </div>

      {/* Product grid skeleton — 3 col desktop, 2 tablet, 1 mobile */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-xl border border-border">
            <Skeleton className="aspect-square w-full" />
            <div className="space-y-2 p-4">
              <Skeleton className="h-5 w-3/4 rounded" />
              <Skeleton className="h-4 w-full rounded" />
              <div className="flex items-center justify-between pt-2">
                <Skeleton className="h-6 w-24 rounded" />
                <Skeleton className="h-8 w-20 rounded-lg" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
