'use client'

import { useState, useTransition } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { CheckCircle, Dumbbell, Moon } from 'lucide-react'

import { Button, buttonVariants } from '@/components/ui/button'
import { slideUp } from '@/lib/animations'
import { completeTodayWorkout } from '@/lib/dashboard/actions'
import { cn } from '@/lib/utils'
import type { DashboardTodayWorkout } from '@/lib/dashboard/queries'

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

interface WorkoutWidgetProps {
  workout: DashboardTodayWorkout
}

/* -------------------------------------------------------------------------- */
/*  Exercise row                                                               */
/* -------------------------------------------------------------------------- */

function ExerciseRow({
  name,
  sets,
  reps,
  index,
}: {
  name: string
  sets: number | null
  reps: number | null
  index: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{
        duration: 0.3,
        ease: [0.22, 1, 0.36, 1],
        delay: 0.1 + index * 0.05,
      }}
      className="flex items-center justify-between py-2 border-b border-border last:border-0"
    >
      <div className="flex items-center gap-2.5">
        <span className="font-condensed text-[10px] text-muted-foreground w-4 tabular-nums">
          {index + 1}.
        </span>
        <span className="text-sm font-medium">{name}</span>
      </div>
      {(sets !== null || reps !== null) && (
        <span className="font-condensed text-xs font-bold tracking-wide-display text-muted-foreground bg-secondary px-2 py-0.5 rounded-md">
          {sets ?? '?'}×{reps ?? '?'}
        </span>
      )}
    </motion.div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Main component                                                             */
/* -------------------------------------------------------------------------- */

export function WorkoutWidget({ workout }: WorkoutWidgetProps) {
  const [optimisticCompleted, setOptimisticCompleted] = useState(
    workout.isCompleted,
  )
  const [isPending, startTransition] = useTransition()

  const handleComplete = () => {
    setOptimisticCompleted(true)
    startTransition(async () => {
      await completeTodayWorkout()
    })
  }

  return (
    <motion.div
      variants={slideUp}
      initial="hidden"
      animate="visible"
      transition={{ delay: 0.05 }}
      className={cn(
        'flex flex-col gap-4 rounded-xl border bg-card p-5 text-card-foreground shadow-sm',
        'dark:bg-[#1a1a1a] dark:border-[#2a2a2a]',
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h3 className="font-condensed text-sm font-bold uppercase tracking-wide-display text-muted-foreground">
            Mai edzés
          </h3>
          {workout.plan && (
            <p className="font-condensed text-xs text-muted-foreground">
              {workout.plan.name}
            </p>
          )}
        </div>

        {optimisticCompleted && (
          <span className="flex items-center gap-1.5 font-condensed text-xs font-bold uppercase tracking-wide-display text-emerald-500 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-full">
            <CheckCircle className="size-3.5 stroke-[1.5]" />
            Elvégezve
          </span>
        )}
      </div>

      {/* No plan */}
      {!workout.hasActivePlan && (
        <div className="flex flex-col items-center justify-center gap-3 py-6 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-muted">
            <Dumbbell className="size-6 stroke-[1.5] text-muted-foreground" />
          </div>
          <div className="flex flex-col gap-1">
            <p className="font-condensed text-base font-bold uppercase tracking-display">
              Még nincs edzésterved
            </p>
            <p className="text-sm text-muted-foreground">
              Hozz létre egy edzéstervet a haladáshoz.
            </p>
          </div>
          <Link
            href="/workouts"
            className={cn(
              buttonVariants({ variant: 'outline', size: 'sm' }),
              'font-condensed uppercase tracking-wide-display',
            )}
          >
            Edzéstervező
          </Link>
        </div>
      )}

      {/* Rest day */}
      {workout.hasActivePlan && workout.isRestDay && (
        <div className="flex flex-col items-center justify-center gap-3 py-6 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-muted">
            <Moon className="size-6 stroke-[1.5] text-muted-foreground" />
          </div>
          <div className="flex flex-col gap-1">
            <p className="font-condensed text-base font-bold uppercase tracking-display">
              Ma pihenőnap
            </p>
            <p className="text-sm text-muted-foreground">
              Regenerálódj — a pihenés is az edzés része.
            </p>
          </div>
        </div>
      )}

      {/* Exercises */}
      {workout.hasActivePlan && !workout.isRestDay && workout.day && (
        <>
          <div className="flex flex-col">
            <div className="mb-1">
              <span className="font-condensed text-xs font-bold uppercase tracking-wide-display text-brand-red">
                {workout.day.day_name}
              </span>
            </div>
            <div className="flex flex-col">
              {workout.exercises.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  Nincs hozzárendelt gyakorlat.
                </p>
              ) : (
                workout.exercises.map((ex, i) => (
                  <ExerciseRow
                    key={ex.id}
                    name={ex.name_hu}
                    sets={ex.sets}
                    reps={ex.reps}
                    index={i}
                  />
                ))
              )}
            </div>
          </div>

          {/* Complete button */}
          <div className="mt-auto pt-1">
            {optimisticCompleted ? (
              <div className="flex items-center justify-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 py-2.5 text-emerald-500">
                <CheckCircle className="size-4 stroke-[1.5]" />
                <span className="font-condensed text-sm font-bold uppercase tracking-wide-display">
                  Edzés elvégezve
                </span>
              </div>
            ) : (
              <Button
                onClick={handleComplete}
                disabled={isPending}
                className={cn(
                  'w-full font-condensed uppercase tracking-wide-display',
                  'bg-[rgba(120,0,0,0.1)] border border-[rgba(120,0,0,0.35)]',
                  'text-brand-red hover:bg-[rgba(120,0,0,0.2)] hover:border-brand-red',
                  'transition-all duration-200',
                )}
              >
                {isPending ? 'Mentés...' : 'Kész vagyok!'}
              </Button>
            )}
          </div>
        </>
      )}
    </motion.div>
  )
}
