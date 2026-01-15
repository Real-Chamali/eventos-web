/**
 * Componente wrapper para next/image con optimizaciones por defecto
 * Incluye blur placeholder, lazy loading, y formatos optimizados
 */

'use client'

import Image, { ImageProps } from 'next/image'
import { useState } from 'react'
import { cn } from '@/lib/utils/cn'

interface OptimizedImageProps extends Omit<ImageProps, 'src' | 'alt'> {
  src: string
  alt: string
  blurDataURL?: string
  fallback?: string
  className?: string
  containerClassName?: string
  priority?: boolean
}

// Blur placeholder base64 (1x1 pixel transparent PNG)
const blurDataURL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='

export function OptimizedImage({
  src,
  alt,
  blurDataURL: customBlurDataURL,
  fallback,
  className,
  containerClassName,
  priority = false,
  fill,
  width,
  height,
  ...props
}: OptimizedImageProps) {
  const [imgSrc, setImgSrc] = useState(src)
  const [isLoading, setIsLoading] = useState(true)

  const handleError = () => {
    if (fallback && imgSrc !== fallback) {
      setImgSrc(fallback)
    }
    setIsLoading(false)
  }

  const handleLoad = () => {
    setIsLoading(false)
  }

  const imageProps: ImageProps = {
    src: imgSrc,
    alt,
    className: cn(
      'transition-opacity duration-300',
      isLoading ? 'opacity-0' : 'opacity-100',
      className
    ),
    placeholder: 'blur',
    blurDataURL: customBlurDataURL || blurDataURL,
    loading: priority ? undefined : 'lazy',
    priority,
    onError: handleError,
    onLoad: handleLoad,
    ...props,
  }

  if (fill) {
    return (
      <div className={cn('relative overflow-hidden', containerClassName)}>
        <Image {...imageProps} alt={alt} fill />
      </div>
    )
  }

  return (
    <div className={cn('relative overflow-hidden', containerClassName)}>
      <Image
        {...imageProps}
        alt={alt}
        width={width || 800}
        height={height || 600}
      />
    </div>
  )
}

