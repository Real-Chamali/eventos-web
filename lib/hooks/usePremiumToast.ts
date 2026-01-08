/**
 * Hook Premium para Toast Notifications con animaciones avanzadas
 */

'use client'

import { useCallback } from 'react'
import { toast } from 'react-hot-toast'
import { CheckCircle2, XCircle, AlertCircle, Info, Sparkles } from 'lucide-react'

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
    return toast.success(message, {
      duration: options?.duration || 4000,
      position: options?.position || 'top-right',
      icon: options?.icon || <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
      style: {
        background: 'white',
        color: '#1f2937',
        borderRadius: '12px',
        padding: '16px',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
        border: '1px solid #e5e7eb',
      },
      className: 'premium-toast',
    })
  }, [])

  const error = useCallback((message: string, options?: ToastOptions) => {
    return toast.error(message, {
      duration: options?.duration || 5000,
      position: options?.position || 'top-right',
      icon: options?.icon || <XCircle className="w-5 h-5 text-red-500" />,
      style: {
        background: 'white',
        color: '#1f2937',
        borderRadius: '12px',
        padding: '16px',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
        border: '1px solid #fee2e2',
      },
      className: 'premium-toast',
    })
  }, [])

  const warning = useCallback((message: string, options?: ToastOptions) => {
    return toast(message, {
      duration: options?.duration || 4000,
      position: options?.position || 'top-right',
      icon: options?.icon || <AlertCircle className="w-5 h-5 text-amber-500" />,
      style: {
        background: 'white',
        color: '#1f2937',
        borderRadius: '12px',
        padding: '16px',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
        border: '1px solid #fef3c7',
      },
      className: 'premium-toast',
    })
  }, [])

  const info = useCallback((message: string, options?: ToastOptions) => {
    return toast(message, {
      duration: options?.duration || 4000,
      position: options?.position || 'top-right',
      icon: options?.icon || <Info className="w-5 h-5 text-blue-500" />,
      style: {
        background: 'white',
        color: '#1f2937',
        borderRadius: '12px',
        padding: '16px',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
        border: '1px solid #dbeafe',
      },
      className: 'premium-toast',
    })
  }, [])

  const premium = useCallback((message: string, options?: ToastOptions) => {
    return toast(message, {
      duration: options?.duration || 4000,
      position: options?.position || 'top-right',
      icon: options?.icon || <Sparkles className="w-5 h-5 text-purple-500" />,
      style: {
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        borderRadius: '12px',
        padding: '16px',
        boxShadow: '0 10px 25px rgba(102, 126, 234, 0.3)',
        border: 'none',
      },
      className: 'premium-toast',
    })
  }, [])

  return {
    success,
    error,
    warning,
    info,
    premium,
  }
}
