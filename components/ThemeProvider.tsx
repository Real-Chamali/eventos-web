'use client'

import { ThemeProvider } from 'next-themes'
import { ReactNode } from 'react'

export default function ThemeProviderWrapper({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider 
      attribute="class" 
      defaultTheme="light" 
      enableSystem
      disableTransitionOnChange={false}
      storageKey="theme"
    >
      {children}
    </ThemeProvider>
  )
}
