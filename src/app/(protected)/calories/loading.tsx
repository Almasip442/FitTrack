import { Skeleton } from '@/components/ui/skeleton'

/**
 * Calories page loading skeleton — F11.3.
 *
 * Matches the live calories layout: header, date navigator, daily summary
 * card with calorie ring + macro bars, four meal sections, weekly trend.
 */
export default function CaloriesLoading() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-3 w-28 rounded-md" />
        <Skeleton className="h-10 w-80 rounded-md" />
        <Skeleton className="h-px w-12" />
        <Skeleton className="h-4 w-full max-w-xl rounded-md" />
      </div>

      {/* Date navigator */}
      <div className="flex items-center justify-between rounded-md border border-border bg-card/40 px-4 py-3">
        <Skeleton className="size-8 rounded-md" />
        <div className="flex flex-col items-center gap-1">
          <Skeleton className="h-3 w-16 rounded-md" />
          <Skeleton className="h-5 w-44 rounded-md" />
        </div>
        <Skeleton className="h-8 w-12 rounded-md" />
      </div>

      {/* Daily summary card */}
      <div className="rounded-md border border-border bg-card/40 p-6 sm:p-8">
        <div className="grid items-center gap-8 sm:grid-cols-[auto_1fr]">
          <Skeleton className="mx-auto size-[196px] rounded-full sm:mx-0" />
          <div className="space-y-5">
            <Skeleton className="h-4 w-24 rounded-md" />
            <Skeleton className="h-2 w-full rounded-full" />
            <Skeleton className="h-4 w-32 rounded-md" />
            <Skeleton className="h-2 w-full rounded-full" />
            <Skeleton className="h-4 w-24 rounded-md" />
            <Skeleton className="h-2 w-full rounded-full" />
          </div>
        </div>
      </div>

      {/* Meal sections — 1/2 col responsive */}
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-44 rounded-md" />
        ))}
      </div>

      {/* Weekly trend chart */}
      <Skeleton className="h-64 rounded-md" />
    </div>
  )
}
