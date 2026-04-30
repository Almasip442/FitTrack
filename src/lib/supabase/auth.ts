/**
 * Supabase Auth helper functions.
 *
 * - Client-side helpers (for use in Client Components / form handlers)
 *   use the browser Supabase client and persist the session via cookies
 *   set by `@supabase/ssr`.
 * - Server-side helpers use the server Supabase client and read cookies
 *   from the incoming request.
 *
 * Server Actions (sign out) are exported from
 * `src/lib/supabase/auth-actions.ts` to keep this module
 * importable from both Server and Client Components.
 */

import type { Session, User, AuthError } from '@supabase/supabase-js'

import { createClient as createBrowserClient } from './client'
import { createClient as createServerClient } from './server'

/* -------------------------------------------------------------------------- */
/*  Result types                                                               */
/* -------------------------------------------------------------------------- */

export type AuthResult<T> = {
  data: T | null
  error: AuthError | null
}

/* -------------------------------------------------------------------------- */
/*  Client-side helpers                                                        */
/* -------------------------------------------------------------------------- */

/**
 * Register a new user with email + password.
 * Must be called from a Client Component / browser context so that the
 * resulting session is persisted in cookies.
 */
export async function signUp(
  email: string,
  password: string,
): Promise<AuthResult<{ user: User | null; session: Session | null }>> {
  const supabase = createBrowserClient()
  const { data, error } = await supabase.auth.signUp({ email, password })

  if (error) {
    return { data: null, error }
  }

  return {
    data: { user: data.user, session: data.session },
    error: null,
  }
}

/**
 * Sign in an existing user with email + password.
 * Must be called from a Client Component / browser context so that the
 * resulting session is persisted in cookies.
 */
export async function signIn(
  email: string,
  password: string,
): Promise<AuthResult<{ user: User; session: Session }>> {
  const supabase = createBrowserClient()
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { data: null, error }
  }

  return {
    data: { user: data.user, session: data.session },
    error: null,
  }
}

/**
 * Sign out the current user from a Client Component context.
 * For Server Action sign-out, see `signOutAction` in `auth-actions.ts`.
 */
export async function signOut(): Promise<{ error: AuthError | null }> {
  const supabase = createBrowserClient()
  const { error } = await supabase.auth.signOut()
  return { error }
}

/* -------------------------------------------------------------------------- */
/*  Server-side helpers                                                        */
/* -------------------------------------------------------------------------- */

/**
 * Read the current session on the server.
 * NOTE: Prefer `getUser()` for authorization checks — `getSession()`
 * returns the raw cookie payload without re-validating against Supabase.
 */
export async function getSession(): Promise<AuthResult<Session>> {
  const supabase = await createServerClient()
  const { data, error } = await supabase.auth.getSession()

  if (error) {
    return { data: null, error }
  }
  return { data: data.session, error: null }
}

/**
 * Read the currently authenticated user on the server.
 * This re-validates the JWT against Supabase and is the recommended
 * way to gate access to protected resources from Server Components
 * and Route Handlers.
 */
export async function getUser(): Promise<AuthResult<User>> {
  const supabase = await createServerClient()
  const { data, error } = await supabase.auth.getUser()

  if (error) {
    return { data: null, error }
  }
  return { data: data.user, error: null }
}
