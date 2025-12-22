/**
 * Hook para obtener tendencias de ingresos
 * Incluye comparación año anterior, proyecciones, etc.
 */

import useSWR from 'swr'
import { createClient } from '@/utils/supabase/client'
import { logger } from '@/lib/utils/logger'

export interface RevenueTrend {
  month: string
  currentYear: number
  previousYear: number
  growth: number
  monthNumber: number
}

export interface RevenueTrendsData {
  trends: RevenueTrend[]
  totalCurrentYear: number
  totalPreviousYear: number
  overallGrowth: number
  averageMonthlyGrowth: number
}

const fetcher = async (): Promise<RevenueTrendsData> => {
  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    throw new Error('Unauthorized')
  }
  
  const currentYear = new Date().getFullYear()
  const previousYear = currentYear - 1
  
  // Obtener cotizaciones aprobadas de los últimos 2 años
  const twoYearsAgo = new Date()
  twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2)
  
  const { data: quotes, error: quotesError } = await supabase
    .from('quotes')
    .select('total_amount, status, created_at')
    .eq('vendor_id', user.id)
    .in('status', ['APPROVED', 'confirmed'])
    .gte('created_at', twoYearsAgo.toISOString())
    .order('created_at', { ascending: true })
  
  if (quotesError) {
    logger.error('useRevenueTrends', 'Error fetching quotes', quotesError as Error)
    throw quotesError
  }
  
  // Agrupar por año y mes
  const currentYearMap = new Map<number, number>()
  const previousYearMap = new Map<number, number>()
  
  // Inicializar todos los meses con 0
  for (let month = 0; month < 12; month++) {
    currentYearMap.set(month, 0)
    previousYearMap.set(month, 0)
  }
  
  // Sumar ventas por mes y año
  quotes?.forEach((quote) => {
    const date = new Date(quote.created_at)
    const year = date.getFullYear()
    const month = date.getMonth()
    const amount = Number(quote.total_amount) || 0
    
    if (year === currentYear) {
      const current = currentYearMap.get(month) || 0
      currentYearMap.set(month, current + amount)
    } else if (year === previousYear) {
      const previous = previousYearMap.get(month) || 0
      previousYearMap.set(month, previous + amount)
    }
  })
  
  // Calcular tendencias
  const trends: RevenueTrend[] = []
  let totalCurrentYear = 0
  let totalPreviousYear = 0
  
  for (let month = 0; month < 12; month++) {
    const current = currentYearMap.get(month) || 0
    const previous = previousYearMap.get(month) || 0
    const growth = previous > 0 ? ((current - previous) / previous) * 100 : (current > 0 ? 100 : 0)
    
    totalCurrentYear += current
    totalPreviousYear += previous
    
    const date = new Date(currentYear, month, 1)
    const monthName = date.toLocaleDateString('es-MX', { month: 'short' })
    
    trends.push({
      month: monthName,
      currentYear: current,
      previousYear: previous,
      growth: Number(growth.toFixed(1)),
      monthNumber: month,
    })
  }
  
  const overallGrowth = totalPreviousYear > 0
    ? ((totalCurrentYear - totalPreviousYear) / totalPreviousYear) * 100
    : (totalCurrentYear > 0 ? 100 : 0)
  
  const averageMonthlyGrowth = trends.reduce((sum, t) => sum + t.growth, 0) / 12
  
  return {
    trends,
    totalCurrentYear: Number(totalCurrentYear.toFixed(2)),
    totalPreviousYear: Number(totalPreviousYear.toFixed(2)),
    overallGrowth: Number(overallGrowth.toFixed(1)),
    averageMonthlyGrowth: Number(averageMonthlyGrowth.toFixed(1)),
  }
}

export function useRevenueTrends() {
  const { data, error, isLoading } = useSWR<RevenueTrendsData>(
    'dashboard:revenue-trends',
    fetcher,
    {
      revalidateOnFocus: false,
      refreshInterval: 300000, // Actualizar cada 5 minutos (datos históricos no cambian tan rápido)
      dedupingInterval: 60000,
      onError: (err) => {
        logger.error('useRevenueTrends', 'SWR error', err as Error)
      },
    }
  )
  
  return {
    trends: data,
    loading: isLoading,
    error: error as Error | null,
  }
}

