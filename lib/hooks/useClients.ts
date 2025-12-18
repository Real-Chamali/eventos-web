/**
 * Hook para gestionar clientes con caché automático
 */

import useSWR from 'swr'
import { createClient } from '@/utils/supabase/client'
import { logger } from '@/lib/utils/logger'
import type { Client } from '@/types'

interface ClientWithQuotesCount extends Client {
  _quotes_count?: number
}

const fetcher = async (): Promise<ClientWithQuotesCount[]> => {
  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    throw new Error('Unauthorized')
  }
  
  const { data, error } = await supabase
    .from('clients')
    .select(`
      *,
      _quotes_count:quotes(count)
    `)
    .order('created_at', { ascending: false })
  
  if (error) {
    logger.error('useClients', 'Error fetching clients', error as Error)
    throw error
  }
  
  // Transformar datos para incluir conteo de cotizaciones
  return (data || []).map((client: {
    _quotes_count?: Array<{ count?: number }> | number | null
    [key: string]: unknown
  }) => {
    let quotesCount = 0
    const quotesCountValue = client._quotes_count
      if (Array.isArray(quotesCountValue)) {
        if (quotesCountValue.length > 0 && 'count' in quotesCountValue[0]) {
          quotesCount = quotesCountValue[0].count ?? 0
      } else {
        quotesCount = quotesCountValue.length
      }
    } else if (typeof quotesCountValue === 'number') {
      quotesCount = quotesCountValue
    }
    return {
      ...client,
      _quotes_count: quotesCount,
    } as ClientWithQuotesCount
  })
}

export function useClients() {
  const { data, error, isLoading, mutate } = useSWR<ClientWithQuotesCount[]>(
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

