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
      total_amount,
      status,
      created_at,
      clients(name)
    `)
    .eq('vendor_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5)
  
  if (error) {
    logger.error('useRecentQuotes', 'Error fetching recent quotes', error as Error)
    throw error
  }
  
  // Tipo para respuesta de Supabase (client puede ser array o objeto)
  type SupabaseQuoteResponse = {
    id: string
    total_amount: number
    status: string
    created_at: string
    clients?: Array<{ name?: string }> | { name?: string } | null
  }

  // Transformar datos para incluir client_name
  return (data || []).map((quote: SupabaseQuoteResponse) => {
    // Extraer cliente (puede ser array o objeto)
    const client = quote.clients ? (Array.isArray(quote.clients) ? quote.clients[0] : quote.clients) : null
    return {
      id: quote.id,
      client_id: '',
      vendor_id: '',
      total_price: quote.total_amount || 0,
      total_amount: quote.total_amount || 0,
      status: quote.status,
      created_at: quote.created_at,
      client_name: client?.name || 'Cliente sin nombre',
    } as Quote
  })
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

