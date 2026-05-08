import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { Exercise } from '@/types/database'

// ---------------------------------------------------------------------
// GET /api/exercises
//
// Query params:
//   q            free-text search (name_hu, name_en, description_hu)
//   category     exact match
//   muscle_group exact match
//   equipment    exact match
//   difficulty   one of: kezdő | haladó | profi
//   page         1-based page index (default 1)
//   limit        page size (default 20, max 50)
//
// Public endpoint — no auth required.
// ---------------------------------------------------------------------

const DEFAULT_LIMIT = 20
const MAX_LIMIT = 50

const VALID_DIFFICULTIES = ['kezdő', 'haladó', 'profi'] as const
type Difficulty = (typeof VALID_DIFFICULTIES)[number]

function asDifficulty(value: string): Difficulty | null {
  return (VALID_DIFFICULTIES as readonly string[]).includes(value)
    ? (value as Difficulty)
    : null
}

export interface ExercisesListResponse {
  data: Exercise[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}

/**
 * Convert free-text user input into a safe `to_tsquery` expression.
 *
 * - Splits on whitespace
 * - Strips characters that have meaning to tsquery (`& | ! ( ) : * \\`)
 * - Joins terms with `&` and appends `:*` for prefix matching
 *
 * Returns null if the sanitized result would be empty — caller should
 * fall back to ilike in that case.
 */
function buildTsQuery(input: string): string | null {
  const tokens = input
    .split(/\s+/)
    .map((t) => t.replace(/[&|!():*\\]/g, '').trim())
    .filter((t) => t.length > 0)

  if (tokens.length === 0) return null
  return tokens.map((t) => `${t}:*`).join(' & ')
}

/**
 * Escape a value for use inside a PostgREST `ilike` pattern.
 * The `%` and `_` wildcards plus the `,` PostgREST list separator
 * must be neutralised; we wrap with `%` for substring matching.
 */
function buildIlikePattern(input: string): string {
  const escaped = input.replace(/[%_,]/g, ' ').trim()
  return `%${escaped}%`
}

function parsePositiveInt(value: string | null, fallback: number): number {
  if (!value) return fallback
  const n = parseInt(value, 10)
  return Number.isFinite(n) && n > 0 ? n : fallback
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)

  const q = searchParams.get('q')?.trim() ?? ''
  const category = searchParams.get('category')?.trim() ?? ''
  const muscleGroup = searchParams.get('muscle_group')?.trim() ?? ''
  const equipment = searchParams.get('equipment')?.trim() ?? ''
  const difficultyRaw = searchParams.get('difficulty')?.trim() ?? ''
  const difficulty = difficultyRaw ? asDifficulty(difficultyRaw) : null

  const page = parsePositiveInt(searchParams.get('page'), 1)
  const requestedLimit = parsePositiveInt(searchParams.get('limit'), DEFAULT_LIMIT)
  const limit = Math.min(requestedLimit, MAX_LIMIT)

  const from = (page - 1) * limit
  const to = from + limit - 1

  try {
    const supabase = await createClient()

    let query = supabase
      .from('exercises')
      .select('*', { count: 'exact' })

    // ---- Filters (combined with AND) ----
    if (category) query = query.ilike('category', `%${category}%`)
    if (muscleGroup) query = query.eq('muscle_group', muscleGroup)
    if (equipment) query = query.ilike('equipment', `%${equipment}%`)
    if (difficulty) query = query.eq('difficulty', difficulty)

    // ---- Free-text search ----
    if (q) {
      const tsQuery = buildTsQuery(q)
      if (tsQuery) {
        // Primary path: GIN-indexed tsvector match.
        query = query.textSearch('search_vector', tsQuery, {
          type: 'plain',
          config: 'simple',
        })
        // textSearch with a raw tsquery expression is passed via PostgREST's
        // `fts` operator. If the parsed expression turns out invalid for any
        // edge-case input we catch it below and fall through to ilike.
      } else {
        // Sanitisation produced no usable tokens — use a plain ilike fallback.
        const pattern = buildIlikePattern(q)
        query = query.or(
          `name_hu.ilike.${pattern},name_en.ilike.${pattern},description_hu.ilike.${pattern}`
        )
      }
    }

    // ---- Pagination + ordering ----
    query = query.order('name_hu', { ascending: true }).range(from, to)

    let { data, error, count } = await query

    // Fallback: if tsquery somehow fails (e.g. dictionary mismatch on the
    // server), retry with a plain ilike search so the endpoint stays usable.
    if (error && q) {
      const pattern = buildIlikePattern(q)
      let fallback = supabase.from('exercises').select('*', { count: 'exact' })

      if (category) fallback = fallback.eq('category', category)
      if (muscleGroup) fallback = fallback.eq('muscle_group', muscleGroup)
      if (equipment) fallback = fallback.eq('equipment', equipment)
      if (difficulty) fallback = fallback.eq('difficulty', difficulty)

      fallback = fallback
        .or(
          `name_hu.ilike.${pattern},name_en.ilike.${pattern},description_hu.ilike.${pattern}`
        )
        .order('name_hu', { ascending: true })
        .range(from, to)

      const retry = await fallback
      data = retry.data
      error = retry.error
      count = retry.count
    }

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch exercises', details: error.message },
        { status: 500 }
      )
    }

    const total = count ?? 0
    const response: ExercisesListResponse = {
      data: data ?? [],
      total,
      page,
      limit,
      hasMore: from + (data?.length ?? 0) < total,
    }

    return NextResponse.json(response)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Internal server error', details: message },
      { status: 500 }
    )
  }
}
