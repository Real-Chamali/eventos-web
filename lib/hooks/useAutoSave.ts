/**
 * Hook para auto-guardado de formularios
 * 
 * Guarda automáticamente el estado del formulario en localStorage
 * y permite restaurar el estado al recargar la página
 */

import { useEffect, useCallback, useRef } from 'react'
import { logger } from '@/lib/utils/logger'
import { useDebounce } from './index'

interface UseAutoSaveOptions<T> {
  data: T
  storageKey: string
  enabled?: boolean
  debounceMs?: number
  onSave?: (data: T) => void | Promise<void>
  onRestore?: (data: T) => void
}

/**
 * Hook para auto-guardado de formularios
 * 
 * @example
 * ```typescript
 * const { save, restore, clear, hasDraft } = useAutoSave({
 *   data: formData,
 *   storageKey: 'quote-draft',
 *   enabled: true,
 *   onSave: async (data) => {
 *     // Guardar en servidor si es necesario
 *   }
 * })
 * ```
 */
export function useAutoSave<T extends Record<string, unknown>>({
  data,
  storageKey,
  enabled = true,
  debounceMs = 2000, // 2 segundos por defecto
  onSave,
  onRestore,
}: UseAutoSaveOptions<T>) {
  const debouncedData = useDebounce(data, debounceMs)
  const isInitialMount = useRef(true)
  const lastSavedRef = useRef<string>('')

  // Restaurar datos al montar
  useEffect(() => {
    if (!enabled || !onRestore) return

    try {
      const saved = localStorage.getItem(storageKey)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (parsed && Object.keys(parsed).length > 0) {
          onRestore(parsed)
          logger.debug('useAutoSave', 'Restored draft', { storageKey })
        }
      }
    } catch (error) {
      logger.error('useAutoSave', 'Error restoring draft', error as Error, { storageKey })
    }
  }, []) // Solo al montar

  // Auto-guardar cuando cambian los datos
  useEffect(() => {
    if (!enabled) return
    if (isInitialMount.current) {
      isInitialMount.current = false
      return
    }

    const dataString = JSON.stringify(debouncedData)
    
    // Solo guardar si hay cambios
    if (dataString === lastSavedRef.current) {
      return
    }

    try {
      localStorage.setItem(storageKey, dataString)
      lastSavedRef.current = dataString
      
      logger.debug('useAutoSave', 'Auto-saved draft', { storageKey })
      
      // Llamar callback si existe
      if (onSave) {
        void onSave(debouncedData)
      }
    } catch (error) {
      logger.error('useAutoSave', 'Error auto-saving draft', error as Error, { storageKey })
    }
  }, [debouncedData, storageKey, enabled, onSave])

  // Guardar manualmente
  const save = useCallback(() => {
    if (!enabled) return

    try {
      const dataString = JSON.stringify(data)
      localStorage.setItem(storageKey, dataString)
      lastSavedRef.current = dataString
      
      if (onSave) {
        void onSave(data)
      }
      
      logger.debug('useAutoSave', 'Manually saved draft', { storageKey })
    } catch (error) {
      logger.error('useAutoSave', 'Error saving draft', error as Error, { storageKey })
    }
  }, [data, storageKey, enabled, onSave])

  // Limpiar borrador
  const clear = useCallback(() => {
    try {
      localStorage.removeItem(storageKey)
      lastSavedRef.current = ''
      logger.debug('useAutoSave', 'Cleared draft', { storageKey })
    } catch (error) {
      logger.error('useAutoSave', 'Error clearing draft', error as Error, { storageKey })
    }
  }, [storageKey])

  // Verificar si hay borrador
  const hasDraft = useCallback(() => {
    try {
      const saved = localStorage.getItem(storageKey)
      return saved !== null && saved !== '{}'
    } catch {
      return false
    }
  }, [storageKey])

  return {
    save,
    clear,
    hasDraft,
  }
}

