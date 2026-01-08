/**
 * Badge Premium con animaciones y efectos visuales
 */

'use client'

import { HTMLAttributes, forwardRef } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils/cn'

interface PremiumBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'premium'
  size?: 'sm' | 'md' | 'lg'
  animated?: boolean
  pulse?: boolean
  glow?: boolean
}

const PremiumBadge = forwardRef<HTMLSpanElement, PremiumBadgeProps>(
  ({ 
    className, 
    variant = 'default', 
    size = 'md',
    animated = true,
    pulse = false,
    glow = false,
    children,
    ...props 
  }, ref) => {
    const variants = {
      default: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100',
      success: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
      warning: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
      error: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
      info: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      premium: 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white',
    }

    const sizes = {
      sm: 'px-2 py-0.5 text-xs',
      md: 'px-2.5 py-1 text-sm',
      lg: 'px-3 py-1.5 text-base',
    }

    const badgeContent = (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center rounded-full font-medium transition-all duration-200',
          variants[variant],
          sizes[size],
          glow && 'shadow-lg',
          className
        )}
        {...props}
      >
        {children}
      </span>
    )

    if (!animated) {
      return badgeContent
    }

    return (
      <motion.span
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        whileHover={{ scale: 1.05 }}
        animate={pulse ? {
          scale: [1, 1.1, 1],
          opacity: [1, 0.8, 1],
        } : {}}
        transition={pulse ? {
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        } : {}}
      >
        {badgeContent}
      </motion.span>
    )
  }
)

PremiumBadge.displayName = 'PremiumBadge'

export default PremiumBadge
