/**
 * Hook para gestionar clientes con caché automático
 */

import useSWR from 'swr'
import { createClient } from '@/utils/supabase/client'
import { logger } from '@/lib/utils/logger'
import type { Client } from '@/types'

const fetcher = async (): Promise<Client[]> => {
  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    throw new Error('Unauthorized')
  }
  
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (error) {
    logger.error('useClients', 'Error fetching clients', error as Error)
    throw error
  }
  
  return (data || []) as Client[]
}

export function useClients() {
  const { data, error, isLoading, mutate } = useSWR<Client[]>(
    'clients',
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 5000,
      onError: (err) => {
        logger.error('useClients', 'SWR error', err as Error)
      },
    }
  )
  
  return {
    clients: data || [],
    loading: isLoading,
    error: error as Error | null,
    refresh: mutate,
  }
}

