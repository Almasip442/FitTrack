'use client'

import { Loader2, Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'
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
import { createWorkoutPlan } from '@/lib/workouts/actions'
import { cn } from '@/lib/utils'

interface CreatePlanDialogProps {
  /** Custom trigger element. If omitted, a default "+ Új terv" button. */
  trigger?: React.ReactNode
}

/**
 * Dialog: prompts for a plan name, calls `createWorkoutPlan`, then
 * navigates straight into the editor when successful.
 */
export function CreatePlanDialog({ trigger }: CreatePlanDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [isPending, startTransition] = useTransition()

  const isValid = name.trim().length > 0

  const handleCreate = () => {
    if (!isValid) return

    startTransition(async () => {
      const result = await createWorkoutPlan(name.trim())
      if (result.success && result.data) {
        toast.success('Edzésterv létrehozva.')
        setOpen(false)
        setName('')
        router.push(`/workouts/${result.data.id}`)
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
          if (!next) setName('')
        }
      }}
    >
      <DialogTrigger asChild>
        {trigger ?? (
          <button
            type="button"
            className={cn(
              'inline-flex h-11 items-center gap-2 rounded-md px-5',
              'bg-brand-red text-white',
              'font-condensed text-sm font-semibold uppercase tracking-wide-display',
              'transition-all duration-200',
              'hover:bg-brand-red/85 hover:shadow-[0_0_24px_-6px_rgba(120,0,0,0.6)]',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-red/50',
            )}
          >
            <Plus className="size-4" />
            Új terv
          </button>
        )}
      </DialogTrigger>

      <DialogContent className="bg-card sm:max-w-md">
        <DialogHeader>
          <span className="font-condensed text-[10px] uppercase tracking-wide-display text-brand-red">
            {'// új terv'}
          </span>
          <DialogTitle
            className={cn(
              'font-condensed text-2xl font-extrabold uppercase tracking-display',
              'text-foreground',
            )}
          >
            Új edzésterv
          </DialogTitle>
          <DialogDescription className="font-sans text-sm text-muted-foreground">
            Adj egy beszédes nevet a tervednek — pl. „Push / Pull / Legs”.
          </DialogDescription>
          <span
            aria-hidden="true"
            className="mt-2 inline-block h-px w-10 bg-brand-red"
          />
        </DialogHeader>

        <div className="space-y-2">
          <label
            htmlFor="plan-name"
            className={cn(
              'flex items-center justify-between',
              'font-condensed text-[11px] uppercase tracking-wide-display',
              'text-muted-foreground',
            )}
          >
            <span>Terv neve</span>
            <span className="text-muted-foreground/50">[ kötelező ]</span>
          </label>
          <Input
            id="plan-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && isValid && !isPending) {
                e.preventDefault()
                handleCreate()
              }
            }}
            placeholder="Pl. Push / Pull / Legs"
            maxLength={120}
            autoFocus
            className="h-11 bg-background font-sans text-base"
          />
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
            onClick={handleCreate}
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
                Létrehozás…
              </>
            ) : (
              <>
                <Plus className="size-3.5" />
                Létrehozás
              </>
            )}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
