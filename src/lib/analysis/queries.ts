/**
 * Weekly AI analysis read-side queries — server-only.
 *
 * Backend Iteration 12 / Task 12.7.
 *
 * Uses the cookie-bound Supabase server client so RLS evaluates against
 * the caller's session. Callers should be Server Components, Server
 * Actions, or Route Handlers.
 *
 * Both functions return safe defaults (`[]` / `null`) when the user is
 * unauthenticated, so callers never need to special-case the missing-
 * session path.
 */

import { createClient } from '@/lib/supabase/server'
import type { WeeklyAnalysis } from '@/types/database'

/** Default cap when `getWeeklyAnalyses` is called without a limit. */
const DEFAULT_LIMIT = 12

/* -------------------------------------------------------------------------- */
/*  Auth helper                                                                */
/* -------------------------------------------------------------------------- */

async function requireUserId(): Promise<string | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user?.id ?? null
}

/* -------------------------------------------------------------------------- */
/*  12.7 — Past analyses listing                                               */
/* -------------------------------------------------------------------------- */

/**
 * Return the current user's weekly analyses, newest first.
 *
 * @param limit Optional cap (defaults to {@link DEFAULT_LIMIT}). Non-finite
 *              or non-positive values fall back to the default.
 */
export async function getWeeklyAnalyses(
  limit?: number,
): Promise<WeeklyAnalysis[]> {
  const userId = await requireUserId()
  if (!userId) return []

  const cap =
    typeof limit === 'number' && Number.isFinite(limit) && limit > 0
      ? Math.floor(limit)
      : DEFAULT_LIMIT

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('weekly_analyses')
    .select('*')
    .eq('user_id', userId)
    .order('week_start', { ascending: false })
    .limit(cap)

  if (error) {
    throw new Error(`Failed to load weekly analyses: ${error.message}`)
  }

  return data ?? []
}

/**
 * Return the most recent weekly analysis for the current user, or `null`
 * if none has been generated yet.
 */
export async function getLatestAnalysis(): Promise<WeeklyAnalysis | null> {
  const userId = await requireUserId()
  if (!userId) return null

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('weekly_analyses')
    .select('*')
    .eq('user_id', userId)
    .order('week_start', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    throw new Error(`Failed to load latest weekly analysis: ${error.message}`)
  }

  return data
}
