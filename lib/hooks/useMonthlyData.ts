/**
 * Hook para obtener datos mensuales reales del dashboard
 * Obtiene ventas de los últimos 6 meses desde la base de datos
 */

import useSWR from 'swr'
import { createClient } from '@/utils/supabase/client'
import { logger } from '@/lib/utils/logger'

interface MonthlyData {
  name: string
  value: number
  month: number
  year: number
}

const fetcher = async (): Promise<MonthlyData[]> => {
  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    throw new Error('Unauthorized')
  }
  
  // Obtener cotizaciones aprobadas de los últimos 6 meses
  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
  
  const { data: quotes, error: quotesError } = await supabase
    .from('quotes')
    .select('total_amount, status, created_at')
    .eq('vendor_id', user.id)
    .in('status', ['APPROVED', 'confirmed'])
    .gte('created_at', sixMonthsAgo.toISOString())
    .order('created_at', { ascending: true })
  
  if (quotesError) {
    logger.error('useMonthlyData', 'Error fetching monthly quotes', quotesError as Error)
    throw quotesError
  }
  
  // Agrupar por mes
  const monthlyMap = new Map<string, number>()
  
  // Inicializar últimos 6 meses con 0
  const currentDate = new Date()
  for (let i = 5; i >= 0; i--) {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1)
    const key = `${date.getFullYear()}-${date.getMonth()}`
    monthlyMap.set(key, 0)
  }
  
  // Sumar ventas por mes
  quotes?.forEach((quote) => {
    const date = new Date(quote.created_at)
    const key = `${date.getFullYear()}-${date.getMonth()}`
    const currentValue = monthlyMap.get(key) || 0
    monthlyMap.set(key, currentValue + (Number(quote.total_amount) || 0))
  })
  
  // Convertir a array y formatear
  const monthlyData: MonthlyData[] = Array.from(monthlyMap.entries()).map(([key, value]) => {
    const [year, month] = key.split('-').map(Number)
    const date = new Date(year, month, 1)
    const monthName = date.toLocaleDateString('es-MX', { month: 'short' })
    
    return {
      name: monthName,
      value: Math.round(value),
      month,
      year,
    }
  })
  
  return monthlyData.sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year
    return a.month - b.month
  })
}

export function useMonthlyData() {
  const { data, error, isLoading } = useSWR<MonthlyData[]>(
    'dashboard:monthly-data',
    fetcher,
    {
      revalidateOnFocus: false,
      refreshInterval: 60000, // Actualizar cada minuto
      dedupingInterval: 10000,
      onError: (err) => {
        logger.error('useMonthlyData', 'SWR error', err as Error)
      },
    }
  )
  
  return {
    monthlyData: data || [],
    loading: isLoading,
    error: error as Error | null,
  }
}

