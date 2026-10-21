'use client'

import * as React from 'react'
import { ThemeProvider as NextThemesProvider, type ThemeProviderProps } from 'next-themes'

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  // React 19.2 / Next 16 can reject the inline theme script when a client
  // navigation remounts the provider. Keep it executable for the server's
  // pre-hydration theme setup, but mark the client-rendered copy inert.
  const scriptProps =
    typeof window === 'undefined'
      ? undefined
      : ({ type: 'application/json' } as const)

  return (
    <NextThemesProvider {...props} scriptProps={scriptProps}>
      {children}
    </NextThemesProvider>
  )
}
