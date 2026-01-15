/**
 * Card Premium con animaciones y efectos visuales avanzados
 */

'use client'

import { HTMLAttributes, forwardRef, useState } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils/cn'

interface PremiumCardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'outlined' | 'glass' | 'gradient'
  hover?: boolean
  glow?: boolean
  animated?: boolean
}

const PremiumCard = forwardRef<HTMLDivElement, PremiumCardProps>(
  ({ 
    className, 
    variant = 'default', 
    hover = true,
    glow = false,
    animated = true,
    children, 
    ...props 
  }, ref) => {
    const [isHovered, setIsHovered] = useState(false)

    const variants = {
      default: 'rounded-2xl border border-gray-200/60 bg-white shadow-sm hover:shadow-md transition-shadow duration-200 dark:border-gray-800/60 dark:bg-gray-900',
      elevated: 'rounded-2xl border-0 bg-white shadow-lg hover:shadow-xl transition-all duration-200 dark:bg-gray-900',
      outlined: 'rounded-2xl border-2 border-gray-200 bg-transparent hover:border-gray-300 transition-colors duration-200 dark:border-gray-800 dark:hover:border-gray-700',
      glass: 'rounded-2xl border border-white/20 bg-white/80 backdrop-blur-xl shadow-lg hover:shadow-xl transition-all duration-200 dark:bg-gray-900/80 dark:border-gray-800/60',
      gradient: 'rounded-2xl border-0 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 shadow-lg hover:shadow-xl transition-all duration-200 dark:from-indigo-950/30 dark:via-purple-950/30 dark:to-pink-950/30',
    }

    const cardContent = (
      <div
        ref={ref}
        className={cn(
          variants[variant],
          glow && 'shadow-[0_0_30px_rgba(99,102,241,0.3)]',
          className
        )}
        onMouseEnter={() => hover && setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        {...props}
      >
        {glow && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-indigo-400/10 via-purple-400/10 to-pink-400/10 blur-2xl rounded-2xl -z-10"
            animate={{ 
              opacity: isHovered ? [0.5, 1, 0.5] : 0.5,
              scale: isHovered ? [1, 1.1, 1] : 1,
            }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}
        <div className="relative z-10">
          {children}
        </div>
      </div>
    )

    if (!animated) {
      return cardContent
    }

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        whileHover={hover ? { scale: 1.01, y: -2 } : {}}
      >
        {cardContent}
      </motion.div>
    )
  }
)

PremiumCard.displayName = 'PremiumCard'

const PremiumCardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    const { onDrag, onDragStart, onDragEnd, onAnimationStart, onAnimationEnd, onAnimationIteration, ...motionProps } = props
    void onDrag
    void onDragStart
    void onDragEnd
    void onAnimationStart
    void onAnimationEnd
    void onAnimationIteration
    return (
      <motion.div
        ref={ref}
        className={cn('flex flex-col space-y-1.5 p-6 pb-4', className)}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        {...motionProps}
      />
    )
  }
)

PremiumCardHeader.displayName = 'PremiumCardHeader'

const PremiumCardTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => {
    const { onDrag, onDragStart, onDragEnd, onAnimationStart, onAnimationEnd, onAnimationIteration, ...motionProps } = props
    void onDrag
    void onDragStart
    void onDragEnd
    void onAnimationStart
    void onAnimationEnd
    void onAnimationIteration
    return (
      <motion.h3
        ref={ref}
        className={cn('text-xl font-semibold leading-tight tracking-tight text-gray-900 dark:text-white', className)}
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
        {...motionProps}
      />
    )
  }
)

PremiumCardTitle.displayName = 'PremiumCardTitle'

const PremiumCardDescription = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => {
    const { onDrag, onDragStart, onDragEnd, onAnimationStart, onAnimationEnd, onAnimationIteration, ...motionProps } = props
    void onDrag
    void onDragStart
    void onDragEnd
    void onAnimationStart
    void onAnimationEnd
    void onAnimationIteration
    return (
      <motion.p
        ref={ref}
        className={cn('text-sm leading-relaxed text-gray-600 dark:text-gray-400', className)}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        {...motionProps}
      />
    )
  }
)

PremiumCardDescription.displayName = 'PremiumCardDescription'

const PremiumCardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    const { onDrag, onDragStart, onDragEnd, onAnimationStart, onAnimationEnd, onAnimationIteration, ...motionProps } = props
    void onDrag
    void onDragStart
    void onDragEnd
    void onAnimationStart
    void onAnimationEnd
    void onAnimationIteration
    return (
      <motion.div
        ref={ref}
        className={cn('p-6 pt-0', className)}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        {...motionProps}
      />
    )
  }
)

PremiumCardContent.displayName = 'PremiumCardContent'

const PremiumCardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    const { onDrag, onDragStart, onDragEnd, onAnimationStart, onAnimationEnd, onAnimationIteration, ...motionProps } = props
    void onDrag
    void onDragStart
    void onDragEnd
    void onAnimationStart
    void onAnimationEnd
    void onAnimationIteration
    return (
      <motion.div
        ref={ref}
        className={cn('flex items-center p-6 pt-0 gap-2', className)}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        {...motionProps}
      />
    )
  }
)

PremiumCardFooter.displayName = 'PremiumCardFooter'

export { 
  PremiumCard, 
  PremiumCardHeader, 
  PremiumCardFooter, 
  PremiumCardTitle, 
  PremiumCardDescription, 
  PremiumCardContent 
}
