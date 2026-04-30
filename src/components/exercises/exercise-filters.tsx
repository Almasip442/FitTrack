'use client'

import { SlidersHorizontal, X } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import {
  DIFFICULTIES,
  EQUIPMENT_OPTIONS,
  MUSCLE_GROUPS,
  type MuscleGroup,
  type EquipmentOption,
  type Difficulty,
} from '@/lib/exercises/taxonomy'
import { cn } from '@/lib/utils'

export interface ExerciseFilterState {
  muscle_group: string
  equipment: string
  difficulty: string
}

interface ExerciseFiltersProps {
  filters: ExerciseFilterState
  onChange: (next: ExerciseFilterState) => void
}

const EMPTY_FILTERS: ExerciseFilterState = {
  muscle_group: '',
  equipment: '',
  difficulty: '',
}

function activeCount(f: ExerciseFilterState): number {
  let c = 0
  if (f.muscle_group) c++
  if (f.equipment) c++
  if (f.difficulty) c++
  return c
}

/**
 * Reusable chip — inactive: ghosted dark surface;
 * active: brand-red filled with inset highlight (matches the F3
 * radio-card selection pattern, just compressed to a chip).
 */
function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={active}
      onClick={onClick}
      className={cn(
        'inline-flex h-8 items-center gap-1.5 rounded-full border px-3',
        'font-condensed text-[11px] font-semibold uppercase tracking-wide-display',
        'transition-all duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
        active
          ? cn(
              'border-brand-red-border bg-brand-red text-white',
              'shadow-[0_0_0_1px_rgba(120,0,0,0.5)_inset]',
            )
          : cn(
              'border-border bg-card text-muted-foreground',
              'hover:border-brand-red-border hover:text-foreground',
            ),
      )}
    >
      {active && (
        <span
          aria-hidden="true"
          className="size-1.5 rounded-full bg-white"
        />
      )}
      {children}
    </button>
  )
}

interface FilterPanelProps {
  filters: ExerciseFilterState
  onChange: (next: ExerciseFilterState) => void
}

/**
 * Inner panel rendered both inline (desktop) and inside the mobile sheet.
 * Pure UI — clicks call `onChange` with the next state object.
 */
function FilterPanel({ filters, onChange }: FilterPanelProps) {
  const toggleMuscle = (m: MuscleGroup) => {
    onChange({
      ...filters,
      muscle_group: filters.muscle_group === m.value ? '' : m.value,
    })
  }
  const toggleEquipment = (e: EquipmentOption) => {
    onChange({
      ...filters,
      equipment: filters.equipment === e.value ? '' : e.value,
    })
  }
  const toggleDifficulty = (d: Difficulty) => {
    onChange({
      ...filters,
      difficulty: filters.difficulty === d ? '' : d,
    })
  }

  return (
    <div className="space-y-6">
      <FilterGroup
        label="Izomcsoport"
        meta={`[ ${MUSCLE_GROUPS.length} kategória ]`}
      >
        {MUSCLE_GROUPS.map((m) => (
          <FilterChip
            key={m.value}
            active={filters.muscle_group === m.value}
            onClick={() => toggleMuscle(m)}
          >
            {m.label}
          </FilterChip>
        ))}
      </FilterGroup>

      <FilterGroup label="Eszköz" meta={`[ ${EQUIPMENT_OPTIONS.length} típus ]`}>
        {EQUIPMENT_OPTIONS.map((e) => (
          <FilterChip
            key={e.value}
            active={filters.equipment === e.value}
            onClick={() => toggleEquipment(e)}
          >
            {e.label}
          </FilterChip>
        ))}
      </FilterGroup>

      <FilterGroup label="Nehézség" meta="[ szint ]">
        {DIFFICULTIES.map((d) => (
          <FilterChip
            key={d.value}
            active={filters.difficulty === d.value}
            onClick={() => toggleDifficulty(d.value)}
          >
            {d.label}
          </FilterChip>
        ))}
      </FilterGroup>
    </div>
  )
}

function FilterGroup({
  label,
  meta,
  children,
}: {
  label: string
  meta?: string
  children: React.ReactNode
}) {
  return (
    <fieldset>
      <legend className="mb-2 flex w-full items-center justify-between">
        <span className="font-condensed text-[11px] font-semibold uppercase tracking-wide-display text-muted-foreground">
          {label}
        </span>
        {meta && (
          <span className="font-condensed text-[10px] uppercase tracking-wide-display text-muted-foreground/50">
            {meta}
          </span>
        )}
      </legend>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </fieldset>
  )
}

/**
 * Top-level filter component.
 *
 * - Desktop (md+): renders the FilterPanel directly inline below the search bar.
 * - Mobile: renders a single "Szűrők" trigger button + a bottom-sheet that
 *   contains the same FilterPanel. The active count is shown in the trigger.
 */
export function ExerciseFilters({ filters, onChange }: ExerciseFiltersProps) {
  const [sheetOpen, setSheetOpen] = useState(false)
  const count = activeCount(filters)
  const hasActive = count > 0

  const clear = () => onChange(EMPTY_FILTERS)

  return (
    <>
      {/* ---------- Mobile: trigger + Sheet ---------- */}
      <div className="md:hidden">
        <div className="flex items-center justify-between gap-2">
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <button
                type="button"
                className={cn(
                  'inline-flex h-10 items-center gap-2 rounded-md border px-4',
                  'font-condensed text-[12px] font-semibold uppercase tracking-wide-display',
                  'transition-colors',
                  hasActive
                    ? 'border-brand-red-border bg-brand-red-muted text-foreground'
                    : 'border-border bg-card text-muted-foreground hover:text-foreground',
                )}
              >
                <SlidersHorizontal className="size-4" />
                <span>Szűrők</span>
                {hasActive && (
                  <span
                    className={cn(
                      'inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5',
                      'bg-brand-red text-white text-[10px] font-bold',
                    )}
                  >
                    {count}
                  </span>
                )}
              </button>
            </SheetTrigger>
            <SheetContent
              side="bottom"
              className="max-h-[85vh] overflow-y-auto bg-background"
            >
              <SheetHeader className="px-6 pt-6">
                <SheetTitle className="font-condensed text-2xl font-extrabold uppercase tracking-display">
                  Szűrők
                </SheetTitle>
                <SheetDescription className="font-condensed text-[11px] uppercase tracking-wide-display text-muted-foreground">
                  {'// szűkítsd a találatokat'}
                </SheetDescription>
                <span className="mt-2 inline-block h-px w-12 bg-brand-red" />
              </SheetHeader>
              <div className="px-6 pb-8">
                <FilterPanel filters={filters} onChange={onChange} />
                <div className="mt-6 flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={clear}
                    disabled={!hasActive}
                    className="font-condensed text-xs uppercase tracking-wide-display"
                  >
                    <X className="size-3.5" />
                    Szűrők törlése
                  </Button>
                  <Button
                    variant="default"
                    onClick={() => setSheetOpen(false)}
                    className="ml-auto font-condensed text-xs uppercase tracking-wide-display"
                  >
                    Bezár
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>

          {hasActive && (
            <button
              type="button"
              onClick={clear}
              className={cn(
                'inline-flex h-10 items-center gap-1.5 rounded-md px-3',
                'font-condensed text-[11px] uppercase tracking-wide-display',
                'text-muted-foreground hover:text-foreground transition-colors',
              )}
            >
              <X className="size-3.5" />
              Törlés
            </button>
          )}
        </div>
      </div>

      {/* ---------- Desktop: inline panel ---------- */}
      <div className="hidden md:block">
        <div
          className={cn(
            'rounded-lg border border-border bg-card/40',
            'px-5 py-5',
          )}
        >
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <SlidersHorizontal className="size-4 text-muted-foreground" />
              <span className="font-condensed text-[11px] font-semibold uppercase tracking-wide-display text-muted-foreground">
                Szűrők
              </span>
              {hasActive && (
                <span
                  className={cn(
                    'inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5',
                    'bg-brand-red text-white text-[10px] font-bold',
                  )}
                >
                  {count}
                </span>
              )}
            </div>
            {hasActive && (
              <button
                type="button"
                onClick={clear}
                className={cn(
                  'inline-flex items-center gap-1.5',
                  'font-condensed text-[11px] uppercase tracking-wide-display',
                  'text-muted-foreground hover:text-brand-red transition-colors',
                )}
              >
                <X className="size-3" />
                Szűrők törlése
              </button>
            )}
          </div>

          <FilterPanel filters={filters} onChange={onChange} />
        </div>
      </div>
    </>
  )
}
