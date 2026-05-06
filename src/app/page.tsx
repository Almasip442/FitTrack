/**
 * Landing page — root route (/)
 *
 * This page is always rendered in dark mode regardless of the user's system
 * preference. It is fully public (no auth check). The middleware does NOT
 * redirect the root route for unauthenticated users.
 *
 * If the user is already authenticated they can still visit this page;
 * the middleware only redirects auth pages (/login, /register) for logged-in
 * users, not the landing page itself.
 */
import { LandingNavbar } from '@/components/landing/landing-navbar'
import { HeroSection } from '@/components/landing/hero-section'
import { FeaturesSection } from '@/components/landing/features-section'
import { StatsSection } from '@/components/landing/stats-section'
import { DifferentiatorsSection } from '@/components/landing/differentiators-section'
import { CtaSection } from '@/components/landing/cta-section'
import { LandingFooter } from '@/components/landing/landing-footer'

// Force dark mode on the html element for the landing page only.
// next-themes reads the `class` attribute on <html>; wrapping the whole
// page in a `dark` class container achieves the same visual effect without
// changing the user's stored theme preference.
export default function HomePage() {
  return (
    // `dark` class scopes the design-system dark tokens to this page tree
    <div className="dark">
      <div className="min-h-screen bg-[#111111] text-[#e0e0e0]">
        <LandingNavbar />
        <main>
          <HeroSection />
          <FeaturesSection />
          <StatsSection />
          <DifferentiatorsSection />
          <CtaSection />
        </main>
        <LandingFooter />
      </div>
    </div>
  )
}
