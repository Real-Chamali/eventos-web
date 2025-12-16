'use client'

import { CheckCircle2, Circle, Clock } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface TimelineItem {
  id: string
  title: string
  description?: string
  date: string
  status: 'completed' | 'pending' | 'upcoming'
}

interface EventTimelineProps {
  items: TimelineItem[]
}

export default function EventTimeline({ items }: EventTimelineProps) {
  const getIcon = (status: TimelineItem['status']) => {
    switch (status) {
      case 'completed':
        return (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
            <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
          </div>
        )
      case 'pending':
        return (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900/20">
            <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
          </div>
        )
      case 'upcoming':
      default:
        return (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
            <Circle className="h-5 w-5 text-gray-400" />
          </div>
        )
    }
  }

  return (
    <div className="space-y-6">
      {items.map((item, index) => (
        <div key={item.id} className="relative flex items-start space-x-4">
          {/* Timeline Line */}
          {index < items.length - 1 && (
            <div className="absolute left-4 top-8 h-full w-0.5 bg-gray-200 dark:bg-gray-800" />
          )}

          {/* Icon */}
          <div className="relative z-10">{getIcon(item.status)}</div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <p
                className={cn(
                  'text-sm font-medium',
                  item.status === 'completed'
                    ? 'text-gray-900 dark:text-white'
                    : 'text-gray-600 dark:text-gray-400'
                )}
              >
                {item.title}
              </p>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {format(new Date(item.date), "dd MMM yyyy", { locale: es })}
              </span>
            </div>
            {item.description && (
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {item.description}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

