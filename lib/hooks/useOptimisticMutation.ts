/**
 * Hook para optimistic updates
 * Actualiza la UI inmediatamente antes de confirmar con el servidor
 */

import { useCallback, useState } from 'react'
import { useSWRConfig } from 'swr'
import { logger } from '@/lib/utils/logger'
import { useToast } from './index'

interface OptimisticUpdateOptions<T> {
  /**
   * Clave de SWR a actualizar
   */
  swrKey: string
  
  /**
   * Función para actualizar los datos optimistamente
   */
  optimisticUpdate: (currentData: T | undefined) => T | undefined
  
  /**
   * Función para hacer la mutación real
   */
  mutateFn: () => Promise<T>
  
  /**
   * Mensaje de éxito
   */
  successMessage?: string
  
  /**
   * Mensaje de error
   */
  errorMessage?: string
  
  /**
   * Rollback en caso de error
   */
  rollback?: (currentData: T | undefined) => T | undefined
}

export function useOptimisticMutation<T>() {
  const { mutate } = useSWRConfig()
  const toast = useToast()
  const [isMutating, setIsMutating] = useState(false)
  
  const execute = useCallback(async ({
    swrKey,
    optimisticUpdate,
    mutateFn,
    successMessage = 'Operación exitosa',
    errorMessage = 'Error en la operación',
    rollback,
  }: OptimisticUpdateOptions<T>) => {
    setIsMutating(true)
    let previousData: T | undefined
    
    try {
      // Obtener datos actuales usando mutate
      await mutate(
        swrKey,
        (data: T | undefined) => {
          previousData = data
          return data // No cambiar los datos aún
        },
        { revalidate: false }
      )
      
      // Actualización optimista - actualizar UI inmediatamente
      mutate(
        swrKey,
        optimisticUpdate(previousData),
        { revalidate: false } // No revalidar aún, usar datos optimistas
      )
      
      // Ejecutar mutación real en el servidor
      const newData = await mutateFn()
      
      // Revalidar cache para obtener datos frescos del servidor
      // (mutateFn ya debería haber revalidado, pero por seguridad lo hacemos aquí también)
      await mutate(swrKey, undefined, { revalidate: true })
      
      toast.success(successMessage)
      return newData
    } catch (error) {
      logger.error('useOptimisticMutation', 'Mutation failed', error instanceof Error ? error : new Error(String(error)))
      
      // Rollback si está disponible
      if (rollback && previousData !== undefined) {
        mutate(swrKey, rollback(previousData), { revalidate: false })
      } else {
        // Revalidar para obtener datos reales del servidor
        mutate(swrKey, undefined, { revalidate: true })
      }
      
      toast.error(errorMessage)
      throw error
    } finally {
      setIsMutating(false)
    }
  }, [mutate, toast])
  
  return {
    execute,
    isMutating,
  }
}

