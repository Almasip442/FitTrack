'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState, type FormEvent } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { signIn } from '@/lib/supabase/auth'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectTo') ?? '/dashboard'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setIsPending(true)

    const { error: signInError } = await signIn(email, password)

    if (signInError) {
      setError(signInError.message)
      setIsPending(false)
      return
    }

    router.replace(redirectTo)
    router.refresh()
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-sm flex-col justify-center px-4 py-12">
      <div className="mb-8 space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          Bejelentkezés
        </h1>
        <p className="text-sm text-muted-foreground">
          Add meg az e-mail címed és a jelszavad a folytatáshoz.
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
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            disabled={isPending}
          />
        </div>

        {error && (
          <p
            role="alert"
            className="text-sm text-destructive"
          >
            {error}
          </p>
        )}

        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={isPending}
        >
          {isPending ? 'Bejelentkezés...' : 'Bejelentkezés'}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Még nincs fiókod?{' '}
        <Link
          href="/register"
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          Regisztráció
        </Link>
      </p>
    </div>
  )
}
