'use client'

import { motion } from 'framer-motion'
import {
  ArrowRight,
  CheckCircle2,
  Loader2,
  Pencil,
  Plus,
  Sparkles,
  Star,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'

import { CreatePlanDialog } from '@/components/workouts/create-plan-dialog'
import { setActivePlan } from '@/lib/workouts/actions'
import { slideUpSm, staggerChildren } from '@/lib/animations'
import { cn } from '@/lib/utils'
import type { WorkoutPlan } from '@/types/database'

interface WorkoutPlanListProps {
  plans: WorkoutPlan[]
}

export function WorkoutPlanList({ plans: initialPlans }: WorkoutPlanListProps) {
  const router = useRouter()
  // Local copy so we can optimistic-update the active flag without refetch.
  const [plans, setPlans] = useState<WorkoutPlan[]>(initialPlans)
  const [activatingId, setActivatingId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleActivate = (planId: string) => {
    if (isPending) return
    // Optimistic flip — keep prior state in case we need to roll back.
    const prev = plans
    setPlans((current) =>
      current.map((p) => ({ ...p, is_active: p.id === planId })),
    )
    setActivatingId(planId)

    startTransition(async () => {
      const result = await setActivePlan(planId)
      setActivatingId(null)

      if (result.success) {
        toast.success('Aktív tervként megjelölve.')
        router.refresh()
      } else {
        setPlans(prev)
        toast.error(result.error)
      }
    })
  }

  if (plans.length === 0) {
    return <EmptyState />
  }

  return (
    <div className="space-y-6">
      {/* Top action row */}
      <div className="flex items-center justify-between gap-3">
        <span className="font-condensed text-[11px] uppercase tracking-wide-display text-muted-foreground/70">
          {plans.length} {plans.length === 1 ? 'terv' : 'terv'} • {plans.filter((p) => p.is_active).length} aktív
        </span>
        <CreatePlanDialog />
      </div>

      <motion.ul
        variants={staggerChildren}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3"
      >
        {plans.map((plan, idx) => (
          <motion.li key={plan.id} variants={slideUpSm} className="list-none">
            <PlanCard
              plan={plan}
              index={idx + 1}
              isActivating={activatingId === plan.id && isPending}
              onActivate={() => handleActivate(plan.id)}
              onEdit={() => router.push(`/workouts/${plan.id}`)}
            />
          </motion.li>
        ))}
      </motion.ul>
    </div>
  )
}

interface PlanCardProps {
  plan: WorkoutPlan
  index: number
  isActivating: boolean
  onActivate: () => void
  onEdit: () => void
}

function PlanCard({
  plan,
  index,
  isActivating,
  onActivate,
  onEdit,
}: PlanCardProps) {
  const created = new Date(plan.created_at).toLocaleDateString('hu-HU', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })

  return (
    <article
      className={cn(
        'group relative flex h-full flex-col overflow-hidden rounded-lg border',
        'transition-all duration-200',
        plan.is_active
          ? cn(
              'border-brand-red-border bg-card',
              'shadow-[0_0_0_1px_rgba(120,0,0,0.35)_inset,0_0_30px_-12px_rgba(120,0,0,0.6)]',
            )
          : 'border-border bg-card hover:border-brand-red-border',
      )}
    >
      {/* Active scanline accent — top thin red bar */}
      {plan.is_active && (
        <span
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-[2px] bg-brand-red"
        />
      )}

      {/* Top: index + active badge */}
      <header className="flex items-start justify-between p-5 pb-3">
        <span className="font-condensed text-[10px] uppercase tracking-wide-display text-muted-foreground/50">
          / {String(index).padStart(3, '0')}
        </span>
        {plan.is_active ? (
          <span
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1',
              'bg-brand-red text-white',
              'font-condensed text-[10px] font-bold uppercase tracking-wide-display',
            )}
          >
            <span className="relative flex size-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white/70 opacity-75" />
              <span className="relative inline-flex size-1.5 rounded-full bg-white" />
            </span>
            Aktív
          </span>
        ) : (
          <span
            className={cn(
              'inline-flex items-center rounded-full px-2.5 py-1',
              'bg-muted/40 text-muted-foreground',
              'font-condensed text-[10px] uppercase tracking-wide-display',
            )}
          >
            Tervezet
          </span>
        )}
      </header>

      {/* Middle: name + meta */}
      <div className="flex-1 px-5">
        <h3
          className={cn(
            'font-condensed text-2xl font-extrabold uppercase leading-tight tracking-display',
            'text-foreground transition-colors',
            'group-hover:text-brand-red',
            plan.is_active && 'text-foreground',
          )}
        >
          {plan.name}
        </h3>
        {plan.description && (
          <p className="mt-2 line-clamp-2 font-sans text-sm text-muted-foreground">
            {plan.description}
          </p>
        )}

        <dl className="mt-4 grid grid-cols-2 gap-3 text-xs">
          <div className="flex flex-col gap-0.5">
            <dt className="font-condensed text-[10px] uppercase tracking-wide-display text-muted-foreground/60">
              Létrehozva
            </dt>
            <dd className="font-condensed font-bold uppercase tracking-display text-foreground">
              {created}
            </dd>
          </div>
          <div className="flex flex-col gap-0.5">
            <dt className="font-condensed text-[10px] uppercase tracking-wide-display text-muted-foreground/60">
              Státusz
            </dt>
            <dd className="font-condensed font-bold uppercase tracking-display text-foreground">
              {plan.is_active ? 'Aktív' : 'Készenlétben'}
            </dd>
          </div>
        </dl>
      </div>

      {/* Footer actions */}
      <footer className="mt-5 flex items-stretch border-t border-border">
        {!plan.is_active && (
          <button
            type="button"
            onClick={onActivate}
            disabled={isActivating}
            className={cn(
              'flex flex-1 items-center justify-center gap-2 px-4 py-3',
              'font-condensed text-[11px] font-semibold uppercase tracking-wide-display',
              'border-r border-border text-muted-foreground transition-colors',
              'hover:bg-brand-red-muted hover:text-brand-red',
              'disabled:opacity-50 disabled:cursor-not-allowed',
            )}
          >
            {isActivating ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                Aktiválás…
              </>
            ) : (
              <>
                <Star className="size-3.5" />
                Aktiváld
              </>
            )}
          </button>
        )}
        {plan.is_active && (
          <span
            className={cn(
              'flex flex-1 items-center justify-center gap-2 px-4 py-3',
              'border-r border-border',
              'font-condensed text-[11px] font-semibold uppercase tracking-wide-display',
              'text-brand-red',
            )}
          >
            <CheckCircle2 className="size-3.5" />
            Aktív terv
          </span>
        )}
        <button
          type="button"
          onClick={onEdit}
          className={cn(
            'flex flex-1 items-center justify-center gap-2 px-4 py-3',
            'font-condensed text-[11px] font-semibold uppercase tracking-wide-display',
            'text-foreground transition-colors',
            'hover:bg-brand-red hover:text-white',
          )}
        >
          <Pencil className="size-3.5" />
          Szerkesztés
          <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
        </button>
      </footer>
    </article>
  )
}

function EmptyState() {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl border border-border bg-card',
        'px-6 py-16 sm:py-24 text-center',
      )}
    >
      {/* Decorative glow */}
      <span
        aria-hidden="true"
        className={cn(
          'pointer-events-none absolute -top-1/2 left-1/2 size-[420px] -translate-x-1/2',
          'rounded-full bg-brand-red/15 blur-[100px]',
        )}
      />
      {/* Crosshair markers */}
      <span aria-hidden="true" className="pointer-events-none absolute left-4 top-4 size-3 border-l border-t border-brand-red/70" />
      <span aria-hidden="true" className="pointer-events-none absolute right-4 top-4 size-3 border-r border-t border-brand-red/70" />
      <span aria-hidden="true" className="pointer-events-none absolute left-4 bottom-4 size-3 border-l border-b border-brand-red/70" />
      <span aria-hidden="true" className="pointer-events-none absolute right-4 bottom-4 size-3 border-r border-b border-brand-red/70" />

      <div className="relative flex flex-col items-center gap-4">
        <span
          className={cn(
            'flex size-14 items-center justify-center rounded-full',
            'bg-brand-red-muted text-brand-red',
            'shadow-[0_0_0_1px_rgba(120,0,0,0.35)_inset]',
          )}
        >
          <Sparkles className="size-6" />
        </span>
        <div className="space-y-2">
          <span className="font-condensed text-[11px] uppercase tracking-wide-display text-brand-red">
            {'// nincs még tervezet'}
          </span>
          <h2 className="font-condensed text-3xl font-extrabold uppercase tracking-display text-foreground">
            Még nincs edzésterved
          </h2>
          <p className="mx-auto max-w-md font-sans text-sm text-muted-foreground">
            Hozz létre egy új tervet, állíts össze edzésnapokat, és töltsd
            fel gyakorlatokkal — a maradékot mi elvégezzük.
          </p>
        </div>
        <CreatePlanDialog
          trigger={
            <button
              type="button"
              className={cn(
                'mt-2 inline-flex h-11 items-center gap-2 rounded-md px-6',
                'bg-brand-red text-white',
                'font-condensed text-sm font-semibold uppercase tracking-wide-display',
                'transition-all duration-200',
                'hover:bg-brand-red/85 hover:shadow-[0_0_30px_-6px_rgba(120,0,0,0.7)]',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-red/50',
              )}
            >
              <Plus className="size-4" />
              Hozz létre egyet!
            </button>
          }
        />
      </div>
    </div>
  )
}
