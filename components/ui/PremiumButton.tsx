/**
 * Botón Premium con animaciones avanzadas y efectos visuales
 */

'use client'

import { ButtonHTMLAttributes, forwardRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils/cn'
import { Loader2, Check, X, AlertCircle } from 'lucide-react'

interface PremiumButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'destructive' | 'success' | 'premium' | 'gradient'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  isLoading?: boolean
  showSuccess?: boolean
  showError?: boolean
  icon?: React.ReactNode
  iconPosition?: 'left' | 'right'
  ripple?: boolean
  glow?: boolean
}

const PremiumButton = forwardRef<HTMLButtonElement, PremiumButtonProps>(
  ({ 
    className, 
    variant = 'default', 
    size = 'md', 
    isLoading, 
    showSuccess,
    showError,
    icon,
    iconPosition = 'left',
    ripple = true,
    glow = false,
    children, 
    disabled, 
    onClick,
    ...props 
  }, ref) => {
    const [ripples, setRipples] = useState<Array<{ x: number; y: number; id: number }>>([])
    const [rippleId, setRippleId] = useState(0)

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (ripple && !disabled && !isLoading) {
        const rect = e.currentTarget.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top
        const newRipple = { x, y, id: rippleId }
        setRipples([...ripples, newRipple])
        setRippleId(rippleId + 1)
        
        setTimeout(() => {
          setRipples((prev) => prev.filter((r) => r.id !== newRipple.id))
        }, 600)
      }
      
      onClick?.(e)
    }

    const baseStyles = 'relative inline-flex items-center justify-center rounded-xl font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed overflow-hidden'
    
    const variants = {
      default: 'bg-gray-900 text-white hover:bg-gray-800 active:bg-gray-700 focus:ring-gray-500 shadow-sm hover:shadow-md dark:bg-gray-50 dark:text-gray-900 dark:hover:bg-gray-100',
      premium: 'bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 focus:ring-indigo-500 shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]',
      gradient: 'bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 focus:ring-purple-500 shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]',
      outline: 'border-2 border-gray-200 bg-transparent text-gray-700 hover:bg-gray-50 active:bg-gray-100 hover:border-gray-300 focus:ring-gray-400 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800',
      ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 active:bg-gray-200 focus:ring-gray-400 dark:text-gray-300 dark:hover:bg-gray-800',
      destructive: 'bg-red-500 text-white hover:bg-red-600 active:bg-red-700 focus:ring-red-500 shadow-sm hover:shadow-md dark:bg-red-600 dark:hover:bg-red-700',
      success: 'bg-emerald-500 text-white hover:bg-emerald-600 active:bg-emerald-700 focus:ring-emerald-500 shadow-sm hover:shadow-md dark:bg-emerald-600 dark:hover:bg-emerald-700',
    }
    
    const sizes = {
      sm: 'px-3 py-2 text-sm gap-1.5 min-h-[36px]',
      md: 'px-4 py-3 text-sm gap-2 min-h-[44px]',
      lg: 'px-6 py-3.5 text-base gap-2 min-h-[48px]',
      xl: 'px-8 py-4 text-lg gap-2.5 min-h-[52px]',
    }

    const getIcon = () => {
      if (isLoading) return <Loader2 className="h-4 w-4 animate-spin" />
      if (showSuccess) return <Check className="h-4 w-4" />
      if (showError) return <AlertCircle className="h-4 w-4" />
      return icon
    }

    const iconElement = getIcon()
    const showIconLeft = iconPosition === 'left' && iconElement
    const showIconRight = iconPosition === 'right' && iconElement

    // Filtrar props que no son compatibles con motion.button
    const { onDrag, onDragStart, onDragEnd, ...motionProps } = props

    return (
      <motion.button
        ref={ref}
        className={cn(
          baseStyles, 
          variants[variant], 
          sizes[size],
          glow && 'shadow-[0_0_20px_rgba(99,102,241,0.5)]',
          className
        )}
        disabled={disabled || isLoading}
        onClick={handleClick}
        whileHover={!disabled && !isLoading ? { scale: 1.02 } : {}}
        whileTap={!disabled && !isLoading ? { scale: 0.98 } : {}}
        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
        {...motionProps}
      >
        {/* Ripple Effect */}
        <AnimatePresence>
          {ripples.map((ripple) => (
            <motion.span
              key={ripple.id}
              className="absolute rounded-full bg-white/30 pointer-events-none"
              initial={{ width: 0, height: 0, x: ripple.x, y: ripple.y, opacity: 1 }}
              animate={{ width: 300, height: 300, x: ripple.x - 150, y: ripple.y - 150, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            />
          ))}
        </AnimatePresence>

        {/* Glow Effect */}
        {glow && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-indigo-400/20 via-purple-400/20 to-pink-400/20 blur-xl"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}

        {/* Content */}
        <span className="relative z-10 flex items-center">
          {showIconLeft && (
            <motion.span
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            >
              {iconElement}
            </motion.span>
          )}
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.span
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                Cargando...
              </motion.span>
            ) : showSuccess ? (
              <motion.span
                key="success"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="text-emerald-50"
              >
                {children || 'Éxito'}
              </motion.span>
            ) : showError ? (
              <motion.span
                key="error"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="text-red-50"
              >
                {children || 'Error'}
              </motion.span>
            ) : (
              <motion.span
                key="default"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {children}
              </motion.span>
            )}
          </AnimatePresence>
          {showIconRight && (
            <motion.span
              initial={{ scale: 0, rotate: 180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            >
              {iconElement}
            </motion.span>
          )}
        </span>
      </motion.button>
    )
  }
)

PremiumButton.displayName = 'PremiumButton'

export default PremiumButton
