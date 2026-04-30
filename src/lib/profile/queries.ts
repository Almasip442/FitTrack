/**
 * Profile read-side queries — server-only.
 *
 * Backend Iteration 5 / Task 5.1.
 *
 * Uses the Supabase server client (cookie-bound) so RLS evaluates against
 * the caller's session. Callers should be Server Components, Server
 * Actions, or Route Handlers.
 */

import { createClient } from '@/lib/supabase/server'
import type { Profile } from '@/types/database'

/**
 * Load the profile row for a given user id.
 *
 * Returns `null` when the row does not exist or RLS hides it from the
 * current session. Throws on unexpected database errors so the caller
 * can decide how to surface them (typically: render an error boundary).
 */
export async function getProfile(userId: string): Promise<Profile | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle()

  if (error) {
    throw new Error(`Failed to load profile: ${error.message}`)
  }

  return data
}
