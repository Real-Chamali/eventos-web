'use client'

import { Toaster, Toast, ToastBar, toast } from 'react-hot-toast'
import { CheckCircle2, XCircle, AlertCircle, Info, X, Loader2, Sparkles } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils/cn'
import { useEffect, useRef, useState } from 'react'

const toastVariants = {
  success: {
    icon: CheckCircle2,
    className: 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white border-emerald-600/50',
    iconClassName: 'text-emerald-100',
    glowColor: 'rgba(16, 185, 129, 0.4)',
  },
  error: {
    icon: XCircle,
    className: 'bg-gradient-to-r from-red-500 to-red-600 text-white border-red-600/50',
    iconClassName: 'text-red-100',
    glowColor: 'rgba(239, 68, 68, 0.4)',
  },
  loading: {
    icon: Loader2,
    className: 'bg-gradient-to-r from-blue-500 to-blue-600 text-white border-blue-600/50',
    iconClassName: 'text-blue-100',
    glowColor: 'rgba(59, 130, 246, 0.4)',
  },
  warning: {
    icon: AlertCircle,
    className: 'bg-gradient-to-r from-amber-500 to-amber-600 text-white border-amber-600/50',
    iconClassName: 'text-amber-100',
    glowColor: 'rgba(245, 158, 11, 0.4)',
  },
  info: {
    icon: Info,
    className: 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white border-indigo-600/50',
    iconClassName: 'text-indigo-100',
    glowColor: 'rgba(99, 102, 241, 0.4)',
  },
}

interface CustomToastProps {
  t: Toast
}

// Sonidos opcionales (solo si el usuario no tiene preferencia de reducción de movimiento)
function playToastSound(type: string) {
  if (typeof window === 'undefined') return
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()
    
    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)
    
    // Frecuencias diferentes por tipo
    const frequencies: Record<string, number> = {
      success: 800,
      error: 400,
      warning: 600,
      info: 500,
    }
    
    oscillator.frequency.value = frequencies[type] || 500
    oscillator.type = 'sine'
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1)
    
    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + 0.1)
  } catch (e) {
    // Silenciar errores de audio
  }
}

function CustomToast({ t }: CustomToastProps) {
  const variant = t.type === 'success' ? 'success' : 
                 t.type === 'error' ? 'error' : 
                 t.type === 'loading' ? 'loading' : 
                 t.type === 'blank' ? 'info' : 'info'
  
  const config = toastVariants[variant]
  const Icon = config.icon
  const [isVisible, setIsVisible] = useState(false)
  const hasPlayedSound = useRef(false)

  useEffect(() => {
    if (t.visible && !hasPlayedSound.current) {
      setIsVisible(true)
      // Reproducir sonido solo para success y error
      if (variant === 'success' || variant === 'error') {
        playToastSound(variant)
      }
      hasPlayedSound.current = true
    }
  }, [t.visible, variant])

  return (
    <motion.div
      initial={{ opacity: 0, y: -50, scale: 0.8, rotateX: -15 }}
      animate={{ 
        opacity: 1, 
        y: 0, 
        scale: 1,
        rotateX: 0,
      }}
      exit={{ 
        opacity: 0, 
        scale: 0.8,
        rotateX: 15,
        transition: { duration: 0.2 } 
      }}
      transition={{ 
        type: 'spring', 
        damping: 20, 
        stiffness: 400,
        mass: 0.5,
      }}
      className={cn(
        'relative flex items-center gap-3 rounded-2xl border-2 p-4 shadow-2xl backdrop-blur-md',
        'min-w-[320px] max-w-[500px]',
        'transform-gpu',
        config.className,
        'ring-2 ring-white/10',
      )}
      style={{
        boxShadow: `0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04), 0 0 20px ${config.glowColor}`,
      }}
    >
      {/* Efecto de brillo animado */}
      <motion.div
        className="absolute inset-0 rounded-2xl opacity-0"
        style={{
          background: `linear-gradient(135deg, ${config.glowColor}, transparent)`,
        }}
        animate={{
          opacity: [0, 0.3, 0],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          repeatDelay: 3,
        }}
      />

      {/* Icono con animación */}
      <motion.div 
        className={cn(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
          'backdrop-blur-sm',
          config.iconClassName,
          variant === 'loading' && 'animate-spin'
        )}
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ 
          type: 'spring',
          stiffness: 500,
          damping: 15,
          delay: 0.1,
        }}
      >
        <Icon className="h-5 w-5" />
      </motion.div>

      {/* Contenido */}
      <div className="flex-1 min-w-0 relative z-10">
        {t.message && (
          <motion.p 
            className="text-sm font-semibold leading-relaxed"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
          >
            {typeof t.message === 'string' ? t.message : String(t.message)}
          </motion.p>
        )}
        
        {/* Progress bar premium */}
        {t.duration && t.duration !== Infinity && (
          <motion.div
            className="absolute bottom-0 left-0 right-0 h-1.5 bg-white/30 rounded-b-2xl overflow-hidden backdrop-blur-sm"
            initial={{ scaleX: 1 }}
            animate={{ scaleX: 0 }}
            transition={{ 
              duration: t.duration / 1000, 
              ease: 'linear',
            }}
          >
            <motion.div
              className="h-full bg-white/60 rounded-full"
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{ 
                duration: t.duration / 1000, 
                ease: 'linear',
              }}
            />
          </motion.div>
        )}
      </div>

      {/* Botón de cerrar con hover effect */}
      {t.type !== 'loading' && (
        <motion.button
          onClick={() => toast.dismiss(t.id)}
          className="shrink-0 rounded-lg p-1.5 transition-all hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/50"
          aria-label="Cerrar"
          whileHover={{ scale: 1.1, rotate: 90 }}
          whileTap={{ scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 400, damping: 17 }}
        >
          <X className="h-4 w-4" />
        </motion.button>
      )}

      {/* Partículas de éxito (solo para success) */}
      {variant === 'success' && (
        <AnimatePresence>
          {isVisible && (
            <>
              {[...Array(3)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute pointer-events-none"
                  initial={{ 
                    x: '50%',
                    y: '50%',
                    scale: 0,
                    opacity: 1,
                  }}
                  animate={{
                    x: `${50 + (Math.random() - 0.5) * 100}%`,
                    y: `${50 + (Math.random() - 0.5) * 100}%`,
                    scale: [0, 1, 0],
                    opacity: [1, 1, 0],
                  }}
                  transition={{
                    duration: 0.8,
                    delay: i * 0.1,
                    ease: 'easeOut',
                  }}
                >
                  <Sparkles className="h-3 w-3 text-yellow-300" />
                </motion.div>
              ))}
            </>
          )}
        </AnimatePresence>
      )}
    </motion.div>
  )
}

export default function PremiumToast() {
  return (
    <Toaster
      position="top-right"
      reverseOrder={false}
      gutter={16}
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
          iconTheme: {
            primary: 'transparent',
            secondary: 'transparent',
          },
        },
        error: {
          duration: 5000,
          iconTheme: {
            primary: 'transparent',
            secondary: 'transparent',
          },
        },
        loading: {
          duration: Infinity,
          iconTheme: {
            primary: 'transparent',
            secondary: 'transparent',
          },
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

