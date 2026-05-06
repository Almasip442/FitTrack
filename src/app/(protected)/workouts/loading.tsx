import { Skeleton } from '@/components/ui/skeleton'

/**
 * Workouts list loading skeleton — F11.3.
 *
 * Mirrors the published markup of the plan-list page (header + plan card grid)
 * so the layout doesn't shift when real data arrives.
 */
export default function WorkoutsLoading() {
  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="space-y-2">
        <Skeleton className="h-3 w-32 rounded-md" />
        <Skeleton className="h-10 w-72 rounded-md" />
        <Skeleton className="h-px w-12 bg-brand-red" />
        <Skeleton className="h-4 w-96 rounded-md" />
      </div>

      {/* Top action row */}
      <div className="flex items-center justify-between gap-3">
        <Skeleton className="h-3 w-20 rounded-md" />
        <Skeleton className="h-9 w-32 rounded-md" />
      </div>

      {/* Plan cards grid — 1/2/3 col by breakpoint */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="flex h-56 flex-col rounded-lg border border-border bg-card p-5"
          >
            <div className="flex items-start justify-between">
              <Skeleton className="h-3 w-12 rounded-md" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
            <div className="mt-4 space-y-2">
              <Skeleton className="h-7 w-3/4 rounded-md" />
              <Skeleton className="h-4 w-full rounded-md" />
              <Skeleton className="h-4 w-5/6 rounded-md" />
            </div>
            <div className="mt-auto grid grid-cols-2 gap-3 pt-4">
              <Skeleton className="h-3 w-full rounded-md" />
              <Skeleton className="h-3 w-full rounded-md" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
