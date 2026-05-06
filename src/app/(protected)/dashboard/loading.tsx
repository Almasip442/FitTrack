import { Skeleton } from '@/components/ui/skeleton'

/* -------------------------------------------------------------------------- */
/*  Widget skeleton card                                                       */
/* -------------------------------------------------------------------------- */

function SkeletonCard({
  className = '',
  children,
}: {
  className?: string
  children?: React.ReactNode
}) {
  return (
    <div
      className={`rounded-xl border border-border bg-card p-5 dark:bg-[#1a1a1a] dark:border-[#2a2a2a] ${className}`}
    >
      {children}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Loading skeleton                                                           */
/* -------------------------------------------------------------------------- */

export default function DashboardLoading() {
  return (
    <div className="flex flex-col gap-6">
      {/* Greeting bar */}
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-64 rounded-md" />
        <Skeleton className="h-4 w-40 rounded-md" />
      </div>

      {/* Widget grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Calories widget skeleton */}
        <SkeletonCard>
          <div className="flex flex-col items-center gap-4">
            <Skeleton className="h-4 w-28 rounded-md" />
            <Skeleton className="size-40 rounded-full" />
            <div className="w-full flex flex-col gap-2">
              <Skeleton className="h-3 w-full rounded-md" />
              <Skeleton className="h-3 w-full rounded-md" />
              <Skeleton className="h-3 w-full rounded-md" />
            </div>
          </div>
        </SkeletonCard>

        {/* Workout widget skeleton — col-span-2 on desktop */}
        <SkeletonCard className="sm:col-span-2 lg:col-span-2">
          <div className="flex flex-col gap-4">
            <Skeleton className="h-4 w-32 rounded-md" />
            <div className="flex flex-col gap-2">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-full rounded-md" />
              ))}
            </div>
            <Skeleton className="h-9 w-full rounded-lg" />
          </div>
        </SkeletonCard>

        {/* Weekly activity skeleton */}
        <SkeletonCard>
          <div className="flex flex-col gap-4">
            <Skeleton className="h-4 w-28 rounded-md" />
            <div className="flex justify-between gap-1">
              {[...Array(7)].map((_, i) => (
                <div key={i} className="flex flex-col items-center gap-1.5 flex-1">
                  <Skeleton className="size-8 rounded-full" />
                  <Skeleton className="h-2.5 w-5 rounded-md" />
                </div>
              ))}
            </div>
          </div>
        </SkeletonCard>

        {/* Weight trend skeleton */}
        <SkeletonCard>
          <div className="flex flex-col gap-4">
            <Skeleton className="h-4 w-28 rounded-md" />
            <Skeleton className="h-10 w-24 rounded-md" />
            <Skeleton className="h-14 w-full rounded-md" />
          </div>
        </SkeletonCard>

        {/* AI analysis skeleton */}
        <SkeletonCard>
          <div className="flex flex-col gap-4">
            <Skeleton className="h-4 w-28 rounded-md" />
            <div className="flex flex-col gap-2">
              <Skeleton className="h-3 w-full rounded-md" />
              <Skeleton className="h-3 w-5/6 rounded-md" />
              <Skeleton className="h-3 w-4/6 rounded-md" />
            </div>
            <Skeleton className="h-9 w-full rounded-lg" />
          </div>
        </SkeletonCard>
      </div>

      {/* Quick nav skeleton */}
      <div className="flex flex-col gap-4">
        <Skeleton className="h-4 w-36 rounded-md" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <SkeletonCard key={i}>
              <div className="flex flex-col items-center gap-3">
                <Skeleton className="size-11 rounded-full" />
                <div className="flex flex-col items-center gap-1 w-full">
                  <Skeleton className="h-4 w-20 rounded-md" />
                  <Skeleton className="h-3 w-16 rounded-md" />
                </div>
              </div>
            </SkeletonCard>
          ))}
        </div>
      </div>
    </div>
  )
}
