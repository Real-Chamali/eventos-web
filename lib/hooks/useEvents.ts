/**
 * Hook para gestionar eventos con caché automático
 */

import useSWR from 'swr'
import { createClient } from '@/utils/supabase/client'
import { logger } from '@/lib/utils/logger'
import type { Event } from '@/types'

const fetcher = async (): Promise<Event[]> => {
  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    throw new Error('Unauthorized')
  }
  
  const { data, error } = await supabase
    .from('events')
    .select(`
      *,
      quote:quotes(
        id,
        total_amount,
        status,
        clients(
          name,
          email
        )
      )
    `)
    .order('start_date', { ascending: false })
  
  if (error) {
    logger.error('useEvents', 'Error fetching events', error as Error)
    throw error
  }
  
  return (data || []) as Event[]
}

export function useEvents() {
  const { data, error, isLoading, mutate } = useSWR<Event[]>(
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

