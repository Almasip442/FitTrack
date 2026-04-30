'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6">
      <div className="text-center max-w-md space-y-5">
        <p className="font-condensed text-xs font-semibold uppercase tracking-wide-display text-[#780000]">
          Hiba
        </p>
        <h1 className="font-condensed text-4xl font-bold uppercase tracking-display text-foreground">
          Valami nem stimmel
        </h1>
        <p className="text-muted-foreground">
          Váratlan hiba történt. Próbáld újra, vagy térj vissza a kezdőlapra.
        </p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <Button
            onClick={() => reset()}
            variant="outline"
            className="border-[#780000]/35 bg-[#780000]/10 text-[#780000] hover:bg-[#780000]/20 font-condensed uppercase tracking-display"
          >
            Újra
          </Button>
        </div>
      </div>
    </div>
  )
}
