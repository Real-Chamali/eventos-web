/**
 * Hook para gestionar pagos parciales de una cotización
 * Usa SWR para caché automático y revalidación
 */

import useSWR from 'swr'
import { createClient } from '@/utils/supabase/client'
import { logger } from '@/lib/utils/logger'

export interface PartialPayment {
  id: string
  quote_id: string
  amount: number
  payment_date: string
  payment_method: 'cash' | 'transfer' | 'card' | 'check' | 'other'
  reference_number?: string | null
  notes?: string | null
  created_by: string
  created_at: string
  updated_at?: string | null
}

export interface PaymentSummary {
  total_paid: number
  balance_due: number
  total_price: number
  payments_count: number
}

const fetcher = async (key: string): Promise<PartialPayment[]> => {
  const supabase = createClient()
  const quoteId = key.replace('partial-payments:', '')
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    throw new Error('Unauthorized')
  }
  
  const { data, error } = await supabase
    .from('partial_payments')
    .select('*')
    .eq('quote_id', quoteId)
    .order('payment_date', { ascending: false })
  
  if (error) {
    logger.error('usePartialPayments', 'Error fetching partial payments', error as Error)
    throw error
  }
  
  return (data || []) as PartialPayment[]
}

export function usePartialPayments(quoteId: string | null) {
  const { data, error, isLoading, mutate } = useSWR<PartialPayment[]>(
    quoteId ? `partial-payments:${quoteId}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 5000,
      onError: (err) => {
        logger.error('usePartialPayments', 'SWR error', err as Error)
      },
    }
  )
  
  return {
    payments: data || [],
    loading: isLoading,
    error: error as Error | null,
    refresh: mutate,
  }
}

/**
 * Hook para obtener resumen de pagos de una cotización
 */
export function usePaymentSummary(quoteId: string | null, totalPrice: number) {
  const { payments, loading, error } = usePartialPayments(quoteId)
  
  const summary: PaymentSummary = {
    total_paid: payments.reduce((sum, payment) => sum + payment.amount, 0),
    balance_due: Math.max(totalPrice - payments.reduce((sum, payment) => sum + payment.amount, 0), 0),
    total_price: totalPrice,
    payments_count: payments.length,
  }
  
  return {
    summary,
    loading,
    error,
  }
}

