import { createClient } from '@/lib/supabase/server'
import { getDashboardData } from '@/lib/dashboard/queries'
import { CaloriesWidget } from '@/components/dashboard/calories-widget'
import { WorkoutWidget } from '@/components/dashboard/workout-widget'
import { WeeklyActivityWidget } from '@/components/dashboard/weekly-activity-widget'
import { WeightTrendWidget } from '@/components/dashboard/weight-trend-widget'
import { AiAnalysisWidget } from '@/components/dashboard/ai-analysis-widget'
import { QuickNav } from '@/components/dashboard/quick-nav'

/* -------------------------------------------------------------------------- */
/*  Hungarian day names                                                        */
/* -------------------------------------------------------------------------- */

const HU_DAYS = [
  'vasárnap',
  'hétfő',
  'kedd',
  'szerda',
  'csütörtök',
  'péntek',
  'szombat',
] as const

function formatHungarianDate(date: Date): string {
  const dayName = HU_DAYS[date.getDay()]
  const month = date.getMonth() + 1
  const day = date.getDate()
  return `${date.getFullYear()}. ${month.toString().padStart(2, '0')}. ${day.toString().padStart(2, '0')}.`
}

/* -------------------------------------------------------------------------- */
/*  Dashboard page — Server Component                                          */
/* -------------------------------------------------------------------------- */

export default async function DashboardPage() {
  const [supabase, dashboardData] = await Promise.all([
    createClient(),
    getDashboardData(),
  ])

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Resolve display name
  const {
    data: profileRow,
  } = await supabase
    .from('profiles')
    .select('name')
    .eq('id', user?.id ?? '')
    .maybeSingle()

  const displayName = profileRow?.name ?? user?.email?.split('@')[0] ?? 'Felhasználó'

  const now = new Date()
  const todayFormatted = formatHungarianDate(now)
  const dayName = HU_DAYS[now.getDay()]

  return (
    <div className="flex flex-col gap-6">
      {/* Greeting bar */}
      <div className="flex flex-col gap-1">
        <h1 className="font-condensed text-2xl font-extrabold uppercase tracking-display sm:text-3xl">
          Szia, {displayName}!
        </h1>
        <p className="font-condensed text-sm text-muted-foreground capitalize">
          Ma {dayName} van &mdash;{' '}
          <span className="text-foreground">{todayFormatted}</span>
        </p>
      </div>

      {/* Widget grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Calories widget — col 1 */}
        <CaloriesWidget calories={dashboardData.todayCalories} />

        {/* Workout widget — col-span-2 on lg */}
        <div className="sm:col-span-2 lg:col-span-2">
          <WorkoutWidget workout={dashboardData.todayWorkout} />
        </div>

        {/* Weekly activity */}
        <WeeklyActivityWidget activity={dashboardData.weeklyActivity} />

        {/* Weight trend */}
        <WeightTrendWidget
          weightTrend={dashboardData.weightTrend}
          currentWeight={dashboardData.currentWeight}
          weightChange={dashboardData.weightChange}
        />

        {/* AI analysis */}
        <AiAnalysisWidget analysis={dashboardData.latestAnalysis} />
      </div>

      {/* Quick navigation */}
      <QuickNav />
    </div>
  )
}
