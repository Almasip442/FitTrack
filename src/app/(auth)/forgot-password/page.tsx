'use client'

import { motion } from 'framer-motion'
import { ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useMemo, useState, type FormEvent } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { slideUp, staggerChildren } from '@/lib/animations'
import { mapAuthError } from '@/lib/auth-errors'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

interface FieldErrors {
  email?: string
}

interface TouchedState {
  email: boolean
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [touched, setTouched] = useState<TouchedState>({ email: false })
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitNotice, setSubmitNotice] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)
  const [isSent, setIsSent] = useState(false)

  const errors: FieldErrors = useMemo(() => {
    const next: FieldErrors = {}
    if (!email) {
      next.email = 'Az e-mail cím megadása kötelező.'
    } else if (!EMAIL_RE.test(email)) {
      next.email = 'Érvénytelen e-mail cím formátum.'
    }
    return next
  }, [email])

  const isValid = !errors.email

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setTouched({ email: true })
    if (!isValid || isPending) return

    setSubmitError(null)
    setSubmitNotice(null)
    setIsPending(true)

    const supabase = createClient()
    const redirectTo =
      typeof window !== 'undefined'
        ? `${window.location.origin}/reset-password`
        : undefined

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    })

    if (error) {
      setSubmitError(mapAuthError(error))
      setIsPending(false)
      return
    }

    setSubmitNotice(
      'Jelszó visszaállítási linket küldtünk az email címedre.',
    )
    setIsSent(true)
    setIsPending(false)
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
          {'// 03 / Jelszó visszaállítása'}
        </p>
        <h1 className="font-condensed text-4xl font-extrabold uppercase tracking-display text-foreground sm:text-5xl">
          Elfelejtetted?
        </h1>
        <p className="text-sm text-muted-foreground">
          Add meg a fiókodhoz tartozó e-mail címet, és küldünk egy
          visszaállítási linket.
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
            disabled={isPending || isSent}
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

        {/* Server error */}
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

        {/* Server success notice */}
        {submitNotice && (
          <div
            role="status"
            className={cn(
              'rounded-md border px-3 py-2 text-sm',
              'border-emerald-500/30 bg-emerald-500/10 text-emerald-500',
            )}
          >
            {submitNotice}
          </div>
        )}

        {/* Submit */}
        <motion.div variants={slideUp}>
          <Button
            type="submit"
            size="lg"
            disabled={isPending || !isValid || isSent}
            className="h-11 w-full font-condensed text-sm uppercase tracking-wide-display"
          >
            {isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Küldés...
              </>
            ) : isSent ? (
              'Elküldve'
            ) : (
              'Visszaállítási link küldése'
            )}
          </Button>
        </motion.div>

        {/* Back-to-login link */}
        <motion.p
          variants={slideUp}
          className="pt-2 text-center text-sm text-muted-foreground"
        >
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 font-condensed uppercase tracking-wide-display text-brand-red underline-offset-4 hover:underline"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            Vissza a bejelentkezéshez
          </Link>
        </motion.p>
      </form>
    </motion.div>
  )
}
