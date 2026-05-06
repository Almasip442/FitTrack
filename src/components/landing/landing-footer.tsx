export function LandingFooter() {
  return (
    <footer className="bg-[#0a0a0a] border-t border-[#404040]/30 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-[#a0a0a0]">
        <p className="font-sans">© 2026 FitTrack Pro</p>

        <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-6 font-sans text-xs">
          <a
            href="https://wger.de"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[#e0e0e0] transition-colors duration-200 underline underline-offset-2"
          >
            Gyakorlatok: wger (CC BY-SA 3.0)
          </a>
          <a
            href="https://world.openfoodfacts.org"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[#e0e0e0] transition-colors duration-200 underline underline-offset-2"
          >
            Élelmiszeradatok: Open Food Facts (ODbL)
          </a>
        </div>
      </div>
    </footer>
  )
}
