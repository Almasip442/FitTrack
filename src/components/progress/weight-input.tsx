'use client'

import { Scale } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { upsertWeightLog } from '@/lib/weight/actions'
import { cn } from '@/lib/utils'
import type { WeightLog } from '@/types/database'

interface WeightInputProps {
  latestLog: WeightLog | null
}

/** Format a Date as YYYY-MM-DD in local time. */
function toLocalIso(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function WeightInput({ latestLog }: WeightInputProps) {
  const router = useRouter()
  const today = toLocalIso(new Date())

  const [date, setDate] = useState(today)
  const [weight, setWeight] = useState(
    latestLog?.weight?.toString() ?? '',
  )
  const [saving, setSaving] = useState(false)

  // Validation helpers
  const weightNum = parseFloat(weight)
  const isWeightValid =
    !isNaN(weightNum) && weightNum >= 20 && weightNum <= 500
  const isFutureDate = date > today
  const isFormValid = isWeightValid && !isFutureDate && date.trim() !== ''

  async function handleSave() {
    if (!isFormValid) return
    setSaving(true)
    try {
      const result = await upsertWeightLog(date, weightNum)
      if (result.success) {
        toast.success('Testsúly elmentve!', {
          description: `${weightNum.toFixed(1)} kg — ${date}`,
        })
        router.refresh()
      } else {
        toast.error('Mentés sikertelen', { description: result.error })
      }
    } catch {
      toast.error('Váratlan hiba történt.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section
      className={cn(
        'relative overflow-hidden rounded-xl border border-border bg-card',
        'p-5 sm:p-6',
      )}
    >
      {/* Subtle brand accent strip */}
      <div className="absolute left-0 top-0 h-full w-0.5 rounded-l-xl bg-brand-red/60" />

      <div className="mb-4">
        <span className="block font-condensed text-[11px] uppercase tracking-wide-display text-brand-red">
          {'// rögzítés'}
        </span>
        <h2 className="mt-0.5 flex items-center gap-2 font-condensed text-xl font-bold uppercase tracking-display text-foreground leading-none">
          <Scale className="size-4 text-muted-foreground" strokeWidth={1.5} />
          Testsúly rögzítése
        </h2>
      </div>

      <div className="space-y-3">
        {/* Date picker */}
        <div>
          <label
            htmlFor="weight-date"
            className="mb-1.5 block font-condensed text-[11px] uppercase tracking-wide-display text-muted-foreground"
          >
            Dátum
          </label>
          <Input
            id="weight-date"
            type="date"
            value={date}
            max={today}
            onChange={(e) => setDate(e.target.value)}
            className={cn(
              'font-sans text-sm',
              isFutureDate && 'border-destructive focus-visible:ring-destructive/30',
            )}
          />
          {isFutureDate && (
            <p className="mt-1 font-sans text-xs text-destructive">
              A dátum nem lehet jövőbeli.
            </p>
          )}
        </div>

        {/* Weight input */}
        <div>
          <label
            htmlFor="weight-kg"
            className="mb-1.5 block font-condensed text-[11px] uppercase tracking-wide-display text-muted-foreground"
          >
            Testsúly (kg)
          </label>
          <div className="relative">
            <Input
              id="weight-kg"
              type="number"
              min={20}
              max={500}
              step={0.1}
              placeholder="pl. 75.5"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className={cn(
                'pr-10 font-sans text-sm tabular-nums',
                weight !== '' && !isWeightValid && 'border-destructive focus-visible:ring-destructive/30',
              )}
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 font-condensed text-xs text-muted-foreground/60">
              kg
            </span>
          </div>
          {weight !== '' && !isWeightValid && (
            <p className="mt-1 font-sans text-xs text-destructive">
              20 és 500 kg közötti értéket adj meg.
            </p>
          )}
        </div>

        {/* Save button */}
        <Button
          onClick={handleSave}
          disabled={!isFormValid || saving}
          className="w-full font-condensed uppercase tracking-display"
        >
          {saving ? 'Mentés...' : 'Mentés'}
        </Button>
      </div>
    </section>
  )
}
