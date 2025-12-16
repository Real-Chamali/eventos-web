import { ReactNode } from 'react'
import { Card, CardContent } from './Card'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface StatsCardProps {
  title: string
  value: string | number
  change?: number
  icon?: ReactNode
  description?: string
  trend?: 'up' | 'down'
}

export default function StatsCard({
  title,
  value,
  change,
  icon,
  description,
  trend,
}: StatsCardProps) {
  const formattedValue = typeof value === 'number' 
    ? value.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : value

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
            <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
              {typeof value === 'number' && value >= 0 ? '$' : ''}{formattedValue}
            </p>
            {(change !== undefined || description) && (
              <div className="mt-2 flex items-center space-x-1">
                {change !== undefined && (
                  <>
                    {trend === 'up' ? (
                      <TrendingUp className="h-4 w-4 text-green-600" />
                    ) : trend === 'down' ? (
                      <TrendingDown className="h-4 w-4 text-red-600" />
                    ) : null}
                    <span
                      className={cn(
                        'text-sm font-medium',
                        trend === 'up' && 'text-green-600',
                        trend === 'down' && 'text-red-600',
                        !trend && 'text-gray-600'
                      )}
                    >
                      {change > 0 ? '+' : ''}{change}%
                    </span>
                  </>
                )}
                {description && (
                  <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">
                    {description}
                  </span>
                )}
              </div>
            )}
          </div>
          {icon && (
            <div className="ml-4 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/20">
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

