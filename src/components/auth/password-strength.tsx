'use client'

import { cn } from '@/lib/utils'

/**
 * Compute a 0–4 password-strength score:
 *   0 → empty
 *   1 → too short / minimal (< 6 chars OR only one character class)
 *   2 → ok    (>= 6 chars + one extra signal)
 *   3 → strong (>= 10 chars OR mixed-case + digits)
 *   4 → very strong (>= 12 chars + mixed-case + digits + symbol)
 */
export function scorePassword(password: string): number {
  if (!password) return 0

  const length = password.length
  const hasLower = /[a-z]/.test(password)
  const hasUpper = /[A-Z]/.test(password)
  const hasDigit = /\d/.test(password)
  const hasSymbol = /[^A-Za-z0-9]/.test(password)
  const classes = [hasLower, hasUpper, hasDigit, hasSymbol].filter(Boolean).length

  if (length < 6) return 1
  if (length >= 12 && classes >= 3) return 4
  if (length >= 10 && classes >= 2) return 3
  if (length >= 6 && classes >= 2) return 2
  return 1
}

const LABELS = ['', 'Gyenge', 'Közepes', 'Erős', 'Nagyon erős'] as const

const SEGMENT_COLORS = [
  '', // empty / score 0
  'bg-red-500',
  'bg-amber-500',
  'bg-lime-500',
  'bg-emerald-500',
] as const

const LABEL_COLORS = [
  'text-muted-foreground',
  'text-red-500',
  'text-amber-500',
  'text-lime-500',
  'text-emerald-500',
] as const

interface PasswordStrengthProps {
  password: string
  /**
   * Whether to render the textual label.
   * Defaults to `true` — set to `false` if you only need the bar.
   */
  showLabel?: boolean
}

/**
 * Four-segment password strength meter, styled to match the
 * industrial-minimalist aesthetic. The meter is purely informational;
 * the actual validation rule (≥ 6 chars) lives in the form.
 */
export function PasswordStrength({
  password,
  showLabel = true,
}: PasswordStrengthProps) {
  const score = scorePassword(password)

  return (
    <div className="mt-2 space-y-1.5">
      <div
        role="meter"
        aria-valuemin={0}
        aria-valuemax={4}
        aria-valuenow={score}
        aria-label="Jelszó erőssége"
        className="grid grid-cols-4 gap-1"
      >
        {Array.from({ length: 4 }).map((_, index) => {
          const filled = index < score
          const color = filled ? SEGMENT_COLORS[score] : 'bg-brand-gray/30'
          return (
            <span
              key={index}
              className={cn(
                'h-1 rounded-full transition-colors duration-200',
                color,
              )}
            />
          )
        })}
      </div>

      {showLabel && (
        <p
          className={cn(
            'font-condensed text-[11px] uppercase tracking-wide-display',
            LABEL_COLORS[score],
          )}
        >
          {score === 0 ? 'Add meg a jelszavadat' : LABELS[score]}
        </p>
      )}
    </div>
  )
}
