/**
 * Hook para gestionar servicios con caché automático
 */

import useSWR from 'swr'
import { createClient } from '@/utils/supabase/client'
import { logger } from '@/lib/utils/logger'
import type { Service } from '@/types'

const fetcher = async (): Promise<Service[]> => {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .order('name')
  
  if (error) {
    logger.error('useServices', 'Error fetching services', error as Error)
    throw error
  }
  
  return (data || []) as Service[]
}

export function useServices() {
  const { data, error, isLoading, mutate } = useSWR<Service[]>(
    'services',
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 10000, // 10 segundos (servicios cambian poco)
      onError: (err) => {
        logger.error('useServices', 'SWR error', err as Error)
      },
    }
  )
  
  return {
    services: data || [],
    loading: isLoading,
    error: error as Error | null,
    refresh: mutate,
  }
}

