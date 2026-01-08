/**
 * Skeleton Premium con animaciones avanzadas y efectos visuales
 */

'use client'

import { HTMLAttributes } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils/cn'

interface PremiumSkeletonProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'text' | 'circular' | 'rectangular'
  lines?: number
  animated?: boolean
  shimmer?: boolean
}

export default function PremiumSkeleton({
  className,
  variant = 'default',
  lines = 1,
  animated = true,
  shimmer = true,
  ...props
}: PremiumSkeletonProps) {
  const baseStyles = 'bg-gray-200 dark:bg-gray-800 rounded-lg'
  
  const variants = {
    default: 'h-4 w-full',
    text: 'h-4 w-full',
    circular: 'h-12 w-12 rounded-full',
    rectangular: 'h-24 w-full rounded-xl',
  }

  // Filtrar props que no son compatibles con motion.div
  const { 
    onDrag, 
    onDragStart, 
    onDragEnd,
    onAnimationStart,
    onAnimationEnd,
    onAnimationIteration,
    ...motionProps 
  } = props

  if (variant === 'text' && lines > 1) {
    return (
      <div className={cn('space-y-2', className)} {...motionProps}>
        {Array.from({ length: lines }).map((_, i) => (
          <motion.div
            key={i}
            className={cn(baseStyles, variants[variant], i === lines - 1 && 'w-3/4')}
            animate={animated && shimmer ? {
              opacity: [0.5, 1, 0.5],
            } : {}}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: i * 0.1,
            }}
          />
        ))}
      </div>
    )
  }

  return (
    <motion.div
      className={cn(baseStyles, variants[variant], className)}
      animate={animated && shimmer ? {
        opacity: [0.5, 1, 0.5],
        backgroundPosition: ['0%', '100%', '0%'],
      } : {}}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
      style={shimmer ? {
        background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
        backgroundSize: '200% 100%',
      } : {}}
      {...motionProps}
    />
  )
}
