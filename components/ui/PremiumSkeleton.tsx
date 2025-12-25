'use client'

import { HTMLAttributes } from 'react'
import { motion, HTMLMotionProps } from 'framer-motion'
import { cn } from '@/lib/utils/cn'

interface PremiumSkeletonProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onDrag' | 'onDragStart' | 'onDragEnd'> {
  variant?: 'default' | 'circular' | 'text' | 'card' | 'table'
  lines?: number
  animated?: boolean
}

export default function PremiumSkeleton({
  className,
  variant = 'default',
  lines = 1,
  animated = true,
  ...props
}: PremiumSkeletonProps) {
  const variants = {
    default: 'rounded-xl',
    circular: 'rounded-full',
    text: 'rounded',
    card: 'rounded-2xl',
    table: 'rounded-lg',
  }

  const baseStyles = cn(
    'bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800',
    'bg-[length:200%_100%]',
    variants[variant],
    animated && 'animate-shimmer',
    className
  )

  // Filtrar props que no son compatibles con motion.div
  const { onDrag, onDragStart, onDragEnd, ...motionProps } = props as any

  if (variant === 'text' && lines > 1) {
    return (
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.1 }}
            className={cn(baseStyles, 'h-4')}
            style={{ width: i === lines - 1 ? '75%' : '100%' }}
            {...(motionProps as HTMLMotionProps<'div'>)}
          />
        ))}
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={baseStyles}
      {...(motionProps as HTMLMotionProps<'div'>)}
    />
  )
}

// Skeleton específicos para diferentes casos de uso
export function CardSkeleton({ count = 1 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
        >
          <PremiumSkeleton variant="card" className="h-48 w-full" />
        </motion.div>
      ))}
    </div>
  )
}

export function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <motion.div
          key={rowIndex}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: rowIndex * 0.05 }}
          className="flex gap-4"
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            <PremiumSkeleton
              key={colIndex}
              variant="table"
              className="h-12 flex-1"
            />
          ))}
        </motion.div>
      ))}
    </div>
  )
}

export function ListSkeleton({ items = 3 }: { items?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: items }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.1 }}
          className="flex items-center gap-4"
        >
          <PremiumSkeleton variant="circular" className="h-12 w-12" />
          <div className="flex-1 space-y-2">
            <PremiumSkeleton variant="text" className="h-4 w-3/4" />
            <PremiumSkeleton variant="text" className="h-3 w-1/2" />
          </div>
        </motion.div>
      ))}
    </div>
  )
}

