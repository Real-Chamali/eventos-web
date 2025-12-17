/**
 * Hook para obtener cotizaciones recientes (últimas 5)
 * Optimizado para el dashboard
 */

import useSWR from 'swr'
import { createClient } from '@/utils/supabase/client'
import { logger } from '@/lib/utils/logger'
import type { Quote } from '@/types'

const fetcher = async (): Promise<Quote[]> => {
  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    throw new Error('Unauthorized')
  }
  
  const { data, error } = await supabase
    .from('quotes')
    .select(`
      id,
      total_price,
      status,
      created_at,
      client:clients(name)
    `)
    .eq('vendor_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5)
  
  if (error) {
    logger.error('useRecentQuotes', 'Error fetching recent quotes', error as Error)
    throw error
  }
  
  // Transformar datos para incluir client_name
  return (data || []).map((quote: any) => ({
    ...quote,
    client_name: quote.client?.name || 'Cliente sin nombre',
  })) as Quote[]
}

export function useRecentQuotes() {
  const { data, error, isLoading, mutate } = useSWR<Quote[]>(
    'recent-quotes',
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 5000,
      refreshInterval: 30000, // Actualizar cada 30 segundos
      onError: (err) => {
        logger.error('useRecentQuotes', 'SWR error', err as Error)
      },
    }
  )
  
  return {
    quotes: data || [],
    loading: isLoading,
    error: error as Error | null,
    refresh: mutate,
  }
}

