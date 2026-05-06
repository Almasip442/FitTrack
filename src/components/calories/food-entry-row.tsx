'use client'

import { Check, Loader2, Pencil, Trash2, X } from 'lucide-react'
import { useEffect, useRef, useState, useTransition } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { deleteFoodEntry, updateFoodEntry } from '@/lib/calories/actions'
import { cn } from '@/lib/utils'
import type { FoodEntry } from '@/types/database'

interface FoodEntryRowProps {
  entry: FoodEntry
  /** Called after a successful delete, with the deleted id. */
  onDeleted: (id: string) => void
  /** Called after a successful inline-edit, with the patched entry. */
  onUpdated: (entry: FoodEntry) => void
}

/**
 * One row inside a meal section. Shows name + amount + macros + kcal,
 * collapses to an inline gram editor on click, and supports optimistic
 * delete with a hover-revealed `×` button.
 */
export function FoodEntryRow({ entry, onDeleted, onUpdated }: FoodEntryRowProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [draftAmount, setDraftAmount] = useState<string>(
    entry.amount != null ? String(entry.amount) : '',
  )
  const [isDeleting, startDelete] = useTransition()
  const [isSaving, startSave] = useTransition()
  const inputRef = useRef<HTMLInputElement | null>(null)

  // Re-sync the draft if the upstream entry changes (e.g. SSR refresh).
  // Defer the setState so it doesn't run synchronously in the effect body
  // (React 19 / `react-hooks/set-state-in-effect` rule).
  useEffect(() => {
    if (isEditing) return
    queueMicrotask(() =>
      setDraftAmount(entry.amount != null ? String(entry.amount) : ''),
    )
  }, [entry.amount, isEditing])

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [isEditing])

  const handleDelete = () => {
    if (isDeleting) return
    startDelete(async () => {
      // Optimistic — surface the row removal first, then verify.
      onDeleted(entry.id)
      const result = await deleteFoodEntry(entry.id)
      if (!result.success) {
        toast.error(result.error)
        // The parent re-fetches via refresh; surfacing the toast is enough.
      } else {
        toast.success('Étel törölve.')
      }
    })
  }

  const handleSaveAmount = () => {
    const next = Number(draftAmount)
    if (!Number.isFinite(next) || next <= 0) {
      toast.error('Az adag nem lehet nulla vagy negatív.')
      return
    }
    if (next === entry.amount) {
      setIsEditing(false)
      return
    }

    // Scale macros + calories proportionally to the new amount, using
    // the original amount as the per-unit denominator.
    const factor = entry.amount && entry.amount > 0 ? next / entry.amount : 1
    const patched = {
      amount: next,
      calories: Math.round(entry.calories * factor),
      protein: entry.protein != null ? Math.round(entry.protein * factor * 10) / 10 : undefined,
      carbs: entry.carbs != null ? Math.round(entry.carbs * factor * 10) / 10 : undefined,
      fat: entry.fat != null ? Math.round(entry.fat * factor * 10) / 10 : undefined,
    }

    startSave(async () => {
      const result = await updateFoodEntry(entry.id, patched)
      if (result.success) {
        onUpdated(result.data)
        setIsEditing(false)
        toast.success('Adag frissítve.')
      } else {
        toast.error(result.error)
      }
    })
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setDraftAmount(entry.amount != null ? String(entry.amount) : '')
  }

  return (
    <div
      className={cn(
        'group relative flex items-center gap-3 rounded-md border border-border/70 bg-card/40',
        'px-3 py-2.5 sm:px-4 sm:py-3 transition-colors',
        'hover:bg-card/70 hover:border-brand-red-border',
        isDeleting && 'pointer-events-none opacity-50',
      )}
    >
      {/* Brand-red accent strip */}
      <span
        aria-hidden="true"
        className={cn(
          'absolute left-0 top-2 bottom-2 w-px bg-brand-red/40',
          'transition-colors group-hover:bg-brand-red',
        )}
      />

      {/* Name + macros */}
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="truncate font-sans text-sm text-foreground">
            {entry.food_name}
          </span>
        </div>
        <div className="mt-0.5 flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
          {/* Macros — micro typography */}
          {entry.protein != null && (
            <span className="font-condensed text-[10px] uppercase tracking-wide-display text-emerald-500/80 tabular-nums">
              P {Math.round(entry.protein)}g
            </span>
          )}
          {entry.carbs != null && (
            <span className="font-condensed text-[10px] uppercase tracking-wide-display text-amber-500/80 tabular-nums">
              C {Math.round(entry.carbs)}g
            </span>
          )}
          {entry.fat != null && (
            <span className="font-condensed text-[10px] uppercase tracking-wide-display text-brand-red/80 tabular-nums">
              F {Math.round(entry.fat)}g
            </span>
          )}
        </div>
      </div>

      {/* Amount editor / display */}
      {isEditing ? (
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-1 rounded-md border border-brand-red bg-card px-2 py-1 shadow-[0_0_0_1px_rgba(120,0,0,0.4)_inset]">
            <input
              ref={inputRef}
              type="number"
              min={1}
              step={1}
              value={draftAmount}
              onChange={(e) => setDraftAmount(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveAmount()
                if (e.key === 'Escape') handleCancelEdit()
              }}
              className={cn(
                'w-14 bg-transparent font-condensed text-sm font-bold uppercase tracking-display',
                'text-foreground outline-none placeholder:text-muted-foreground/40 tabular-nums',
              )}
              aria-label="Adag grammban"
              disabled={isSaving}
            />
            <span className="font-condensed text-[10px] uppercase tracking-wide-display text-muted-foreground/70">
              g
            </span>
          </div>
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            onClick={handleSaveAmount}
            disabled={isSaving}
            aria-label="Mentés"
            className="text-emerald-500 hover:bg-emerald-500/10 hover:text-emerald-500"
          >
            {isSaving ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Check className="size-3.5" />
            )}
          </Button>
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            onClick={handleCancelEdit}
            disabled={isSaving}
            aria-label="Mégse"
            className="text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="size-3.5" />
          </Button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setIsEditing(true)}
          className={cn(
            'group/amount flex items-baseline gap-1 rounded-md px-2 py-1 transition-colors',
            'hover:bg-brand-red-muted',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
          )}
          aria-label={`Adag szerkesztése (${entry.amount ?? 0}g)`}
        >
          <span className="font-condensed text-sm font-bold uppercase tracking-display text-foreground tabular-nums">
            {entry.amount ?? '—'}
          </span>
          <span className="font-condensed text-[10px] uppercase tracking-wide-display text-muted-foreground/70">
            g
          </span>
          <Pencil className="ml-1 size-3 opacity-0 transition-opacity group-hover/amount:opacity-60" />
        </button>
      )}

      {/* Calories */}
      <div className="min-w-[68px] text-right">
        <span className="font-condensed text-base font-bold uppercase tracking-display text-foreground tabular-nums">
          {Math.round(entry.calories).toLocaleString('hu-HU')}
        </span>
        <span className="ml-1 font-condensed text-[10px] uppercase tracking-wide-display text-muted-foreground/70">
          kcal
        </span>
      </div>

      {/* Delete */}
      <button
        type="button"
        onClick={handleDelete}
        disabled={isDeleting}
        aria-label={`${entry.food_name} törlése`}
        className={cn(
          'shrink-0 rounded-full p-1 transition-all',
          'text-muted-foreground/50 hover:bg-red-500/10 hover:text-red-500',
          'opacity-0 group-hover:opacity-100 focus-visible:opacity-100',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
        )}
      >
        {isDeleting ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : (
          <Trash2 className="size-3.5" />
        )}
      </button>
    </div>
  )
}
