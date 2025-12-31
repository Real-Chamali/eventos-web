/**
 * Hooks para Prefetching Inteligente
 * 
 * Hooks de React para prefetching proactivo de recursos
 */

import { useEffect, useCallback } from 'react'
import { prefetchRoute, prefetchData, prefetchImage } from './prefetch'

/**
 * Hook para prefetch de ruta al hacer hover
 */
export function useHoverPrefetch(href: string, enabled = true) {
  const handleMouseEnter = useCallback(() => {
    if (enabled) {
      prefetchRoute(href)
    }
  }, [href, enabled])

  return handleMouseEnter
}

/**
 * Hook para prefetch de datos
 */
export function usePrefetchData(url: string, enabled = true) {
  useEffect(() => {
    if (enabled && typeof window !== 'undefined') {
      prefetchData(url)
    }
  }, [url, enabled])
}

/**
 * Hook para prefetch de imágenes
 */
export function usePrefetchImages(urls: string[], enabled = true) {
  useEffect(() => {
    if (enabled && typeof window !== 'undefined') {
      urls.forEach(url => prefetchImage(url))
    }
  }, [urls, enabled])
}

/**
 * Hook para prefetch de rutas relacionadas
 */
export function usePrefetchRelatedRoutes(routes: string[], enabled = true) {
  useEffect(() => {
    if (enabled && typeof window !== 'undefined') {
      // Prefetch después de un pequeño delay para no bloquear
      const timer = setTimeout(() => {
        routes.forEach(route => prefetchRoute(route))
      }, 1000)
      
      return () => clearTimeout(timer)
    }
  }, [routes, enabled])
}

