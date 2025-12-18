/**
 * Utilidades para validar eventos duplicados antes de crear/actualizar
 */

import { createClient } from '@/utils/supabase/client'
import { logger } from '@/lib/utils/logger'

export interface EventDateRange {
  quote_id: string
  start_date: string
  end_date?: string | null
  event_id?: string // Para excluir el evento actual en updates
}

/**
 * Verifica si existe un evento duplicado o con fechas solapadas
 * @param range - Rango de fechas del evento a validar
 * @returns true si hay duplicado/solapamiento, false si está libre
 */
export async function checkDuplicateEvent(range: EventDateRange): Promise<{
  isDuplicate: boolean
  message?: string
}> {
  try {
    const supabase = createClient()
    
    const startDate = new Date(range.start_date)
    const endDate = range.end_date ? new Date(range.end_date) : startDate
    
    // Verificar eventos existentes que se solapen
    const { data: existingEvents, error } = await supabase
      .from('events')
      .select('id, start_date, end_date')
      .eq('quote_id', range.quote_id)
      .not('id', 'eq', range.event_id || '00000000-0000-0000-0000-000000000000')
    
    if (error) {
      logger.error('eventValidation', 'Error checking duplicate events', error as Error)
      throw error
    }
    
    if (!existingEvents || existingEvents.length === 0) {
      return { isDuplicate: false }
    }
    
    // Verificar solapamientos
    for (const event of existingEvents) {
      const eventStart = new Date(event.start_date)
      const eventEnd = event.end_date ? new Date(event.end_date) : eventStart
      
      // Verificar si hay solapamiento
      const overlaps = 
        // El nuevo evento empieza dentro de un evento existente
        (startDate >= eventStart && startDate <= eventEnd) ||
        // El nuevo evento termina dentro de un evento existente
        (endDate >= eventStart && endDate <= eventEnd) ||
        // El nuevo evento contiene completamente un evento existente
        (startDate <= eventStart && endDate >= eventEnd)
      
      if (overlaps) {
        return {
          isDuplicate: true,
          message: `Ya existe un evento para esta cotización en estas fechas. El evento existente va del ${eventStart.toLocaleDateString()} al ${eventEnd.toLocaleDateString()}.`,
        }
      }
      
      // Verificar si es exactamente la misma fecha de inicio
      if (startDate.getTime() === eventStart.getTime()) {
        return {
          isDuplicate: true,
          message: `Ya existe un evento para esta cotización que comienza en la misma fecha (${startDate.toLocaleDateString()}).`,
        }
      }
    }
    
    return { isDuplicate: false }
  } catch (error) {
    logger.error('eventValidation', 'Error in checkDuplicateEvent', error as Error)
    throw error
  }
}

/**
 * Crea un evento validando que no haya duplicados
 * @param eventData - Datos del evento a crear
 * @returns El evento creado
 */
export async function createEventWithValidation(eventData: {
  quote_id: string
  start_date: string
  end_date?: string | null
  status?: string
}): Promise<{ id: string; quote_id: string; start_date: string; end_date: string | null; status: string; created_at: string }> {
  const supabase = createClient()
  
  // Validar duplicados antes de insertar
  const validation = await checkDuplicateEvent({
    quote_id: eventData.quote_id,
    start_date: eventData.start_date,
    end_date: eventData.end_date,
  })
  
  if (validation.isDuplicate) {
    throw new Error(validation.message || 'Ya existe un evento para esta cotización en estas fechas')
  }
  
  // Crear el evento
  const { data, error } = await supabase
    .from('events')
    .insert({
      quote_id: eventData.quote_id,
      start_date: eventData.start_date,
      end_date: eventData.end_date || null,
      status: eventData.status || 'pending',
    })
    .select()
    .single()
  
  if (error) {
    // Si el error es de constraint único, es un duplicado
    if (error.code === '23505') {
      throw new Error('Ya existe un evento para esta cotización en estas fechas')
    }
    throw error
  }
  
  return data
}

