/**
 * Hook para obtener métricas avanzadas del dashboard
 * Incluye tasa de conversión, promedio de ventas, tendencias, etc.
 */

import useSWR from 'swr'
import { createClient } from '@/utils/supabase/client'
import { logger } from '@/lib/utils/logger'

export interface AdvancedMetrics {
  conversionRate: number
  averageSaleAmount: number
  averageQuoteAmount: number
  salesGrowth: number // Porcentaje de crecimiento vs mes anterior
  quotesGrowth: number
  topClient: {
    id: string
    name: string
    totalSales: number
  } | null
  bestMonth: {
    month: string
    sales: number
  } | null
  pendingQuotesValue: number
  averageDaysToClose: number
}

const fetcher = async (): Promise<AdvancedMetrics> => {
  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    throw new Error('Unauthorized')
  }
  
  // Obtener cotizaciones de los últimos 12 meses
  const twelveMonthsAgo = new Date()
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12)
  
  const { data: quotes, error: quotesError } = await supabase
    .from('quotes')
    .select('id, total_amount, status, created_at, client_id, updated_at')
    .eq('vendor_id', user.id)
    .gte('created_at', twelveMonthsAgo.toISOString())
    .order('created_at', { ascending: true })
  
  if (quotesError) {
    logger.error('useAdvancedMetrics', 'Error fetching quotes', quotesError as Error)
    throw quotesError
  }
  
  const quotesData = quotes || []
  const approvedQuotes = quotesData.filter((q) => q.status === 'APPROVED' || q.status === 'confirmed')
  const draftQuotes = quotesData.filter((q) => q.status === 'DRAFT' || q.status === 'draft')
  
  // Calcular tasa de conversión
  const conversionRate = quotesData.length > 0
    ? (approvedQuotes.length / quotesData.length) * 100
    : 0
  
  // Calcular promedio de ventas
  const totalSales = approvedQuotes.reduce((acc, q) => acc + (Number(q.total_amount) || 0), 0)
  const averageSaleAmount = approvedQuotes.length > 0
    ? totalSales / approvedQuotes.length
    : 0
  
  // Calcular promedio de cotizaciones
  const totalQuotes = quotesData.reduce((acc, q) => acc + (Number(q.total_amount) || 0), 0)
  const averageQuoteAmount = quotesData.length > 0
    ? totalQuotes / quotesData.length
    : 0
  
  // Calcular crecimiento de ventas (mes actual vs mes anterior)
  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()
  const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1
  const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear
  
  const currentMonthSales = approvedQuotes
    .filter((q) => {
      const date = new Date(q.created_at)
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear
    })
    .reduce((acc, q) => acc + (Number(q.total_amount) || 0), 0)
  
  const lastMonthSales = approvedQuotes
    .filter((q) => {
      const date = new Date(q.created_at)
      return date.getMonth() === lastMonth && date.getFullYear() === lastMonthYear
    })
    .reduce((acc, q) => acc + (Number(q.total_amount) || 0), 0)
  
  const salesGrowth = lastMonthSales > 0
    ? ((currentMonthSales - lastMonthSales) / lastMonthSales) * 100
    : currentMonthSales > 0 ? 100 : 0
  
  // Calcular crecimiento de cotizaciones
  const currentMonthQuotes = quotesData.filter((q) => {
    const date = new Date(q.created_at)
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear
  }).length
  
  const lastMonthQuotes = quotesData.filter((q) => {
    const date = new Date(q.created_at)
    return date.getMonth() === lastMonth && date.getFullYear() === lastMonthYear
  }).length
  
  const quotesGrowth = lastMonthQuotes > 0
    ? ((currentMonthQuotes - lastMonthQuotes) / lastMonthQuotes) * 100
    : currentMonthQuotes > 0 ? 100 : 0
  
  // Obtener cliente con más ventas
  const clientSales = new Map<string, { id: string; name: string; total: number }>()
  
  approvedQuotes.forEach((quote) => {
    if (quote.client_id) {
      const existing = clientSales.get(quote.client_id) || { id: quote.client_id, name: 'Cliente', total: 0 }
      existing.total += Number(quote.total_amount) || 0
      clientSales.set(quote.client_id, existing)
    }
  })
  
  // Obtener nombres de clientes
  const clientIds = Array.from(clientSales.keys())
  if (clientIds.length > 0) {
    const { data: clients } = await supabase
      .from('clients')
      .select('id, name')
      .in('id', clientIds)
    
    clients?.forEach((client) => {
      const sales = clientSales.get(client.id)
      if (sales) {
        sales.name = client.name || 'Cliente'
      }
    })
  }
  
  const topClient = Array.from(clientSales.values())
    .sort((a, b) => b.total - a.total)[0] || null
  
  // Calcular mejor mes
  const monthlySales = new Map<string, number>()
  approvedQuotes.forEach((quote) => {
    const date = new Date(quote.created_at)
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    const existing = monthlySales.get(key) || 0
    monthlySales.set(key, existing + (Number(quote.total_amount) || 0))
  })
  
  const bestMonthEntry = Array.from(monthlySales.entries())
    .sort((a, b) => b[1] - a[1])[0]
  
  const bestMonth = bestMonthEntry
    ? {
        month: new Date(bestMonthEntry[0] + '-01').toLocaleDateString('es-MX', { month: 'long', year: 'numeric' }),
        sales: bestMonthEntry[1],
      }
    : null
  
  // Calcular valor de cotizaciones pendientes
  const pendingQuotesValue = draftQuotes.reduce(
    (acc, q) => acc + (Number(q.total_amount) || 0),
    0
  )
  
  // Calcular promedio de días para cerrar venta
  const closedQuotes = approvedQuotes.filter((q) => q.created_at && q.updated_at)
  const averageDaysToClose = closedQuotes.length > 0
    ? closedQuotes.reduce((acc, q) => {
        const created = new Date(q.created_at)
        const updated = new Date(q.updated_at)
        const days = Math.floor((updated.getTime() - created.getTime()) / (1000 * 60 * 60 * 24))
        return acc + days
      }, 0) / closedQuotes.length
    : 0
  
  return {
    conversionRate: Number(conversionRate.toFixed(1)),
    averageSaleAmount: Number(averageSaleAmount.toFixed(2)),
    averageQuoteAmount: Number(averageQuoteAmount.toFixed(2)),
    salesGrowth: Number(salesGrowth.toFixed(1)),
    quotesGrowth: Number(quotesGrowth.toFixed(1)),
    topClient,
    bestMonth,
    pendingQuotesValue: Number(pendingQuotesValue.toFixed(2)),
    averageDaysToClose: Number(averageDaysToClose.toFixed(1)),
  }
}

export function useAdvancedMetrics() {
  const { data, error, isLoading } = useSWR<AdvancedMetrics>(
    'dashboard:advanced-metrics',
    fetcher,
    {
      revalidateOnFocus: false,
      refreshInterval: 60000, // Actualizar cada minuto
      dedupingInterval: 10000,
      onError: (err) => {
        logger.error('useAdvancedMetrics', 'SWR error', err as Error)
      },
    }
  )
  
  return {
    metrics: data,
    loading: isLoading,
    error: error as Error | null,
  }
}


