/**
 * Hook específico para admin que obtiene TODAS las cotizaciones
 * Usa una query directa sin restricciones de RLS para admins
 */

import useSWR from 'swr'
import { createClient } from '@/utils/supabase/client'
import { logger } from '@/lib/utils/logger'
import { mapQuoteStatusFromDB } from '@/lib/utils/statusMapper'
import type { Quote } from '@/types'

const fetcher = async (): Promise<Quote[]> => {
  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    throw new Error('Unauthorized')
  }
  
  // Verificar que el usuario sea admin
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()
  
  if (profileError) {
    logger.error('useAdminQuotes', 'Error fetching profile', profileError as Error)
    throw profileError
  }
  
  if (profile?.role !== 'admin') {
    throw new Error('Forbidden: Admin access required')
  }
  
  // Query sin filtro de vendor_id - admins ven todas las cotizaciones
  // RLS debería permitir esto, pero si no funciona, podemos usar service role
  const { data, error } = await supabase
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
  
  if (error) {
    logger.error('useAdminQuotes', 'Error fetching quotes', error as Error, {
      errorCode: error.code,
      errorMessage: error.message,
      errorDetails: error.details,
    })
    throw error
  }
  
  // Tipo para respuesta de Supabase
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
    // Mapear status de BD a frontend
    const frontendStatus = mapQuoteStatusFromDB(quote.status)
    return {
      id: quote.id,
      total_amount: quote.total_amount,
      total_price: quote.total_amount, // Alias para compatibilidad
      status: frontendStatus,
      created_at: quote.created_at,
      updated_at: quote.updated_at,
      vendor_id: quote.vendor_id,
      client_id: quote.client_id,
      client_name: client?.name || 'Cliente sin nombre',
    } as Quote
  })
}

export function useAdminQuotes() {
  const { data, error, isLoading, mutate } = useSWR<Quote[]>(
    'admin-quotes',
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 5000, // 5 segundos de caché
      onError: (err) => {
        logger.error('useAdminQuotes', 'SWR error', err as Error)
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

