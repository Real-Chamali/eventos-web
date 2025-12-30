/**
 * Función debounce para limitar la frecuencia de llamadas
 * Útil para búsquedas, filtros, y eventos de scroll
 * 
 * Nota: Para hooks de React, usar useDebounce de @/lib/hooks
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

