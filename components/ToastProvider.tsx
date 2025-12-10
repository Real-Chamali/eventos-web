'use client'

import { ReactNode } from 'react'
import { Toaster } from 'react-hot-toast'

export default function ToastProvider({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <Toaster
        position="top-right"
        reverseOrder={false}
        gutter={8}
        toastOptions={{
          duration: 4000,
          style: {
            background: '#fff',
            color: '#000',
            borderRadius: '0.5rem',
            boxShadow: '0 10px 15px rgba(0, 0, 0, 0.1)',
          },
          success: {
            style: {
              background: '#10b981',
              color: '#fff',
            },
            icon: '✅',
          },
          error: {
            style: {
              background: '#ef4444',
              color: '#fff',
            },
            icon: '❌',
          },
          loading: {
            style: {
              background: '#3b82f6',
              color: '#fff',
            },
          },
        }}
      />
    </>
  )
}
