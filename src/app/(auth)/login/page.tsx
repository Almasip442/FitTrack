'use client'

import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useMemo, useState, type FormEvent } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { slideUp, staggerChildren } from '@/lib/animations'
import { mapAuthError } from '@/lib/auth-errors'
import { signIn } from '@/lib/supabase/auth'
import { cn } from '@/lib/utils'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

interface FieldErrors {
  email?: string
  password?: string
}

interface TouchedState {
  email: boolean
  password: boolean
}

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectTo') ?? '/dashboard'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [touched, setTouched] = useState<TouchedState>({
    email: false,
    password: false,
  })
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)

  const errors: FieldErrors = useMemo(() => {
    const next: FieldErrors = {}
    if (!email) {
      next.email = 'Az e-mail cím megadása kötelező.'
    } else if (!EMAIL_RE.test(email)) {
      next.email = 'Érvénytelen e-mail cím formátum.'
    }
    if (!password) {
      next.password = 'A jelszó megadása kötelező.'
    } else if (password.length < 6) {
      next.password = 'A jelszó legalább 6 karakter hosszú legyen.'
    }
    return next
  }, [email, password])

  const isValid = !errors.email && !errors.password

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setTouched({ email: true, password: true })
    if (!isValid || isPending) return

    setSubmitError(null)
    setIsPending(true)

    const { error } = await signIn(email, password)

    if (error) {
      setSubmitError(mapAuthError(error))
      setIsPending(false)
      return
    }

    router.replace(redirectTo)
    router.refresh()
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={staggerChildren}
      className="space-y-8"
    >
      {/* Header */}
      <motion.div variants={slideUp} className="space-y-3">
        <p className="font-condensed text-[11px] uppercase tracking-wide-display text-brand-red">
          {'// 01 / Bejelentkezés'}
        </p>
        <h1 className="font-condensed text-4xl font-extrabold uppercase tracking-display text-foreground sm:text-5xl">
          Üdv újra.
        </h1>
        <p className="text-sm text-muted-foreground">
          Add meg a hitelesítő adataidat a folytatáshoz.
        </p>
      </motion.div>

      <motion.div variants={slideUp} className="h-px w-12 bg-brand-red" />

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        {/* Email */}
        <motion.div variants={slideUp} className="space-y-2">
          <label
            htmlFor="email"
            className="flex items-center justify-between font-condensed text-[11px] uppercase tracking-wide-display text-muted-foreground"
          >
            <span>E-mail cím</span>
            <span className="text-muted-foreground/50">[ required ]</span>
          </label>
          <Input
            id="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, email: true }))}
            disabled={isPending}
            aria-invalid={touched.email && !!errors.email}
            aria-describedby={
              touched.email && errors.email ? 'email-error' : undefined
            }
            className="h-11 bg-card font-sans text-base placeholder:text-muted-foreground/60"
            placeholder="te@pelda.hu"
          />
          {touched.email && errors.email && (
            <p
              id="email-error"
              role="alert"
              className="text-xs text-red-500"
            >
              {errors.email}
            </p>
          )}
        </motion.div>

        {/* Password */}
        <motion.div variants={slideUp} className="space-y-2">
          <label
            htmlFor="password"
            className="flex items-center justify-between font-condensed text-[11px] uppercase tracking-wide-display text-muted-foreground"
          >
            <span>Jelszó</span>
            <span className="text-muted-foreground/50">[ required ]</span>
          </label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, password: true }))}
            disabled={isPending}
            aria-invalid={touched.password && !!errors.password}
            aria-describedby={
              touched.password && errors.password
                ? 'password-error'
                : undefined
            }
            className="h-11 bg-card font-sans text-base placeholder:text-muted-foreground/60"
            placeholder="••••••••"
          />
          {touched.password && errors.password && (
            <p
              id="password-error"
              role="alert"
              className="text-xs text-red-500"
            >
              {errors.password}
            </p>
          )}
        </motion.div>

        {/* Submit error (server) */}
        {submitError && (
          <div
            role="alert"
            className={cn(
              'rounded-md border px-3 py-2 text-sm',
              'border-red-500/30 bg-red-500/10 text-red-500',
            )}
          >
            {submitError}
          </div>
        )}

        {/* Submit */}
        <motion.div variants={slideUp}>
          <Button
            type="submit"
            size="lg"
            disabled={isPending || !isValid}
            className="h-11 w-full font-condensed text-sm uppercase tracking-wide-display"
          >
            {isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Belépés...
              </>
            ) : (
              'Bejelentkezés'
            )}
          </Button>
        </motion.div>

        {/* Footer link */}
        <motion.p
          variants={slideUp}
          className="pt-2 text-center text-sm text-muted-foreground"
        >
          Nincs még fiókod?{' '}
          <Link
            href="/register"
            className="font-condensed uppercase tracking-wide-display text-brand-red underline-offset-4 hover:underline"
          >
            Regisztrálj
          </Link>
        </motion.p>
      </form>
    </motion.div>
  )
}
