/**
 * Dashboard read-side aggregator — server-only.
 *
 * Backend Iteration 10 / Tasks 10.1–10.5.
 *
 * Exposes a single `getDashboardData()` entry point that fans out into
 * five parallel Supabase queries (Promise.all) and assembles the unified
 * `DashboardData` payload consumed by the home dashboard page.
 *
 * The Supabase server client is cookie-bound, so RLS evaluates against
 * the caller's session. Callers must be Server Components, Server
 * Actions, or Route Handlers.
 *
 * Unauthenticated callers receive a neutral default `DashboardData`
 * value — never an error — so the dashboard page can render a "please
 * sign in" state without try/catch noise.
 */
import { calculateCalorieTarget } from '@/lib/calories'
import { createClient } from '@/lib/supabase/server'
import type {
  DailyLog,
  Profile,
  WeeklyAnalysis,
  WeightLog,
  WorkoutPlan,
} from '@/types/database'

/* -------------------------------------------------------------------------- */
/*  Public types                                                               */
/* -------------------------------------------------------------------------- */

export type DashboardTodayWorkout = {
  plan: { id: string; name: string } | null
  day: { id: string; day_name: string; day_of_week: number | null } | null
  exercises: Array<{
    id: string
    name_hu: string
    sets: number | null
    reps: number | null
  }>
  isCompleted: boolean
  isRestDay: boolean
  hasActivePlan: boolean
}

export type DashboardTodayCalories = {
  consumed: number
  target: number
  protein: number
  carbs: number
  fat: number
}

export type DashboardWeeklyActivityPoint = {
  date: string
  completed: boolean
}

export type DashboardWeightPoint = {
  date: string
  weight: number
}

export type DashboardLatestAnalysis = {
  id: string
  week_start: string
  ai_analysis: string | null
  ai_rating: number | null
}

export type DashboardData = {
  todayWorkout: DashboardTodayWorkout
  todayCalories: DashboardTodayCalories
  weeklyActivity: DashboardWeeklyActivityPoint[]
  weightTrend: DashboardWeightPoint[]
  currentWeight: number | null
  weightChange: number | null
  latestAnalysis: DashboardLatestAnalysis | null
}

/* -------------------------------------------------------------------------- */
/*  Constants                                                                  */
/* -------------------------------------------------------------------------- */

/** Lookback window (days) for the dashboard weight trend. */
const WEIGHT_TREND_DAYS = 30

/** Empty / neutral value returned when the caller is unauthenticated. */
const EMPTY_DASHBOARD: DashboardData = {
  todayWorkout: {
    plan: null,
    day: null,
    exercises: [],
    isCompleted: false,
    isRestDay: false,
    hasActivePlan: false,
  },
  todayCalories: { consumed: 0, target: 0, protein: 0, carbs: 0, fat: 0 },
  weeklyActivity: [],
  weightTrend: [],
  currentWeight: null,
  weightChange: null,
  latestAnalysis: null,
}

/* -------------------------------------------------------------------------- */
/*  Date helpers                                                               */
/* -------------------------------------------------------------------------- */

/** Format a Date as `YYYY-MM-DD` in local time (matches Postgres `date`). */
function toIsoDate(d: Date): string {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Convert JavaScript's `Date.getDay()` (0 = Sunday, 1 = Monday, ...,
 * 6 = Saturday) to the project's `day_of_week` convention (0 = Monday,
 * 1 = Tuesday, ..., 6 = Sunday).
 */
function jsDayToDbDayOfWeek(jsDay: number): number {
  return (jsDay + 6) % 7
}

/**
 * Return the Monday of the week containing `d`, at local midnight.
 * Week starts on Monday (Hungarian convention).
 */
function startOfWeekMonday(d: Date): Date {
  const out = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const jsDay = out.getDay() // 0 = Sun, 1 = Mon, ..., 6 = Sat
  const diff = jsDay === 0 ? -6 : 1 - jsDay
  out.setDate(out.getDate() + diff)
  return out
}

/** Add `days` calendar days to a date and return a new Date. */
function addDays(d: Date, days: number): Date {
  const out = new Date(d)
  out.setDate(out.getDate() + days)
  return out
}

/* -------------------------------------------------------------------------- */
/*  Auth helper                                                                */
/* -------------------------------------------------------------------------- */

async function requireUserId(): Promise<string | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user?.id ?? null
}

/* -------------------------------------------------------------------------- */
/*  Internal row shapes for nested selects                                     */
/* -------------------------------------------------------------------------- */

/**
 * Shape of an active workout plan loaded together with its day rows and
 * the nested exercise list. The `Relationships: []` placeholders in
 * `database.ts` mean nested selects come back typed as
 * `SelectQueryError`; we cast through `unknown` because the runtime
 * shape is correct (PostgREST resolves the FKs).
 */
type ActivePlanRow = WorkoutPlan & {
  workout_days: Array<{
    id: string
    day_name: string
    day_of_week: number | null
    workout_day_exercises: Array<{
      sets: number | null
      reps: number | null
      exercise_order: number
      exercises: {
        id: string
        name_hu: string
      } | null
    }>
  }>
}

type DailyLogWithFood = DailyLog & {
  food_entries: Array<{
    calories: number | null
    protein: number | null
    carbs: number | null
    fat: number | null
  }> | null
}

/* -------------------------------------------------------------------------- */
/*  10.1 — Today's workout                                                     */
/* -------------------------------------------------------------------------- */

async function loadTodayWorkout(
  userId: string,
  todayIso: string,
  todayDbDow: number,
): Promise<DashboardTodayWorkout> {
  const supabase = await createClient()

  // Active plan + days + exercises in a single nested select.
  const planQuery = supabase
    .from('workout_plans')
    .select(
      `
      *,
      workout_days (
        id,
        day_name,
        day_of_week,
        workout_day_exercises (
          sets,
          reps,
          exercise_order,
          exercises (
            id,
            name_hu
          )
        )
      )
    `,
    )
    .eq('user_id', userId)
    .eq('is_active', true)
    .maybeSingle()

  // Today's daily_log purely for the `workout_completed` flag.
  const completionQuery = supabase
    .from('daily_logs')
    .select('workout_completed')
    .eq('user_id', userId)
    .eq('date', todayIso)
    .maybeSingle()

  const [planResult, completionResult] = await Promise.all([
    planQuery,
    completionQuery,
  ])

  if (planResult.error) {
    throw new Error(
      `Failed to load active workout plan: ${planResult.error.message}`,
    )
  }
  if (completionResult.error) {
    throw new Error(
      `Failed to load daily log: ${completionResult.error.message}`,
    )
  }

  const plan = planResult.data as unknown as ActivePlanRow | null
  const isCompleted = completionResult.data?.workout_completed ?? false

  if (!plan) {
    return {
      plan: null,
      day: null,
      exercises: [],
      isCompleted,
      isRestDay: false,
      hasActivePlan: false,
    }
  }

  const today = (plan.workout_days ?? []).find(
    (d) => d.day_of_week === todayDbDow,
  )

  if (!today) {
    return {
      plan: { id: plan.id, name: plan.name },
      day: null,
      exercises: [],
      isCompleted,
      isRestDay: true,
      hasActivePlan: true,
    }
  }

  const exercises = [...(today.workout_day_exercises ?? [])]
    .sort((a, b) => a.exercise_order - b.exercise_order)
    .filter((row) => row.exercises != null)
    .map((row) => ({
      id: row.exercises!.id,
      name_hu: row.exercises!.name_hu,
      sets: row.sets,
      reps: row.reps,
    }))

  return {
    plan: { id: plan.id, name: plan.name },
    day: {
      id: today.id,
      day_name: today.day_name,
      day_of_week: today.day_of_week,
    },
    exercises,
    isCompleted,
    isRestDay: false,
    hasActivePlan: true,
  }
}

/* -------------------------------------------------------------------------- */
/*  10.2 — Today's calorie balance                                             */
/* -------------------------------------------------------------------------- */

async function loadTodayCalories(
  userId: string,
  todayIso: string,
): Promise<DashboardTodayCalories> {
  const supabase = await createClient()

  const profileQuery = supabase
    .from('profiles')
    .select('gender, weight, height, age, activity_level, goal')
    .eq('id', userId)
    .maybeSingle()

  // Single nested select: today's log + its food entries.
  const logQuery = supabase
    .from('daily_logs')
    .select('*, food_entries ( calories, protein, carbs, fat )')
    .eq('user_id', userId)
    .eq('date', todayIso)
    .maybeSingle()

  const [profileResult, logResult] = await Promise.all([profileQuery, logQuery])

  if (profileResult.error) {
    throw new Error(`Failed to load profile: ${profileResult.error.message}`)
  }
  if (logResult.error) {
    throw new Error(`Failed to load daily log: ${logResult.error.message}`)
  }

  const profile = profileResult.data as Pick<
    Profile,
    'gender' | 'weight' | 'height' | 'age' | 'activity_level' | 'goal'
  > | null

  const log = logResult.data as unknown as DailyLogWithFood | null

  let consumed = 0
  let protein = 0
  let carbs = 0
  let fat = 0

  for (const entry of log?.food_entries ?? []) {
    if (typeof entry.calories === 'number') consumed += entry.calories
    if (typeof entry.protein === 'number') protein += entry.protein
    if (typeof entry.carbs === 'number') carbs += entry.carbs
    if (typeof entry.fat === 'number') fat += entry.fat
  }

  const target = profile ? (calculateCalorieTarget(profile)?.target ?? 0) : 0

  return { consumed, target, protein, carbs, fat }
}

/* -------------------------------------------------------------------------- */
/*  10.3 — Weekly activity (Mon–Sun)                                            */
/* -------------------------------------------------------------------------- */

async function loadWeeklyActivity(
  userId: string,
  weekStart: Date,
): Promise<DashboardWeeklyActivityPoint[]> {
  const supabase = await createClient()

  const startIso = toIsoDate(weekStart)
  const endIso = toIsoDate(addDays(weekStart, 6))

  const { data, error } = await supabase
    .from('daily_logs')
    .select('date, workout_completed')
    .eq('user_id', userId)
    .gte('date', startIso)
    .lte('date', endIso)

  if (error) {
    throw new Error(`Failed to load weekly activity: ${error.message}`)
  }

  const byDate = new Map<string, boolean>()
  for (const row of data ?? []) {
    byDate.set(row.date, row.workout_completed)
  }

  const series: DashboardWeeklyActivityPoint[] = []
  for (let i = 0; i < 7; i++) {
    const iso = toIsoDate(addDays(weekStart, i))
    series.push({ date: iso, completed: byDate.get(iso) ?? false })
  }
  return series
}

/* -------------------------------------------------------------------------- */
/*  10.4 — Weight trend (last 30 days)                                          */
/* -------------------------------------------------------------------------- */

type WeightTrendResult = {
  trend: DashboardWeightPoint[]
  currentWeight: number | null
  weightChange: number | null
}

async function loadWeightTrend(userId: string): Promise<WeightTrendResult> {
  const supabase = await createClient()

  const since = toIsoDate(addDays(new Date(), -(WEIGHT_TREND_DAYS - 1)))

  const { data, error } = await supabase
    .from('weight_logs')
    .select('date, weight')
    .eq('user_id', userId)
    .gte('date', since)
    .order('date', { ascending: true })

  if (error) {
    throw new Error(`Failed to load weight trend: ${error.message}`)
  }

  const rows = (data ?? []) as Pick<WeightLog, 'date' | 'weight'>[]
  const trend = rows.map((r) => ({ date: r.date, weight: r.weight }))

  const currentWeight = trend.length > 0 ? trend[trend.length - 1].weight : null
  const weightChange =
    trend.length >= 2 ? trend[trend.length - 1].weight - trend[0].weight : null

  return { trend, currentWeight, weightChange }
}

/* -------------------------------------------------------------------------- */
/*  10.5 — Latest weekly analysis                                              */
/* -------------------------------------------------------------------------- */

async function loadLatestAnalysis(
  userId: string,
): Promise<DashboardLatestAnalysis | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('weekly_analyses')
    .select('id, week_start, ai_analysis, ai_rating')
    .eq('user_id', userId)
    .order('week_start', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    throw new Error(`Failed to load latest analysis: ${error.message}`)
  }

  if (!data) return null

  const row = data as Pick<
    WeeklyAnalysis,
    'id' | 'week_start' | 'ai_analysis' | 'ai_rating'
  >
  return {
    id: row.id,
    week_start: row.week_start,
    ai_analysis: row.ai_analysis,
    ai_rating: row.ai_rating,
  }
}

/* -------------------------------------------------------------------------- */
/*  Public entry point                                                          */
/* -------------------------------------------------------------------------- */

/**
 * Aggregate every dashboard widget's data for the current authenticated
 * user in a single round of parallel Supabase queries.
 *
 * Returns a neutral default value when the caller is unauthenticated —
 * never throws for that case — so consumers can render the page without
 * special-casing missing sessions.
 */
export async function getDashboardData(): Promise<DashboardData> {
  const userId = await requireUserId()
  if (!userId) return EMPTY_DASHBOARD

  const now = new Date()
  const todayIso = toIsoDate(now)
  const todayDbDow = jsDayToDbDayOfWeek(now.getDay())
  const weekStart = startOfWeekMonday(now)

  // `allSettled` so a single failing widget query does not blank the
  // entire dashboard — each rejected loader falls back to its neutral
  // default value from `EMPTY_DASHBOARD`.
  const [
    todayWorkoutResult,
    todayCaloriesResult,
    weeklyActivityResult,
    weightResultSettled,
    latestAnalysisResult,
  ] = await Promise.allSettled([
    loadTodayWorkout(userId, todayIso, todayDbDow),
    loadTodayCalories(userId, todayIso),
    loadWeeklyActivity(userId, weekStart),
    loadWeightTrend(userId),
    loadLatestAnalysis(userId),
  ])

  const todayWorkout =
    todayWorkoutResult.status === 'fulfilled'
      ? todayWorkoutResult.value
      : EMPTY_DASHBOARD.todayWorkout

  const todayCalories =
    todayCaloriesResult.status === 'fulfilled'
      ? todayCaloriesResult.value
      : EMPTY_DASHBOARD.todayCalories

  const weeklyActivity =
    weeklyActivityResult.status === 'fulfilled'
      ? weeklyActivityResult.value
      : EMPTY_DASHBOARD.weeklyActivity

  const weightResult: WeightTrendResult =
    weightResultSettled.status === 'fulfilled'
      ? weightResultSettled.value
      : { trend: [], currentWeight: null, weightChange: null }

  const latestAnalysis =
    latestAnalysisResult.status === 'fulfilled'
      ? latestAnalysisResult.value
      : null

  return {
    todayWorkout,
    todayCalories,
    weeklyActivity,
    weightTrend: weightResult.trend,
    currentWeight: weightResult.currentWeight,
    weightChange: weightResult.weightChange,
    latestAnalysis,
  }
}
