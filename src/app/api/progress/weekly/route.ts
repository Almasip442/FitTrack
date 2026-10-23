import { NextResponse } from 'next/server'

import { getWeeklyProgressBundle, startOfWeekMonday, toIsoDate } from '@/lib/analysis/weekly-metrics'
import { createClient } from '@/lib/supabase/server'

const MAX_HISTORY_WEEKS = 52

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Bejelentkezés szükséges.' }, { status: 401 })
  }

  const requested = new URL(request.url).searchParams.get('week_start')
  if (!requested || !/^\d{4}-\d{2}-\d{2}$/.test(requested)) {
    return NextResponse.json({ error: 'Érvénytelen hét.' }, { status: 400 })
  }

  const selectedMonday = new Date(`${requested}T12:00:00`)
  if (!Number.isFinite(selectedMonday.getTime()) || toIsoDate(selectedMonday) !== requested ||
      toIsoDate(startOfWeekMonday(selectedMonday)) !== requested) {
    return NextResponse.json({ error: 'A hét kezdőnapja hétfő kell legyen.' }, { status: 400 })
  }

  const currentMonday = startOfWeekMonday(new Date())
  const earliestAllowed = new Date(currentMonday)
  earliestAllowed.setDate(earliestAllowed.getDate() - 7 * (MAX_HISTORY_WEEKS - 1))
  if (selectedMonday < earliestAllowed || selectedMonday > currentMonday) {
    return NextResponse.json({ error: 'Ez a hét nem választható ki.' }, { status: 400 })
  }

  try {
    const bundle = await getWeeklyProgressBundle(user.id, new Date(), requested)
    return NextResponse.json({ current: bundle.current, previous: bundle.previous })
  } catch (error) {
    console.error('[Weekly progress] Could not load selected week:', error)
    return NextResponse.json({ error: 'Nem sikerült betölteni a kiválasztott hetet.' }, { status: 500 })
  }
}
