import { calculateCalorieTarget } from '@/lib/calories'
import { createClient } from '@/lib/supabase/server'
import type { Profile } from '@/types/database'

export type WeeklyMetricSnapshot = {
  weekStart: string
  weekEnd: string
  goal: string | null
  calorieTarget: number | null
  proteinTarget: number | null
  elapsedDays: number
  nutritionDays: number
  proteinDays: number
  averageCalories: number | null
  averageProtein: number | null
  calorieDifference: number | null
  plannedWorkouts: number
  completedWorkouts: number
  workoutCompletionPercent: number | null
  exerciseCount: number
  totalSets: number
  totalReps: number
  volumeKg: number
  weightMeasurements: number
  averageWeight: number | null
  previousAverageWeight: number | null
  weightChange: number | null
}

export type WeeklyComparisonBundle = {
  current: WeeklyMetricSnapshot
  previous: WeeklyMetricSnapshot
}

export type WeeklyProgressBundle = WeeklyComparisonBundle & {
  previousPrevious: WeeklyMetricSnapshot
}

export type RawFood = { calories: number | null; protein: number | null }
export type RawDailyLog = {
  date: string
  workout_completed: boolean
  food_entries: RawFood[] | null
}
export type RawWeight = { date: string; weight: number }
export type RawExerciseLog = {
  sets_completed: number | null
  reps_completed: number[] | null
  weight_used: number[] | null
  daily_logs: { date: string } | { date: string }[] | null
}
type RawPlan = { workout_days: { day_of_week: number | null }[] | null } | null

export function toIsoDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export function startOfWeekMonday(date: Date): Date {
  const result = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const day = result.getDay()
  result.setDate(result.getDate() + (day === 0 ? -6 : 1 - day))
  return result
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

function average(values: number[]): number | null {
  if (values.length === 0) return null
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

function rounded(value: number | null, decimals = 0): number | null {
  if (value === null) return null
  const factor = 10 ** decimals
  return Math.round(value * factor) / factor
}

function scheduledWorkoutCount(
  planDays: { day_of_week: number | null }[],
  start: Date,
  end: Date,
): number {
  const weekdays = new Set(
    planDays.flatMap((day) => (day.day_of_week == null ? [] : [day.day_of_week])),
  )
  let count = 0
  for (const date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
    if (weekdays.has(date.getDay())) count++
  }
  return count
}

export function buildWeekSnapshot(args: {
  start: Date
  end: Date
  profile: Profile | null
  planDays: { day_of_week: number | null }[]
  dailyLogs: RawDailyLog[]
  weights: RawWeight[]
  exerciseLogs: RawExerciseLog[]
  previousAverageWeight: number | null
}): WeeklyMetricSnapshot {
  const { start, end, profile, planDays, dailyLogs, weights, exerciseLogs } = args
  const startIso = toIsoDate(start)
  const endIso = toIsoDate(end)
  const inWeek = <T extends { date: string }>(row: T) =>
    row.date >= startIso && row.date <= endIso
  const logs = dailyLogs.filter(inWeek)
  const foodDays = logs
    .map((log) => ({ entries: log.food_entries ?? [] }))
    .filter(({ entries }) => entries.length > 0)

  const caloriesByDay = foodDays.map(({ entries }) =>
    entries.reduce((sum, entry) => sum + (entry.calories ?? 0), 0),
  )
  const proteinByDay = foodDays.flatMap(({ entries }) => {
    const recorded = entries
      .map((entry) => entry.protein)
      .filter((protein): protein is number => typeof protein === 'number')
    return recorded.length > 0
      ? [recorded.reduce((sum, protein) => sum + protein, 0)]
      : []
  })

  const targets = profile ? calculateCalorieTarget(profile) : null
  const calorieTarget = targets?.target ?? null
  const weightsThisWeek = weights.filter(inWeek).map((row) => row.weight)
  const averageWeight = average(weightsThisWeek)
  const weightChange =
    averageWeight !== null && args.previousAverageWeight !== null
      ? averageWeight - args.previousAverageWeight
      : null

  const exercises = exerciseLogs.filter((row) => {
    const parent = Array.isArray(row.daily_logs) ? row.daily_logs[0] : row.daily_logs
    return Boolean(parent && inWeek(parent))
  })
  let totalSets = 0
  let totalReps = 0
  let volumeKg = 0
  for (const exercise of exercises) {
    const reps = exercise.reps_completed ?? []
    const weightsUsed = exercise.weight_used ?? []
    totalSets += exercise.sets_completed ?? reps.length
    reps.forEach((rep, index) => {
      const safeRep = Number.isFinite(rep) ? rep : 0
      const weight = weightsUsed[index] ?? 0
      totalReps += safeRep
      volumeKg += safeRep * (Number.isFinite(weight) ? weight : 0)
    })
  }

  const completedWorkouts = logs.filter((log) => log.workout_completed).length
  const plannedWorkouts = scheduledWorkoutCount(planDays, start, end)
  const elapsedDays = Math.max(
    1,
    Math.round((Date.UTC(end.getFullYear(), end.getMonth(), end.getDate()) -
      Date.UTC(start.getFullYear(), start.getMonth(), start.getDate())) / 86_400_000) + 1,
  )

  return {
    weekStart: startIso,
    weekEnd: endIso,
    goal: profile?.goal ?? null,
    calorieTarget,
    proteinTarget: calorieTarget === null ? null : Math.round((calorieTarget * 0.3) / 4),
    elapsedDays,
    nutritionDays: foodDays.length,
    proteinDays: proteinByDay.length,
    averageCalories: rounded(average(caloriesByDay)),
    averageProtein: rounded(average(proteinByDay)),
    calorieDifference:
      calorieTarget !== null && caloriesByDay.length > 0
        ? rounded(average(caloriesByDay)! - calorieTarget)
        : null,
    plannedWorkouts,
    completedWorkouts,
    workoutCompletionPercent:
      plannedWorkouts === 0
        ? null
        : Math.round((completedWorkouts / plannedWorkouts) * 100),
    exerciseCount: exercises.length,
    totalSets,
    totalReps,
    volumeKg: rounded(volumeKg, 1) ?? 0,
    weightMeasurements: weightsThisWeek.length,
    averageWeight: rounded(average(weightsThisWeek), 1),
    previousAverageWeight: rounded(args.previousAverageWeight, 1),
    weightChange: rounded(weightChange, 1),
  }
}

/**
 * Load the selected week and two preceding weeks for the analysis rules.
 * Progress clients receive only the selected week and its direct comparison.
 */
export async function getWeeklyProgressBundle(
  userId: string,
  now = new Date(),
  requestedWeekStart?: string,
): Promise<WeeklyProgressBundle> {
  const currentWeekStart = startOfWeekMonday(now)
  const currentStart = requestedWeekStart
    ? new Date(`${requestedWeekStart}T12:00:00`)
    : currentWeekStart
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const currentSunday = addDays(currentStart, 6)
  const isCurrentWeek = toIsoDate(currentStart) === toIsoDate(currentWeekStart)
  const currentEnd = isCurrentWeek && currentSunday > today ? today : currentSunday
  const previousStart = addDays(currentStart, -7)
  const previousEnd = addDays(currentStart, -1)
  // Keep two complete weeks of context so adaptive suggestions never infer
  // a pattern from the still-in-progress current week.
  const previousPreviousStart = addDays(previousStart, -7)
  const previousPreviousEnd = addDays(previousStart, -1)
  const fromIso = toIsoDate(previousPreviousStart)
  const toIso = toIsoDate(currentEnd)

  const supabase = await createClient()
  const [profileResult, planResult, logsResult, weightsResult, exerciseResult] =
    await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
      supabase
        .from('workout_plans')
        .select('workout_days(day_of_week)')
        .eq('user_id', userId)
        .eq('is_active', true)
        .maybeSingle(),
      supabase
        .from('daily_logs')
        .select('date, workout_completed, food_entries(calories, protein)')
        .eq('user_id', userId)
        .gte('date', fromIso)
        .lte('date', toIso),
      supabase
        .from('weight_logs')
        .select('date, weight')
        .eq('user_id', userId)
        .gte('date', fromIso)
        .lte('date', toIso),
      supabase
        .from('workout_exercise_logs')
        .select(
          'sets_completed, reps_completed, weight_used, daily_logs!inner(date, user_id)',
        )
        .eq('daily_logs.user_id', userId)
        .eq('skipped', false)
        .gte('daily_logs.date', fromIso)
        .lte('daily_logs.date', toIso),
    ])

  const failed = [
    profileResult.error,
    planResult.error,
    logsResult.error,
    weightsResult.error,
    exerciseResult.error,
  ].find(Boolean)
  if (failed) throw new Error(`Failed to load weekly metrics: ${failed.message}`)

  const profile = profileResult.data as Profile | null
  const plan = planResult.data as unknown as RawPlan
  const planDays = plan?.workout_days ?? []
  const dailyLogs = (logsResult.data as unknown as RawDailyLog[] | null) ?? []
  const weights = (weightsResult.data as unknown as RawWeight[] | null) ?? []
  const exerciseLogs =
    (exerciseResult.data as unknown as RawExerciseLog[] | null) ?? []

  const previousWeights = weights
    .filter((row) => row.date >= toIsoDate(previousStart) && row.date <= toIsoDate(previousEnd))
    .map((row) => row.weight)
  const previousAverageWeight = average(previousWeights)
  const previousPreviousWeights = weights
    .filter((row) => row.date >= fromIso && row.date <= toIsoDate(previousPreviousEnd))
    .map((row) => row.weight)
  const previousPreviousAverageWeight = average(previousPreviousWeights)
  const previous = buildWeekSnapshot({
    start: previousStart,
    end: previousEnd,
    profile,
    planDays,
    dailyLogs,
    weights,
    exerciseLogs,
    previousAverageWeight: previousPreviousAverageWeight,
  })
  const previousPrevious = buildWeekSnapshot({
    start: previousPreviousStart,
    end: previousPreviousEnd,
    profile,
    planDays,
    dailyLogs,
    weights,
    exerciseLogs,
    previousAverageWeight: null,
  })
  const current = buildWeekSnapshot({
    start: currentStart,
    end: currentEnd,
    profile,
    planDays,
    dailyLogs,
    weights,
    exerciseLogs,
    previousAverageWeight,
  })

  return { current, previous, previousPrevious }
}
