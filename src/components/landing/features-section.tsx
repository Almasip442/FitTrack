'use client'

import { GripVertical, ShoppingCart } from 'lucide-react'
import { motion, useReducedMotion } from 'framer-motion'
import { cn } from '@/lib/utils'

// Custom bezier typed for framer-motion v12
const EASE_OUT_EXPO = [0.22, 1, 0.36, 1] as [number, number, number, number]

// ── Mock UI panels ─────────────────────────────────────────────────────────

function WorkoutMockPanel() {
  const exercises = [
    { name: 'Fekvőnyomás', sets: 3, reps: 10 },
    { name: 'Húzódzkodás', sets: 4, reps: 8 },
    { name: 'Guggolás', sets: 5, reps: 5 },
  ]
  return (
    <div className="bg-[#1a1a1a] border border-[#404040]/60 rounded-xl p-4 space-y-2 w-full max-w-sm">
      <p className="font-condensed text-xs uppercase tracking-[0.05em] text-[#a0a0a0] mb-3">
        Heti edzésterv
      </p>
      {exercises.map((ex) => (
        <div
          key={ex.name}
          className="flex items-center gap-3 bg-[#111111] border-t-2 border-t-[#780000] border-x border-b border-x-[#404040]/40 border-b-[#404040]/40 rounded-lg px-3 py-2.5"
        >
          <GripVertical
            size={14}
            strokeWidth={1.5}
            className="text-[#404040] shrink-0"
            aria-hidden="true"
          />
          <span className="flex-1 text-sm font-medium text-[#e0e0e0]">
            {ex.name}
          </span>
          <span className="font-condensed text-xs text-[#a0a0a0] uppercase">
            {ex.sets}×{ex.reps}
          </span>
        </div>
      ))}
    </div>
  )
}

function CalorieMockPanel() {
  // SVG progress ring — 75% filled
  const radius = 42
  const circumference = 2 * Math.PI * radius
  const filled = circumference * 0.75
  const macros = [
    { name: 'Fehérje', value: '142 g', pct: 72 },
    { name: 'Szénhidrát', value: '238 g', pct: 58 },
    { name: 'Zsír', value: '67 g', pct: 85 },
  ]
  return (
    <div className="bg-[#1a1a1a] border border-[#404040]/60 rounded-xl p-4 w-full max-w-sm">
      <p className="font-condensed text-xs uppercase tracking-[0.05em] text-[#a0a0a0] mb-4">
        Napi kalória
      </p>
      {/* Ring */}
      <div className="flex justify-center mb-4">
        <div className="relative">
          <svg
            width="110"
            height="110"
            viewBox="0 0 110 110"
            className="-rotate-90"
            aria-hidden="true"
          >
            <circle
              cx="55"
              cy="55"
              r={radius}
              fill="none"
              stroke="#404040"
              strokeWidth="8"
            />
            <circle
              cx="55"
              cy="55"
              r={radius}
              fill="none"
              stroke="#780000"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference - filled}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-condensed font-bold text-xl text-[#e0e0e0]">
              1 840
            </span>
            <span className="text-[10px] text-[#a0a0a0]">kcal</span>
          </div>
        </div>
      </div>
      {/* Macros */}
      <div className="space-y-2">
        {macros.map((m) => (
          <div key={m.name} className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-[#a0a0a0]">{m.name}</span>
              <span className="text-[#e0e0e0]">{m.value}</span>
            </div>
            <div className="h-1 rounded-full bg-[#404040]/60">
              <div
                className="h-full rounded-full bg-[#780000]"
                style={{ width: `${m.pct}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function AiMockPanel() {
  return (
    <div className="bg-[#1a1a1a] border border-[#404040]/60 rounded-xl overflow-hidden w-full max-w-sm">
      <div className="bg-[#780000] px-4 py-2.5 flex items-center justify-between">
        <span className="font-condensed text-xs uppercase tracking-[0.05em] text-white">
          AI Elemzés
        </span>
        <span className="font-condensed font-bold text-sm text-white">
          8/10
        </span>
      </div>
      <div className="p-4 space-y-3">
        {[
          'Kiemelkedő erőnövekedés a mellizomban (+12%)',
          'Alvásminőség javítása javasolt a regenerációhoz',
          'Fehérjebevitel növelése az optimális fejlődésért',
        ].map((line, i) => (
          <div
            key={i}
            className="flex items-start gap-2"
          >
            <div className="mt-1.5 w-1 h-1 rounded-full bg-[#780000] shrink-0" />
            <p className="text-xs text-[#a0a0a0] leading-relaxed">{line}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function ShopMockPanel() {
  const products = [
    { name: 'Whey Protein', price: '8 990 Ft' },
    { name: 'Kreatin', price: '4 490 Ft' },
    { name: 'BCAA', price: '5 990 Ft' },
    { name: 'Multivitamin', price: '3 290 Ft' },
  ]
  return (
    <div className="bg-[#1a1a1a] border border-[#404040]/60 rounded-xl p-4 w-full max-w-sm">
      <div className="flex items-center justify-between mb-3">
        <p className="font-condensed text-xs uppercase tracking-[0.05em] text-[#a0a0a0]">
          Webshop
        </p>
        <div className="relative">
          <ShoppingCart
            size={16}
            strokeWidth={1.5}
            className="text-[#e0e0e0]"
            aria-hidden="true"
          />
          <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 rounded-full bg-[#780000] flex items-center justify-center text-[9px] font-bold text-white leading-none">
            2
          </span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {products.map((p) => (
          <div
            key={p.name}
            className="bg-[#111111] border border-[#404040]/40 rounded-lg p-2.5 space-y-1"
          >
            <div className="w-full h-8 rounded bg-[#404040]/40" />
            <p className="text-xs text-[#e0e0e0] font-medium leading-tight">
              {p.name}
            </p>
            <p className="text-[11px] text-[#780000] font-condensed font-bold">
              {p.price}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Feature data ────────────────────────────────────────────────────────────

const features = [
  {
    id: 'workout',
    title: 'Drag & Drop Edzéstervező',
    description:
      'Vizuálisan tervezd meg az edzésprogramodat egyszerű fogd-és-vidd mozdulatokkal. Rendezd át a gyakorlatokat, adj hozzá szetteket, és ments el kész programokat.',
    panel: WorkoutMockPanel,
    imageRight: true,
  },
  {
    id: 'calories',
    title: 'Intelligens Kalóriakövetés',
    description:
      'Kövesd nyomon a napi makrótápanyag-beviteledet. Részletes étkezési napló, vizuális haladásjelzők és automatikus kalóriaszámítás a céljaid alapján.',
    panel: CalorieMockPanel,
    imageRight: false,
  },
  {
    id: 'ai',
    title: 'Heti AI Elemzés',
    description:
      'Mesterséges intelligencia értékeli az edzés- és táplálkozási adataidat minden héten. Személyre szabott tanácsok és trendek, hogy mindig tudd, mi működik.',
    panel: AiMockPanel,
    imageRight: true,
  },
  {
    id: 'shop',
    title: 'Integrált Webshop',
    description:
      'Táplálékkiegészítők és fitness termékek egy helyen. A profilodhoz ajánlott termékek, kosárkezelés és gyors rendelés — mindezt az appból.',
    panel: ShopMockPanel,
    imageRight: false,
  },
]

// ── Section component ────────────────────────────────────────────────────────

interface FeatureRowProps {
  title: string
  description: string
  Panel: React.FC
  imageRight: boolean
  index: number
}

function FeatureRow({
  title,
  description,
  Panel,
  imageRight,
  index,
}: FeatureRowProps) {
  const shouldReduceMotion = useReducedMotion()

  const textInitial = shouldReduceMotion
    ? {}
    : { opacity: 0, x: imageRight ? -40 : 40 }
  const panelInitial = shouldReduceMotion
    ? {}
    : { opacity: 0, x: imageRight ? 40 : -40 }
  const animateVisible = { opacity: 1, x: 0 }

  const textContent = (
    <motion.div
      className="flex flex-col justify-center"
      initial={textInitial}
      whileInView={animateVisible}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.6, ease: EASE_OUT_EXPO, delay: 0.05 }}
    >
      <span className="font-condensed text-xs uppercase tracking-[0.07em] text-[#780000] mb-2">
        {String(index + 1).padStart(2, '0')}
      </span>
      <h2 className="font-condensed font-bold uppercase text-[#e0e0e0] text-3xl sm:text-4xl tracking-[0.05em] mb-4 leading-tight">
        {title}
      </h2>
      <p className="font-sans text-[#a0a0a0] leading-relaxed text-base max-w-md">
        {description}
      </p>
    </motion.div>
  )

  const panelContent = (
    <motion.div
      className="flex justify-center lg:justify-end"
      initial={panelInitial}
      whileInView={animateVisible}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.6, ease: EASE_OUT_EXPO }}
    >
      <Panel />
    </motion.div>
  )

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center py-20 sm:py-24">
      {imageRight ? (
        <>
          {textContent}
          {panelContent}
        </>
      ) : (
        <>
          <div className="order-2 lg:order-1 flex justify-center lg:justify-start">
            {panelContent}
          </div>
          <div className="order-1 lg:order-2">{textContent}</div>
        </>
      )}
    </div>
  )
}

export function FeaturesSection() {
  return (
    <section
      className="bg-[#111111] px-4 sm:px-6 lg:px-8"
      aria-label="Funkciók"
    >
      <div className="max-w-6xl mx-auto">
        <div className="divide-y divide-[#404040]/30">
          {features.map((feat, i) => (
            <FeatureRow
              key={feat.id}
              title={feat.title}
              description={feat.description}
              Panel={feat.panel}
              imageRight={feat.imageRight}
              index={i}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
