import { Skeleton } from '@/components/ui/skeleton'

export default function ProgressLoading() {
  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="space-y-2">
        <Skeleton className="h-9 w-52 rounded-md" />
        <Skeleton className="h-4 w-80 rounded-md" />
      </div>

      {/* Top row: weight input + summary */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Skeleton className="h-48 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
      </div>

      {/* Weight chart */}
      <Skeleton className="h-72 rounded-xl" />

      {/* AI section header */}
      <div className="space-y-1">
        <Skeleton className="h-7 w-64 rounded-md" />
        <Skeleton className="h-4 w-96 rounded-md" />
      </div>

      {/* AI CTA card */}
      <Skeleton className="h-32 rounded-xl" />

      {/* Analysis history */}
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
    </div>
  )
}
