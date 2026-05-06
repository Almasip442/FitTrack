'use client'

import Link from 'next/link'
import { ChevronDown } from 'lucide-react'
import {
  motion,
  useScroll,
  useTransform,
  useReducedMotion,
  type Variants,
} from 'framer-motion'
import { cn } from '@/lib/utils'

const headlineWords = ['TERVEZD MEG.', 'EDZD LE.', 'FEJLŐDJ.']

const containerVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.18,
      delayChildren: 0.2,
    },
  },
}

const wordVariants: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  },
}

const subtitleVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' as const, delay: 0.75 },
  },
}

const ctaVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' as const, delay: 0.95 },
  },
}

export function HeroSection() {
  const shouldReduceMotion = useReducedMotion()
  const { scrollYProgress } = useScroll()

  // Parallax transforms for blobs
  const blob1Y = useTransform(scrollYProgress, [0, 1], ['0%', '-20%'])
  const blob2Y = useTransform(scrollYProgress, [0, 1], ['0%', '-12%'])

  return (
    <section
      className="relative min-h-screen bg-[#111111] flex flex-col items-center justify-center overflow-hidden"
      aria-label="Hero szekció"
    >
      {/* Animated background blobs */}
      {!shouldReduceMotion && (
        <>
          <motion.div
            className="absolute top-1/4 left-1/4 w-[600px] h-[600px] rounded-full pointer-events-none"
            style={{
              background:
                'radial-gradient(circle, rgba(120,0,0,0.15) 0%, transparent 70%)',
              y: blob1Y,
            }}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.1, 0.2, 0.1],
            }}
            transition={{
              repeat: Infinity,
              duration: 8,
              ease: 'easeInOut',
            }}
          />
          <motion.div
            className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] rounded-full pointer-events-none"
            style={{
              background:
                'radial-gradient(circle, rgba(64,64,64,0.2) 0%, transparent 70%)',
              y: blob2Y,
            }}
            animate={{
              scale: [1, 1.15, 1],
              opacity: [0.08, 0.18, 0.08],
            }}
            transition={{
              repeat: Infinity,
              duration: 10,
              ease: 'easeInOut',
              delay: 2,
            }}
          />
        </>
      )}

      {/* Content */}
      <div className="relative z-10 text-center px-4 sm:px-6 max-w-5xl mx-auto">
        {/* Headline */}
        <motion.div
          variants={shouldReduceMotion ? undefined : containerVariants}
          initial={shouldReduceMotion ? undefined : 'hidden'}
          animate={shouldReduceMotion ? undefined : 'visible'}
          className="mb-6"
        >
          {headlineWords.map((word) => (
            <motion.h1
              key={word}
              variants={shouldReduceMotion ? undefined : wordVariants}
              className={cn(
                'block font-condensed font-extrabold uppercase text-[#e0e0e0]',
                'text-5xl sm:text-6xl lg:text-7xl',
                'tracking-[0.05em] leading-tight',
              )}
            >
              {word}
            </motion.h1>
          ))}
        </motion.div>

        {/* Subtitle */}
        <motion.p
          variants={shouldReduceMotion ? undefined : subtitleVariants}
          initial={shouldReduceMotion ? undefined : 'hidden'}
          animate={shouldReduceMotion ? undefined : 'visible'}
          className="font-sans text-[#a0a0a0] text-lg sm:text-xl mb-10 max-w-2xl mx-auto"
        >
          Az egyetlen fitness app amire szükséged van
        </motion.p>

        {/* CTA buttons */}
        <motion.div
          variants={shouldReduceMotion ? undefined : ctaVariants}
          initial={shouldReduceMotion ? undefined : 'hidden'}
          animate={shouldReduceMotion ? undefined : 'visible'}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link
            href="/register"
            className={cn(
              'inline-flex items-center justify-center rounded-lg px-8 py-3',
              'text-base font-medium text-white transition-all duration-200',
              'bg-[#780000] hover:bg-[#8a0000]',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#780000]/50',
              'min-w-[180px]',
            )}
          >
            Regisztráció
          </Link>
          <Link
            href="/login"
            className={cn(
              'inline-flex items-center justify-center rounded-lg border px-8 py-3',
              'text-base font-medium text-[#e0e0e0] transition-all duration-200',
              'bg-[rgba(120,0,0,0.1)] border-[rgba(120,0,0,0.35)]',
              'hover:bg-[rgba(120,0,0,0.2)] hover:border-[rgba(120,0,0,0.6)]',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#780000]/50',
              'min-w-[180px]',
            )}
          >
            Bejelentkezés
          </Link>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10">
        {shouldReduceMotion ? (
          <ChevronDown
            className="text-[#a0a0a0]"
            size={28}
            strokeWidth={1.5}
            aria-hidden="true"
          />
        ) : (
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
            aria-hidden="true"
          >
            <ChevronDown
              className="text-[#a0a0a0]"
              size={28}
              strokeWidth={1.5}
            />
          </motion.div>
        )}
      </div>
    </section>
  )
}
