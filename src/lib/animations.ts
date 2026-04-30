import type { Variants, Transition } from 'framer-motion'

/**
 * Reusable Framer Motion variants tuned for the
 * FitTrack Pro industrial-minimalist aesthetic.
 *
 * All variants are short, restrained, and respect `prefers-reduced-motion`
 * via the global CSS rule in `globals.css`.
 */

const easeOut: Transition['ease'] = [0.22, 1, 0.36, 1]

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.4, ease: easeOut } },
}

export const slideUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: easeOut },
  },
}

export const slideUpSm: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: easeOut },
  },
}

export const staggerChildren: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08, delayChildren: 0.05 },
  },
}

export const pageTransition: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: easeOut },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: { duration: 0.2, ease: easeOut },
  },
}

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.3, ease: easeOut },
  },
}
