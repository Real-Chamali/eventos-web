'use client'

import { useState } from 'react'
import { CheckCircle2, Circle } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'

interface ChecklistItem {
  id: string
  label: string
  completed: boolean
  required?: boolean
}

interface EventChecklistProps {
  items: ChecklistItem[]
  onToggle?: (id: string) => void
  readonly?: boolean
}

export default function EventChecklist({
  items,
  onToggle,
  readonly = false,
}: EventChecklistProps) {
  const [localItems, setLocalItems] = useState(items)

  const handleToggle = (id: string) => {
    if (readonly || !onToggle) return

    setLocalItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, completed: !item.completed } : item))
    )
    onToggle(id)
  }

  const completedCount = localItems.filter((item) => item.completed).length
  const progress = (completedCount / localItems.length) * 100

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Checklist del Evento</CardTitle>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {completedCount} de {localItems.length}
          </span>
        </div>
        {/* Progress Bar */}
        <div className="mt-4 h-2 w-full rounded-full bg-gray-200 dark:bg-gray-800">
          <div
            className="h-2 rounded-full bg-blue-600 dark:bg-blue-400 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {localItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleToggle(item.id)}
              disabled={readonly}
              className={cn(
                'flex w-full items-center space-x-3 rounded-lg p-3 text-left transition-colors',
                readonly
                  ? 'cursor-default'
                  : 'hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer',
                item.completed && 'bg-green-50 dark:bg-green-900/10'
              )}
            >
              {item.completed ? (
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
              ) : (
                <Circle className="h-5 w-5 text-gray-400 flex-shrink-0" />
              )}
              <span
                className={cn(
                  'flex-1 text-sm',
                  item.completed
                    ? 'text-gray-500 dark:text-gray-400 line-through'
                    : 'text-gray-900 dark:text-white',
                  item.required && !item.completed && 'font-medium'
                )}
              >
                {item.label}
                {item.required && (
                  <span className="ml-2 text-xs text-red-600 dark:text-red-400">*</span>
                )}
              </span>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

