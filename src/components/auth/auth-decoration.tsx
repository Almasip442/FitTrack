'use client'

import { motion } from 'framer-motion'

import { fadeIn, slideUp, staggerChildren } from '@/lib/animations'

/**
 * Cinematic decorative panel for the auth split-screen.
 * Always rendered with the brand-dark backdrop regardless of theme —
 * this is intentional so the marketing surface stays consistent.
 *
 * The panel layers:
 *   1. Solid `#111111` base
 *   2. Off-center radial brand-red glow
 *   3. Faint orthogonal grid (CSS-only, mask-fade to bottom)
 *   4. SVG noise overlay (very low opacity, masks AI-flat surfaces)
 *   5. Mission-style metadata pinned to the corners
 *   6. Asymmetric oversized motivational quote
 */
export function AuthDecoration() {
  return (
    <div className="relative h-full w-full overflow-hidden bg-[#111111] text-[#e0e0e0]">
      {/* (2) — radial brand red glow, off-center top-right */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(60% 50% at 78% 18%, rgba(120,0,0,0.55) 0%, rgba(120,0,0,0.18) 35%, rgba(0,0,0,0) 70%)',
        }}
      />

      {/* (3) — faint orthogonal grid, masked to fade out */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.18]"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.06) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
          maskImage:
            'linear-gradient(to bottom, black 0%, black 60%, transparent 100%)',
          WebkitMaskImage:
            'linear-gradient(to bottom, black 0%, black 60%, transparent 100%)',
        }}
      />

      {/* (4) — SVG noise, very low opacity, breaks flat banding */}
      <svg
        aria-hidden
        className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.06] mix-blend-overlay"
      >
        <filter id="auth-noise">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.9"
            numOctaves="2"
            stitchTiles="stitch"
          />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#auth-noise)" />
      </svg>

      {/* (1) — vignette to deepen the edges */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(120% 90% at 50% 50%, transparent 55%, rgba(0,0,0,0.55) 100%)',
        }}
      />

      <motion.div
        initial="hidden"
        animate="visible"
        variants={staggerChildren}
        className="relative z-10 flex h-full w-full flex-col justify-between p-10 xl:p-14"
      >
        {/* TOP — mission tag */}
        <motion.div
          variants={slideUp}
          className="flex items-start justify-between gap-6"
        >
          <div className="flex items-center gap-3">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#780000] opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#780000]" />
            </span>
            <span className="font-condensed text-[11px] uppercase tracking-wide-display text-[#a0a0a0]">
              FitTrack Pro / Auth Console
            </span>
          </div>
          <span className="font-condensed text-[11px] uppercase tracking-wide-display text-[#a0a0a0]">
            v1.0
          </span>
        </motion.div>

        {/* CENTER — oversized headline + supporting copy */}
        <motion.div variants={slideUp} className="max-w-xl space-y-6">
          <p className="font-condensed text-[11px] uppercase tracking-wide-display text-[#780000]">
            {'// Mission Brief'}
          </p>

          <h2 className="font-condensed text-5xl leading-[0.95] font-extrabold uppercase tracking-display text-[#e0e0e0] xl:text-6xl">
            Minden rep
            <br />
            <span className="text-[#780000]">számít.</span>
          </h2>

          <p className="max-w-md text-sm leading-relaxed text-[#a0a0a0]">
            Kövesd az edzéseid, a kalóriákat és a fejlődésed
            egyetlen fókuszált felületről. Nincsenek elterelő
            részletek — csak az adatok, amelyek számítanak.
          </p>
        </motion.div>

        {/* BOTTOM — telemetry-style coordinates */}
        <motion.div
          variants={fadeIn}
          className="flex items-end justify-between gap-6 font-condensed text-[10px] uppercase tracking-wide-display text-[#a0a0a0]"
        >
          <div className="space-y-1">
            <div className="text-[#780000]">[ status ]</div>
            <div>System nominal</div>
          </div>
          <div className="space-y-1 text-right">
            <div className="text-[#780000]">[ session ]</div>
            <div>Awaiting credentials</div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}
