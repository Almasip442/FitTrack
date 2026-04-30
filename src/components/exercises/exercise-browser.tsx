'use client'

import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { ExerciseCard } from '@/components/exercises/exercise-card'
import { ExerciseDetail } from '@/components/exercises/exercise-detail'
import {
  ExerciseFilters,
  type ExerciseFilterState,
} from '@/components/exercises/exercise-filters'
import { ExerciseEmptyState } from '@/components/exercises/exercise-empty-state'
import { ExerciseSearchBar } from '@/components/exercises/exercise-search-bar'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  buildExerciseQuery,
  fetchExercises,
  type ExercisesListResponse,
} from '@/lib/exercises/api'
import { slideUpSm, staggerChildren } from '@/lib/animations'
import { cn } from '@/lib/utils'
import type { Exercise } from '@/types/database'

interface ExerciseBrowserProps {
  /** Pre-fetched first page from the server component (SEO + fast paint). */
  initialResponse: ExercisesListResponse
  /** The query that produced `initialResponse` — kept in sync with URL. */
  initialQuery: {
    q: string
    muscle_group: string
    equipment: string
    difficulty: string
  }
  /** Page size used by the API (matches what the server fetched). */
  pageSize: number
}

const EMPTY_FILTERS: ExerciseFilterState = {
  muscle_group: '',
  equipment: '',
  difficulty: '',
}

/**
 * Top-level client wrapper for the exercise browser.
 *
 * Responsibilities:
 *   - Hold list, page, loading state.
 *   - Read/write filters & query to the URL (so they're shareable).
 *   - Fetch from `/api/exercises` whenever the URL changes.
 *   - Render search bar, filters, list, load-more, detail surface.
 *
 * The first page is hydrated from `initialResponse` so the page is
 * indexable and the user sees content immediately.
 */
export function ExerciseBrowser({
  initialResponse,
  initialQuery,
  pageSize,
}: ExerciseBrowserProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Filter / query state — derived from URL (single source of truth).
  const q = searchParams.get('q') ?? initialQuery.q
  const filters = useMemo<ExerciseFilterState>(
    () => ({
      muscle_group:
        searchParams.get('muscle_group') ?? initialQuery.muscle_group,
      equipment: searchParams.get('equipment') ?? initialQuery.equipment,
      difficulty: searchParams.get('difficulty') ?? initialQuery.difficulty,
    }),
    [searchParams, initialQuery],
  )

  // Build the canonical key that identifies this query — refetch on change.
  const queryKey = useMemo(
    () => `${q}|${filters.muscle_group}|${filters.equipment}|${filters.difficulty}`,
    [q, filters.muscle_group, filters.equipment, filters.difficulty],
  )

  // ----- List state -----
  const [list, setList] = useState<Exercise[]>(initialResponse.data)
  const [page, setPage] = useState<number>(initialResponse.page)
  const [hasMore, setHasMore] = useState<boolean>(initialResponse.hasMore)
  const [total, setTotal] = useState<number>(initialResponse.total)

  // Loading flags: `searching` blanks the list with a skeleton; `loadingMore`
  // is the smaller spinner on the load-more button.
  const [searching, setSearching] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // The query key the *current* list corresponds to. Used to know whether
  // we need to refetch on the next render or hydrate from the initial server
  // response (which may match if the user landed straight on a filtered URL).
  const initialKey = useMemo(
    () =>
      `${initialQuery.q}|${initialQuery.muscle_group}|${initialQuery.equipment}|${initialQuery.difficulty}`,
    [initialQuery],
  )
  const currentKeyRef = useRef<string>(initialKey)

  // Detail surface state.
  const [selected, setSelected] = useState<Exercise | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  /**
   * Reflect a new filter/query state to the URL. The URL change triggers
   * the effect below which performs the fetch.
   */
  const pushQuery = useCallback(
    (next: { q?: string; filters?: ExerciseFilterState }) => {
      const sp = buildExerciseQuery({
        q: next.q ?? q,
        muscle_group: (next.filters ?? filters).muscle_group,
        equipment: (next.filters ?? filters).equipment,
        difficulty: (next.filters ?? filters).difficulty,
      })
      const qs = sp.toString()
      router.replace(qs ? `/exercises?${qs}` : '/exercises', {
        scroll: false,
      })
    },
    [router, q, filters],
  )

  // ----- Refetch on query change -----
  useEffect(() => {
    if (queryKey === currentKeyRef.current) {
      // URL matches the data we already have (initial mount, or a no-op).
      return
    }

    let cancelled = false
    setSearching(true)
    setError(null)

    fetchExercises({
      q,
      muscle_group: filters.muscle_group,
      equipment: filters.equipment,
      difficulty: filters.difficulty,
      page: 1,
      limit: pageSize,
    })
      .then((res) => {
        if (cancelled) return
        currentKeyRef.current = queryKey
        setList(res.data)
        setPage(res.page)
        setHasMore(res.hasMore)
        setTotal(res.total)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        const msg = err instanceof Error ? err.message : 'Ismeretlen hiba'
        setError(msg)
      })
      .finally(() => {
        if (!cancelled) setSearching(false)
      })

    return () => {
      cancelled = true
    }
    // queryKey captures all the inputs we care about
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryKey, pageSize])

  // ----- Load more -----
  const handleLoadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return
    const nextPage = page + 1
    setLoadingMore(true)
    setError(null)
    try {
      const res = await fetchExercises({
        q,
        muscle_group: filters.muscle_group,
        equipment: filters.equipment,
        difficulty: filters.difficulty,
        page: nextPage,
        limit: pageSize,
      })
      setList((prev) => [...prev, ...res.data])
      setPage(res.page)
      setHasMore(res.hasMore)
      setTotal(res.total)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Ismeretlen hiba'
      setError(msg)
    } finally {
      setLoadingMore(false)
    }
  }, [
    loadingMore,
    hasMore,
    page,
    q,
    filters.muscle_group,
    filters.equipment,
    filters.difficulty,
    pageSize,
  ])

  // ----- Handlers -----
  const handleSearchChange = useCallback(
    (next: string) => {
      pushQuery({ q: next })
    },
    [pushQuery],
  )

  const handleFiltersChange = useCallback(
    (next: ExerciseFilterState) => {
      pushQuery({ filters: next })
    },
    [pushQuery],
  )

  const handleClearAll = useCallback(() => {
    pushQuery({ q: '', filters: EMPTY_FILTERS })
  }, [pushQuery])

  const handleSelectExercise = useCallback((ex: Exercise) => {
    setSelected(ex)
    setDetailOpen(true)
  }, [])

  const hasAnyFilter =
    Boolean(q) ||
    Boolean(filters.muscle_group) ||
    Boolean(filters.equipment) ||
    Boolean(filters.difficulty)

  return (
    <div className="space-y-6">
      {/* ---------- Header ---------- */}
      <header className="flex flex-col gap-2">
        <span className="font-condensed text-[11px] uppercase tracking-wide-display text-brand-red">
          {'// 01 / Gyakorlat-atlasz'}
        </span>
        <h1
          className={cn(
            'font-condensed text-3xl sm:text-4xl md:text-5xl font-extrabold uppercase',
            'tracking-display text-foreground leading-none',
          )}
        >
          Gyakorlatok
        </h1>
        <span aria-hidden="true" className="block h-px w-12 bg-brand-red" />
        <p className="mt-1 font-sans text-sm text-muted-foreground">
          Böngészd át a gyakorlatok teljes adatbázisát — szűrj izomcsoport,
          eszköz vagy nehézség szerint.
        </p>
      </header>

      {/* ---------- Search ---------- */}
      <ExerciseSearchBar
        initialValue={q}
        onDebouncedChange={handleSearchChange}
      />

      {/* ---------- Filters ---------- */}
      <ExerciseFilters filters={filters} onChange={handleFiltersChange} />

      {/* ---------- Telemetry: result count ---------- */}
      <div className="flex items-center justify-between">
        <span className="font-condensed text-[11px] uppercase tracking-wide-display text-muted-foreground/70">
          {searching ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="size-3 animate-spin" />
              Keresés…
            </span>
          ) : (
            <>
              {total === 0
                ? '0 találat'
                : `${total} ${total === 1 ? 'találat' : 'találat'} • ${list.length} betöltve`}
            </>
          )}
        </span>
        {hasAnyFilter && !searching && (
          <button
            type="button"
            onClick={handleClearAll}
            className={cn(
              'font-condensed text-[11px] uppercase tracking-wide-display',
              'text-muted-foreground hover:text-brand-red transition-colors',
            )}
          >
            Mindent töröl
          </button>
        )}
      </div>

      {/* ---------- List / states ---------- */}
      {error && (
        <div
          role="alert"
          className={cn(
            'rounded-md border border-destructive/40 bg-destructive/10',
            'px-4 py-3 font-sans text-sm text-destructive',
          )}
        >
          Hiba történt: {error}
        </div>
      )}

      {searching ? (
        <SkeletonList count={Math.min(pageSize, 6)} />
      ) : list.length === 0 ? (
        <ExerciseEmptyState
          hasActiveFilters={hasAnyFilter}
          onClearFilters={handleClearAll}
        />
      ) : (
        <motion.ul
          key={queryKey}
          variants={staggerChildren}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3"
        >
          {list.map((exercise, idx) => (
            <motion.li
              key={exercise.id}
              variants={slideUpSm}
              className="list-none"
            >
              <ExerciseCard
                exercise={exercise}
                index={idx + 1}
                onSelect={handleSelectExercise}
              />
            </motion.li>
          ))}
        </motion.ul>
      )}

      {/* ---------- Load more ---------- */}
      {!searching && hasMore && list.length > 0 && (
        <div className="flex justify-center pt-2">
          <Button
            variant="outline"
            size="lg"
            onClick={handleLoadMore}
            disabled={loadingMore}
            className={cn(
              'h-11 px-6 font-condensed text-sm uppercase tracking-wide-display',
              'border-brand-red-border hover:bg-brand-red-muted hover:text-foreground',
            )}
          >
            {loadingMore ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="size-4 animate-spin" />
                Betöltés…
              </span>
            ) : (
              'Még több betöltése'
            )}
          </Button>
        </div>
      )}

      {/* ---------- Detail surface ---------- */}
      <ExerciseDetail
        exercise={selected}
        open={detailOpen}
        onOpenChange={(open) => {
          setDetailOpen(open)
          if (!open) {
            // Defer-clear so the closing animation doesn't flicker the body.
            setTimeout(() => setSelected(null), 200)
          }
        }}
      />
    </div>
  )
}

/**
 * Skeleton placeholder while a search/filter change is in flight.
 * Matches the card layout (thumbnail + two text rows + chevron).
 */
function SkeletonList({ count }: { count: number }) {
  return (
    <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <li key={i} className="list-none">
          <div
            className={cn(
              'flex items-stretch gap-4 rounded-lg border border-border',
              'bg-card p-3 sm:p-4',
            )}
          >
            <Skeleton className="h-16 w-16 sm:h-20 sm:w-20 rounded-md" />
            <div className="flex flex-1 flex-col justify-center gap-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        </li>
      ))}
    </ul>
  )
}
