'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

export function LandingNavbar() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY >= 50)
    }

    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        scrolled
          ? 'bg-[#111111]/90 backdrop-blur-md border-b border-[#404040]/50'
          : 'bg-transparent border-b border-transparent',
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            href="/"
            className="inline-flex items-baseline font-condensed font-extrabold uppercase tracking-[0.07em] text-xl select-none transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#780000]/50 rounded-sm"
            aria-label="FitTrack Pro főoldal"
          >
            <span className="text-[#780000]">FITTRACK</span>
            <span className="ml-1.5 text-[#e0e0e0]">PRO</span>
          </Link>

          {/* Nav actions */}
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className={cn(
                'inline-flex items-center justify-center rounded-lg border px-4 py-2',
                'text-sm font-medium text-[#e0e0e0] transition-all duration-200',
                'bg-[rgba(120,0,0,0.1)] border-[rgba(120,0,0,0.35)]',
                'hover:bg-[rgba(120,0,0,0.2)] hover:border-[rgba(120,0,0,0.6)]',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#780000]/50',
              )}
            >
              Bejelentkezés
            </Link>
            <Link
              href="/register"
              className={cn(
                'inline-flex items-center justify-center rounded-lg px-4 py-2',
                'text-sm font-medium text-white transition-all duration-200',
                'bg-[#780000] hover:bg-[#8a0000]',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#780000]/50',
              )}
            >
              Regisztráció
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
}
