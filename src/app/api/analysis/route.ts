import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { calculateCalorieTarget } from '@/lib/calories'
import type { Profile } from '@/types/database'

// ---------------------------------------------------------------------
// POST /api/analysis
//
// Generate the weekly AI analysis for the authenticated user.
//
// Backend Iteration 12 / Tasks 12.1 – 12.6.
//
// Pipeline:
//   1. Auth check (cookie-bound Supabase client)
//   2. Rate limit — 1 row per user per ISO-week (week_start = Monday)
//   3. Collect last-7-days metrics in parallel
//   4. Build system + user prompt
//   5. Call OpenRouter (free Nemotron model) with json_object response
//   6. Validate the JSON payload
//   7. Insert into weekly_analyses and return the row to the client
//
// Errors:
//   401  unauthenticated
//   429  analysis already exists for the current week
//   500  unexpected database failure
//   502  OpenRouter responded but the JSON payload was unusable
//   503  OpenRouter unreachable / timed out / non-OK / API key missing
// ---------------------------------------------------------------------

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'
const OPENROUTER_MODEL = 'nvidia/nemotron-3-super-120b-a12b:free'
const OPENROUTER_TIMEOUT_MS = 30_000
const APP_URL = 'https://fittrack-pro.vercel.app'
const APP_TITLE = 'FitTrack Pro'

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

type AnalysisResult = {
  summary: string
  suggestions: string[]
  rating: number
}

type WeeklyMetrics = {
  profile: Profile | null
  calorieTarget: number | null
  plannedWorkouts: number
  completedWorkouts: number
  avgCalories: number | null
  weightChange: number | null
  exerciseLogSummary: ExerciseLogSummary
}

type ExerciseLogSummary = {
  totalSets: number
  totalReps: number
  totalVolumeKg: number
  exercises: number
}

/* -------------------------------------------------------------------------- */
/*  Date helpers (Hungarian / Monday-start week, local time)                   */
/* -------------------------------------------------------------------------- */

function toIsoDate(d: Date): string {
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

function startOfWeekMonday(d: Date): Date {
  const out = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  // getDay(): 0 = Sunday, 1 = Monday, ..., 6 = Saturday
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

/* -------------------------------------------------------------------------- */
/*  Metric collection                                                          */
/* -------------------------------------------------------------------------- */

async function collectWeeklyMetrics(
  userId: string,
  weekStartIso: string,
  weekEndIso: string,
): Promise<WeeklyMetrics> {
  const supabase = await createClient()

  const [
    profileRes,
    completedRes,
    activePlanRes,
    foodAggRes,
    weightSeriesRes,
    exerciseLogsRes,
  ] = await Promise.all([
    // Profile (goal + Mifflin-St Jeor inputs)
    supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle(),

    // Completed workouts in the current week
    supabase
      .from('daily_logs')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('workout_completed', true)
      .gte('date', weekStartIso)
      .lte('date', weekEndIso),

    // Active plan -> count its workout_days
    supabase
      .from('workout_plans')
      .select('id, workout_days(id)')
      .eq('user_id', userId)
      .eq('is_active', true)
      .maybeSingle(),

    // Food entries joined through daily_logs in the week (avg kcal/day)
    supabase
      .from('daily_logs')
      .select('date, food_entries ( calories )')
      .eq('user_id', userId)
      .gte('date', weekStartIso)
      .lte('date', weekEndIso),

    // Weight logs in the week, oldest first
    supabase
      .from('weight_logs')
      .select('date, weight')
      .eq('user_id', userId)
      .gte('date', weekStartIso)
      .lte('date', weekEndIso)
      .order('date', { ascending: true }),

    // Workout exercise logs joined through daily_logs in the week.
    // We cannot filter on the parent table directly via PostgREST inner-join
    // syntax in a single chained call, so we filter the inner relation by
    // user_id + date window through a join hint on daily_logs.
    supabase
      .from('workout_exercise_logs')
      .select(
        'sets_completed, reps_completed, weight_used, daily_logs!inner(user_id, date)',
      )
      .eq('daily_logs.user_id', userId)
      .gte('daily_logs.date', weekStartIso)
      .lte('daily_logs.date', weekEndIso),
  ])

  if (profileRes.error) {
    throw new Error(`Failed to load profile: ${profileRes.error.message}`)
  }
  if (completedRes.error) {
    throw new Error(
      `Failed to count completed workouts: ${completedRes.error.message}`,
    )
  }
  if (activePlanRes.error) {
    throw new Error(
      `Failed to load active workout plan: ${activePlanRes.error.message}`,
    )
  }
  if (foodAggRes.error) {
    throw new Error(`Failed to load food entries: ${foodAggRes.error.message}`)
  }
  if (weightSeriesRes.error) {
    throw new Error(
      `Failed to load weight logs: ${weightSeriesRes.error.message}`,
    )
  }
  if (exerciseLogsRes.error) {
    throw new Error(
      `Failed to load workout exercise logs: ${exerciseLogsRes.error.message}`,
    )
  }

  const profile = profileRes.data
  const completedWorkouts = completedRes.count ?? 0

  // Active plan -> planned workouts/week = number of days in the plan
  type ActivePlan = { id: string; workout_days: { id: string }[] | null } | null
  const activePlan = activePlanRes.data as unknown as ActivePlan
  const plannedWorkouts = activePlan?.workout_days?.length ?? 0

  // Average daily calories = mean of per-day kcal sums (only over days
  // that actually have food_entries; days with zero entries are ignored
  // so that a missing log doesn't drag the average toward zero).
  type LogWithEntries = {
    date: string
    food_entries: { calories: number | null }[] | null
  }
  const foodRows = (foodAggRes.data as unknown as LogWithEntries[] | null) ?? []
  const dailyTotals: number[] = []
  for (const row of foodRows) {
    const entries = row.food_entries ?? []
    if (entries.length === 0) continue
    const sum = entries.reduce(
      (acc, e) => acc + (typeof e.calories === 'number' ? e.calories : 0),
      0,
    )
    dailyTotals.push(sum)
  }
  const avgCalories =
    dailyTotals.length > 0
      ? Math.round(
          dailyTotals.reduce((a, b) => a + b, 0) / dailyTotals.length,
        )
      : null

  // Weight change = last - first within the week (null if <2 samples)
  const weightSeries = weightSeriesRes.data ?? []
  const weightChange =
    weightSeries.length >= 2
      ? Math.round(
          (weightSeries[weightSeries.length - 1].weight -
            weightSeries[0].weight) *
            10,
        ) / 10
      : null

  // Exercise log aggregate (used for "izomcsoport-szintű elemzés" prompt enrichment).
  type ExerciseLogRow = {
    sets_completed: number | null
    reps_completed: number[] | null
    weight_used: number[] | null
  }
  const logRows =
    (exerciseLogsRes.data as unknown as ExerciseLogRow[] | null) ?? []

  let totalSets = 0
  let totalReps = 0
  let totalVolumeKg = 0
  for (const row of logRows) {
    const reps = row.reps_completed ?? []
    const weights = row.weight_used ?? []
    totalSets += row.sets_completed ?? reps.length
    for (let i = 0; i < reps.length; i++) {
      const r = reps[i] ?? 0
      const w = weights[i] ?? 0
      totalReps += r
      totalVolumeKg += r * w
    }
  }
  const exerciseLogSummary: ExerciseLogSummary = {
    totalSets,
    totalReps,
    totalVolumeKg: Math.round(totalVolumeKg * 10) / 10,
    exercises: logRows.length,
  }

  // Calorie target via Mifflin-St Jeor when the profile has the inputs.
  const calorieTarget =
    profile && calculateCalorieTarget(profile)?.target != null
      ? (calculateCalorieTarget(profile)?.target ?? null)
      : null

  return {
    profile,
    calorieTarget,
    plannedWorkouts,
    completedWorkouts,
    avgCalories,
    weightChange,
    exerciseLogSummary,
  }
}

/* -------------------------------------------------------------------------- */
/*  Prompt construction                                                        */
/* -------------------------------------------------------------------------- */

const SYSTEM_PROMPT = `Személyi edző és táplálkozási tanácsadó vagy.
Magyarul válaszolj. Légy motiváló, de realista.
Válaszolj KIZÁRÓLAG az alábbi JSON formátumban, semmi más szöveget ne írj:
{
  "summary": "2-3 mondatos összefoglaló az elmúlt hétről",
  "suggestions": ["javaslat 1", "javaslat 2", "javaslat 3"],
  "rating": 7
}`

function formatWeightChange(change: number | null): string {
  if (change == null) return 'nincs adat'
  const sign = change > 0 ? '+' : ''
  return `${sign}${change} kg`
}

function buildUserPrompt(metrics: WeeklyMetrics): string {
  const goal = metrics.profile?.goal ?? 'nincs megadva'
  const calorieTarget =
    metrics.calorieTarget != null
      ? `${metrics.calorieTarget} kcal/nap`
      : 'nincs megadva'
  const avgCalories =
    metrics.avgCalories != null
      ? `${metrics.avgCalories} kcal/nap`
      : 'nincs adat'

  const lines = [
    'Felhasználó adatai az elmúlt héten:',
    `- Cél: ${goal}`,
    `- Tervezett edzések: ${metrics.plannedWorkouts}/hét`,
    `- Elvégzett edzések: ${metrics.completedWorkouts}`,
    `- Kalóriacél: ${calorieTarget}`,
    `- Átlagos bevitel: ${avgCalories}`,
    `- Testsúlyváltozás: ${formatWeightChange(metrics.weightChange)}`,
  ]

  // Add exercise-log detail only when there is something to report.
  if (metrics.exerciseLogSummary.exercises > 0) {
    const s = metrics.exerciseLogSummary
    lines.push(
      `- Edzésnapló: ${s.exercises} gyakorlat, ${s.totalSets} szett, ${s.totalReps} ismétlés, ${s.totalVolumeKg} kg össz-volumen`,
    )
  }

  return lines.join('\n')
}

/* -------------------------------------------------------------------------- */
/*  OpenRouter call                                                            */
/* -------------------------------------------------------------------------- */

type OpenRouterResponse = {
  choices?: Array<{ message?: { content?: string | null } | null } | null>
}

async function callOpenRouter(
  systemPrompt: string,
  userPrompt: string,
): Promise<string | null> {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) return null

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), OPENROUTER_TIMEOUT_MS)

  try {
    const res = await fetch(OPENROUTER_URL, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': APP_URL,
        'X-Title': APP_TITLE,
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_object' },
      }),
    })

    if (!res.ok) return null

    const json = (await res.json()) as OpenRouterResponse
    const content = json.choices?.[0]?.message?.content?.trim()
    return content ? content : null
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

/* -------------------------------------------------------------------------- */
/*  Response validation                                                        */
/* -------------------------------------------------------------------------- */

function parseAnalysis(raw: string): AnalysisResult | null {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return null
  }

  if (!parsed || typeof parsed !== 'object') return null
  const obj = parsed as Record<string, unknown>

  const summary = typeof obj.summary === 'string' ? obj.summary.trim() : ''
  if (!summary) return null

  if (!Array.isArray(obj.suggestions)) return null
  const suggestions = obj.suggestions
    .filter((s): s is string => typeof s === 'string')
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
  if (suggestions.length === 0) return null

  const ratingRaw = obj.rating
  const ratingNum = typeof ratingRaw === 'number' ? ratingRaw : Number(ratingRaw)
  if (!Number.isFinite(ratingNum)) return null
  const rating = Math.round(ratingNum)
  if (rating < 1 || rating > 10) return null

  return { summary, suggestions, rating }
}

/* -------------------------------------------------------------------------- */
/*  Route handler                                                              */
/* -------------------------------------------------------------------------- */

export async function POST() {
  try {
    const supabase = await createClient()

    // 1) Auth ----------------------------------------------------------------
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Bejelentkezés szükséges.' },
        { status: 401 },
      )
    }
    const userId = user.id

    // Compute the ISO week window once and reuse it everywhere.
    const today = new Date()
    const weekStart = startOfWeekMonday(today)
    const weekEnd = addDays(weekStart, 6)
    const weekStartIso = toIsoDate(weekStart)
    const weekEndIso = toIsoDate(weekEnd)

    // 2) Rate limit ----------------------------------------------------------
    const { data: existing, error: existingErr } = await supabase
      .from('weekly_analyses')
      .select('id')
      .eq('user_id', userId)
      .eq('week_start', weekStartIso)
      .maybeSingle()

    if (existingErr) {
      return NextResponse.json(
        { error: 'Adatbázis hiba történt.' },
        { status: 500 },
      )
    }
    if (existing) {
      return NextResponse.json(
        { error: 'Ezen a héten már generáltál elemzést.' },
        { status: 429 },
      )
    }

    // 3) Collect metrics -----------------------------------------------------
    let metrics: WeeklyMetrics
    try {
      metrics = await collectWeeklyMetrics(userId, weekStartIso, weekEndIso)
    } catch {
      return NextResponse.json(
        { error: 'Nem sikerült összegyűjteni a heti adatokat.' },
        { status: 500 },
      )
    }

    // 4) Build prompt --------------------------------------------------------
    const userPrompt = buildUserPrompt(metrics)

    // 5) Call OpenRouter -----------------------------------------------------
    const aiContent = await callOpenRouter(SYSTEM_PROMPT, userPrompt)
    if (!aiContent) {
      return NextResponse.json(
        {
          error:
            'Az AI elemzés jelenleg nem elérhető, próbáld újra később.',
        },
        { status: 503 },
      )
    }

    // 6) Parse + validate ----------------------------------------------------
    const result = parseAnalysis(aiContent)
    if (!result) {
      return NextResponse.json(
        { error: 'Az AI érvénytelen választ adott.' },
        { status: 502 },
      )
    }

    // 7) Persist -------------------------------------------------------------
    const { data: row, error: insertError } = await supabase
      .from('weekly_analyses')
      .insert({
        user_id: userId,
        week_start: weekStartIso,
        week_end: weekEndIso,
        workouts_completed: metrics.completedWorkouts,
        avg_calories: metrics.avgCalories,
        weight_change: metrics.weightChange,
        ai_analysis: result.summary,
        ai_suggestions: result.suggestions,
        ai_rating: result.rating,
      })
      .select('*')
      .single()

    if (insertError || !row) {
      return NextResponse.json(
        { error: 'Nem sikerült elmenteni az elemzést.' },
        { status: 500 },
      )
    }

    return NextResponse.json({
      id: row.id,
      summary: row.ai_analysis,
      suggestions: row.ai_suggestions,
      rating: row.ai_rating,
      week_start: row.week_start,
      week_end: row.week_end,
    })
  } catch (err) {
    // Catch-all for unexpected runtime errors (e.g. cookie store failure,
    // out-of-memory, etc.). Returning a structured 500 keeps the client UX
    // deterministic instead of leaking a raw stack trace.
    const message = err instanceof Error ? err.message : 'Ismeretlen hiba'
    return NextResponse.json(
      { error: 'Belső szerver hiba történt.', details: message },
      { status: 500 },
    )
  }
}
