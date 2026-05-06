'use client'

import Link from 'next/link'
import { motion, useReducedMotion } from 'framer-motion'
import { cn } from '@/lib/utils'

export function CtaSection() {
  const shouldReduceMotion = useReducedMotion()

  return (
    <section
      className="relative bg-gradient-to-br from-[#1a1a1a] to-[#111111] py-24 sm:py-32 px-4 sm:px-6 lg:px-8 overflow-hidden"
      aria-label="Regisztráció felhívás"
    >
      {/* Subtle brand-red glow */}
      {!shouldReduceMotion && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(120,0,0,0.12) 0%, transparent 70%)',
          }}
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ repeat: Infinity, duration: 6, ease: 'easeInOut' }}
          aria-hidden="true"
        />
      )}

      <div className="relative z-10 max-w-3xl mx-auto text-center">
        <motion.div
          initial={shouldReduceMotion ? undefined : { opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <h2 className="font-condensed font-extrabold uppercase text-[#e0e0e0] text-4xl sm:text-5xl tracking-[0.05em] mb-4 leading-tight">
            Kezdd el most — ingyen!
          </h2>
          <p className="font-sans text-[#a0a0a0] text-base sm:text-lg mb-10 max-w-lg mx-auto">
            Csatlakozz és alakítsd át a fitnesz rutinod — teljes hozzáférés, regisztrációtól azonnal.
          </p>

          <Link
            href="/register"
            className={cn(
              'inline-flex items-center justify-center rounded-lg px-10 py-4',
              'text-base font-semibold text-white transition-all duration-200',
              'bg-[#780000] hover:bg-[#8a0000]',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#780000]/50',
              'shadow-lg shadow-[#780000]/20',
            )}
          >
            Regisztrálok most
          </Link>

          <p className="mt-4 font-sans text-xs text-[#a0a0a0]">
            Nincs hitelkártya szükséges
          </p>
        </motion.div>
      </div>
    </section>
  )
}
