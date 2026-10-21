/**
 * FitTrack Pro — Demo User Seed Script
 * -----------------------------------------------------------------------------
 * Creates (or refreshes) a single demo user with realistic 2 consecutive completed weeks of
 * workout, calorie, and weight data so the deployed application has
 * something meaningful to demonstrate immediately after deploy.
 *
 * Usage:
 *   npx tsx scripts/seed-demo-user.ts
 *
 * Required environment variables (loaded from .env.local):
 *   - NEXT_PUBLIC_SUPABASE_URL
 *   - SUPABASE_SERVICE_ROLE_KEY  (bypasses RLS; do NOT expose to clients)
 *
 * Demo credentials (also documented in docs/DEPLOYMENT.md):
 *   email:    demo@fittrack.hu
 *   password: Demo1234!
 *
 * Idempotency:
 *   - The auth user is reused by email if it already exists.
 *   - All per-user rows are wiped and re-inserted on every run so the
 *     dataset stays consistent and fresh (the script is meant for the
 *     demo user only; do NOT point it at a real user).
 *   - Catalog tables (`exercises`, `products`) are NEVER touched.
 * -----------------------------------------------------------------------------
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import { resolve } from 'path'

import type { Database } from '../src/types/database'

config({ path: resolve(process.cwd(), '.env.local') })

// -----------------------------------------------------------------------------
// Environment validation
// -----------------------------------------------------------------------------

function getEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

const SUPABASE_URL = getEnv('NEXT_PUBLIC_SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = getEnv('SUPABASE_SERVICE_ROLE_KEY')

const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})

/** Verify required migrations before creating an auth user or deleting demo data. */
async function verifyRequiredSchema(): Promise<void> {
  const [analysisSchema, workoutSchema] = await Promise.all([
    supabase
      .from('weekly_analyses')
      .select('id, rule_based_summary, rule_based_suggestions, rule_based_rating, risk_warning, metrics_snapshot, ai_status')
      .limit(0),
    supabase.from('workout_exercise_logs').select('id, skipped').limit(0),
  ])

  if (analysisSchema.error || workoutSchema.error) {
    throw new Error(
      [
        'A demó seedhez szükséges adatbázis-migráció hiányzik vagy a Supabase sémagyorsítótára még nem frissült.',
        'Alkalmazd időrendben a supabase/migrations/20261021000009_workout_exercise_skip.sql és 20261021000010_weekly_analysis_comparison.sql migrációkat.',
        "Ha már lefuttattad őket, futtasd a Supabase SQL Editorban: NOTIFY pgrst, 'reload schema'; majd várj néhány másodpercet és próbáld újra.",
        `Schema ellenőrzés: ${analysisSchema.error?.message ?? workoutSchema.error?.message}`,
      ].join('\n'),
    )
  }
}

// -----------------------------------------------------------------------------
// Demo user constants
// -----------------------------------------------------------------------------

const DEMO_EMAIL = 'demo@fittrack.hu'
const DEMO_PASSWORD = 'Demo1234!'

const DEMO_PROFILE = {
  name: 'Kovács Demo',
  age: 35,
  gender: 'férfi' as const,
  weight: 90.5, // initial weight (kg) — weight_logs reflect the trend
  height: 178, // cm
  goal: 'fogyás' as const,
  activity_level: 'mérsékelten_aktív' as const,
}

/** Two consecutive, completed weeks are generated as a reproducible test fixture. */

// -----------------------------------------------------------------------------
// Date helpers (Monday-start ISO weeks, local time)
// -----------------------------------------------------------------------------

function toIsoDate(d: Date): string {
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

function startOfWeekMonday(d: Date): Date {
  const out = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const day = out.getDay()
  const diff = day === 0 ? -6 : 1 - day
  out.setDate(out.getDate() + diff)
  return out
}

function addDays(d: Date, days: number): Date {
  const out = new Date(d)
  out.setDate(out.getDate() + days)
  return out
}

// -----------------------------------------------------------------------------
// Auth user (create or reuse)
// -----------------------------------------------------------------------------

async function ensureDemoUser(): Promise<string> {
  // listUsers → find by email; the admin SDK does not have a "get by
  // email" helper, so we paginate (the demo project will only have a few
  // users, so a single page is enough).
  const { data: list, error: listError } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  })
  if (listError) {
    throw new Error(`Failed to list auth users: ${listError.message}`)
  }

  const existing = list.users.find((u) => u.email === DEMO_EMAIL)
  if (existing) {
    console.log(`Reusing existing demo user: ${existing.id}`)
    // Reset the password so the documented credentials always work.
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      existing.id,
      { password: DEMO_PASSWORD, email_confirm: true },
    )
    if (updateError) {
      throw new Error(
        `Failed to refresh demo user password: ${updateError.message}`,
      )
    }
    return existing.id
  }

  const { data: created, error: createError } = await supabase.auth.admin.createUser({
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
    email_confirm: true,
    user_metadata: { is_demo: true },
  })
  if (createError || !created.user) {
    throw new Error(
      `Failed to create demo user: ${createError?.message ?? 'unknown error'}`,
    )
  }
  console.log(`Created new demo user: ${created.user.id}`)
  return created.user.id
}

// -----------------------------------------------------------------------------
// Profile
// -----------------------------------------------------------------------------

async function seedProfile(userId: string): Promise<void> {
  // The handle_new_user() trigger inserts a bare profiles row at signup.
  // We update it to the documented demo state.
  const { error } = await supabase
    .from('profiles')
    .update({
      name: DEMO_PROFILE.name,
      age: DEMO_PROFILE.age,
      gender: DEMO_PROFILE.gender,
      weight: DEMO_PROFILE.weight,
      height: DEMO_PROFILE.height,
      goal: DEMO_PROFILE.goal,
      activity_level: DEMO_PROFILE.activity_level,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)

  if (error) {
    throw new Error(`Failed to update demo profile: ${error.message}`)
  }
  console.log('Profile populated.')
}

// -----------------------------------------------------------------------------
// Wipe all per-user rows so re-runs stay deterministic
// -----------------------------------------------------------------------------

async function wipeUserData(userId: string): Promise<void> {
  const tables = [
    'workout_exercise_logs',
    'food_entries',
    'weight_logs',
    'weekly_analyses',
    'workout_day_exercises',
    'workout_days',
    'workout_plans',
    'daily_logs',
  ] as const

  // workout_exercise_logs and food_entries are CASCADE-deleted via their
  // parent FK, but the parent tables we control (`daily_logs`,
  // `workout_plans`, etc.) are wiped explicitly below. Doing the children
  // first is harmless and guarantees a clean slate even if parent FKs
  // ever change.
  for (const table of tables) {
    if (table === 'food_entries' || table === 'workout_exercise_logs') {
      // These have no user_id column — their deletion happens via parent
      // CASCADE. We skip them here.
      continue
    }
    if (table === 'workout_day_exercises' || table === 'workout_days') {
      // Same: deletion cascades from workout_plans.
      continue
    }
    const { error } = await supabase
      .from(table)
      .delete()
      .eq('user_id', userId)
    if (error) {
      throw new Error(`Failed to wipe ${table}: ${error.message}`)
    }
  }
  console.log('Existing demo data wiped.')
}

// -----------------------------------------------------------------------------
// Workout plan (active, 3 days, 5 exercises per day)
// -----------------------------------------------------------------------------

type DayPlan = {
  name: string
  dayOfWeek: number
  exerciseCategoryFilter: string[]
}

const DAY_PLANS: DayPlan[] = [
  {
    name: 'Hétfő — Mell + Tricepsz',
    dayOfWeek: 1,
    exerciseCategoryFilter: ['mellkas', 'tricepsz'],
  },
  {
    name: 'Szerda — Hát + Bicepsz',
    dayOfWeek: 2,
    exerciseCategoryFilter: ['hát', 'bicepsz'],
  },
  {
    name: 'Péntek — Láb + Váll',
    dayOfWeek: 4,
    exerciseCategoryFilter: ['láb', 'váll'],
  },
  {
    name: 'Szombat â€” Teljes test',
    dayOfWeek: 6,
    exerciseCategoryFilter: ['mellkas', 'hĂˇt', 'lĂˇb'],
  },
]

type SeededDayExercise = {
  workout_day_id: string
  exercise_id: string
}

async function seedWorkoutPlan(
  userId: string,
): Promise<{ planId: string; dayExerciseMap: Map<number, SeededDayExercise[]> }> {
  // 1) Plan
  const { data: plan, error: planError } = await supabase
    .from('workout_plans')
    .insert({
      user_id: userId,
      name: 'Demo edzésterv — 4 nap / hét',
      description: 'Két lezárt hét összehasonlítható mintaadataival',
      is_active: true,
    })
    .select('id')
    .single()
  if (planError || !plan) {
    throw new Error(`Failed to create workout plan: ${planError?.message}`)
  }

  // 2) Exercise pool — fall back to whatever exists in the catalog
  const { data: pool, error: poolError } = await supabase
    .from('exercises')
    .select('id, muscle_group')
    .limit(200)
  if (poolError || !pool || pool.length === 0) {
    throw new Error(
      `Cannot seed workout plan — exercises catalog is empty. Run seed-exercises.ts first.`,
    )
  }

  // 3) Days + exercises
  const dayExerciseMap = new Map<number, SeededDayExercise[]>()
  for (let dayOrder = 0; dayOrder < DAY_PLANS.length; dayOrder++) {
    const day = DAY_PLANS[dayOrder]

    const { data: dayRow, error: dayError } = await supabase
      .from('workout_days')
      .insert({
        plan_id: plan.id,
        day_name: day.name,
        day_order: dayOrder,
        day_of_week: day.dayOfWeek,
      })
      .select('id')
      .single()
    if (dayError || !dayRow) {
      throw new Error(`Failed to create workout day: ${dayError?.message}`)
    }

    // Pick 5 exercises preferring the day's muscle groups.
    const preferred = pool.filter(
      (e) =>
        e.muscle_group != null &&
        day.exerciseCategoryFilter.includes(e.muscle_group),
    )
    const fallback = pool.filter((e) => !preferred.includes(e))
    const chosen = [...preferred, ...fallback].slice(0, 5)

    const inserts = chosen.map((ex, i) => ({
      workout_day_id: dayRow.id,
      exercise_id: ex.id,
      sets: 4,
      reps: 10,
      rest_seconds: 90,
      exercise_order: i,
    }))

    const { data: exRows, error: exError } = await supabase
      .from('workout_day_exercises')
      .insert(inserts)
      .select('id, exercise_id, workout_day_id')
    if (exError || !exRows) {
      throw new Error(
        `Failed to insert workout_day_exercises: ${exError?.message}`,
      )
    }

    dayExerciseMap.set(
      day.dayOfWeek,
      exRows.map((r) => ({
        workout_day_id: r.workout_day_id,
        exercise_id: r.exercise_id,
      })),
    )
  }

  console.log(`Workout plan + ${DAY_PLANS.length} days + ${DAY_PLANS.length * 5} exercises seeded.`)
  return { planId: plan.id, dayExerciseMap }
}

// -----------------------------------------------------------------------------
// Two deterministic, completed weeks for the weekly-summary comparison.
const NUTRITION = [
  { calories: [2000, 2100, 2200, 1900], protein: [125, 130, 140, 115] },
  { calories: [2100, 2200, 2150, 2050, 2200, 2200], protein: [130, 140, 135, 125, 140, 140] },
] as const
const COMPLETED_DAYS = [[0, 3], [0, 3, 5]] as const
const WEIGHT_FIXTURES = [[82.1, 82.3], [81.9, 81.8, 81.7, 81.6, 81.5]] as const

async function seedDailyData(
  userId: string,
  dayExerciseMap: Map<number, SeededDayExercise[]>,
): Promise<void> {
  const monday = addDays(startOfWeekMonday(new Date()), -14)
  let dailyLogsInserted = 0
  let foodEntriesInserted = 0
  let workoutLogsInserted = 0

  for (let week = 0; week < 2; week++) {
    const completedOffsets = COMPLETED_DAYS[week]
    const nutrition = NUTRITION[week]
    const calorieDayIndexes = week === 0 ? [0, 1, 3, 5] : [0, 1, 2, 3, 4, 5]
    for (let offset = 0; offset < 7; offset++) {
      const date = addDays(monday, week * 7 + offset)
      const dateIso = toIsoDate(date)
      const dow = date.getDay()
      const completed = completedOffsets.some((completedOffset) => completedOffset === offset)
      const { data: dailyLog, error } = await supabase
        .from('daily_logs')
        .insert({ user_id: userId, date: dateIso, workout_completed: completed })
        .select('id').single()
      if (error || !dailyLog) throw new Error(`Failed daily log ${dateIso}: ${error?.message}`)
      dailyLogsInserted++

      const foodIndex = calorieDayIndexes.indexOf(offset)
      if (foodIndex >= 0) {
        const calories = nutrition.calories[foodIndex]
        const protein = nutrition.protein[foodIndex]
        const { error: foodError } = await supabase.from('food_entries').insert([
          { daily_log_id: dailyLog.id, food_name: 'Reggeli mintaétkezés', calories: 500, protein: 30, carbs: 55, fat: 15, amount: 1, meal_type: 'reggeli' },
          { daily_log_id: dailyLog.id, food_name: 'Ebéd mintaétkezés', calories: 900, protein: 50, carbs: 100, fat: 25, amount: 1, meal_type: 'ebéd' },
          { daily_log_id: dailyLog.id, food_name: 'Vacsora mintaétkezés', calories: calories - 1400, protein: protein - 80, carbs: 50, fat: 20, amount: 1, meal_type: 'vacsora' },
        ])
        if (foodError) throw new Error(`Failed food entries ${dateIso}: ${foodError.message}`)
        foodEntriesInserted += 3
      }

      if (completed) {
        const exercises = dayExerciseMap.get(dow) ?? []
        const logs = exercises.map((exercise, index) => {
          const load = 20 + index * 5 + week * 2
          return { daily_log_id: dailyLog.id, exercise_id: exercise.exercise_id,
            sets_completed: 3, reps_completed: [10, 10, 10], weight_used: [load, load, load] }
        })
        const { error: logError } = await supabase.from('workout_exercise_logs').insert(logs)
        if (logError) throw new Error(`Failed workout logs ${dateIso}: ${logError.message}`)
        workoutLogsInserted += logs.length
      }
    }
  }
  console.log(`Daily logs: ${dailyLogsInserted}; food entries: ${foodEntriesInserted}; workout exercise logs: ${workoutLogsInserted}`)
}

async function seedWeightLogs(userId: string): Promise<void> {
  const monday = addDays(startOfWeekMonday(new Date()), -14)
  const offsets = [[0, 4], [0, 1, 2, 3, 4]] as const
  const inserts = WEIGHT_FIXTURES.flatMap((week, weekIndex) =>
    week.map((weight, index) => ({ user_id: userId,
      date: toIsoDate(addDays(monday, weekIndex * 7 + offsets[weekIndex][index])), weight })),
  )
  const { error } = await supabase.from('weight_logs').insert(inserts)
  if (error) throw new Error(`Failed to seed weights: ${error.message}`)
  const latest = inserts[inserts.length - 1]
  const { error: profileError } = await supabase.from('profiles')
    .update({ weight: latest.weight, updated_at: new Date().toISOString() }).eq('id', userId)
  if (profileError) throw new Error(`Failed to update profile weight: ${profileError.message}`)
  console.log(`Weight logs: ${inserts.length}; week averages: 82.2 kg then 81.7 kg (-0.5 kg).`)
}

async function seedWeeklyAnalysis(userId: string): Promise<void> {
  const weekStart = addDays(startOfWeekMonday(new Date()), -7)
  const weekEnd = addDays(weekStart, 6)
  const { error } = await supabase.from('weekly_analyses').insert({
    user_id: userId, week_start: toIsoDate(weekStart), week_end: toIsoDate(weekEnd),
    workouts_completed: 3, avg_calories: 2150, weight_change: -0.5,
    ai_analysis: null, ai_suggestions: null, ai_rating: null,
    rule_based_summary: 'A lezárt mintahéten 3/4 tervezett edzés, 6/7 nap étkezési napló és 5 testsúlymérés szerepel.',
    rule_based_suggestions: ['A naplózott adatok alapján folytasd a követhető edzésritmust.', 'A hiányzó naplóadatokat rögzítsd a pontosabb heti összehasonlításhoz.'],
    rule_based_rating: 7,
    risk_warning: 'Ez a mintaadatokon alapuló összesítés nem egészségügyi tanács.',
    metrics_snapshot: { sample: true, expected: { workouts: '3/4', calories: 2150, volumeKg: 14400, weightChangeKg: -0.5 } },
    ai_status: 'sample',
  })
  if (error) throw new Error(`Failed to insert sample weekly analysis: ${error.message}`)
  console.log('Historical sample analysis seeded.')
}
// -----------------------------------------------------------------------------
// Main
// -----------------------------------------------------------------------------

async function main(): Promise<void> {
  console.log('=== FitTrack Pro — Demo User Seed ===')
  await verifyRequiredSchema()
  console.log('Required database migrations verified.')
  console.log(`Email:    ${DEMO_EMAIL}`)
  console.log(`Password: ${DEMO_PASSWORD}`)
  console.log('-------------------------------------\n')

  const userId = await ensureDemoUser()
  await seedProfile(userId)
  await wipeUserData(userId)

  const { dayExerciseMap } = await seedWorkoutPlan(userId)
  await seedDailyData(userId, dayExerciseMap)
  await seedWeightLogs(userId)
  await seedWeeklyAnalysis(userId)

  console.log('\nDemo seed completed successfully.')
  console.log('Expected closed-week metrics:')
  console.log('  Previous: workouts 2/4; calories 2,050 kcal/day (4/7 logged); volume 9,000 kg; weight average 82.2 kg.')
  console.log('  Latest:   workouts 3/4; calories 2,150 kcal/day (6/7 logged); volume 14,400 kg; weight average 81.7 kg; change -0.5 kg.')
  console.log(`Login at /login with ${DEMO_EMAIL} / ${DEMO_PASSWORD}`)
}

main().catch((err) => {
  console.error('\nDemo seed failed:', err)
  process.exit(1)
})
