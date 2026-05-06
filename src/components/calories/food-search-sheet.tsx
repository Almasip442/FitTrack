'use client'

import { ArrowLeft, Loader2, Plus, Search, SearchX, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState, useTransition } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { useDebounce } from '@/hooks/use-debounce'
import { addFoodEntry, type FoodEntryInput } from '@/lib/calories/actions'
import type { MealType } from '@/lib/calories/meal-types'
import { cn } from '@/lib/utils'
import type { FoodEntry } from '@/types/database'

/* -------------------------------------------------------------------------- */
/*  Upstream API shape                                                         */
/* -------------------------------------------------------------------------- */

interface FoodSearchResult {
  name: string
  calories_per_100g: number
  protein_per_100g: number
  carbs_per_100g: number
  fat_per_100g: number
}

interface FoodSearchSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Daily log id to attach the entry to (required to call addFoodEntry). */
  dailyLogId: string
  /** Meal slot the user opened the sheet from. */
  mealType: MealType
  /** Display label for the meal slot, e.g. "Reggeli". */
  mealLabel: string
  /** Fired with the inserted food entry on success. */
  onAdded: (entry: FoodEntry) => void
}

/* -------------------------------------------------------------------------- */
/*  Hooks                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Run a search against the OFF proxy whenever `query` settles. Empty
 * queries clear the result list.
 */
function useFoodSearch(query: string) {
  const debounced = useDebounce(query.trim(), 400)
  const [results, setResults] = useState<FoodSearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const requestSeqRef = useRef(0)

  useEffect(() => {
    if (!debounced) {
      // Defer to satisfy `react-hooks/set-state-in-effect` (React 19).
      queueMicrotask(() => {
        setResults([])
        setError(null)
        setIsLoading(false)
      })
      return
    }

    const seq = ++requestSeqRef.current
    queueMicrotask(() => {
      setIsLoading(true)
      setError(null)
    })

    const controller = new AbortController()

    fetch(`/api/food-search?q=${encodeURIComponent(debounced)}`, {
      signal: controller.signal,
    })
      .then(async (r) => {
        if (!r.ok) throw new Error('A keresés nem elérhető')
        return (await r.json()) as FoodSearchResult[]
      })
      .then((data) => {
        if (seq !== requestSeqRef.current) return
        setResults(Array.isArray(data) ? data : [])
        setIsLoading(false)
      })
      .catch((err: unknown) => {
        if ((err as { name?: string })?.name === 'AbortError') return
        if (seq !== requestSeqRef.current) return
        setError('A keresés jelenleg nem elérhető')
        setResults([])
        setIsLoading(false)
      })

    return () => controller.abort()
  }, [debounced])

  return { results, isLoading, error, debounced }
}

/* -------------------------------------------------------------------------- */
/*  Per-100g result row                                                        */
/* -------------------------------------------------------------------------- */

function ResultRow({
  result,
  onSelect,
}: {
  result: FoodSearchResult
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'group relative flex w-full items-center gap-4 rounded-md border border-border/70 bg-card/40',
        'px-3 py-3 text-left transition-all',
        'hover:border-brand-red-border hover:bg-card/70',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          'absolute left-0 top-2 bottom-2 w-px bg-brand-red/30',
          'transition-colors group-hover:bg-brand-red',
        )}
      />
      <div className="min-w-0 flex-1">
        <p className="truncate font-sans text-sm text-foreground">{result.name}</p>
        <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
          <span className="font-condensed text-[10px] uppercase tracking-wide-display text-emerald-500/80 tabular-nums">
            P {result.protein_per_100g}g
          </span>
          <span className="font-condensed text-[10px] uppercase tracking-wide-display text-amber-500/80 tabular-nums">
            C {result.carbs_per_100g}g
          </span>
          <span className="font-condensed text-[10px] uppercase tracking-wide-display text-brand-red/80 tabular-nums">
            F {result.fat_per_100g}g
          </span>
          <span className="font-condensed text-[10px] uppercase tracking-wide-display text-muted-foreground/60">
            / 100g
          </span>
        </div>
      </div>
      <div className="text-right">
        <span className="font-condensed text-base font-bold uppercase tracking-display text-foreground tabular-nums">
          {Math.round(result.calories_per_100g)}
        </span>
        <span className="ml-1 font-condensed text-[10px] uppercase tracking-wide-display text-muted-foreground/70">
          kcal
        </span>
      </div>
    </button>
  )
}

/* -------------------------------------------------------------------------- */
/*  Sheet                                                                      */
/* -------------------------------------------------------------------------- */

export function FoodSearchSheet({
  open,
  onOpenChange,
  dailyLogId,
  mealType,
  mealLabel,
  onAdded,
}: FoodSearchSheetProps) {
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<FoodSearchResult | null>(null)
  const [amount, setAmount] = useState<string>('100')
  const [isPending, startTransition] = useTransition()

  const { results, isLoading, error, debounced } = useFoodSearch(query)

  // Reset state every time the sheet (re-)opens. Defer to satisfy the
  // `react-hooks/set-state-in-effect` rule.
  useEffect(() => {
    if (!open) return
    queueMicrotask(() => {
      setQuery('')
      setSelected(null)
      setAmount('100')
    })
  }, [open])

  /* ------------------------------------------------------------------ */
  /*  Computed totals (live preview while editing the gram amount)       */
  /* ------------------------------------------------------------------ */

  const previewTotals = useMemo(() => {
    if (!selected) return null
    const grams = Number(amount)
    if (!Number.isFinite(grams) || grams <= 0) return null
    const f = grams / 100
    return {
      grams,
      calories: Math.round(selected.calories_per_100g * f),
      protein: Math.round(selected.protein_per_100g * f * 10) / 10,
      carbs: Math.round(selected.carbs_per_100g * f * 10) / 10,
      fat: Math.round(selected.fat_per_100g * f * 10) / 10,
    }
  }, [selected, amount])

  /* ------------------------------------------------------------------ */
  /*  Handlers                                                            */
  /* ------------------------------------------------------------------ */

  const handleAdd = () => {
    if (!selected || !previewTotals) return
    const input: FoodEntryInput = {
      food_name: selected.name,
      calories: previewTotals.calories,
      protein: previewTotals.protein,
      carbs: previewTotals.carbs,
      fat: previewTotals.fat,
      amount: previewTotals.grams,
      meal_type: mealType,
    }
    startTransition(async () => {
      const result = await addFoodEntry(dailyLogId, input)
      if (result.success) {
        onAdded(result.data)
        toast.success(`„${result.data.food_name}” hozzáadva.`)
        onOpenChange(false)
      } else {
        toast.error(result.error)
      }
    })
  }

  /* ------------------------------------------------------------------ */
  /*  Renderers                                                           */
  /* ------------------------------------------------------------------ */

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        className={cn(
          'max-h-[92vh] overflow-hidden bg-background p-0',
          'sm:rounded-t-lg',
        )}
      >
        <SheetTitle className="sr-only">
          Étel keresése — {mealLabel}
        </SheetTitle>
        <SheetDescription className="sr-only">
          Keress ételeket az Open Food Facts adatbázisában, válassz adag méretet,
          majd add hozzá az étkezéshez.
        </SheetDescription>

        <div className="flex h-full max-h-[92vh] flex-col">
          {/* ---------- Header ---------- */}
          <div className="border-b border-border bg-card/50 px-5 py-4 sm:px-6 sm:py-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="font-condensed text-[10px] uppercase tracking-wide-display text-brand-red">
                  {`// ${mealLabel} → új étel`}
                </span>
                <h2 className="mt-1 font-condensed text-2xl font-extrabold uppercase tracking-display text-foreground leading-none">
                  Étel keresése
                </h2>
                <span aria-hidden="true" className="mt-2 block h-px w-10 bg-brand-red" />
              </div>
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className={cn(
                  'shrink-0 rounded-full p-1.5 transition-colors',
                  'text-muted-foreground hover:bg-muted hover:text-foreground',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
                )}
                aria-label="Bezárás"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>

          {/* ---------- Body ---------- */}
          <div className="flex-1 overflow-y-auto">
            {selected ? (
              <SelectionPanel
                selected={selected}
                amount={amount}
                onAmountChange={setAmount}
                preview={previewTotals}
                onBack={() => setSelected(null)}
                onAdd={handleAdd}
                isPending={isPending}
              />
            ) : (
              <SearchPanel
                query={query}
                onQueryChange={setQuery}
                results={results}
                debounced={debounced}
                isLoading={isLoading}
                error={error}
                onSelect={(r) => setSelected(r)}
              />
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

/* -------------------------------------------------------------------------- */
/*  Search panel                                                              */
/* -------------------------------------------------------------------------- */

function SearchPanel({
  query,
  onQueryChange,
  results,
  debounced,
  isLoading,
  error,
  onSelect,
}: {
  query: string
  onQueryChange: (v: string) => void
  results: FoodSearchResult[]
  debounced: string
  isLoading: boolean
  error: string | null
  onSelect: (r: FoodSearchResult) => void
}) {
  return (
    <div className="flex flex-col gap-4 p-5 sm:p-6">
      {/* Search input */}
      <div
        className={cn(
          'group relative flex items-center gap-3',
          'rounded-md border border-border bg-card',
          'px-4 h-12',
          'transition-colors duration-200',
          'focus-within:border-brand-red',
          'focus-within:shadow-[0_0_0_1px_rgba(120,0,0,0.4)_inset]',
        )}
      >
        <span
          aria-hidden="true"
          className="font-condensed text-sm font-bold uppercase tracking-wide-display text-brand-red shrink-0"
        >
          {'>'}
        </span>
        <Search
          aria-hidden="true"
          className="size-4 shrink-0 text-muted-foreground/70 transition-colors group-focus-within:text-brand-red"
        />
        <Input
          type="search"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="pl. zabpehely, csirkemell, banán..."
          aria-label="Étel keresése"
          autoFocus
          className={cn(
            'h-full w-full flex-1 border-0 bg-transparent px-0 py-0 shadow-none',
            'text-base font-sans placeholder:text-muted-foreground/60',
            'focus-visible:border-0 focus-visible:ring-0',
            '[&::-webkit-search-cancel-button]:appearance-none',
          )}
        />
        {query.length > 0 && (
          <button
            type="button"
            onClick={() => onQueryChange('')}
            className={cn(
              'shrink-0 rounded-full p-1 transition-colors',
              'text-muted-foreground hover:bg-brand-red-muted hover:text-brand-red',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
            )}
            aria-label="Keresés törlése"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>

      {/* Source line */}
      <div className="flex items-center justify-between">
        <span className="font-condensed text-[10px] uppercase tracking-wide-display text-muted-foreground/60">
          {'// forrás: open food facts'}
        </span>
        {isLoading && (
          <span className="flex items-center gap-1.5 font-condensed text-[10px] uppercase tracking-wide-display text-brand-red">
            <Loader2 className="size-3 animate-spin" />
            Keresés...
          </span>
        )}
      </div>

      {/* Results list */}
      {isLoading && (
        <div className="space-y-2">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-[68px] w-full rounded-md" />
          ))}
        </div>
      )}

      {!isLoading && error && (
        <div
          className={cn(
            'flex flex-col items-center justify-center gap-2 rounded-md border border-border/60 bg-card/40 px-6 py-10 text-center',
          )}
        >
          <SearchX className="size-6 text-red-500/70" />
          <p className="font-condensed text-sm uppercase tracking-wide-display text-foreground">
            {error}
          </p>
          <p className="font-sans text-xs text-muted-foreground">
            Próbáld újra kicsit később.
          </p>
        </div>
      )}

      {!isLoading && !error && debounced.length > 0 && results.length === 0 && (
        <div
          className={cn(
            'flex flex-col items-center justify-center gap-2 rounded-md border border-border/60 bg-card/40 px-6 py-10 text-center',
          )}
        >
          <SearchX className="size-6 text-muted-foreground/70" />
          <p className="font-condensed text-sm uppercase tracking-wide-display text-foreground">
            Nincs találat
          </p>
          <p className="font-sans text-xs text-muted-foreground">
            Próbálj egy másik kifejezést, vagy egyszerűsítsd a nevet.
          </p>
        </div>
      )}

      {!isLoading && !error && debounced.length === 0 && (
        <div
          className={cn(
            'rounded-md border border-dashed border-border/60 bg-card/30 px-6 py-10 text-center',
          )}
        >
          <p className="font-condensed text-sm uppercase tracking-wide-display text-muted-foreground">
            Kezdj el gépelni a keresőbe
          </p>
          <p className="mt-1 font-sans text-xs text-muted-foreground/70">
            Eredmények 100g-ra normalizálva jelennek meg.
          </p>
        </div>
      )}

      {!isLoading && results.length > 0 && (
        <ul className="space-y-2">
          {results.map((r, idx) => (
            <li key={`${r.name}-${idx}`}>
              <ResultRow result={r} onSelect={() => onSelect(r)} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Selection panel — gram amount + preview                                    */
/* -------------------------------------------------------------------------- */

function SelectionPanel({
  selected,
  amount,
  onAmountChange,
  preview,
  onBack,
  onAdd,
  isPending,
}: {
  selected: FoodSearchResult
  amount: string
  onAmountChange: (v: string) => void
  preview: {
    grams: number
    calories: number
    protein: number
    carbs: number
    fat: number
  } | null
  onBack: () => void
  onAdd: () => void
  isPending: boolean
}) {
  const setQuickAmount = (g: number) => onAmountChange(String(g))
  const isValid = preview != null && preview.grams > 0
  return (
    <div className="flex h-full flex-col gap-6 p-5 sm:p-6">
      {/* Back link */}
      <button
        type="button"
        onClick={onBack}
        disabled={isPending}
        className={cn(
          'inline-flex items-center gap-2 self-start rounded-md px-2 py-1',
          'font-condensed text-[11px] uppercase tracking-wide-display text-muted-foreground',
          'transition-colors hover:bg-muted hover:text-foreground',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
        )}
      >
        <ArrowLeft className="size-3.5" />
        Vissza a kereséshez
      </button>

      {/* Selected item card */}
      <div className="relative rounded-md border border-brand-red-border bg-card/60 px-4 py-4 shadow-[0_0_0_1px_rgba(120,0,0,0.4)_inset]">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-2 top-2 h-2 w-2 border-l border-t border-brand-red"
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute right-2 top-2 h-2 w-2 border-r border-t border-brand-red"
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-2 bottom-2 h-2 w-2 border-l border-b border-brand-red"
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute right-2 bottom-2 h-2 w-2 border-r border-b border-brand-red"
        />
        <span className="font-condensed text-[10px] uppercase tracking-wide-display text-brand-red">
          {'// kiválasztva'}
        </span>
        <p className="mt-1 font-sans text-base text-foreground">{selected.name}</p>
        <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
          <span className="font-condensed text-[10px] uppercase tracking-wide-display text-muted-foreground/60">
            / 100g
          </span>
          <span className="font-condensed text-[11px] uppercase tracking-wide-display text-foreground tabular-nums">
            {Math.round(selected.calories_per_100g)} kcal
          </span>
          <span className="font-condensed text-[10px] uppercase tracking-wide-display text-emerald-500/80 tabular-nums">
            P {selected.protein_per_100g}g
          </span>
          <span className="font-condensed text-[10px] uppercase tracking-wide-display text-amber-500/80 tabular-nums">
            C {selected.carbs_per_100g}g
          </span>
          <span className="font-condensed text-[10px] uppercase tracking-wide-display text-brand-red/80 tabular-nums">
            F {selected.fat_per_100g}g
          </span>
        </div>
      </div>

      {/* Amount input */}
      <div className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between">
          <span className="font-condensed text-[11px] uppercase tracking-wide-display text-muted-foreground">
            Adag mérete
          </span>
          <span className="font-condensed text-[10px] uppercase tracking-wide-display text-muted-foreground/50">
            [ grammban ]
          </span>
        </div>
        <div
          className={cn(
            'flex items-center gap-3 rounded-md border border-border bg-card px-4 h-12',
            'transition-colors focus-within:border-brand-red',
            'focus-within:shadow-[0_0_0_1px_rgba(120,0,0,0.4)_inset]',
          )}
        >
          <span className="font-condensed text-sm font-bold uppercase tracking-wide-display text-brand-red">
            {'>'}
          </span>
          <input
            type="number"
            min={1}
            step={1}
            value={amount}
            onChange={(e) => onAmountChange(e.target.value)}
            className={cn(
              'h-full w-full flex-1 bg-transparent px-0 outline-none',
              'font-condensed text-lg font-bold uppercase tracking-display text-foreground tabular-nums',
              'placeholder:text-muted-foreground/40',
            )}
            aria-label="Adag mérete grammban"
            disabled={isPending}
          />
          <span className="font-condensed text-sm uppercase tracking-wide-display text-muted-foreground">
            g
          </span>
        </div>

        {/* Quick presets */}
        <div className="flex flex-wrap gap-1.5">
          {[50, 100, 150, 200, 250].map((g) => {
            const isActive = Number(amount) === g
            return (
              <button
                key={g}
                type="button"
                onClick={() => setQuickAmount(g)}
                disabled={isPending}
                className={cn(
                  'rounded-md border px-2.5 py-1 transition-all',
                  'font-condensed text-[11px] uppercase tracking-wide-display tabular-nums',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
                  isActive
                    ? 'border-brand-red bg-brand-red text-white shadow-[0_0_0_1px_rgba(120,0,0,0.5)_inset]'
                    : 'border-border bg-card/40 text-muted-foreground hover:border-brand-red-border hover:text-foreground',
                )}
              >
                {g}g
              </button>
            )
          })}
        </div>
      </div>

      {/* Live preview */}
      <div className="rounded-md border border-border bg-card/40 px-4 py-3">
        <span className="font-condensed text-[10px] uppercase tracking-wide-display text-muted-foreground/60">
          {'// adagra számolva'}
        </span>
        <div className="mt-2 grid grid-cols-4 gap-3 text-center">
          <div>
            <p className="font-condensed text-2xl font-extrabold uppercase tracking-display text-brand-red leading-none tabular-nums">
              {preview ? preview.calories : '—'}
            </p>
            <p className="mt-1 font-condensed text-[10px] uppercase tracking-wide-display text-muted-foreground/70">
              kcal
            </p>
          </div>
          <div>
            <p className="font-condensed text-lg font-bold uppercase tracking-display text-emerald-500 leading-none tabular-nums">
              {preview ? preview.protein : '—'}g
            </p>
            <p className="mt-1 font-condensed text-[10px] uppercase tracking-wide-display text-muted-foreground/70">
              fehérje
            </p>
          </div>
          <div>
            <p className="font-condensed text-lg font-bold uppercase tracking-display text-amber-500 leading-none tabular-nums">
              {preview ? preview.carbs : '—'}g
            </p>
            <p className="mt-1 font-condensed text-[10px] uppercase tracking-wide-display text-muted-foreground/70">
              szénh.
            </p>
          </div>
          <div>
            <p className="font-condensed text-lg font-bold uppercase tracking-display text-brand-red leading-none tabular-nums">
              {preview ? preview.fat : '—'}g
            </p>
            <p className="mt-1 font-condensed text-[10px] uppercase tracking-wide-display text-muted-foreground/70">
              zsír
            </p>
          </div>
        </div>
      </div>

      {/* Submit */}
      <div className="mt-auto flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="ghost"
          size="lg"
          onClick={onBack}
          disabled={isPending}
          className="font-condensed text-sm uppercase tracking-wide-display"
        >
          Mégse
        </Button>
        <Button
          type="button"
          size="lg"
          onClick={onAdd}
          disabled={isPending || !isValid}
          className={cn(
            'font-condensed text-sm uppercase tracking-wide-display',
            'bg-brand-red text-white hover:bg-brand-red/90',
          )}
        >
          {isPending ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Hozzáadás...
            </>
          ) : (
            <>
              <Plus className="size-4" />
              Hozzáadás
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
