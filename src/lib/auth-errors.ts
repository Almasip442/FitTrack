import type { AuthError } from '@supabase/supabase-js'

/**
 * Map Supabase Auth error codes / messages to Hungarian, user-friendly text.
 * The set of `code` values is taken from `@supabase/supabase-js` docs;
 * we fall back to message-based heuristics for older releases that do not
 * expose `code`, and finally to a generic copy.
 */
export function mapAuthError(error: AuthError | null | undefined): string {
  if (!error) return ''

  const code = (error as AuthError & { code?: string }).code
  const message = error.message?.toLowerCase() ?? ''

  if (code === 'invalid_credentials' || message.includes('invalid login')) {
    return 'Hibás e-mail cím vagy jelszó.'
  }
  if (code === 'email_not_confirmed' || message.includes('not confirmed')) {
    return 'Az e-mail cím még nincs megerősítve. Ellenőrizd a postafiókod.'
  }
  if (code === 'user_already_exists' || message.includes('already registered')) {
    return 'Ezzel az e-mail címmel már létezik fiók.'
  }
  if (code === 'weak_password' || message.includes('password should be')) {
    return 'A jelszó túl gyenge. Használj legalább 6 karaktert, valamint betűt és számot.'
  }
  if (code === 'over_request_rate_limit' || message.includes('rate limit')) {
    return 'Túl sok próbálkozás. Kérjük, várj egy percet, mielőtt újra próbálnád.'
  }
  if (message.includes('network') || message.includes('fetch')) {
    return 'Hálózati hiba. Ellenőrizd az internetkapcsolatod, és próbáld újra.'
  }

  return 'Váratlan hiba történt. Kérjük, próbáld újra.'
}
