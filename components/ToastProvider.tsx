'use client'

import { ReactNode } from 'react'
import PremiumToast from './ui/PremiumToast'

export default function ToastProvider({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <PremiumToast />
    </>
  )
}
