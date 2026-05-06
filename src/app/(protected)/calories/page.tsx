/**
 * /calories — calorie tracker (server component).
 *
 * Frontend Iteration 7. Loads today's daily log, food entries, summary,
 * and weekly trend on the server, then hands off to the client wrapper
 * for date navigation and interactive editing.
 *
 * The daily log row is *not* eagerly created here — it is upserted via
 * `getOrCreateDailyLog` only when the user actually adds the first
 * food, so empty days don't pollute the table.
 */

import { redirect } from 'next/navigation'

import { CaloriesClient } from '@/components/calories/calories-client'
import { calculateCalorieTarget } from '@/lib/calories'
import { todayIso } from '@/lib/calories/format'
import {
  getDailyLog,
  getFoodEntriesForLog,
  getWeeklyCalorieTrend,
  type CalorieTrendPoint,
} from '@/lib/calories/queries'
import { getProfile } from '@/lib/profile/queries'
import { createClient } from '@/lib/supabase/server'
import type { FoodEntry } from '@/types/database'

export const metadata = {
  title: 'Kalória — FitTrack Pro',
  description:
    'Kövesd nyomon a napi kalória- és makrónutriens-bevitelt, étkezésenként.',
}

const FALLBACK_TARGET = 2000

export default async function CaloriesPage() {
  // Defence-in-depth — the protected layout already guards auth, but a
  // direct call to getProfile would otherwise throw if the cookie is gone.
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const profile = await getProfile(user.id)
  const targets = profile ? calculateCalorieTarget(profile) : null
  const calorieTarget = targets?.target ?? FALLBACK_TARGET

  const date = todayIso()

  // Load today's day-side. The log is allowed to be null — the client
  // will create it lazily on first food add.
  const dailyLog = await getDailyLog(date).catch(() => null)

  let entries: FoodEntry[] = []

  if (dailyLog) {
    entries = await getFoodEntriesForLog(dailyLog.id).catch(() => [])
  }

  const weeklyTrend: CalorieTrendPoint[] = await getWeeklyCalorieTrend(7).catch(
    () => [],
  )

  return (
    <CaloriesClient
      initialDate={date}
      calorieTarget={calorieTarget}
      initialDailyLog={dailyLog}
      initialEntries={entries}
      initialWeeklyTrend={weeklyTrend}
    />
  )
}
