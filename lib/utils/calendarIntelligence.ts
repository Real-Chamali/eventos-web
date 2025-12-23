/**
 * Utilidades para calendario inteligente
 * Bloqueo automático, prevención de conflictos, estados visuales
 */

import { createClient } from '@/utils/supabase/client'
import { logger } from './logger'

export interface DateConflict {
  eventId: string
  quoteId: string
  startDate: string
  endDate: string
  status: string
  clientName: string
}

export type AvailabilityStatus = 'AVAILABLE' | 'RESERVED' | 'CONFIRMED' | 'CANCELLED'

/**
 * Verifica conflictos de fechas
 */
export async function checkDateConflicts(
  startDate: string,
  endDate: string,
  excludeEventId?: string
): Promise<DateConflict[]> {
  try {
    const supabase = createClient()
    
    const { data, error } = await supabase.rpc('check_date_conflicts', {
      p_start_date: startDate,
      p_end_date: endDate,
      p_exclude_event_id: excludeEventId || null,
    })
    
    if (error) {
      logger.error('calendarIntelligence', 'Error checking conflicts', error as Error, {
        startDate,
        endDate,
        excludeEventId,
      })
      throw error
    }
    
    return (data || []) as DateConflict[]
  } catch (error) {
    logger.error('calendarIntelligence', 'Failed to check date conflicts', error as Error)
    return []
  }
}

/**
 * Obtiene disponibilidad de un rango de fechas
 */
export async function getDateAvailability(
  startDate: string,
  endDate: string
): Promise<AvailabilityStatus> {
  try {
    const supabase = createClient()
    
    const { data, error } = await supabase.rpc('get_date_availability', {
      p_start_date: startDate,
      p_end_date: endDate,
    })
    
    if (error) {
      logger.error('calendarIntelligence', 'Error getting availability', error as Error, {
        startDate,
        endDate,
      })
      return 'RESERVED' // Por seguridad, asumir reservado si hay error
    }
    
    return (data || 'RESERVED') as AvailabilityStatus
  } catch (error) {
    logger.error('calendarIntelligence', 'Failed to get date availability', error as Error)
    return 'RESERVED'
  }
}

/**
 * Valida si se puede crear un evento en un rango de fechas
 */
export async function canCreateEvent(
  startDate: string,
  endDate: string,
  excludeEventId?: string
): Promise<{ canCreate: boolean; conflicts: DateConflict[]; message?: string }> {
  const conflicts = await checkDateConflicts(startDate, endDate, excludeEventId)
  
  if (conflicts.length === 0) {
    return { canCreate: true, conflicts: [] }
  }
  
  const confirmedConflicts = conflicts.filter(c => c.status === 'CONFIRMED')
  if (confirmedConflicts.length > 0) {
    return {
      canCreate: false,
      conflicts,
      message: `No se puede crear el evento: hay ${confirmedConflicts.length} evento(s) confirmado(s) en este rango de fechas.`,
    }
  }
  
  return {
    canCreate: true,
    conflicts,
    message: `Advertencia: hay ${conflicts.length} evento(s) en este rango, pero no están confirmados.`,
  }
}

/**
 * Obtiene color para estado de disponibilidad
 */
export function getAvailabilityColor(status: AvailabilityStatus): string {
  switch (status) {
    case 'AVAILABLE':
      return 'bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-300'
    case 'RESERVED':
      return 'bg-yellow-100 dark:bg-yellow-950/30 text-yellow-700 dark:text-yellow-300'
    case 'CONFIRMED':
      return 'bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300'
    case 'CANCELLED':
      return 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
    default:
      return 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
  }
}

/**
 * Obtiene label para estado de disponibilidad
 */
export function getAvailabilityLabel(status: AvailabilityStatus): string {
  switch (status) {
    case 'AVAILABLE':
      return 'Disponible'
    case 'RESERVED':
      return 'Apartada'
    case 'CONFIRMED':
      return 'Confirmada'
    case 'CANCELLED':
      return 'Cancelada'
    default:
      return 'Desconocido'
  }
}

