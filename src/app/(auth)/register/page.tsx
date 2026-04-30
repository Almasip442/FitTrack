'use client'

import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMemo, useState, type FormEvent } from 'react'

import { PasswordStrength } from '@/components/auth/password-strength'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { slideUp, staggerChildren } from '@/lib/animations'
import { mapAuthError } from '@/lib/auth-errors'
import { signUp } from '@/lib/supabase/auth'
import { cn } from '@/lib/utils'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

interface FieldErrors {
  email?: string
  password?: string
  confirm?: string
}

interface TouchedState {
  email: boolean
  password: boolean
  confirm: boolean
}

export default function RegisterPage() {
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [touched, setTouched] = useState<TouchedState>({
    email: false,
    password: false,
    confirm: false,
  })

  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitNotice, setSubmitNotice] = useState<string | null>(null)
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
    if (!confirm) {
      next.confirm = 'A jelszó megerősítése kötelező.'
    } else if (confirm !== password) {
      next.confirm = 'A két jelszó nem egyezik.'
    }
    return next
  }, [email, password, confirm])

  const isValid = !errors.email && !errors.password && !errors.confirm

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setTouched({ email: true, password: true, confirm: true })
    if (!isValid || isPending) return

    setSubmitError(null)
    setSubmitNotice(null)
    setIsPending(true)

    const { data, error } = await signUp(email, password)

    if (error) {
      setSubmitError(mapAuthError(error))
      setIsPending(false)
      return
    }

    // If email confirmation is required, no session is returned.
    if (!data?.session) {
      setSubmitNotice(
        'Sikeres regisztráció. Erősítsd meg az e-mail címed, majd jelentkezz be.',
      )
      setIsPending(false)
      return
    }

    router.replace('/onboarding')
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
          {'// 02 / Regisztráció'}
        </p>
        <h1 className="font-condensed text-4xl font-extrabold uppercase tracking-display text-foreground sm:text-5xl">
          Hozz létre fiókot.
        </h1>
        <p className="text-sm text-muted-foreground">
          Pár adat, és indulhat a követés. Soha nem osztjuk meg
          harmadik féllel.
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
            <span className="text-muted-foreground/50">[ min 6 ]</span>
          </label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
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
                : 'password-strength'
            }
            className="h-11 bg-card font-sans text-base placeholder:text-muted-foreground/60"
            placeholder="••••••••"
          />
          <div id="password-strength">
            <PasswordStrength password={password} />
          </div>
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

        {/* Confirm password */}
        <motion.div variants={slideUp} className="space-y-2">
          <label
            htmlFor="confirm"
            className="flex items-center justify-between font-condensed text-[11px] uppercase tracking-wide-display text-muted-foreground"
          >
            <span>Jelszó megerősítése</span>
            <span className="text-muted-foreground/50">[ match ]</span>
          </label>
          <Input
            id="confirm"
            type="password"
            autoComplete="new-password"
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, confirm: true }))}
            disabled={isPending}
            aria-invalid={touched.confirm && !!errors.confirm}
            aria-describedby={
              touched.confirm && errors.confirm
                ? 'confirm-error'
                : undefined
            }
            className="h-11 bg-card font-sans text-base placeholder:text-muted-foreground/60"
            placeholder="••••••••"
          />
          {touched.confirm && errors.confirm && (
            <p
              id="confirm-error"
              role="alert"
              className="text-xs text-red-500"
            >
              {errors.confirm}
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

        {/* Server notice (e.g. confirm email) */}
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
            disabled={isPending || !isValid}
            className="h-11 w-full font-condensed text-sm uppercase tracking-wide-display"
          >
            {isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Regisztráció...
              </>
            ) : (
              'Fiók létrehozása'
            )}
          </Button>
        </motion.div>

        {/* Footer link */}
        <motion.p
          variants={slideUp}
          className="pt-2 text-center text-sm text-muted-foreground"
        >
          Van már fiókod?{' '}
          <Link
            href="/login"
            className="font-condensed uppercase tracking-wide-display text-brand-red underline-offset-4 hover:underline"
          >
            Jelentkezz be
          </Link>
        </motion.p>
      </form>
    </motion.div>
  )
}
