'use client'

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ChevronDown, Plus, UtensilsCrossed } from 'lucide-react'
import { useEffect, useState } from 'react'

import { FoodEntryRow } from '@/components/calories/food-entry-row'
import { FoodSearchSheet } from '@/components/calories/food-search-sheet'
import { slideUpSm, staggerChildren } from '@/lib/animations'
import type { MealType, MealTypeMeta } from '@/lib/calories/meal-types'
import { cn } from '@/lib/utils'
import type { FoodEntry } from '@/types/database'

interface MealSectionProps {
  meta: MealTypeMeta
  entries: FoodEntry[]
  /** Daily log id — null until the first entry of the day is added. */
  dailyLogId: string | null
  /** Called when the user wants to open the search sheet. The parent
   *  ensures a daily_log row exists before passing back the id. */
  onOpenSheet: (mealType: MealType) => Promise<string | null>
  /** Called after a successful add — parent updates state. */
  onEntryAdded: (entry: FoodEntry) => void
  /** Called after a successful delete — parent updates state. */
  onEntryDeleted: (entryId: string) => void
  /** Called after an inline edit — parent updates state. */
  onEntryUpdated: (entry: FoodEntry) => void
}

export function MealSection({
  meta,
  entries,
  dailyLogId,
  onOpenSheet,
  onEntryAdded,
  onEntryDeleted,
  onEntryUpdated,
}: MealSectionProps) {
  const [isOpen, setIsOpen] = useState(true)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [resolvedLogId, setResolvedLogId] = useState<string | null>(dailyLogId)
  const reduceMotion = useReducedMotion()

  // Keep the resolved id in sync if it materialises from the parent later.
  // Deferred via queueMicrotask to satisfy `react-hooks/set-state-in-effect`.
  useEffect(() => {
    if (dailyLogId && dailyLogId !== resolvedLogId) {
      queueMicrotask(() => setResolvedLogId(dailyLogId))
    }
  }, [dailyLogId, resolvedLogId])

  const totalKcal = entries.reduce((acc, e) => acc + (e.calories ?? 0), 0)
  const isEmpty = entries.length === 0

  const handleOpenSheet = async () => {
    const id = await onOpenSheet(meta.value)
    if (id) {
      setResolvedLogId(id)
      setSheetOpen(true)
    }
  }

  return (
    <section
      className={cn(
        'relative overflow-hidden rounded-md border border-border bg-card/40',
      )}
      aria-label={meta.label}
    >
      {/* ---------- Header ---------- */}
      <div className="flex items-center gap-3 px-4 py-3 sm:px-5 sm:py-3.5">
        <button
          type="button"
          onClick={() => setIsOpen((v) => !v)}
          aria-expanded={isOpen}
          aria-label={`${meta.label} ${isOpen ? 'összecsukása' : 'kibontása'}`}
          className={cn(
            'flex shrink-0 items-center justify-center rounded-md p-1',
            'text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
          )}
        >
          <ChevronDown
            className={cn(
              'size-4 transition-transform duration-200',
              isOpen ? 'rotate-0' : '-rotate-90',
            )}
          />
        </button>

        {/* Specimen code */}
        <span
          aria-hidden="true"
          className="font-condensed text-[10px] font-bold uppercase tracking-wide-display text-brand-red shrink-0"
        >
          {meta.code}
        </span>

        {/* Title */}
        <h3 className="font-condensed text-sm font-bold uppercase tracking-display text-foreground sm:text-base">
          {meta.label}
        </h3>

        {/* kcal pill */}
        <span
          className={cn(
            'inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5',
            'font-condensed text-[10px] uppercase tracking-wide-display tabular-nums',
            totalKcal > 0
              ? 'border-brand-red-border bg-brand-red-muted text-brand-red'
              : 'border-border/70 bg-card/60 text-muted-foreground/60',
          )}
        >
          {Math.round(totalKcal).toLocaleString('hu-HU')} kcal
        </span>

        <div className="flex-1" />

        {/* Add button */}
        <button
          type="button"
          onClick={handleOpenSheet}
          className={cn(
            'inline-flex shrink-0 items-center gap-1.5 rounded-md border border-brand-red-border bg-brand-red-muted',
            'px-2.5 py-1.5 transition-all',
            'font-condensed text-[11px] uppercase tracking-wide-display text-brand-red',
            'hover:bg-brand-red hover:text-white hover:border-brand-red',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
          )}
        >
          <Plus className="size-3.5" />
          <span className="hidden sm:inline">Étel</span>
          <span className="sm:hidden">Új</span>
        </button>
      </div>

      {/* ---------- Body (collapsible) ---------- */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="body"
            initial={reduceMotion ? false : { height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="border-t border-border/60 px-3 py-3 sm:px-4 sm:py-4">
              {isEmpty ? (
                <EmptyMealState onClick={handleOpenSheet} />
              ) : (
                <motion.ul
                  variants={staggerChildren}
                  initial="hidden"
                  animate="visible"
                  className="space-y-2"
                >
                  {entries.map((entry) => (
                    <motion.li key={entry.id} variants={slideUpSm}>
                      <FoodEntryRow
                        entry={entry}
                        onDeleted={onEntryDeleted}
                        onUpdated={onEntryUpdated}
                      />
                    </motion.li>
                  ))}
                </motion.ul>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ---------- Search sheet ---------- */}
      {resolvedLogId && (
        <FoodSearchSheet
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          dailyLogId={resolvedLogId}
          mealType={meta.value}
          mealLabel={meta.label}
          onAdded={onEntryAdded}
        />
      )}
    </section>
  )
}

/* -------------------------------------------------------------------------- */
/*  Empty meal state                                                          */
/* -------------------------------------------------------------------------- */

function EmptyMealState({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group flex w-full items-center gap-3 rounded-md border border-dashed border-border/70 bg-card/30',
        'px-4 py-4 text-left transition-all',
        'hover:border-brand-red-border hover:bg-brand-red-muted/40',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
      )}
    >
      <UtensilsCrossed className="size-4 shrink-0 text-muted-foreground/60 transition-colors group-hover:text-brand-red" />
      <span className="font-condensed text-xs uppercase tracking-wide-display text-muted-foreground transition-colors group-hover:text-foreground">
        Még nincs étel — kattints az étel hozzáadásához
      </span>
    </button>
  )
}
