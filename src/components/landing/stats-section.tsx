'use client'

import { useEffect, useRef, useState } from 'react'
import { useInView, useMotionValue, animate, useReducedMotion, type Variants } from 'framer-motion'
import { motion } from 'framer-motion'

interface StatItem {
  value: string
  label: string
  isNumeric: boolean
  numericTarget?: number
  prefix?: string
  suffix?: string
}

const stats: StatItem[] = [
  {
    value: '200+',
    label: 'Gyakorlat az adatbázisban',
    isNumeric: true,
    numericTarget: 200,
    suffix: '+',
  },
  {
    value: 'Heti',
    label: 'AI Elemzés',
    isNumeric: false,
  },
  {
    value: '1 helyen',
    label: 'Minden eszközöd',
    isNumeric: false,
  },
]

function CountUpStat({ stat }: { stat: StatItem }) {
  const ref = useRef<HTMLSpanElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-60px' })
  const shouldReduceMotion = useReducedMotion()
  const count = useMotionValue(0)
  const [displayValue, setDisplayValue] = useState('0')

  useEffect(() => {
    if (!isInView || !stat.isNumeric || stat.numericTarget === undefined) return
    if (shouldReduceMotion) {
      setDisplayValue(String(stat.numericTarget))
      return
    }

    const controls = animate(count, stat.numericTarget, {
      duration: 1.8,
      ease: 'easeOut',
      onUpdate(value) {
        setDisplayValue(Math.round(value).toString())
      },
    })
    return () => controls.stop()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInView, shouldReduceMotion])

  if (!stat.isNumeric) {
    return (
      <span
        ref={ref as React.RefObject<HTMLSpanElement>}
        className="font-condensed font-extrabold text-5xl sm:text-6xl text-[#780000] uppercase tracking-[0.05em]"
      >
        {stat.value}
      </span>
    )
  }

  return (
    <span
      ref={ref}
      className="font-condensed font-extrabold text-5xl sm:text-6xl text-[#780000] uppercase tracking-[0.05em]"
    >
      {displayValue}
      {stat.suffix}
    </span>
  )
}

const containerVariants: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.15 },
  },
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' as const },
  },
}

export function StatsSection() {
  const shouldReduceMotion = useReducedMotion()

  return (
    <section
      className="bg-[#1a1a1a] py-20 sm:py-28 px-4 sm:px-6 lg:px-8"
      aria-label="Statisztikák"
    >
      <div className="max-w-5xl mx-auto">
        <motion.div
          variants={shouldReduceMotion ? undefined : containerVariants}
          initial={shouldReduceMotion ? undefined : 'hidden'}
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-12 sm:gap-8 text-center"
        >
          {stats.map((stat) => (
            <motion.div
              key={stat.label}
              variants={shouldReduceMotion ? undefined : itemVariants}
              className="flex flex-col items-center gap-3"
            >
              <CountUpStat stat={stat} />
              <p className="font-sans text-[#a0a0a0] text-sm sm:text-base">
                {stat.label}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
