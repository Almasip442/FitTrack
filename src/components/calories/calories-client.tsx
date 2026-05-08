'use client'

import { motion } from 'framer-motion'
import { CalendarDays, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'

import { DailySummaryCard } from '@/components/calories/daily-summary-card'
import { MealSection } from '@/components/calories/meal-section'
import { WeeklyTrendChart } from '@/components/calories/weekly-trend-chart'
import { Button } from '@/components/ui/button'
import { fadeIn, slideUpSm, staggerChildren } from '@/lib/animations'
import {
  addDays,
  compareIso,
  formatHungarianDate,
  isToday,
  relativeLabel,
  todayIso,
} from '@/lib/calories/format'
import { MEAL_TYPES, type MealType } from '@/lib/calories/meal-types'
import type {
  CalorieTrendPoint,
  DailySummary,
} from '@/lib/calories/queries'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import type { DailyLog, FoodEntry } from '@/types/database'

interface CaloriesClientProps {
  initialDate: string
  calorieTarget: number
  initialDailyLog: DailyLog | null
  initialEntries: FoodEntry[]
  initialWeeklyTrend: CalorieTrendPoint[]
}

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function summarise(entries: FoodEntry[]): DailySummary {
  return {
    total_calories: entries.reduce((a, e) => a + (e.calories ?? 0), 0),
    total_protein: entries.reduce((a, e) => a + (e.protein ?? 0), 0),
    total_carbs: entries.reduce((a, e) => a + (e.carbs ?? 0), 0),
    total_fat: entries.reduce((a, e) => a + (e.fat ?? 0), 0),
  }
}

/* -------------------------------------------------------------------------- */
/*  Component                                                                  */
/* -------------------------------------------------------------------------- */

export function CaloriesClient({
  initialDate,
  calorieTarget,
  initialDailyLog,
  initialEntries,
  initialWeeklyTrend,
}: CaloriesClientProps) {
  const supabase = useMemo(() => createClient(), [])

  /* ----- Per-date state ---------------------------------------------------- */

  const [date, setDate] = useState<string>(initialDate)
  const [dailyLog, setDailyLog] = useState<DailyLog | null>(initialDailyLog)
  const [entries, setEntries] = useState<FoodEntry[]>(initialEntries)
  const [isLoadingDay, setIsLoadingDay] = useState(false)

  /* ----- Trend state (re-fetched after every mutation) -------------------- */

  const [trend, setTrend] = useState<CalorieTrendPoint[]>(initialWeeklyTrend)

  /* ----- Derived ----------------------------------------------------------- */

  const summary = useMemo(() => summarise(entries), [entries])
  const isFutureDate = compareIso(date, todayIso()) > 0
  const isOnToday = isToday(date)

  /* ----- Track the latest fetch sequence to prevent stale writes ---------- */
  const fetchSeqRef = useRef(0)

  /* ----- Coalesce concurrent ensureDailyLog calls -------------------------- */
  // If the user opens several meal sections in quick succession, each one
  // calls `ensureDailyLog`. Without coalescing, each call would fire its own
  // upsert+select round-trip and race against the others. We share a single
  // in-flight promise per render-cycle so all concurrent callers resolve
  // with the same daily-log id.
  const dailyLogPromiseRef = useRef<Promise<string | null> | null>(null)

  /* ----- Keep the per-date data fresh when `date` changes ------------------ */

  const fetchDay = useCallback(
    async (target: string) => {
      const seq = ++fetchSeqRef.current
      setIsLoadingDay(true)
      try {
        // 1) Resolve the user (RLS gates everything below).
        const { data: userData } = await supabase.auth.getUser()
        const userId = userData.user?.id
        if (!userId) {
          if (seq === fetchSeqRef.current) {
            setDailyLog(null)
            setEntries([])
            setIsLoadingDay(false)
          }
          return
        }

        // 2) Look up the daily log (no upsert — keep empty days clean).
        const { data: log, error: logError } = await supabase
          .from('daily_logs')
          .select('*')
          .eq('user_id', userId)
          .eq('date', target)
          .maybeSingle()

        if (logError) throw new Error(logError.message)

        if (!log) {
          if (seq === fetchSeqRef.current) {
            setDailyLog(null)
            setEntries([])
          }
          return
        }

        // 3) Load the entries in one round-trip.
        const { data: rows, error: rowsError } = await supabase
          .from('food_entries')
          .select('*')
          .eq('daily_log_id', log.id)
          .order('created_at', { ascending: true })

        if (rowsError) throw new Error(rowsError.message)

        if (seq === fetchSeqRef.current) {
          setDailyLog(log)
          setEntries(rows ?? [])
        }
      } catch (err: unknown) {
        if (seq === fetchSeqRef.current) {
          const msg = err instanceof Error ? err.message : 'Ismeretlen hiba'
          toast.error(`Nem sikerült betölteni a napot: ${msg}`)
          setDailyLog(null)
          setEntries([])
        }
      } finally {
        if (seq === fetchSeqRef.current) setIsLoadingDay(false)
      }
    },
    [supabase],
  )

  // Effect: when `date` changes (and isn't the initial), fetch the new day.
  // We deliberately key on `date` only — the initial render is hydrated
  // from props, so the very first mount must NOT trigger a fetch.
  const isFirstRenderRef = useRef(true)
  useEffect(() => {
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false
      return
    }
    fetchDay(date)
  }, [date, fetchDay])

  /* ----- Trend re-fetch after a mutation ---------------------------------- */

  const refetchTrend = useCallback(async () => {
    try {
      const { data: userData } = await supabase.auth.getUser()
      const userId = userData.user?.id
      if (!userId) return

      const today = new Date()
      const start = new Date(today)
      start.setDate(today.getDate() - 6)

      const toIso = (d: Date) => {
        const y = d.getFullYear()
        const m = String(d.getMonth() + 1).padStart(2, '0')
        const dd = String(d.getDate()).padStart(2, '0')
        return `${y}-${m}-${dd}`
      }

      const { data, error } = await supabase
        .from('daily_logs')
        .select('date, food_entries ( calories )')
        .eq('user_id', userId)
        .gte('date', toIso(start))
        .lte('date', toIso(today))

      if (error) return

      type Row = {
        date: string
        food_entries: { calories: number | null }[] | null
      }
      const totals = new Map<string, number>()
      for (const row of (data as unknown as Row[] | null) ?? []) {
        const sum = (row.food_entries ?? []).reduce(
          (acc, e) => acc + (typeof e.calories === 'number' ? e.calories : 0),
          0,
        )
        totals.set(row.date, sum)
      }
      const series: CalorieTrendPoint[] = []
      for (let i = 0; i < 7; i++) {
        const d = new Date(start)
        d.setDate(start.getDate() + i)
        const iso = toIso(d)
        series.push({ date: iso, total_calories: totals.get(iso) ?? 0 })
      }
      setTrend(series)
    } catch {
      // Silent — the trend chart is non-critical.
    }
  }, [supabase])

  /* ----- Lazy daily-log creation on first food add ----------------------- */

  const ensureDailyLog = useCallback((): Promise<string | null> => {
    if (dailyLog) return Promise.resolve(dailyLog.id)
    // Reuse the in-flight promise if another caller already kicked off the
    // upsert+select. This collapses N parallel attempts into a single
    // round-trip and guarantees they all see the same daily-log id.
    if (dailyLogPromiseRef.current) return dailyLogPromiseRef.current

    const promise = (async (): Promise<string | null> => {
      try {
        const { data: userData } = await supabase.auth.getUser()
        const userId = userData.user?.id
        if (!userId) {
          toast.error('Bejelentkezés szükséges.')
          return null
        }
        // Idempotent upsert on (user_id, date).
        const { error: upsertError } = await supabase
          .from('daily_logs')
          .upsert(
            { user_id: userId, date },
            { onConflict: 'user_id,date', ignoreDuplicates: true },
          )
        if (upsertError) throw new Error(upsertError.message)

        const { data: log, error } = await supabase
          .from('daily_logs')
          .select('*')
          .eq('user_id', userId)
          .eq('date', date)
          .single()

        if (error || !log) throw new Error(error?.message ?? 'no row')

        setDailyLog(log)
        return log.id
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Ismeretlen hiba'
        toast.error(`Nem sikerült létrehozni a naplót: ${msg}`)
        return null
      }
    })().finally(() => {
      // Release the cached promise so the next genuinely-new call (e.g.
      // after the user navigates to a different date) starts fresh.
      dailyLogPromiseRef.current = null
    })

    dailyLogPromiseRef.current = promise
    return promise
  }, [dailyLog, supabase, date])

  /* ----- Mutation handlers ------------------------------------------------ */

  const handleEntryAdded = useCallback(
    (entry: FoodEntry) => {
      setEntries((prev) => [...prev, entry])
      void refetchTrend()
    },
    [refetchTrend],
  )

  const handleEntryDeleted = useCallback(
    (id: string) => {
      setEntries((prev) => prev.filter((e) => e.id !== id))
      void refetchTrend()
    },
    [refetchTrend],
  )

  const handleEntryUpdated = useCallback(
    (entry: FoodEntry) => {
      setEntries((prev) => prev.map((e) => (e.id === entry.id ? entry : e)))
      void refetchTrend()
    },
    [refetchTrend],
  )

  const handleOpenSheet = useCallback(
    async (_meal: MealType): Promise<string | null> => {
      void _meal
      return ensureDailyLog()
    },
    [ensureDailyLog],
  )

  /* ----- Date nav --------------------------------------------------------- */

  const goPrev = () => setDate(addDays(date, -1))
  const goNext = () => {
    if (isFutureDate) return
    if (isOnToday) return
    setDate(addDays(date, 1))
  }
  const goToday = () => {
    if (!isOnToday) setDate(todayIso())
  }

  /* ----- Group entries by meal-type --------------------------------------- */

  const entriesByMealType = useMemo(() => {
    const map = new Map<MealType, FoodEntry[]>()
    MEAL_TYPES.forEach((m) => map.set(m.value, []))
    for (const entry of entries) {
      const meal = (entry.meal_type ?? 'snack') as MealType
      const list = map.get(meal) ?? []
      list.push(entry)
      map.set(meal, list)
    }
    return map
  }, [entries])

  const isCompletelyEmpty = entries.length === 0

  /* ----- Render ----------------------------------------------------------- */

  return (
    <motion.div
      variants={fadeIn}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      {/* ---------- Page header ---------- */}
      <header className="flex flex-col gap-2">
        <span className="font-condensed text-[11px] uppercase tracking-wide-display text-brand-red">
          {'// 03 / Kalória'}
        </span>
        <h1
          className={cn(
            'font-condensed text-3xl sm:text-4xl md:text-5xl font-extrabold uppercase',
            'tracking-display text-foreground leading-none',
          )}
        >
          Kalóriakövetés
        </h1>
        <span aria-hidden="true" className="block h-px w-12 bg-brand-red" />
        <p className="mt-1 max-w-2xl font-sans text-sm text-muted-foreground">
          Rögzítsd, amit eszel, és kövesd a kalória- és makrobevitelt
          étkezésenként. A célt a profilodban beállított adatokból számoljuk.
        </p>
      </header>

      {/* ---------- Date navigator ---------- */}
      <DateNavigator
        date={date}
        onPrev={goPrev}
        onNext={goNext}
        onToday={goToday}
        isOnToday={isOnToday}
        isLoading={isLoadingDay}
      />

      {/* ---------- Daily summary ---------- */}
      <DailySummaryCard
        consumed={summary.total_calories}
        target={calorieTarget}
        summary={summary}
        isLoading={isLoadingDay}
      />

      {/* ---------- Empty-day notice ---------- */}
      {isCompletelyEmpty && !isLoadingDay && (
        <motion.div
          variants={slideUpSm}
          initial="hidden"
          animate="visible"
          className={cn(
            'rounded-md border border-dashed border-border/70 bg-card/30 px-5 py-4',
            'flex items-center gap-3',
          )}
        >
          <CalendarDays className="size-4 shrink-0 text-brand-red" />
          <div className="min-w-0">
            <p className="font-condensed text-sm uppercase tracking-wide-display text-foreground">
              {isOnToday
                ? 'Ma még nem rögzítettél ételt'
                : 'Ezen a napon nincs rögzített étel'}
            </p>
            <p className="mt-0.5 font-sans text-xs text-muted-foreground">
              Adj hozzá ételt valamelyik étkezéshez lent.
            </p>
          </div>
        </motion.div>
      )}

      {/* ---------- Meal sections ---------- */}
      <motion.div
        key={`meals:${date}`}
        variants={staggerChildren}
        initial="hidden"
        animate="visible"
        className="grid gap-4 sm:grid-cols-2"
      >
        {MEAL_TYPES.map((meta) => (
          <motion.div key={meta.value} variants={slideUpSm}>
            <MealSection
              meta={meta}
              entries={entriesByMealType.get(meta.value) ?? []}
              dailyLogId={dailyLog?.id ?? null}
              onOpenSheet={handleOpenSheet}
              onEntryAdded={handleEntryAdded}
              onEntryDeleted={handleEntryDeleted}
              onEntryUpdated={handleEntryUpdated}
            />
          </motion.div>
        ))}
      </motion.div>

      {/* ---------- Weekly trend ---------- */}
      <WeeklyTrendChart data={trend} target={calorieTarget} />
    </motion.div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Date navigator                                                            */
/* -------------------------------------------------------------------------- */

function DateNavigator({
  date,
  onPrev,
  onNext,
  onToday,
  isOnToday,
  isLoading,
}: {
  date: string
  onPrev: () => void
  onNext: () => void
  onToday: () => void
  isOnToday: boolean
  isLoading: boolean
}) {
  const relative = relativeLabel(date)
  const long = formatHungarianDate(date)

  return (
    <div
      className={cn(
        'flex items-center justify-between gap-3 rounded-md border border-border bg-card/40',
        'px-3 py-2 sm:px-4 sm:py-2.5',
      )}
    >
      <button
        type="button"
        onClick={onPrev}
        aria-label="Előző nap"
        className={cn(
          'flex shrink-0 items-center justify-center rounded-md p-2',
          'text-muted-foreground transition-colors hover:bg-brand-red-muted hover:text-brand-red',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
        )}
      >
        <ChevronLeft className="size-4" />
      </button>

      <div className="flex min-w-0 flex-1 items-center justify-center gap-2">
        {isLoading ? (
          <Loader2 className="size-3.5 shrink-0 animate-spin text-brand-red" />
        ) : (
          <span
            aria-hidden="true"
            className="size-1.5 shrink-0 rounded-full bg-brand-red"
          />
        )}
        <div className="flex min-w-0 flex-col items-center text-center">
          <span className="font-condensed text-[10px] uppercase tracking-wide-display text-muted-foreground/60">
            {relative ?? 'Nap'}
          </span>
          <span className="truncate font-condensed text-sm sm:text-base font-bold uppercase tracking-display text-foreground">
            {long}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={onToday}
          disabled={isOnToday}
          className={cn(
            'font-condensed text-[11px] uppercase tracking-wide-display',
            !isOnToday && 'border border-brand-red-border bg-brand-red-muted text-brand-red hover:bg-brand-red hover:text-white',
          )}
        >
          Ma
        </Button>

        <button
          type="button"
          onClick={onNext}
          aria-label="Következő nap"
          disabled={isOnToday}
          className={cn(
            'flex shrink-0 items-center justify-center rounded-md p-2 transition-colors',
            'text-muted-foreground hover:bg-brand-red-muted hover:text-brand-red',
            'disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-muted-foreground',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
          )}
        >
          <ChevronRight className="size-4" />
        </button>
      </div>
    </div>
  )
}
