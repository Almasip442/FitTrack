'use client'

/**
 * Shared profile form — used by both the onboarding and edit-profile pages.
 *
 * Frontend Iteration 3 / Tasks 3.1, 3.2, 3.3, 3.4, 3.6.
 *
 * Validation pattern follows the F2 auth-page convention:
 *   - `errors` is a useMemo derived from current state.
 *   - Each field has a `touched` flag set on blur.
 *   - A field error renders only if `touched[field] && errors[field]`.
 *   - Submit forces `setTouched({...all: true})`.
 *   - Submit button is disabled until the four mandatory fields
 *     (gender, weight, height, goal) are present and all errors clear.
 *
 * The form delegates persistence to the `updateProfile` Server Action
 * (Backend I5), submitted via `<form action={...}>`. We additionally
 * call it from the React-state submit handler so we can branch on the
 * `{ success, error }` result and surface a Sonner toast.
 */

import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useMemo, useState, useTransition, type FormEvent } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { slideUp, staggerChildren } from '@/lib/animations'
import { updateProfile } from '@/lib/profile/actions'
import { cn } from '@/lib/utils'
import type { Profile } from '@/types/database'

import { ActivitySelector, type ActivityLevel } from './activity-selector'
import { CaloriePreview } from './calorie-preview'
import { GenderSelector, type Gender } from './gender-selector'
import { GoalSelector, type Goal } from './goal-selector'

interface ProfileFormProps {
  /**
   * Initial values — usually the existing profile row. Pass `null` for
   * a brand-new onboarding flow.
   */
  initial: Pick<
    Profile,
    'name' | 'age' | 'gender' | 'weight' | 'height' | 'goal' | 'activity_level'
  > | null
  /**
   * Where to navigate after a successful save.
   * Onboarding: `/dashboard`. Profile edit: `/profile` (stay).
   */
  redirectTo: string
  /**
   * CTA copy on the submit button.
   */
  submitLabel: string
  /**
   * Toast message on success.
   */
  successMessage: string
}

interface FieldErrors {
  name?: string
  age?: string
  gender?: string
  weight?: string
  height?: string
  goal?: string
  activity_level?: string
}

interface TouchedState {
  name: boolean
  age: boolean
  gender: boolean
  weight: boolean
  height: boolean
  goal: boolean
  activity_level: boolean
}

const ALL_TOUCHED: TouchedState = {
  name: true,
  age: true,
  gender: true,
  weight: true,
  height: true,
  goal: true,
  activity_level: true,
}

/** Convert an empty string to `null` for the calorie calculator. */
function asNumber(value: string): number | null {
  if (value.trim() === '') return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

export function ProfileForm({
  initial,
  redirectTo,
  submitLabel,
  successMessage,
}: ProfileFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // ---- Field state (strings for inputs, structured for selectors) ----
  const [name, setName] = useState(initial?.name ?? '')
  const [age, setAge] = useState(
    initial?.age != null ? String(initial.age) : '',
  )
  const [gender, setGender] = useState<Gender | null>(initial?.gender ?? null)
  const [weight, setWeight] = useState(
    initial?.weight != null ? String(initial.weight) : '',
  )
  const [height, setHeight] = useState(
    initial?.height != null ? String(initial.height) : '',
  )
  const [goal, setGoal] = useState<Goal | null>(initial?.goal ?? null)
  const [activityLevel, setActivityLevel] = useState<ActivityLevel | null>(
    initial?.activity_level ?? null,
  )

  const [touched, setTouched] = useState<TouchedState>({
    name: false,
    age: false,
    gender: false,
    weight: false,
    height: false,
    goal: false,
    activity_level: false,
  })

  // ---- Validation ----
  const errors: FieldErrors = useMemo(() => {
    const next: FieldErrors = {}

    // Name is optional — but if provided, must not be just whitespace.
    if (name && name.trim().length === 0) {
      next.name = 'A név nem lehet csak szóköz.'
    }

    // Age — optional for the strict gate, but required for kcal preview.
    // Validate range when present.
    if (age) {
      const n = Number(age)
      if (!Number.isInteger(n) || n < 10 || n > 100) {
        next.age = 'Az életkor 10 és 100 között legyen.'
      }
    }

    // Gender — required.
    if (!gender) {
      next.gender = 'A nem megadása kötelező.'
    }

    // Weight — required, positive number.
    if (!weight) {
      next.weight = 'A testsúly megadása kötelező.'
    } else {
      const n = Number(weight)
      if (!Number.isFinite(n) || n <= 0) {
        next.weight = 'Adj meg érvényes testsúlyt.'
      } else if (n < 20 || n > 400) {
        next.weight = 'A testsúly 20 és 400 kg között legyen.'
      }
    }

    // Height — required, positive number.
    if (!height) {
      next.height = 'A magasság megadása kötelező.'
    } else {
      const n = Number(height)
      if (!Number.isFinite(n) || n <= 0) {
        next.height = 'Adj meg érvényes magasságot.'
      } else if (n < 80 || n > 250) {
        next.height = 'A magasság 80 és 250 cm között legyen.'
      }
    }

    // Goal — required.
    if (!goal) {
      next.goal = 'A cél kiválasztása kötelező.'
    }

    return next
  }, [name, age, gender, weight, height, goal])

  // The "Save" button gate — matches the backlog spec exactly.
  const isValid =
    !!gender &&
    !!weight &&
    !!height &&
    !!goal &&
    Object.keys(errors).length === 0

  function blur<K extends keyof TouchedState>(field: K) {
    return () => setTouched((t) => ({ ...t, [field]: true }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setTouched(ALL_TOUCHED)
    if (!isValid || isPending) return

    const formData = new FormData()
    if (name.trim()) formData.append('name', name.trim())
    if (age) formData.append('age', age)
    if (gender) formData.append('gender', gender)
    if (weight) formData.append('weight', weight)
    if (height) formData.append('height', height)
    if (goal) formData.append('goal', goal)
    if (activityLevel) formData.append('activity_level', activityLevel)

    startTransition(async () => {
      const result = await updateProfile(formData)
      if (!result.success) {
        toast.error(result.error)
        return
      }
      toast.success(successMessage)
      router.push(redirectTo)
      router.refresh()
    })
  }

  return (
    <motion.form
      onSubmit={handleSubmit}
      noValidate
      initial="hidden"
      animate="visible"
      variants={staggerChildren}
      className="space-y-8"
    >
      {/* Identity ------------------------------------------------------ */}
      <motion.section variants={slideUp} className="space-y-5">
        <SectionHeader index="01" label="Azonosítás" />

        {/* Name */}
        <div className="space-y-2">
          <FieldLabel htmlFor="name" meta="optional">
            Név
          </FieldLabel>
          <Input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={blur('name')}
            disabled={isPending}
            aria-invalid={touched.name && !!errors.name}
            aria-describedby={
              touched.name && errors.name ? 'name-error' : undefined
            }
            placeholder="Pl. Kiss János"
            className="h-11 bg-card font-sans text-base placeholder:text-muted-foreground/60"
          />
          {touched.name && errors.name && (
            <p id="name-error" role="alert" className="text-xs text-red-500">
              {errors.name}
            </p>
          )}
        </div>

        {/* Gender */}
        <div className="space-y-2">
          <FieldLabel meta="required" asLegend>
            Nem
          </FieldLabel>
          <GenderSelector
            value={gender}
            onChange={(v) => {
              setGender(v)
              setTouched((t) => ({ ...t, gender: true }))
            }}
            onBlur={blur('gender')}
            disabled={isPending}
            invalid={touched.gender && !!errors.gender}
          />
          {touched.gender && errors.gender && (
            <p role="alert" className="text-xs text-red-500">
              {errors.gender}
            </p>
          )}
        </div>
      </motion.section>

      {/* Metrics ------------------------------------------------------- */}
      <motion.section variants={slideUp} className="space-y-5">
        <SectionHeader index="02" label="Testparaméterek" />

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          {/* Age */}
          <div className="space-y-2">
            <FieldLabel htmlFor="age" meta="10–100">
              Életkor
            </FieldLabel>
            <Input
              id="age"
              name="age"
              type="number"
              inputMode="numeric"
              min={10}
              max={100}
              step={1}
              value={age}
              onChange={(e) => setAge(e.target.value)}
              onBlur={blur('age')}
              disabled={isPending}
              aria-invalid={touched.age && !!errors.age}
              aria-describedby={
                touched.age && errors.age ? 'age-error' : undefined
              }
              placeholder="—"
              className="h-11 bg-card font-sans text-base tabular-nums placeholder:text-muted-foreground/60"
            />
            {touched.age && errors.age && (
              <p id="age-error" role="alert" className="text-xs text-red-500">
                {errors.age}
              </p>
            )}
          </div>

          {/* Weight */}
          <div className="space-y-2">
            <FieldLabel htmlFor="weight" meta="kg">
              Testsúly
            </FieldLabel>
            <div className="relative">
              <Input
                id="weight"
                name="weight"
                type="number"
                inputMode="decimal"
                min={0.1}
                step={0.1}
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                onBlur={blur('weight')}
                disabled={isPending}
                aria-invalid={touched.weight && !!errors.weight}
                aria-describedby={
                  touched.weight && errors.weight
                    ? 'weight-error'
                    : undefined
                }
                placeholder="—"
                className="h-11 bg-card pr-10 font-sans text-base tabular-nums placeholder:text-muted-foreground/60"
              />
              <UnitSuffix>kg</UnitSuffix>
            </div>
            {touched.weight && errors.weight && (
              <p
                id="weight-error"
                role="alert"
                className="text-xs text-red-500"
              >
                {errors.weight}
              </p>
            )}
          </div>

          {/* Height */}
          <div className="space-y-2">
            <FieldLabel htmlFor="height" meta="cm">
              Magasság
            </FieldLabel>
            <div className="relative">
              <Input
                id="height"
                name="height"
                type="number"
                inputMode="numeric"
                min={1}
                step={1}
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                onBlur={blur('height')}
                disabled={isPending}
                aria-invalid={touched.height && !!errors.height}
                aria-describedby={
                  touched.height && errors.height
                    ? 'height-error'
                    : undefined
                }
                placeholder="—"
                className="h-11 bg-card pr-10 font-sans text-base tabular-nums placeholder:text-muted-foreground/60"
              />
              <UnitSuffix>cm</UnitSuffix>
            </div>
            {touched.height && errors.height && (
              <p
                id="height-error"
                role="alert"
                className="text-xs text-red-500"
              >
                {errors.height}
              </p>
            )}
          </div>
        </div>
      </motion.section>

      {/* Goal ---------------------------------------------------------- */}
      <motion.section variants={slideUp} className="space-y-5">
        <SectionHeader index="03" label="Cél" />

        <GoalSelector
          value={goal}
          onChange={(v) => {
            setGoal(v)
            setTouched((t) => ({ ...t, goal: true }))
          }}
          onBlur={blur('goal')}
          disabled={isPending}
          invalid={touched.goal && !!errors.goal}
        />
        {touched.goal && errors.goal && (
          <p role="alert" className="text-xs text-red-500">
            {errors.goal}
          </p>
        )}
      </motion.section>

      {/* Activity ------------------------------------------------------ */}
      <motion.section variants={slideUp} className="space-y-5">
        <SectionHeader index="04" label="Aktivitási szint" />

        <ActivitySelector
          value={activityLevel}
          onChange={(v) => {
            setActivityLevel(v)
            setTouched((t) => ({ ...t, activity_level: true }))
          }}
          onBlur={blur('activity_level')}
          disabled={isPending}
        />
      </motion.section>

      {/* Calorie preview ---------------------------------------------- */}
      <motion.section variants={slideUp}>
        <CaloriePreview
          gender={gender}
          weight={asNumber(weight)}
          height={asNumber(height)}
          age={asNumber(age)}
          activityLevel={activityLevel}
          goal={goal}
        />
      </motion.section>

      {/* Submit -------------------------------------------------------- */}
      <motion.div
        variants={slideUp}
        className="sticky bottom-4 z-10 flex flex-col gap-3 rounded-xl border border-border bg-background/80 p-3 backdrop-blur-md sm:flex-row sm:items-center sm:justify-between sm:p-4"
      >
        <p className="font-condensed text-[11px] uppercase tracking-wide-display text-muted-foreground">
          {isValid
            ? '// Készen állsz a mentésre'
            : '// Töltsd ki a kötelező mezőket'}
        </p>
        <Button
          type="submit"
          size="lg"
          disabled={isPending || !isValid}
          className={cn(
            'h-11 w-full font-condensed text-sm uppercase tracking-wide-display sm:w-auto sm:min-w-[14rem]',
          )}
        >
          {isPending ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Mentés...
            </>
          ) : (
            submitLabel
          )}
        </Button>
      </motion.div>
    </motion.form>
  )
}

/* -------------------------------------------------------------------------- */
/*  Internal: shared field chrome                                             */
/* -------------------------------------------------------------------------- */

function SectionHeader({ index, label }: { index: string; label: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="font-condensed text-[11px] uppercase tracking-wide-display text-brand-red">
        {`// ${index}`}
      </span>
      <h2 className="font-condensed text-lg font-semibold uppercase tracking-wide-display text-foreground">
        {label}
      </h2>
      <span className="h-px flex-1 bg-border" />
    </div>
  )
}

interface FieldLabelProps {
  htmlFor?: string
  meta?: string
  children: React.ReactNode
  asLegend?: boolean
}

function FieldLabel({ htmlFor, meta, children, asLegend }: FieldLabelProps) {
  const className =
    'flex items-center justify-between font-condensed text-[11px] uppercase tracking-wide-display text-muted-foreground'

  if (asLegend) {
    return (
      <p className={className}>
        <span>{children}</span>
        {meta && <span className="text-muted-foreground/50">[ {meta} ]</span>}
      </p>
    )
  }

  return (
    <label htmlFor={htmlFor} className={className}>
      <span>{children}</span>
      {meta && <span className="text-muted-foreground/50">[ {meta} ]</span>}
    </label>
  )
}

function UnitSuffix({ children }: { children: React.ReactNode }) {
  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 font-condensed text-[11px] uppercase tracking-wide-display text-muted-foreground/70"
    >
      {children}
    </span>
  )
}
