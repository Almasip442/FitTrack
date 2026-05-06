'use client'

import { CalendarPlus, Loader2 } from 'lucide-react'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { addWorkoutDay } from '@/lib/workouts/actions'
import { cn } from '@/lib/utils'
import type { WorkoutDay } from '@/types/database'

const DAY_OF_WEEK_OPTIONS: { value: number; label: string; short: string }[] = [
  { value: 0, label: 'Hétfő', short: 'H' },
  { value: 1, label: 'Kedd', short: 'K' },
  { value: 2, label: 'Szerda', short: 'Sze' },
  { value: 3, label: 'Csütörtök', short: 'Cs' },
  { value: 4, label: 'Péntek', short: 'P' },
  { value: 5, label: 'Szombat', short: 'Szo' },
  { value: 6, label: 'Vasárnap', short: 'V' },
]

interface AddDayDialogProps {
  planId: string
  nextDayOrder: number
  /** Days that are already taken (so we disable those chips). */
  takenDaysOfWeek?: number[]
  trigger?: React.ReactNode
  onAdded?: (day: WorkoutDay) => void
}

export function AddDayDialog({
  planId,
  nextDayOrder,
  takenDaysOfWeek = [],
  trigger,
  onAdded,
}: AddDayDialogProps) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [dayOfWeek, setDayOfWeek] = useState<number | null>(null)
  const [isPending, startTransition] = useTransition()

  const isValid = name.trim().length > 0

  const reset = () => {
    setName('')
    setDayOfWeek(null)
  }

  const handleAdd = () => {
    if (!isValid) return
    startTransition(async () => {
      const result = await addWorkoutDay(
        planId,
        name.trim(),
        nextDayOrder,
        dayOfWeek === null ? undefined : dayOfWeek,
      )
      if (result.success && result.data) {
        toast.success(`„${result.data.day_name}” hozzáadva.`)
        onAdded?.(result.data)
        setOpen(false)
        reset()
      } else {
        toast.error(result.success ? 'Ismeretlen hiba.' : result.error)
      }
    })
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!isPending) {
          setOpen(next)
          if (!next) reset()
        }
      }}
    >
      <DialogTrigger asChild>
        {trigger ?? (
          <button
            type="button"
            className={cn(
              'inline-flex h-9 items-center gap-2 rounded-md px-3',
              'border border-brand-red-border bg-brand-red-muted',
              'font-condensed text-[12px] font-semibold uppercase tracking-wide-display',
              'text-brand-red transition-colors',
              'hover:bg-brand-red hover:text-white',
            )}
          >
            <CalendarPlus className="size-3.5" />
            Új nap
          </button>
        )}
      </DialogTrigger>

      <DialogContent className="bg-card sm:max-w-md">
        <DialogHeader>
          <span className="font-condensed text-[10px] uppercase tracking-wide-display text-brand-red">
            {'// új edzésnap'}
          </span>
          <DialogTitle
            className={cn(
              'font-condensed text-2xl font-extrabold uppercase tracking-display',
              'text-foreground',
            )}
          >
            Edzésnap hozzáadása
          </DialogTitle>
          <DialogDescription className="font-sans text-sm text-muted-foreground">
            Adj nevet a napnak (pl. „Mell + tricepsz”) és — ha akarod — kösd
            egy hét napjához.
          </DialogDescription>
          <span
            aria-hidden="true"
            className="mt-2 inline-block h-px w-10 bg-brand-red"
          />
        </DialogHeader>

        {/* Name */}
        <div className="space-y-2">
          <label
            htmlFor="day-name"
            className="flex items-center justify-between font-condensed text-[11px] uppercase tracking-wide-display text-muted-foreground"
          >
            <span>A nap neve</span>
            <span className="text-muted-foreground/50">[ kötelező ]</span>
          </label>
          <Input
            id="day-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Pl. Mell + tricepsz"
            maxLength={60}
            autoFocus
            className="h-11 bg-background font-sans text-base"
          />
        </div>

        {/* Day of week chips */}
        <div className="space-y-2">
          <span className="flex items-center justify-between font-condensed text-[11px] uppercase tracking-wide-display text-muted-foreground">
            <span>A hét napja</span>
            <span className="text-muted-foreground/50">[ opcionális ]</span>
          </span>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setDayOfWeek(null)}
              className={cn(
                'inline-flex h-8 items-center rounded-full border px-3',
                'font-condensed text-[11px] font-semibold uppercase tracking-wide-display',
                'transition-colors',
                dayOfWeek === null
                  ? 'border-brand-red-border bg-brand-red text-white shadow-[0_0_0_1px_rgba(120,0,0,0.5)_inset]'
                  : 'border-border bg-background text-muted-foreground hover:border-brand-red-border hover:text-foreground',
              )}
            >
              Nincs
            </button>
            {DAY_OF_WEEK_OPTIONS.map((d) => {
              const taken = takenDaysOfWeek.includes(d.value)
              const active = dayOfWeek === d.value
              return (
                <button
                  type="button"
                  key={d.value}
                  onClick={() => setDayOfWeek(active ? null : d.value)}
                  disabled={taken && !active}
                  className={cn(
                    'inline-flex h-8 items-center rounded-full border px-3',
                    'font-condensed text-[11px] font-semibold uppercase tracking-wide-display',
                    'transition-colors',
                    active
                      ? 'border-brand-red-border bg-brand-red text-white shadow-[0_0_0_1px_rgba(120,0,0,0.5)_inset]'
                      : 'border-border bg-background text-muted-foreground hover:border-brand-red-border hover:text-foreground',
                    taken && !active && 'opacity-30 cursor-not-allowed',
                  )}
                >
                  {d.label}
                </button>
              )
            })}
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isPending}
            className="font-condensed text-xs uppercase tracking-wide-display"
          >
            Mégse
          </Button>
          <button
            type="button"
            onClick={handleAdd}
            disabled={!isValid || isPending}
            className={cn(
              'inline-flex h-9 items-center justify-center gap-2 rounded-md px-4',
              'bg-brand-red text-white',
              'font-condensed text-xs font-semibold uppercase tracking-wide-display',
              'transition-all hover:bg-brand-red/85',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-red/50',
            )}
          >
            {isPending ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                Hozzáadás…
              </>
            ) : (
              <>
                <CalendarPlus className="size-3.5" />
                Hozzáadás
              </>
            )}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
