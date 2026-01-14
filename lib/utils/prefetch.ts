/**
 * Utilidades de Prefetching Inteligente
 * 
 * Prefetching proactivo de recursos para mejorar la experiencia del usuario
 */

import { logger } from './logger'

/**
 * Prefetch de una ruta Next.js
 */
interface NextRouter {
  prefetch?: (href: string) => void
}

interface NextData {
  router?: NextRouter
}

interface WindowWithNextData extends Window {
  __NEXT_DATA__?: NextData
}

export function prefetchRoute(href: string) {
  if (typeof window === 'undefined') return
  
  // Usar el router de Next.js si está disponible
  const windowWithNext = window as unknown as WindowWithNextData
  const router = windowWithNext.__NEXT_DATA__?.router
  if (router && router.prefetch) {
    router.prefetch(href)
  }
}

/**
 * Prefetch de datos de una API
 */
export async function prefetchData(url: string) {
  if (typeof window === 'undefined') return null
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    
    if (response.ok) {
      return await response.json()
    }
  } catch (error) {
    // Silenciar errores de prefetch (no crítico)
    logger.debug('Prefetch', 'Prefetch failed', { url })
  }
  
  return null
}

/**
 * Prefetch de imágenes
 */
export function prefetchImage(src: string) {
  if (typeof window === 'undefined') return
  
  const link = document.createElement('link')
  link.rel = 'prefetch'
  link.as = 'image'
  link.href = src
  document.head.appendChild(link)
}

/**
 * Prefetch inteligente basado en hover
 */
export function useHoverPrefetch(elementRef: React.RefObject<HTMLElement>, href: string) {
  if (typeof window === 'undefined') return
  
  const handleMouseEnter = () => {
    prefetchRoute(href)
  }
  
  if (elementRef.current) {
    elementRef.current.addEventListener('mouseenter', handleMouseEnter)
    
    return () => {
      elementRef.current?.removeEventListener('mouseenter', handleMouseEnter)
    }
  }
}

