'use client'

/**
 * Utilidades Premium para Optimización de Imágenes
 * 
 * Funciones para optimizar imágenes con next/image, blur placeholders,
 * y formatos modernos (WebP/AVIF)
 */

import React, { useState, useEffect } from 'react'
import Image from 'next/image'

export interface OptimizedImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
  priority?: boolean
  quality?: number
  placeholder?: 'blur' | 'empty'
  blurDataURL?: string
  sizes?: string
  fill?: boolean
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down'
}

/**
 * Genera un blur placeholder base64 para imágenes
 * Útil para crear placeholders de carga suaves
 */
export function generateBlurPlaceholder(width: number = 10, height: number = 10): string {
  // Placeholder SVG minimalista que se convierte a base64
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#e5e7eb"/>
    </svg>
  `
  
  if (typeof window === 'undefined') {
    // En servidor, usar un placeholder simple
    return 'data:image/svg+xml;base64,' + Buffer.from(svg).toString('base64')
  }
  
  // En cliente, usar canvas para generar blur
  try {
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.fillStyle = '#e5e7eb'
      ctx.fillRect(0, 0, width, height)
      return canvas.toDataURL()
    }
  } catch (e) {
    // Fallback a SVG
  }
  
  return 'data:image/svg+xml;base64,' + btoa(svg)
}

/**
 * Componente de imagen optimizada premium
 * Con lazy loading, blur placeholder, y formatos modernos
 */
export function OptimizedImage({
  src,
  alt,
  width,
  height,
  className = '',
  priority = false,
  quality = 85,
  placeholder = 'blur',
  blurDataURL,
  sizes,
  fill = false,
  objectFit = 'cover',
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  // Generar blur placeholder si no se proporciona
  const defaultBlur = blurDataURL || generateBlurPlaceholder(width || 400, height || 300)

  if (hasError) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-100 dark:bg-gray-800 ${className}`}
        style={fill ? undefined : { width, height }}
      >
        <span className="text-gray-400 text-sm">Error al cargar imagen</span>
      </div>
    )
  }

  const imageProps = fill
    ? {
        fill: true,
        style: { objectFit },
      }
    : {
        width: width || 400,
        height: height || 300,
      }

  return (
    <div className={`relative overflow-hidden ${className}`} style={fill ? { width: '100%', height: '100%' } : undefined}>
      <Image
        src={src}
        alt={alt}
        {...imageProps}
        priority={priority}
        quality={quality}
        placeholder={placeholder}
        blurDataURL={placeholder === 'blur' ? defaultBlur : undefined}
        sizes={sizes || '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'}
        className={`transition-opacity duration-300 ${
          isLoading ? 'opacity-0' : 'opacity-100'
        }`}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false)
          setHasError(true)
        }}
      />
      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse" />
      )}
    </div>
  )
}

/**
 * Obtiene el tamaño óptimo de imagen según el viewport
 */
export function getOptimalImageSize(containerWidth: number, devicePixelRatio: number = 1): number {
  // Calcular tamaño considerando DPR para pantallas retina
  return Math.ceil(containerWidth * devicePixelRatio)
}

/**
 * Genera srcSet para responsive images
 */
export function generateSrcSet(
  baseSrc: string,
  widths: number[] = [640, 750, 828, 1080, 1200, 1920, 2048, 3840]
): string {
  return widths
    .map((width) => `${baseSrc}?w=${width} ${width}w`)
    .join(', ')
}

/**
 * Preload de imágenes críticas
 */
export function preloadImage(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new window.Image()
    img.onload = () => resolve()
    img.onerror = reject
    img.src = src
  })
}

/**
 * Lazy load de imágenes con Intersection Observer
 */
export function useLazyImage(src: string, options?: IntersectionObserverInit): {
  imgSrc: string | null
  isLoaded: boolean
  ref: (node: HTMLElement | null) => void
} {
  const [imgSrc, setImgSrc] = useState<string | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [node, setNode] = useState<HTMLElement | null>(null)

  useEffect(() => {
    if (!node) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setImgSrc(src)
            observer.disconnect()
          }
        })
      },
      {
        rootMargin: '50px',
        ...options,
      }
    )

    observer.observe(node)

    return () => {
      observer.disconnect()
    }
  }, [node, src, options])

  useEffect(() => {
    if (!imgSrc) return

    const img = new window.Image()
    img.onload = () => setIsLoaded(true)
    img.src = imgSrc
  }, [imgSrc])

  return {
    imgSrc,
    isLoaded,
    ref: setNode,
  }
}

// Re-export Image de next/image para uso directo
export { Image as NextImage } from 'next/image'

