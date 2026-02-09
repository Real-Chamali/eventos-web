/**
 * Logo optimizado con diferentes tamaños según el contexto
 * Utiliza next/image con blur placeholder y lazy loading
 */

'use client'

import Image from 'next/image'
import { cn } from '@/lib/utils/cn'

interface OptimizedLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  priority?: boolean
  variant?: 'full' | 'icon'
}

const sizeConfig = {
  sm: { width: 32, height: 32, icon: 'icon-96.png' },
  md: { width: 48, height: 48, icon: 'icon-128.png' },
  lg: { width: 64, height: 64, icon: 'icon-192.png' },
  xl: { width: 128, height: 128, icon: 'icon-512.png' },
}

const blurDataURL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='

export function OptimizedLogo({ 
  size = 'md', 
  className, 
  priority = false,
  variant = 'full'
}: OptimizedLogoProps) {
  const config = sizeConfig[size]
  const src = `/${config.icon}`

  if (variant === 'icon') {
    return (
      <div className={cn('relative', className)}>
        <Image
          src={src}
          alt="Eventos CRM Logo"
          width={config.width}
          height={config.height}
          className="rounded-lg"
          placeholder="blur"
          blurDataURL={blurDataURL}
          priority={priority}
          sizes="(max-width: 768px) 32px, 48px"
        />
      </div>
    )
  }

  return (
    <div className={cn('relative flex items-center gap-3', className)}>
      <Image
        src={src}
        alt="Eventos CRM Logo"
        width={config.width}
        height={config.height}
        className="rounded-lg"
        placeholder="blur"
        blurDataURL={blurDataURL}
        priority={priority}
        sizes="(max-width: 768px) 32px, 48px"
      />
      <span className="font-bold text-xl text-gray-900 dark:text-white">
        Eventos CRM
      </span>
    </div>
  )
}
