import { ReactNode } from 'react'
import { Card, CardContent } from './Card'
import { TrendingUp, TrendingDown, ArrowUpRight } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface StatsCardProps {
  title: string
  value: string | number
  change?: number
  icon?: ReactNode
  description?: string
  trend?: 'up' | 'down'
  type?: 'currency' | 'percentage' | 'number'
  variant?: 'default' | 'premium'
}

export default function StatsCard({
  title,
  value,
  change,
  icon,
  description,
  trend,
  type = 'number',
  variant = 'default',
}: StatsCardProps) {
  const formatValue = (val: string | number) => {
    if (typeof val === 'number') {
      if (type === 'currency') {
        return new Intl.NumberFormat('es-MX', {
          style: 'currency',
          currency: 'MXN',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(val)
      } else if (type === 'percentage') {
        return `${val.toFixed(1)}%`
      }
      return val.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    }
    return val
  }

  const formattedValue = formatValue(value)

  return (
    <Card variant={variant === 'premium' ? 'elevated' : 'default'} className="group hover:scale-[1.02] transition-all duration-200">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
              {variant === 'premium' && (
                <ArrowUpRight className="h-4 w-4 text-indigo-600 dark:text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
              )}
            </div>
            <p className={cn(
              "text-3xl font-bold tracking-tight",
              variant === 'premium' 
                ? "bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent"
                : "text-gray-900 dark:text-white"
            )}>
              {formattedValue}
            </p>
            {(change !== undefined || description) && (
              <div className="flex items-center gap-2 flex-wrap">
                {change !== undefined && (
                  <div className="flex items-center gap-1">
                    {trend === 'up' ? (
                      <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    ) : trend === 'down' ? (
                      <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
                    ) : null}
                    <span
                      className={cn(
                        'text-sm font-semibold',
                        trend === 'up' && 'text-emerald-600 dark:text-emerald-400',
                        trend === 'down' && 'text-red-600 dark:text-red-400',
                        !trend && 'text-gray-600 dark:text-gray-400'
                      )}
                    >
                      {change > 0 ? '+' : ''}{change}%
                    </span>
                  </div>
                )}
                {description && (
                  <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                    {description}
                  </span>
                )}
              </div>
            )}
          </div>
          {icon && (
            <div className={cn(
              "ml-4 flex h-14 w-14 items-center justify-center rounded-2xl transition-all duration-200 group-hover:scale-110",
              variant === 'premium'
                ? "bg-gradient-to-br from-indigo-500 to-violet-500 shadow-lg"
                : "bg-indigo-50 dark:bg-indigo-950/30"
            )}>
              <div className={cn(
                variant === 'premium' ? "text-white" : "text-indigo-600 dark:text-indigo-400"
              )}>
                {icon}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
