/**
 * Hook para obtener estadísticas del dashboard
 * Optimiza consultas combinando múltiples métricas en una sola query
 */

import useSWR from 'swr'
import { createClient } from '@/utils/supabase/client'
import { logger } from '@/lib/utils/logger'
import type { DashboardStats } from '@/types'

const fetcher = async (): Promise<DashboardStats> => {
  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    throw new Error('Unauthorized')
  }
  
  // Una sola consulta optimizada que obtiene todo lo necesario
  const { data: quotes, error: quotesError } = await supabase
    .from('quotes')
    .select('total_amount, status, created_at')
    .eq('vendor_id', user.id)
  
  if (quotesError) {
    logger.error('useDashboardStats', 'Error fetching quotes', quotesError as Error)
    throw quotesError
  }
  
  // Obtener clientes (solo count, no todos los datos)
  const { count: clientsCount, error: clientsError } = await supabase
    .from('clients')
    .select('*', { count: 'exact', head: true })
  
  if (clientsError) {
    logger.warn('useDashboardStats', 'Error fetching clients count', {
      error: clientsError.message,
    })
  }
  
  const quotesData = quotes || []
  const sales = quotesData.filter((q) => q.status === 'APPROVED' || q.status === 'confirmed')
  const totalSales = sales.reduce((acc, s) => acc + (Number(s.total_amount) || 0), 0)
  const commissionRate = 0.1
  const totalCommissions = totalSales * commissionRate
  
  const pendingQuotes = quotesData.filter((q) => q.status === 'DRAFT' || q.status === 'draft').length
  const confirmedQuotes = sales.length
  
  // Calcular ventas del mes actual
  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()
  const monthlySales = sales
    .filter((sale) => {
      const saleDate = new Date(sale.created_at)
      return saleDate.getMonth() === currentMonth && saleDate.getFullYear() === currentYear
    })
    .reduce((acc, sale) => acc + (Number(sale.total_amount) || 0), 0)
  
  // Calcular tasa de conversión
  const conversionRate =
    quotesData.length > 0 ? (confirmedQuotes / quotesData.length) * 100 : 0
  
  // Calcular promedio de venta
  const averageSale = confirmedQuotes > 0 ? totalSales / confirmedQuotes : 0
  
  return {
    totalSales,
    totalCommissions,
    pendingQuotes,
    confirmedQuotes,
    conversionRate: Number(conversionRate.toFixed(1)),
    averageSale,
    monthlySales,
    totalClients: clientsCount || 0,
  }
}

export function useDashboardStats() {
  const { data, error, isLoading } = useSWR<DashboardStats>(
    'dashboard:stats',
    fetcher,
    {
      revalidateOnFocus: false,
      refreshInterval: 30000, // Actualizar cada 30 segundos
      dedupingInterval: 5000,
      onError: (err) => {
        logger.error('useDashboardStats', 'SWR error', err as Error)
      },
    }
  )
  
  return {
    stats: data,
    loading: isLoading,
    error: error as Error | null,
  }
}

