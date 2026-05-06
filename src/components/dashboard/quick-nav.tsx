'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Dumbbell, Flame, TrendingUp, ShoppingBag } from 'lucide-react'

import { staggerChildren, slideUp } from '@/lib/animations'
import { cn } from '@/lib/utils'

/* -------------------------------------------------------------------------- */
/*  Nav items                                                                  */
/* -------------------------------------------------------------------------- */

const NAV_ITEMS = [
  {
    href: '/workouts',
    icon: Dumbbell,
    label: 'Edzéstervező',
    description: 'Tervek és gyakorlatok',
  },
  {
    href: '/calories',
    icon: Flame,
    label: 'Kalória',
    description: 'Napi naplózás',
  },
  {
    href: '/progress',
    icon: TrendingUp,
    label: 'Fejlődés',
    description: 'Statisztikák és mérések',
  },
  {
    href: '/shop',
    icon: ShoppingBag,
    label: 'Shop',
    description: 'Edzőfelszerelések',
  },
] as const

/* -------------------------------------------------------------------------- */
/*  Main component                                                             */
/* -------------------------------------------------------------------------- */

export function QuickNav() {
  return (
    <section className="mt-2">
      <h2 className="mb-4 font-condensed text-sm font-bold uppercase tracking-wide-display text-muted-foreground">
        Gyors navigáció
      </h2>

      <motion.div
        variants={staggerChildren}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 gap-3 sm:grid-cols-4"
      >
        {NAV_ITEMS.map(({ href, icon: Icon, label, description }) => (
          <motion.div key={href} variants={slideUp}>
            <Link
              href={href}
              className={cn(
                'group flex flex-col items-center gap-3 rounded-xl border p-4 text-center',
                'bg-card border-border transition-all duration-200',
                'hover:bg-[rgba(120,0,0,0.05)] hover:border-[rgba(120,0,0,0.35)]',
                'dark:bg-[#1a1a1a] dark:border-[#2a2a2a]',
                'dark:hover:bg-[rgba(120,0,0,0.1)]',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              )}
            >
              <div
                className={cn(
                  'flex size-11 items-center justify-center rounded-full border transition-all duration-200',
                  'bg-muted border-border',
                  'group-hover:bg-[rgba(120,0,0,0.1)] group-hover:border-[rgba(120,0,0,0.35)]',
                )}
              >
                <Icon
                  className={cn(
                    'size-5 stroke-[1.5] text-muted-foreground transition-colors duration-200',
                    'group-hover:text-brand-red',
                  )}
                />
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="font-condensed text-sm font-bold uppercase tracking-display leading-tight">
                  {label}
                </span>
                <span className="font-condensed text-[10px] text-muted-foreground tracking-wide-display">
                  {description}
                </span>
              </div>
            </Link>
          </motion.div>
        ))}
      </motion.div>
    </section>
  )
}
