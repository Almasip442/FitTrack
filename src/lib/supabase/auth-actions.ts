'use server'

/**
 * Server Actions for authentication.
 *
 * Kept separate from `auth.ts` so that `auth.ts` can be imported from
 * both Client and Server Components without forcing the entire module
 * into a Server Action bundle.
 */

import { redirect } from 'next/navigation'

import { createClient } from './server'

/**
 * Sign the current user out and redirect to /login.
 * Intended to be passed as the `action` of a <form> in a Client/Server
 * Component (see `src/components/auth/sign-out-button.tsx`).
 */
export async function signOutAction(): Promise<void> {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
