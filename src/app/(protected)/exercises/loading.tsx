import { Skeleton } from '@/components/ui/skeleton'

/**
 * Exercises browser loading skeleton — F11.3.
 *
 * Header + filter chip row + paginated card list. Matches ExerciseBrowser
 * markup so the page doesn't reflow when the API resolves.
 */
export default function ExercisesLoading() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-3 w-32 rounded-md" />
        <Skeleton className="h-10 w-72 rounded-md" />
        <Skeleton className="h-px w-12 bg-brand-red" />
        <Skeleton className="h-4 w-full max-w-xl rounded-md" />
      </div>

      {/* Search + filters */}
      <div className="space-y-3">
        <Skeleton className="h-11 w-full rounded-md" />
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-7 w-20 rounded-md" />
          ))}
        </div>
      </div>

      {/* Specimen card list */}
      <div className="space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-[88px] w-full rounded-md" />
        ))}
      </div>
    </div>
  )
}
