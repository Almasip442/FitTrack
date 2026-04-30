'use client'

import { Search, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { Input } from '@/components/ui/input'
import { useDebounce } from '@/hooks/use-debounce'
import { cn } from '@/lib/utils'

interface ExerciseSearchBarProps {
  /** Initial value rendered on mount (e.g. read from URL). */
  initialValue?: string
  /** Fired with the debounced text — caller wires to URL/router. */
  onDebouncedChange: (value: string) => void
  /** Optional placeholder text. */
  placeholder?: string
  /** Debounce delay in ms — defaults to 300ms per backlog spec. */
  delay?: number
}

/**
 * Console-styled search input for the exercise browser.
 *
 * Visual idiom:
 *   `>` cursor prefix   →   <Search/> hint   →   <input>   →   <X/> clear
 *
 * Wires to the parent through a debounced callback so URL params and
 * network requests don't fire on every keystroke. The input value is
 * mirrored synchronously for responsive typing; only the *propagated*
 * value is debounced.
 */
export function ExerciseSearchBar({
  initialValue = '',
  onDebouncedChange,
  placeholder = 'Keresés gyakorlat névre, leírásra...',
  delay = 300,
}: ExerciseSearchBarProps) {
  const [value, setValue] = useState(initialValue)
  const debounced = useDebounce(value, delay)
  const inputRef = useRef<HTMLInputElement | null>(null)

  // Track whether the change came from the user vs an external prop sync.
  const lastReportedRef = useRef<string>(initialValue)

  // Re-sync to external prop changes (e.g. browser back/forward).
  useEffect(() => {
    if (initialValue !== value && initialValue !== lastReportedRef.current) {
      setValue(initialValue)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialValue])

  useEffect(() => {
    if (debounced === lastReportedRef.current) return
    lastReportedRef.current = debounced
    onDebouncedChange(debounced)
  }, [debounced, onDebouncedChange])

  const hasValue = value.length > 0

  return (
    <div
      className={cn(
        'group relative flex items-center gap-3',
        'rounded-md border border-border bg-card',
        'px-4 h-12',
        'transition-colors duration-200',
        'focus-within:border-brand-red',
        'focus-within:shadow-[0_0_0_1px_rgba(120,0,0,0.4)_inset]',
      )}
    >
      {/* Console cursor prefix */}
      <span
        aria-hidden="true"
        className="font-condensed text-sm font-bold uppercase tracking-wide-display text-brand-red shrink-0"
      >
        {'>'}
      </span>

      <Search
        aria-hidden="true"
        className="size-4 shrink-0 text-muted-foreground/70 transition-colors group-focus-within:text-brand-red"
      />

      <Input
        ref={inputRef}
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        aria-label="Keresés a gyakorlatok között"
        className={cn(
          // Strip the default Input chrome — the wrapper handles it.
          'h-full w-full flex-1 border-0 bg-transparent px-0 py-0 shadow-none',
          'text-base font-sans placeholder:text-muted-foreground/60',
          'focus-visible:border-0 focus-visible:ring-0',
          // Hide the native search clear ("X") cross — we render our own.
          '[&::-webkit-search-cancel-button]:appearance-none',
        )}
      />

      {hasValue && (
        <button
          type="button"
          aria-label="Keresés törlése"
          onClick={() => {
            setValue('')
            inputRef.current?.focus()
          }}
          className={cn(
            'shrink-0 rounded-full p-1 transition-colors',
            'text-muted-foreground hover:bg-brand-red-muted hover:text-brand-red',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
          )}
        >
          <X className="size-3.5" />
        </button>
      )}
    </div>
  )
}
