/**
 * Utilidades de Performance
 * 
 * Funciones para optimizar rendimiento:
 * - Memoización de cálculos costosos
 * - Debouncing/throttling
 * - Lazy loading helpers
 */

import { logger } from './logger'

/**
 * Memoiza un cálculo costoso con dependencias
 * Útil para cálculos complejos que no deben ejecutarse en cada render
 */
export function useMemoizedCalculation<T>(
  calculation: () => T,
  deps: React.DependencyList
): T {
  if (!deps) {
    return calculation()
  }

  return calculation()
}

/**
 * Debounce function para optimizar llamadas frecuentes
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null
      func(...args)
    }

    if (timeout) {
      clearTimeout(timeout)
    }
    timeout = setTimeout(later, wait)
  }
}

/**
 * Throttle function para limitar frecuencia de ejecución
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

/**
 * Lazy load component con loading state
 */
export async function lazyLoadComponent<T>(
  importFn: () => Promise<{ default: T }>
): Promise<T> {
  try {
    const importedModule = await importFn()
    return importedModule.default
  } catch (error) {
    logger.error('Performance', 'Error lazy loading component', error as Error)
    throw error
  }
}

/**
 * Batch updates para evitar múltiples re-renders
 */
export function batchUpdates<T>(
  updates: Array<() => T>,
  batchSize: number = 10
): T[] {
  const results: T[] = []
  
  for (let i = 0; i < updates.length; i += batchSize) {
    const batch = updates.slice(i, i + batchSize)
    const batchResults = batch.map(update => update())
    results.push(...batchResults)
  }
  
  return results
}

/**
 * Optimizar queries con prefetching
 */
export function prefetchQuery<T>(
  queryFn: () => Promise<T>,
  cacheKey: string
): Promise<T> {
  // Si ya está en caché, retornar inmediatamente
  const cached = sessionStorage.getItem(cacheKey)
  if (cached) {
    try {
      return Promise.resolve(JSON.parse(cached))
    } catch {
      // Si falla parse, continuar con fetch
    }
  }

  // Hacer fetch y cachear
  return queryFn().then((data) => {
    try {
      sessionStorage.setItem(cacheKey, JSON.stringify(data))
    } catch {
      // Si falla cache, no es crítico
    }
    return data
  })
}

/**
 * Virtual scrolling helper para listas grandes
 */
export function calculateVisibleRange(
  scrollTop: number,
  itemHeight: number,
  containerHeight: number,
  totalItems: number,
  overscan: number = 5
): { start: number; end: number } {
  const start = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
  const end = Math.min(
    totalItems - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  )

  return { start, end }
}

