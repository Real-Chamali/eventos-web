/**
 * Hook para obtener rendimiento de servicios
 * Top servicios por ingresos y cantidad
 */

import useSWR from 'swr'
import { createClient } from '@/utils/supabase/client'
import { logger } from '@/lib/utils/logger'

export interface ServicePerformance {
  serviceId: string
  serviceName: string
  revenue: number
  count: number
  averagePrice: number
}

const fetcher = async (): Promise<ServicePerformance[]> => {
  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    throw new Error('Unauthorized')
  }
  
  // Obtener cotizaciones aprobadas con sus servicios
  const { data: quotes, error: quotesError } = await supabase
    .from('quotes')
    .select('id, status')
    .eq('vendor_id', user.id)
    .eq('status', 'APPROVED')
  
  if (quotesError) {
    logger.error('useServicePerformance', 'Error fetching quotes', quotesError as Error)
    throw quotesError
  }
  
  if (!quotes || quotes.length === 0) {
    return []
  }
  
  const quoteIds = quotes.map(q => q.id)
  
  // Obtener servicios de las cotizaciones
  const { data: quoteServices, error: servicesError } = await supabase
    .from('quote_services')
    .select('quote_id, service_id, quantity, final_price')
    .in('quote_id', quoteIds)
  
  if (servicesError) {
    logger.error('useServicePerformance', 'Error fetching quote services', servicesError as Error)
    throw servicesError
  }
  
  // Agrupar por servicio
  const serviceMap = new Map<string, { revenue: number; count: number }>()
  
  quoteServices?.forEach((qs) => {
    if (!qs.service_id) return
    
    const existing = serviceMap.get(qs.service_id) || { revenue: 0, count: 0 }
    existing.revenue += Number(qs.final_price) * (Number(qs.quantity) || 1)
    existing.count += Number(qs.quantity) || 1
    serviceMap.set(qs.service_id, existing)
  })
  
  // Obtener nombres de servicios (optimización N+1)
  const serviceIds = Array.from(serviceMap.keys())
  if (serviceIds.length === 0) {
    return []
  }
  
  const { data: services, error: servicesDataError } = await supabase
    .from('services')
    .select('id, name')
    .in('id', serviceIds)
  
  if (servicesDataError) {
    logger.warn('useServicePerformance', 'Error fetching services', {
      error: servicesDataError.message,
    })
  }
  
  // Crear mapa de nombres
  const serviceNames = new Map<string, string>()
  services?.forEach((s) => {
    serviceNames.set(s.id, s.name || 'Servicio desconocido')
  })
  
  // Construir resultado
  const performance: ServicePerformance[] = Array.from(serviceMap.entries()).map(([serviceId, data]) => {
    const averagePrice = data.count > 0 ? data.revenue / data.count : 0
    return {
      serviceId,
      serviceName: serviceNames.get(serviceId) || 'Servicio desconocido',
      revenue: Number(data.revenue.toFixed(2)),
      count: data.count,
      averagePrice: Number(averagePrice.toFixed(2)),
    }
  })
  
  // Ordenar por revenue descendente y tomar top 10
  return performance
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10)
}

export function useServicePerformance() {
  const { data, error, isLoading } = useSWR<ServicePerformance[]>(
    'dashboard:service-performance',
    fetcher,
    {
      revalidateOnFocus: false,
      refreshInterval: 300000, // Actualizar cada 5 minutos
      dedupingInterval: 60000,
      onError: (err) => {
        logger.error('useServicePerformance', 'SWR error', err as Error)
      },
    }
  )
  
  return {
    services: data || [],
    loading: isLoading,
    error: error as Error | null,
  }
}

