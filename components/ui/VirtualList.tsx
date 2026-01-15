/**
 * Componente wrapper para virtual scrolling usando @tanstack/react-virtual
 * Optimiza el renderizado de listas largas renderizando solo los elementos visibles
 */

'use client'

import { useRef, useMemo } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { cn } from '@/lib/utils/cn'

interface VirtualListProps<T> {
  items: T[]
  renderItem: (item: T, index: number) => React.ReactNode
  estimateSize?: number
  overscan?: number
  className?: string
  containerClassName?: string
  emptyMessage?: string
  emptyIcon?: React.ReactNode
}

export function VirtualList<T>({
  items,
  renderItem,
  estimateSize = 80,
  overscan = 5,
  className,
  containerClassName,
  emptyMessage = 'No hay elementos',
  emptyIcon,
}: VirtualListProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null)

  // eslint-disable-next-line react-hooks/incompatible-library
  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimateSize,
    overscan,
  })

  const itemsToRender = useMemo(() => {
    return virtualizer.getVirtualItems()
  }, [virtualizer])

  if (items.length === 0) {
    return (
      <div className={cn('flex flex-col items-center justify-center py-12', containerClassName)}>
        {emptyIcon}
        <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div
      ref={parentRef}
      className={cn('h-full overflow-auto', containerClassName)}
      style={{
        contain: 'strict',
      }}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
        className={className}
      >
        {itemsToRender.map((virtualItem) => {
          const item = items[virtualItem.index]
          return (
            <div
              key={virtualItem.key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualItem.size}px`,
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              {renderItem(item, virtualItem.index)}
            </div>
          )
        })}
      </div>
    </div>
  )
}

