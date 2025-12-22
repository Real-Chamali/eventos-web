/**
 * Hook para gestionar eventos en el panel de administración
 * Similar a useEvents pero sin filtro de vendor_id
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
  
  // Verificar que el usuario sea admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  
  if (profile?.role !== 'admin') {
    throw new Error('Forbidden: Admin access required')
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
    logger.error('useAdminEvents', 'Error fetching events', error as Error)
    throw error
  }
  
  return (data || []) as Event[]
}

export function useAdminEvents() {
  const { data, error, isLoading, mutate } = useSWR<Event[]>(
    'admin:events',
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 5000,
      refreshInterval: 60000, // Actualizar cada minuto
      onError: (err) => {
        logger.error('useAdminEvents', 'SWR error', err as Error)
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

