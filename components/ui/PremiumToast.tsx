'use client'

import { Toaster, Toast, ToastBar, toast } from 'react-hot-toast'
import { CheckCircle2, XCircle, AlertCircle, Info, X, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils/cn'

const toastVariants = {
  success: {
    icon: CheckCircle2,
    className: 'bg-emerald-500 text-white border-emerald-600',
    iconClassName: 'text-emerald-100',
  },
  error: {
    icon: XCircle,
    className: 'bg-red-500 text-white border-red-600',
    iconClassName: 'text-red-100',
  },
  loading: {
    icon: Loader2,
    className: 'bg-blue-500 text-white border-blue-600',
    iconClassName: 'text-blue-100',
  },
  warning: {
    icon: AlertCircle,
    className: 'bg-amber-500 text-white border-amber-600',
    iconClassName: 'text-amber-100',
  },
  info: {
    icon: Info,
    className: 'bg-indigo-500 text-white border-indigo-600',
    iconClassName: 'text-indigo-100',
  },
}

interface CustomToastProps {
  t: Toast
}

function CustomToast({ t }: CustomToastProps) {
  const variant = t.type === 'success' ? 'success' : 
                 t.type === 'error' ? 'error' : 
                 t.type === 'loading' ? 'loading' : 
                 t.type === 'blank' ? 'info' : 'info'
  
  const config = toastVariants[variant]
  const Icon = config.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className={cn(
        'relative flex items-center gap-3 rounded-xl border p-4 shadow-2xl backdrop-blur-sm',
        'min-w-[300px] max-w-[500px]',
        config.className,
        t.visible ? 'animate-enter' : 'animate-leave'
      )}
    >
      {/* Icono */}
      <div className={cn(
        'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
        config.iconClassName,
        variant === 'loading' && 'animate-spin'
      )}>
        <Icon className="h-5 w-5" />
      </div>

      {/* Contenido */}
      <div className="flex-1 min-w-0">
        {t.message && (
          <p className="text-sm font-medium leading-relaxed">
            {typeof t.message === 'string' ? t.message : String(t.message)}
          </p>
        )}
        
        {/* Progress bar */}
        {t.duration && t.duration !== Infinity && (
          <motion.div
            className="absolute bottom-0 left-0 right-0 h-1 bg-white/20 rounded-b-xl overflow-hidden"
            initial={{ scaleX: 1 }}
            animate={{ scaleX: 0 }}
            transition={{ duration: t.duration, ease: 'linear' }}
          />
        )}
      </div>

      {/* Botón de cerrar */}
      {t.type !== 'loading' && (
        <button
          onClick={() => toast.dismiss(t.id)}
          className="shrink-0 rounded-lg p-1 transition-colors hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/50"
          aria-label="Cerrar"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </motion.div>
  )
}

export default function PremiumToast() {
  return (
    <Toaster
      position="top-right"
      reverseOrder={false}
      gutter={12}
      containerClassName="!z-[9999]"
      toastOptions={{
        duration: 4000,
        style: {
          background: 'transparent',
          padding: 0,
          boxShadow: 'none',
        },
        className: '',
        success: {
          duration: 3000,
        },
        error: {
          duration: 5000,
        },
        loading: {
          duration: Infinity,
        },
      }}
    >
      {(t) => (
        <ToastBar toast={t}>
          {() => <CustomToast t={t} />}
        </ToastBar>
      )}
    </Toaster>
  )
}

// Re-export toast para uso fácil
export { toast } from 'react-hot-toast'

