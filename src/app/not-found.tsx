import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6">
      <div className="text-center max-w-md space-y-5">
        <p className="font-condensed text-8xl md:text-9xl font-extrabold uppercase tracking-wide-display text-[#780000] leading-none">
          404
        </p>
        <h1 className="font-condensed text-2xl font-bold uppercase tracking-display text-foreground">
          Az oldal nem található
        </h1>
        <p className="text-muted-foreground">
          A keresett oldal eltűnt vagy soha nem is létezett.
        </p>
        <div className="pt-2">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-md px-4 h-10 border border-[#780000]/35 bg-[#780000]/10 text-[#780000] hover:bg-[#780000]/20 transition-colors font-condensed text-sm font-semibold uppercase tracking-display"
          >
            Vissza a dashboardra
          </Link>
        </div>
      </div>
    </div>
  )
}
