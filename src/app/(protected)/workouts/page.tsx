/**
 * /workouts — workout-plan list (server component).
 *
 * Frontend Iteration 6 / Workout planner entry point. Loads every plan
 * the current user owns and hands off to the client list.
 */

import { WorkoutPlanList } from '@/components/workouts/workout-plan-list'
import { getWorkoutPlans } from '@/lib/workouts/queries'
import { cn } from '@/lib/utils'

export default async function WorkoutsPage() {
  const plans = await getWorkoutPlans().catch(() => [])

  return (
    <div className="space-y-8">
      {/* ---------- Header ---------- */}
      <header className="flex flex-col gap-2">
        <span className="font-condensed text-[11px] uppercase tracking-wide-display text-brand-red">
          {'// 02 / Edzéstervező'}
        </span>
        <h1
          className={cn(
            'font-condensed text-3xl sm:text-4xl md:text-5xl font-extrabold uppercase',
            'tracking-display text-foreground leading-none',
          )}
        >
          Edzéstervek
        </h1>
        <span aria-hidden="true" className="block h-px w-12 bg-brand-red" />
        <p className="mt-1 max-w-2xl font-sans text-sm text-muted-foreground">
          Készíts saját edzésterveket, állítsd össze a heti rutinodat,
          és válaszd ki, melyik legyen az aktív.
        </p>
      </header>

      <WorkoutPlanList plans={plans} />
    </div>
  )
}
