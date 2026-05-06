/**
 * /workouts/[id] — workout plan editor (server component).
 *
 * Frontend Iteration 6 / Drag & drop planner. Loads the requested plan
 * with all of its days + exercises, then hands off to the client editor.
 * If the plan does not exist (or RLS hides it), redirect to /workouts.
 */

import { redirect } from 'next/navigation'

import { WorkoutPlanEditor } from '@/components/workouts/workout-plan-editor'
import { getWorkoutPlanWithDays } from '@/lib/workouts/queries'

interface WorkoutPlanPageProps {
  params: Promise<{ id: string }>
}

export default async function WorkoutPlanPage({
  params,
}: WorkoutPlanPageProps) {
  const { id } = await params
  const plan = await getWorkoutPlanWithDays(id).catch(() => null)

  if (!plan) {
    redirect('/workouts')
  }

  return <WorkoutPlanEditor plan={plan} />
}
