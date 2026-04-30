import { ExerciseBrowser } from '@/components/exercises/exercise-browser'
import { fetchExercises } from '@/lib/exercises/api'
import type { ExercisesListResponse } from '@/lib/exercises/api'

export const metadata = {
  title: 'Gyakorlatok — FitTrack Pro',
  description:
    'Böngészd át a gyakorlatok teljes adatbázisát — keress név alapján, szűrj izomcsoport, eszköz vagy nehézség szerint.',
}

const PAGE_SIZE = 20

interface ExercisesPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

/**
 * Read a single string from the resolved search params.
 * Arrays are flattened to the first item; everything else returns ''.
 */
function readParam(
  params: Record<string, string | string[] | undefined>,
  key: string,
): string {
  const v = params[key]
  if (typeof v === 'string') return v.trim()
  if (Array.isArray(v) && typeof v[0] === 'string') return v[0].trim()
  return ''
}

/**
 * Server-side first page.
 *
 * - Reads filter params from the URL.
 * - Fetches the first page of results from `/api/exercises`.
 * - Hands the response to the Client wrapper so the page is meaningful
 *   on first paint (SEO + perceived speed).
 *
 * If the API call fails we still render the browser so the user can
 * recover by adjusting filters; the error state is surfaced inline.
 */
export default async function ExercisesPage({
  searchParams,
}: ExercisesPageProps) {
  const params = await searchParams

  const initialQuery = {
    q: readParam(params, 'q'),
    muscle_group: readParam(params, 'muscle_group'),
    equipment: readParam(params, 'equipment'),
    difficulty: readParam(params, 'difficulty'),
  }

  let initialResponse: ExercisesListResponse
  try {
    initialResponse = await fetchExercises(
      {
        q: initialQuery.q,
        muscle_group: initialQuery.muscle_group,
        equipment: initialQuery.equipment,
        difficulty: initialQuery.difficulty,
        page: 1,
        limit: PAGE_SIZE,
      },
      { cache: 'no-store' },
    )
  } catch {
    initialResponse = {
      data: [],
      total: 0,
      page: 1,
      limit: PAGE_SIZE,
      hasMore: false,
    }
  }

  return (
    <ExerciseBrowser
      initialResponse={initialResponse}
      initialQuery={initialQuery}
      pageSize={PAGE_SIZE}
    />
  )
}
