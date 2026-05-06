'use client'

/**
 * SuccessClient — F9.8 client wrapper
 *
 * Two responsibilities:
 *  1. Calls clearCart() on mount so the cart is emptied after a successful order.
 *  2. Renders a Framer Motion confetti animation (floating/falling colored pieces).
 *
 * No external confetti library is used — just motion.div elements with
 * randomised initial positions, rotations, and y-trajectories.
 */

import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { useCartStore } from '@/store/cart'

// Confetti piece configuration
const CONFETTI_PIECES = [
  { color: '#780000', x: '10%', size: 10, delay: 0, duration: 3.2 },
  { color: '#e0e0e0', x: '25%', size: 8, delay: 0.2, duration: 2.8 },
  { color: '#780000', x: '40%', size: 12, delay: 0.5, duration: 3.5 },
  { color: '#a0a0a0', x: '55%', size: 7, delay: 0.1, duration: 2.6 },
  { color: '#780000', x: '70%', size: 9, delay: 0.4, duration: 3.0 },
  { color: '#e0e0e0', x: '85%', size: 11, delay: 0.3, duration: 3.3 },
  { color: '#780000', x: '15%', size: 6, delay: 0.7, duration: 2.9 },
  { color: '#a0a0a0', x: '60%', size: 13, delay: 0.6, duration: 3.1 },
  { color: '#780000', x: '90%', size: 8, delay: 0.15, duration: 2.7 },
  { color: '#e0e0e0', x: '35%', size: 10, delay: 0.45, duration: 3.4 },
]

export function SuccessClient() {
  const clearCart = useCartStore((s) => s.clearCart)

  useEffect(() => {
    clearCart()
  }, [clearCart])

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      {CONFETTI_PIECES.map((piece, i) => (
        <motion.div
          key={i}
          initial={{
            opacity: 1,
            y: -20,
            x: piece.x,
            rotate: 0,
            scale: 1,
          }}
          animate={{
            opacity: [1, 1, 0],
            y: ['0%', '30%', '80%'],
            rotate: [0, 180, 360],
            scale: [1, 0.8, 0.6],
          }}
          transition={{
            duration: piece.duration,
            delay: piece.delay,
            ease: 'easeIn',
            repeat: 2,
            repeatDelay: 0.5,
          }}
          style={{
            position: 'absolute',
            top: 0,
            left: piece.x,
            width: piece.size,
            height: piece.size,
            backgroundColor: piece.color,
            borderRadius: i % 3 === 0 ? '50%' : i % 3 === 1 ? '2px' : '0',
            opacity: 0.7,
          }}
        />
      ))}
    </div>
  )
}
