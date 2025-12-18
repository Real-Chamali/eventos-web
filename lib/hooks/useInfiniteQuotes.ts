/**
 * Hook para paginación infinita de cotizaciones
 * Usa SWR Infinite para carga progresiva
 */

import useSWRInfinite from 'swr/infinite'
import { createClient } from '@/utils/supabase/client'
import { logger } from '@/lib/utils/logger'
import type { Quote } from '@/types'

const PAGE_SIZE = 20

const getKey = (pageIndex: number, previousPageData: Quote[] | null) => {
  // Si ya no hay más datos, no hacer fetch
  if (previousPageData && previousPageData.length < PAGE_SIZE) return null
  return `quotes:page:${pageIndex}`
}

const fetcher = async (key: string): Promise<Quote[]> => {
  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    throw new Error('Unauthorized')
  }
  
  const pageIndex = parseInt(key.split(':')[2])
  const from = pageIndex * PAGE_SIZE
  const to = from + PAGE_SIZE - 1
  
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
    .range(from, to)
  
  if (error) {
    logger.error('useInfiniteQuotes', 'Error fetching quotes', error as Error)
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

export function useInfiniteQuotes() {
  const { data, error, size, setSize, isValidating, isLoading } = useSWRInfinite<Quote[]>(
    getKey,
    fetcher,
    {
      revalidateFirstPage: false,
      revalidateAll: false,
      onError: (err) => {
        logger.error('useInfiniteQuotes', 'SWR Infinite error', err as Error)
      },
    }
  )
  
  const quotes = data ? data.flat() : []
  const isLoadingMore = isValidating && data && typeof data[size - 1] !== 'undefined'
  const isEmpty = data?.[0]?.length === 0
  const isReachingEnd = isEmpty || (data && data[data.length - 1]?.length < PAGE_SIZE)
  
  return {
    quotes,
    error: error as Error | null,
    isLoading,
    isLoadingMore,
    isReachingEnd,
    loadMore: () => setSize(size + 1),
    refresh: () => setSize(1),
  }
}

