/**
 * Hook Premium para Toast Notifications con animaciones avanzadas
 */

'use client'

import { useCallback } from 'react'
import { toast, ToastOptions as ReactHotToastOptions } from 'react-hot-toast'

interface ToastOptions {
  duration?: number
  position?: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right'
  icon?: React.ReactNode
  action?: {
    label: string
    onClick: () => void
  }
}

export function usePremiumToast() {
  const success = useCallback((message: string, options?: ToastOptions) => {
    const toastOptions: ReactHotToastOptions = {
      duration: options?.duration || 4000,
      position: options?.position || 'top-right',
      style: {
        background: 'white',
        color: '#1f2937',
        borderRadius: '12px',
        padding: '16px',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
        border: '1px solid #e5e7eb',
      },
      className: 'premium-toast',
    }
    return toast.success(message, toastOptions)
  }, [])

  const error = useCallback((message: string, options?: ToastOptions) => {
    const toastOptions: ReactHotToastOptions = {
      duration: options?.duration || 5000,
      position: options?.position || 'top-right',
      style: {
        background: 'white',
        color: '#1f2937',
        borderRadius: '12px',
        padding: '16px',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
        border: '1px solid #fee2e2',
      },
      className: 'premium-toast',
    }
    return toast.error(message, toastOptions)
  }, [])

  const warning = useCallback((message: string, options?: ToastOptions) => {
    const toastOptions: ReactHotToastOptions = {
      duration: options?.duration || 4000,
      position: options?.position || 'top-right',
      style: {
        background: 'white',
        color: '#1f2937',
        borderRadius: '12px',
        padding: '16px',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
        border: '1px solid #fef3c7',
      },
      className: 'premium-toast',
    }
    return toast(message, toastOptions)
  }, [])

  const info = useCallback((message: string, options?: ToastOptions) => {
    const toastOptions: ReactHotToastOptions = {
      duration: options?.duration || 4000,
      position: options?.position || 'top-right',
      style: {
        background: 'white',
        color: '#1f2937',
        borderRadius: '12px',
        padding: '16px',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
        border: '1px solid #dbeafe',
      },
      className: 'premium-toast',
    }
    return toast(message, toastOptions)
  }, [])

  const premium = useCallback((message: string, options?: ToastOptions) => {
    const toastOptions: ReactHotToastOptions = {
      duration: options?.duration || 4000,
      position: options?.position || 'top-right',
      style: {
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        borderRadius: '12px',
        padding: '16px',
        boxShadow: '0 10px 25px rgba(102, 126, 234, 0.3)',
        border: 'none',
      },
      className: 'premium-toast',
    }
    return toast(message, toastOptions)
  }, [])

  return {
    success,
    error,
    warning,
    info,
    premium,
  }
}
