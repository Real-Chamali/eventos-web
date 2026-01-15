/**
 * Hook para gestionar eventos con caché automático
 */

import useSWR from 'swr'
import { createClient } from '@/utils/supabase/client'
import { logger } from '@/lib/utils/logger'
import { mapEventStatusFromDB } from '@/lib/utils/statusMapper'
import type { Event } from '@/types'

type RawClient = { name: string | null; email: string | null }
type RawQuote = {
  id: string
  total_amount: number | null
  status: string
  vendor_id?: string | null
  client?: RawClient | RawClient[] | null
}
type EventWithQuote = Omit<Event, 'quote'> & { quote?: RawQuote | null }
type RawEvent = Omit<Event, 'quote'> & { quote?: RawQuote | RawQuote[] | null }

const fetcher = async (): Promise<EventWithQuote[]> => {
  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    throw new Error('Unauthorized')
  }
  
  // Verificar si el usuario es admin para determinar qué eventos mostrar
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()
  
  const isAdmin = profile?.role === 'admin'
  
  // Query base - RLS manejará el filtrado automáticamente
  // Admins ven todos los eventos, vendors solo los suyos
  const { data, error } = await supabase
    .from('events')
    .select(`
      id,
      quote_id,
      status,
      start_date,
      end_date,
      start_time,
      end_time,
      location,
      guest_count,
      event_type,
      emergency_contact,
      emergency_phone,
      special_requirements,
      additional_notes,
      created_at,
      quote:quotes(
        id,
        total_amount,
        status,
        vendor_id,
        client:clients(
          name,
          email
        )
      )
    `)
    .order('start_date', { ascending: false })
  
  if (error) {
    logger.error('useEvents', 'Error fetching events', error as Error, {
      errorCode: error.code,
      errorMessage: error.message,
      errorDetails: error.details,
      isAdmin,
    })
    throw error
  }
  
  // Procesar datos para normalizar estructura
  return ((data || []) as RawEvent[]).map((event) => {
    // Normalizar quote (puede venir como array o objeto)
    const quote = Array.isArray(event.quote) ? event.quote[0] : event.quote
    
    // Normalizar client dentro de quote
    if (quote && quote.client) {
      quote.client = Array.isArray(quote.client) ? quote.client[0] : quote.client
    }
    
    // Mapear status de BD a frontend
    const frontendStatus = mapEventStatusFromDB(event.status || 'CONFIRMED')
    
    return {
      ...event,
      status: frontendStatus,
      quote: quote || null,
    } as EventWithQuote
  })
}

export function useEvents() {
  const { data, error, isLoading, mutate } = useSWR<EventWithQuote[]>(
    'events',
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 5000,
      refreshInterval: 60000, // Actualizar cada minuto (eventos pueden cambiar)
      onError: (err) => {
        logger.error('useEvents', 'SWR error', err as Error)
      },
    }
  )
  
  return {
    events: data || [],
    loading: isLoading,
    error: error as Error | null,
    refresh: mutate,
  }
}

