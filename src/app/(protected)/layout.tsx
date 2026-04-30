import { Navbar } from '@/components/layout/navbar'
import { MobileTabBar } from '@/components/layout/mobile-tab-bar'

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main
        className={
          'mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 ' +
          'pt-20 pb-24 md:pb-12'
        }
      >
        {children}
      </main>
      <MobileTabBar />
    </div>
  )
}
