'use client'

import { SWRConfig } from 'swr'
import { ReactNode } from 'react'
import { logger } from '@/lib/utils/logger'

interface SWRProviderProps {
  children: ReactNode
}

/**
 * Provider de SWR para configuración global
 * Maneja caché, revalidación y manejo de errores
 */
export function SWRProvider({ children }: SWRProviderProps) {
  return (
    <SWRConfig
      value={{
        // Configuración de revalidación
        revalidateOnFocus: false, // No revalidar al cambiar de tab
        revalidateOnReconnect: true, // Revalidar al reconectar
        revalidateIfStale: true, // Revalidar si los datos están obsoletos
        
        // Configuración de caché
        dedupingInterval: 5000, // 5 segundos de deduplicación
        focusThrottleInterval: 5000, // Throttle de 5 segundos para focus
        
        // Manejo de errores
        onError: (error, key) => {
          logger.error('SWR', `Error fetching ${key}`, error instanceof Error ? error : new Error(String(error)), {
            key,
          })
        },
        
        // Retry configuration
        errorRetryCount: 3,
        errorRetryInterval: 5000,
        
        // Fetcher por defecto (se puede sobrescribir en hooks específicos)
        fetcher: async (url: string) => {
          const res = await fetch(url)
          if (!res.ok) {
            const error = new Error('An error occurred while fetching the data.')
            throw error
          }
          return res.json()
        },
      }}
    >
      {children}
    </SWRConfig>
  )
}

