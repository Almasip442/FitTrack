import type { Session, User, AuthError } from '@supabase/supabase-js'

import { createClient as createBrowserClient } from './client'

export type AuthResult<T> = {
  data: T | null
  error: AuthError | null
}

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

export async function signOut(): Promise<{ error: AuthError | null }> {
  const supabase = createBrowserClient()
  const { error } = await supabase.auth.signOut()
  return { error }
}
