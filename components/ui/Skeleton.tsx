// Re-export PremiumSkeleton as Skeleton for backward compatibility
export { default } from './PremiumSkeleton'

// Skeleton components adicionales
import PremiumSkeleton from './PremiumSkeleton'
import { cn } from '@/lib/utils/cn'

export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('p-6 space-y-4', className)}>
      <PremiumSkeleton variant="text" lines={2} />
      <PremiumSkeleton variant="rectangular" />
    </div>
  )
}

export function TableSkeleton({ rows = 5, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <PremiumSkeleton key={i} variant="rectangular" className="h-16" />
      ))}
    </div>
  )
}

export function ListSkeleton({ items = 5, className }: { items?: number; className?: string }) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <PremiumSkeleton variant="circular" />
          <PremiumSkeleton variant="text" className="flex-1" />
        </div>
      ))}
    </div>
  )
}
