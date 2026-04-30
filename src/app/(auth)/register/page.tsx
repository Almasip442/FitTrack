'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { signUp } from '@/lib/supabase/auth'

export default function RegisterPage() {
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    if (password.length < 6) {
      setError('A jelszónak legalább 6 karakter hosszúnak kell lennie.')
      return
    }

    setIsPending(true)

    const { data, error: signUpError } = await signUp(email, password)

    if (signUpError) {
      setError(signUpError.message)
      setIsPending(false)
      return
    }

    // If email confirmation is disabled in Supabase, the session is
    // available immediately and we can navigate to onboarding.
    // If confirmation is required (no session returned), prompt the user.
    if (!data?.session) {
      setError(
        'A regisztráció sikeres volt. Kérjük, erősítsd meg az e-mail címed, majd jelentkezz be.',
      )
      setIsPending(false)
      return
    }

    router.replace('/onboarding')
    router.refresh()
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-sm flex-col justify-center px-4 py-12">
      <div className="mb-8 space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          Regisztráció
        </h1>
        <p className="text-sm text-muted-foreground">
          Hozz létre egy fiókot a FitTrack Pro használatához.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div className="space-y-2">
          <label
            htmlFor="email"
            className="text-sm font-medium leading-none"
          >
            E-mail cím
          </label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={isPending}
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="password"
            className="text-sm font-medium leading-none"
          >
            Jelszó
          </label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={6}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            disabled={isPending}
          />
          <p className="text-xs text-muted-foreground">
            Legalább 6 karakter.
          </p>
        </div>

        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}

        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={isPending}
        >
          {isPending ? 'Regisztráció...' : 'Regisztráció'}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Már van fiókod?{' '}
        <Link
          href="/login"
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          Bejelentkezés
        </Link>
      </p>
    </div>
  )
}
