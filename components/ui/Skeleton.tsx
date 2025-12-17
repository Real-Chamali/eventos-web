import { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils/cn'

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'circular' | 'text'
}

export default function Skeleton({ className, variant = 'default', ...props }: SkeletonProps) {
  const variants = {
    default: 'rounded-xl',
    circular: 'rounded-full',
    text: 'rounded',
  }
  
  return (
    <div
      className={cn(
        'animate-pulse bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800',
        'bg-[length:200%_100%] animate-[shimmer_2s_infinite]',
        variants[variant],
        className
      )}
      {...props}
    />
  )
}
