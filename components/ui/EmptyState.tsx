import { ReactNode } from 'react'
import { cn } from '@/lib/utils/cn'
import Button from './Button'

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
}

export default function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-16 px-4 text-center',
        className
      )}
    >
      {icon && (
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-900 shadow-lg">
          <div className="text-gray-400 dark:text-gray-500">
            {icon}
          </div>
        </div>
      )}
      <h3 className="mb-3 text-xl font-bold text-gray-900 dark:text-white">
        {title}
      </h3>
      {description && (
        <p className="mb-8 max-w-md text-sm leading-relaxed text-gray-600 dark:text-gray-400">
          {description}
        </p>
      )}
      {action && (
        <Button variant="premium" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  )
}
