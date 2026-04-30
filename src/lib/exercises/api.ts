import type { Exercise } from '@/types/database'

/**
 * Shape returned by `GET /api/exercises` — kept here so client and
 * server components agree on the contract without re-importing the
 * Next route handler.
 */
export interface ExercisesListResponse {
  data: Exercise[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}

export interface ExerciseQuery {
  q?: string
  muscle_group?: string
  equipment?: string
  difficulty?: string
  category?: string
  page?: number
  limit?: number
}

/**
 * Build a `URLSearchParams` from an `ExerciseQuery`, omitting empty values
 * so the resulting URL stays clean (`/api/exercises?q=...` instead of
 * `/api/exercises?q=&muscle_group=&...`).
 */
export function buildExerciseQuery(params: ExerciseQuery): URLSearchParams {
  const sp = new URLSearchParams()
  if (params.q) sp.set('q', params.q)
  if (params.muscle_group) sp.set('muscle_group', params.muscle_group)
  if (params.equipment) sp.set('equipment', params.equipment)
  if (params.difficulty) sp.set('difficulty', params.difficulty)
  if (params.category) sp.set('category', params.category)
  if (params.page && params.page > 1) sp.set('page', String(params.page))
  if (params.limit) sp.set('limit', String(params.limit))
  return sp
}

/**
 * Resolve the absolute base URL the API should be called against.
 * On the server we need an absolute URL; on the client a relative
 * path is enough.
 */
function getBaseUrl(): string {
  if (typeof window !== 'undefined') return ''
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  const port = process.env.PORT ?? '3000'
  return `http://localhost:${port}`
}

/**
 * Client-side / server-side fetcher for the exercises list endpoint.
 * Throws on a non-2xx response so the caller can render an error state.
 */
export async function fetchExercises(
  params: ExerciseQuery,
  init?: RequestInit
): Promise<ExercisesListResponse> {
  const sp = buildExerciseQuery(params)
  const qs = sp.toString()
  const url = `${getBaseUrl()}/api/exercises${qs ? `?${qs}` : ''}`

  const res = await fetch(url, {
    ...init,
    cache: 'no-store',
  })

  if (!res.ok) {
    throw new Error(`Failed to fetch exercises (${res.status})`)
  }

  return (await res.json()) as ExercisesListResponse
}

/**
 * Fetch a single exercise by id.
 */
export async function fetchExercise(
  id: string,
  init?: RequestInit
): Promise<Exercise> {
  const url = `${getBaseUrl()}/api/exercises/${id}`
  const res = await fetch(url, {
    ...init,
    cache: 'no-store',
  })
  if (!res.ok) {
    throw new Error(`Failed to fetch exercise ${id} (${res.status})`)
  }
  const json = (await res.json()) as { data: Exercise }
  return json.data
}
