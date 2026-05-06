'use client'

import { Dumbbell, Cpu, ShoppingBag } from 'lucide-react'
import { motion, useReducedMotion, type Variants } from 'framer-motion'
import { cn } from '@/lib/utils'

interface DifferentiatorCard {
  icon: React.FC<{ size?: number; strokeWidth?: number; className?: string }>
  title: string
  description: string
}

const cards: DifferentiatorCard[] = [
  {
    icon: Dumbbell,
    title: 'Drag & Drop Tervező',
    description: 'Vizuálisan tervezd meg az edzésprogramodat egyszerű fogd-és-vidd mozdulatokkal.',
  },
  {
    icon: Cpu,
    title: 'AI Elemzés',
    description: 'Heti összefoglaló mesterséges intelligenciával — értsd meg a fejlődésed trendjeit.',
  },
  {
    icon: ShoppingBag,
    title: 'Integrált Webshop',
    description: 'Táplálékkiegészítők és fitness eszközök egy helyen, a profilodhoz ajánlva.',
  },
]

const containerVariants: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1 },
  },
}

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  },
}

export function DifferentiatorsSection() {
  const shouldReduceMotion = useReducedMotion()

  return (
    <section
      className="bg-[#111111] py-20 sm:py-28 px-4 sm:px-6 lg:px-8"
      aria-label="Miért válassz minket"
    >
      <div className="max-w-6xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-14">
          <h2 className="font-condensed font-extrabold uppercase text-[#e0e0e0] text-3xl sm:text-4xl tracking-[0.05em]">
            Miért FitTrack Pro?
          </h2>
          <p className="mt-3 font-sans text-[#a0a0a0] text-base max-w-xl mx-auto">
            Minden, amire szükséged van, egy helyen — és semmi más.
          </p>
        </div>

        <motion.div
          variants={shouldReduceMotion ? undefined : containerVariants}
          initial={shouldReduceMotion ? undefined : 'hidden'}
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-6"
        >
          {cards.map((card) => {
            const Icon = card.icon
            return (
              <motion.div
                key={card.title}
                variants={shouldReduceMotion ? undefined : cardVariants}
                className={cn(
                  'bg-[#1a1a1a] border border-[#404040]/50 rounded-xl p-6',
                  'flex flex-col gap-4',
                  'hover:border-[#780000]/40 transition-colors duration-300',
                )}
              >
                <div className="w-12 h-12 rounded-lg bg-[rgba(120,0,0,0.1)] border border-[rgba(120,0,0,0.25)] flex items-center justify-center">
                  <Icon
                    size={22}
                    strokeWidth={1.5}
                    className="text-[#780000]"
                    aria-hidden="true"
                  />
                </div>
                <div className="space-y-2">
                  <h3 className="font-condensed font-bold uppercase text-[#e0e0e0] text-lg tracking-[0.05em]">
                    {card.title}
                  </h3>
                  <p className="font-sans text-[#a0a0a0] text-sm leading-relaxed">
                    {card.description}
                  </p>
                </div>
              </motion.div>
            )
          })}
        </motion.div>
      </div>
    </section>
  )
}
