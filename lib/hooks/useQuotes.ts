/**
 * Hook para gestionar cotizaciones con caché automático
 * Usa SWR para caché inteligente y revalidación automática
 */

import useSWR from 'swr'
import { createClient } from '@/utils/supabase/client'
import { logger } from '@/lib/utils/logger'
import type { Quote } from '@/types'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const fetcher = async (_key: string): Promise<Quote[]> => {
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
      updated_at,
      clients (
        name
      )
    `)
    .eq('vendor_id', user.id)
    .order('created_at', { ascending: false })
  
  if (error) {
    logger.error('useQuotes', 'Error fetching quotes', error as Error)
    throw error
  }
  
  // Tipo para respuesta de Supabase (clients puede ser array o objeto)
  type SupabaseQuoteResponse = {
    id: string
    total_price: number
    status: string
    created_at: string
    updated_at?: string | null
    clients?: Array<{ name?: string }> | { name?: string } | null
  }

  // Transformar datos para incluir client_name
  return (data || []).map((quote: SupabaseQuoteResponse) => {
    // Extraer cliente (puede ser array o objeto)
    const client = quote.clients ? (Array.isArray(quote.clients) ? quote.clients[0] : quote.clients) : null
    return {
      ...quote,
      client_name: client?.name || 'Cliente sin nombre',
    }
  }) as Quote[]
}

export function useQuotes() {
  const { data, error, isLoading, mutate } = useSWR<Quote[]>(
    'quotes',
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 5000, // 5 segundos de caché
      onError: (err) => {
        logger.error('useQuotes', 'SWR error', err as Error)
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

