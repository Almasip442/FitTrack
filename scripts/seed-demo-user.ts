/**
 * FitTrack Pro — Demo User Seed Script
 * -----------------------------------------------------------------------------
 * Creates (or refreshes) a single demo user with realistic 6 weeks of
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

/** Number of past weeks to back-fill data for. */
const WEEKS = 6

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
    dayOfWeek: 3,
    exerciseCategoryFilter: ['hát', 'bicepsz'],
  },
  {
    name: 'Péntek — Láb + Váll',
    dayOfWeek: 5,
    exerciseCategoryFilter: ['láb', 'váll'],
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
      name: 'Demo edzésterv — 3 nap / hét',
      description: '6 hetes fogyás-fókuszú edzésterv',
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

  console.log('Workout plan + 3 days + 15 exercises seeded.')
  return { planId: plan.id, dayExerciseMap }
}

// -----------------------------------------------------------------------------
// Daily logs + food entries + workout exercise logs (6 weeks)
// -----------------------------------------------------------------------------

const MEAL_TEMPLATES: Array<{
  food_name: string
  calories: number
  protein: number
  carbs: number
  fat: number
  meal_type: 'reggeli' | 'ebéd' | 'vacsora' | 'snack'
  amount: number
}> = [
  // Breakfasts
  { food_name: 'Zabkása banánnal és mézzel', calories: 380, protein: 12, carbs: 65, fat: 6, meal_type: 'reggeli', amount: 350 },
  { food_name: 'Tojásrántotta sonkával, pirítóssal', calories: 450, protein: 28, carbs: 30, fat: 22, meal_type: 'reggeli', amount: 250 },
  { food_name: 'Görög joghurt müzlivel és bogyós gyümölccsel', calories: 320, protein: 18, carbs: 42, fat: 8, meal_type: 'reggeli', amount: 300 },
  // Lunches
  { food_name: 'Csirkemell rizzsel és párolt zöldségekkel', calories: 580, protein: 45, carbs: 70, fat: 10, meal_type: 'ebéd', amount: 450 },
  { food_name: 'Marhapörkölt nokedlivel', calories: 720, protein: 38, carbs: 65, fat: 30, meal_type: 'ebéd', amount: 500 },
  { food_name: 'Tonhalsaláta tojással és olívaolajjal', calories: 480, protein: 35, carbs: 25, fat: 26, meal_type: 'ebéd', amount: 400 },
  // Dinners
  { food_name: 'Sült lazac quinoával és spenóttal', calories: 540, protein: 38, carbs: 45, fat: 22, meal_type: 'vacsora', amount: 400 },
  { food_name: 'Pulykamell teljes kiőrlésű tésztával', calories: 510, protein: 40, carbs: 60, fat: 12, meal_type: 'vacsora', amount: 400 },
  { food_name: 'Lencsefőzelék fasírttal', calories: 620, protein: 32, carbs: 70, fat: 22, meal_type: 'vacsora', amount: 450 },
  // Snacks
  { food_name: 'Whey protein shake', calories: 130, protein: 25, carbs: 4, fat: 2, meal_type: 'snack', amount: 250 },
  { food_name: 'Banán + mandula', calories: 220, protein: 6, carbs: 30, fat: 10, meal_type: 'snack', amount: 130 },
  { food_name: 'Túró rudi', calories: 165, protein: 6, carbs: 18, fat: 8, meal_type: 'snack', amount: 50 },
]

/** Seeded RNG so re-runs produce identical fixtures. */
function makeRng(seed: number): () => number {
  let s = seed >>> 0
  return () => {
    // Mulberry32
    s = (s + 0x6d2b79f5) >>> 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function pickN<T>(arr: T[], n: number, rng: () => number): T[] {
  const copy = [...arr]
  const out: T[] = []
  for (let i = 0; i < n && copy.length > 0; i++) {
    const idx = Math.floor(rng() * copy.length)
    out.push(copy[idx])
    copy.splice(idx, 1)
  }
  return out
}

async function seedDailyData(
  userId: string,
  dayExerciseMap: Map<number, SeededDayExercise[]>,
): Promise<void> {
  const rng = makeRng(0xfa15d600)

  const today = new Date()
  const thisWeekStart = startOfWeekMonday(today)
  const startDate = addDays(thisWeekStart, -7 * (WEEKS - 1))

  let dailyLogsInserted = 0
  let foodEntriesInserted = 0
  let workoutLogsInserted = 0

  for (let week = 0; week < WEEKS; week++) {
    for (let weekday = 0; weekday < 7; weekday++) {
      const date = addDays(startDate, week * 7 + weekday)
      // Stop generating data for "the future" — don't seed past today.
      if (toIsoDate(date) > toIsoDate(today)) break

      const dow = date.getDay()
      const isWorkoutDay = dayExerciseMap.has(dow)
      // Mark roughly 90% of planned workouts as completed so the AI
      // analysis has something realistic to work with.
      const completed = isWorkoutDay && rng() < 0.9

      const { data: dailyLog, error: dailyLogError } = await supabase
        .from('daily_logs')
        .insert({
          user_id: userId,
          date: toIsoDate(date),
          workout_completed: completed,
        })
        .select('id')
        .single()
      if (dailyLogError || !dailyLog) {
        throw new Error(`Failed to insert daily_log: ${dailyLogError?.message}`)
      }
      dailyLogsInserted++

      // Food entries — 3 main meals + 0-2 snacks per day.
      const mealsToday = pickN(
        MEAL_TEMPLATES,
        3 + Math.floor(rng() * 3),
        rng,
      )
      const foodInserts = mealsToday.map((m) => ({
        daily_log_id: dailyLog.id,
        food_name: m.food_name,
        calories: m.calories,
        protein: m.protein,
        carbs: m.carbs,
        fat: m.fat,
        amount: m.amount,
        meal_type: m.meal_type,
      }))
      if (foodInserts.length > 0) {
        const { error: foodError } = await supabase
          .from('food_entries')
          .insert(foodInserts)
        if (foodError) {
          throw new Error(`Failed to insert food_entries: ${foodError.message}`)
        }
        foodEntriesInserted += foodInserts.length
      }

      // Workout exercise logs — only if the workout was completed.
      if (completed) {
        const planned = dayExerciseMap.get(dow) ?? []
        const logInserts = planned.map((dx) => {
          // Slight progressive overload: reps drift up a bit over weeks.
          const baseReps = 8 + Math.floor(rng() * 3)
          const repsArr = [
            baseReps + week,
            baseReps + week - 1,
            baseReps + week - 2,
            baseReps + week - 2,
          ].map((r) => Math.max(4, r))
          const baseWeight = 30 + Math.floor(rng() * 30) // 30-60 kg
          const weightsArr = repsArr.map(
            (_, i) => baseWeight + week * 1.5 - i * 1.25,
          )
          return {
            daily_log_id: dailyLog.id,
            exercise_id: dx.exercise_id,
            sets_completed: repsArr.length,
            reps_completed: repsArr,
            weight_used: weightsArr.map((w) => Math.round(w * 10) / 10),
          }
        })
        if (logInserts.length > 0) {
          const { error: logError } = await supabase
            .from('workout_exercise_logs')
            .insert(logInserts)
          if (logError) {
            throw new Error(
              `Failed to insert workout_exercise_logs: ${logError.message}`,
            )
          }
          workoutLogsInserted += logInserts.length
        }
      }
    }
  }

  console.log(
    `Daily logs: ${dailyLogsInserted} | Food entries: ${foodEntriesInserted} | Workout logs: ${workoutLogsInserted}`,
  )
}

// -----------------------------------------------------------------------------
// Weight logs (declining trend, ~3 entries/week)
// -----------------------------------------------------------------------------

async function seedWeightLogs(userId: string): Promise<void> {
  const rng = makeRng(0xbeefcafe)
  const today = new Date()
  const thisWeekStart = startOfWeekMonday(today)
  const startDate = addDays(thisWeekStart, -7 * (WEEKS - 1))

  // Linear decline from 90.5 -> ~87.2 kg over the window, with small
  // day-to-day noise.
  const startWeight = 90.5
  const endWeight = 87.2
  const totalDays = WEEKS * 7
  const dailyDelta = (endWeight - startWeight) / totalDays

  const inserts: Array<{ user_id: string; date: string; weight: number }> = []
  for (let week = 0; week < WEEKS; week++) {
    // 3 entries per week — Mon/Wed/Fri.
    for (const offset of [0, 2, 4]) {
      const date = addDays(startDate, week * 7 + offset)
      if (toIsoDate(date) > toIsoDate(today)) break

      const dayIndex = week * 7 + offset
      const baseline = startWeight + dailyDelta * dayIndex
      const noise = (rng() - 0.5) * 0.4 // ±0.2 kg
      const weight = Math.round((baseline + noise) * 10) / 10

      inserts.push({
        user_id: userId,
        date: toIsoDate(date),
        weight,
      })
    }
  }

  if (inserts.length === 0) return

  const { error } = await supabase
    .from('weight_logs')
    .insert(inserts)
  if (error) {
    throw new Error(`Failed to insert weight_logs: ${error.message}`)
  }

  // Sync the latest weight onto the profile so the dashboard reflects
  // the current state.
  const latest = inserts[inserts.length - 1]
  await supabase
    .from('profiles')
    .update({
      weight: latest.weight,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)

  console.log(`Weight logs: ${inserts.length} entries, latest ${latest.weight} kg.`)
}

// -----------------------------------------------------------------------------
// Weekly AI analysis (one historical entry — last week)
// -----------------------------------------------------------------------------

async function seedWeeklyAnalysis(userId: string): Promise<void> {
  const today = new Date()
  const thisWeekStart = startOfWeekMonday(today)
  const lastWeekStart = addDays(thisWeekStart, -7)
  const lastWeekEnd = addDays(lastWeekStart, 6)

  const { error } = await supabase
    .from('weekly_analyses')
    .insert({
      user_id: userId,
      week_start: toIsoDate(lastWeekStart),
      week_end: toIsoDate(lastWeekEnd),
      workouts_completed: 3,
      avg_calories: 2150,
      weight_change: -0.6,
      ai_analysis:
        'Kiváló hét volt! Mindhárom tervezett edzést teljesítetted, és sikerült a kalóriabevitelt a célon belül tartani. A 0,6 kg-os fogyás reális ütemű, ami fenntartható eredményt biztosít.',
      ai_suggestions: [
        'Próbálj minden edzésnap után 30g fehérjét fogyasztani a regenerációhoz.',
        'A láb napon emeld a guggolás súlyát 2,5 kg-mal a következő héten.',
        'Iktass be heti 1 aktív pihenőnapot, pl. 30 perc tempós sétát.',
      ],
      ai_rating: 8,
    })
  if (error) {
    throw new Error(`Failed to insert weekly_analyses: ${error.message}`)
  }
  console.log('Historical weekly AI analysis seeded.')
}

// -----------------------------------------------------------------------------
// Main
// -----------------------------------------------------------------------------

async function main(): Promise<void> {
  console.log('=== FitTrack Pro — Demo User Seed ===')
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
  console.log(`Login at /login with ${DEMO_EMAIL} / ${DEMO_PASSWORD}`)
}

main().catch((err) => {
  console.error('\nDemo seed failed:', err)
  process.exit(1)
})
