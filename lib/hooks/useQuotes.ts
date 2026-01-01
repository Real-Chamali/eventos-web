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
  
  // Verificar si el usuario es admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()
  
  const isAdmin = profile?.role === 'admin'
  
  // Construir query - admins ven todas las cotizaciones, vendedores solo las suyas
  let query = supabase
    .from('quotes')
    .select(`
      id,
      total_amount,
      status,
      created_at,
      updated_at,
      vendor_id,
      client_id,
      client:clients (
        name
      )
    `)
    .order('created_at', { ascending: false })
  
  // Solo filtrar por vendor_id si NO es admin
  if (!isAdmin) {
    query = query.eq('vendor_id', user.id)
  }
  
  const { data, error } = await query
  
  if (error) {
    logger.error('useQuotes', 'Error fetching quotes', error as Error)
    throw error
  }
  
  // Tipo para respuesta de Supabase (client puede ser array o objeto)
  type SupabaseQuoteResponse = {
    id: string
    total_amount: number
    status: string
    created_at: string
    updated_at?: string | null
    vendor_id: string
    client_id: string
    client?: Array<{ name?: string }> | { name?: string } | null
  }

  // Transformar datos para incluir client_name y total_price (alias)
  return (data || []).map((quote: SupabaseQuoteResponse) => {
    // Extraer cliente (puede ser array o objeto)
    const client = quote.client ? (Array.isArray(quote.client) ? quote.client[0] : quote.client) : null
    return {
      id: quote.id,
      total_amount: quote.total_amount,
      total_price: quote.total_amount, // Alias para compatibilidad
      status: quote.status,
      created_at: quote.created_at,
      updated_at: quote.updated_at,
      vendor_id: quote.vendor_id,
      client_id: quote.client_id,
      client_name: client?.name || 'Cliente sin nombre',
    } as Quote
  })
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

