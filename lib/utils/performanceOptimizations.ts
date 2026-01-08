/**
 * Utilidades Premium para Optimización de Performance
 * Funciones y hooks para mejorar rendimiento
 */

'use client'

import { useMemo, useCallback, useEffect, useRef, useState, lazy, type ComponentType, type RefObject, type DependencyList } from 'react'
import * as React from 'react'

/**
 * Debounce hook optimizado
 */
export function useDebounceOptimized<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

/**
 * Throttle hook para limitar frecuencia de ejecución
 */
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const lastRun = useRef(Date.now())

  return useCallback(
    ((...args: Parameters<T>) => {
      if (Date.now() - lastRun.current >= delay) {
        callback(...args)
        lastRun.current = Date.now()
      }
    }) as T,
    [callback, delay]
  )
}

/**
 * Memoizar cálculos pesados
 */
export function useMemoizedCalculation<T>(
  calculation: () => T,
  dependencies: DependencyList
): T {
  return useMemo(calculation, dependencies)
}

/**
 * Lazy load de componentes (helper function)
 */
export function createLazyComponent<T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>
) {
  return lazy(importFunc)
}

/**
 * Prefetch de recursos
 */
export function usePrefetch(url: string) {
  useEffect(() => {
    const link = document.createElement('link')
    link.rel = 'prefetch'
    link.href = url
    document.head.appendChild(link)

    return () => {
      document.head.removeChild(link)
    }
  }, [url])
}

/**
 * Intersection Observer para lazy loading
 */
export function useIntersectionObserver(
  ref: RefObject<Element>,
  options?: IntersectionObserverInit
) {
  const [isIntersecting, setIsIntersecting] = useState(false)

  useEffect(() => {
    if (!ref.current) return

    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting)
    }, options)

    observer.observe(ref.current)

    return () => {
      observer.disconnect()
    }
  }, [ref, options])

  return isIntersecting
}

/**
 * Virtual scrolling helper
 */
export function calculateVirtualItems(
  containerHeight: number,
  itemHeight: number,
  scrollTop: number,
  totalItems: number,
  overscan: number = 5
) {
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
  const endIndex = Math.min(
    totalItems - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  )

  return {
    startIndex,
    endIndex,
    visibleItems: endIndex - startIndex + 1,
  }
}

/**
 * Batch updates para evitar re-renders innecesarios
 */
export function useBatchedUpdates() {
  const updatesRef = useRef<Array<() => void>>([])
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const batchUpdate = useCallback((update: () => void) => {
    updatesRef.current.push(update)

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(() => {
      updatesRef.current.forEach((update) => update())
      updatesRef.current = []
    }, 0)
  }, [])

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return batchUpdate
}
