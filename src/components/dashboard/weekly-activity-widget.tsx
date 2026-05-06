'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { slideUp } from '@/lib/animations'
import type { DashboardWeeklyActivityPoint } from '@/lib/dashboard/queries'

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

interface WeeklyActivityWidgetProps {
  activity: DashboardWeeklyActivityPoint[]
}

/* -------------------------------------------------------------------------- */
/*  Constants                                                                  */
/* -------------------------------------------------------------------------- */

const DAY_LABELS = ['Hé', 'Ke', 'Sze', 'Csü', 'Pé', 'Szo', 'Va']

/* -------------------------------------------------------------------------- */
/*  Main component                                                             */
/* -------------------------------------------------------------------------- */

export function WeeklyActivityWidget({ activity }: WeeklyActivityWidgetProps) {
  const completed = activity.filter((d) => d.completed).length

  // Today's ISO date for highlighting
  const todayIso = new Date().toLocaleDateString('sv-SE') // YYYY-MM-DD local

  return (
    <motion.div
      variants={slideUp}
      initial="hidden"
      animate="visible"
      transition={{ delay: 0.1 }}
      className={cn(
        'flex flex-col gap-4 rounded-xl border bg-card p-5 text-card-foreground shadow-sm',
        'dark:bg-[#1a1a1a] dark:border-[#2a2a2a]',
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-condensed text-sm font-bold uppercase tracking-wide-display text-muted-foreground">
          Heti aktivitás
        </h3>
        <span className="font-condensed text-xs font-bold text-foreground">
          <span className="text-brand-red">{completed}</span>
          <span className="text-muted-foreground">/7</span>
        </span>
      </div>

      {/* Days grid */}
      {activity.length === 0 ? (
        <p className="py-2 text-center text-sm text-muted-foreground">
          Nincs heti adat.
        </p>
      ) : (
        <div className="flex items-end justify-between gap-1">
          {activity.map((day, i) => {
            const isToday = day.date === todayIso
            const label = DAY_LABELS[i] ?? `N${i + 1}`

            return (
              <div key={day.date} className="flex flex-1 flex-col items-center gap-1.5">
                <motion.div
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{
                    duration: 0.3,
                    ease: [0.22, 1, 0.36, 1],
                    delay: 0.05 * i,
                  }}
                  className={cn(
                    'size-8 rounded-full border-2 transition-all duration-200',
                    day.completed
                      ? 'bg-brand-red border-brand-red'
                      : 'bg-transparent border-[#404040]',
                    isToday && !day.completed && 'border-foreground',
                    isToday && day.completed && 'ring-2 ring-white/30',
                  )}
                  title={day.date}
                />
                <span
                  className={cn(
                    'font-condensed text-[10px] uppercase tracking-wide-display',
                    isToday
                      ? 'text-foreground font-bold'
                      : 'text-muted-foreground',
                  )}
                >
                  {label}
                </span>
              </div>
            )
          })}
        </div>
      )}

      {/* Summary text */}
      <p className="text-xs text-muted-foreground text-center">
        {completed === 0
          ? 'Még nincs elvégzett edzés ezen a héten.'
          : completed === 7
            ? 'Tökéletes hét — minden edzés teljesítve!'
            : `${completed} edzés teljesítve ezen a héten.`}
      </p>
    </motion.div>
  )
}
