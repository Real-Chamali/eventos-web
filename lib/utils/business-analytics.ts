/**
 * Utilidades de Analytics y Métricas de Negocio
 * 
 * Funciones para calcular métricas clave, funnels de conversión
 * y análisis de rendimiento del negocio
 */

import { format, subDays, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns'
import { es } from 'date-fns/locale'

export interface AnalyticsMetrics {
  revenue: {
    total: number
    average: number
    trend: number
    byMonth: Array<{ month: string; revenue: number }>
  }
  quotes: {
    total: number
    approved: number
    rejected: number
    pending: number
    conversionRate: number
    averageApprovalTime: number
  }
  clients: {
    total: number
    new: number
    returning: number
    retentionRate: number
    lifetimeValue: number
  }
  services: {
    topPerforming: Array<{
      name: string
      count: number
      revenue: number
      margin: number
    }>
    revenueDistribution: Array<{
      category: string
      percentage: number
      amount: number
    }>
  }
  payments: {
    totalReceived: number
    pending: number
    overdue: number
    onTimeRate: number
    averageDelay: number
    methods: Array<{
      method: string
      count: number
      amount: number
      percentage: number
    }>
  }
  vendors: Array<{
    name: string
    email: string
    quotes: number
    approvals: number
    revenue: number
    conversionRate: number
    rank: number
  }>
}

export interface ConversionFunnel {
  stage: string
  count: number
  conversionRate: number
  dropOffRate: number
  averageTime: number
}

export interface TimeSeriesData {
  date: string
  revenue: number
  quotes: number
  conversions: number
  clients: number
}

/**
 * Calcula métricas de conversión del funnel
 */
export function calculateConversionFunnel(data: any[]): ConversionFunnel[] {
  const stages = [
    { name: 'Creadas', field: 'created_at', filter: () => true },
    { name: 'Enviadas', field: 'sent_at', filter: (item: any) => item.status === 'sent' },
    { name: 'Aprobadas', field: 'approved_at', filter: (item: any) => item.status === 'approved' },
    { name: 'Pagadas', field: 'paid_at', filter: (item: any) => item.status === 'paid' },
  ]

  const funnel: ConversionFunnel[] = []
  let previousCount = 0

  stages.forEach((stage, index) => {
    const count = data.filter(stage.filter).length
    const conversionRate = previousCount > 0 ? (count / previousCount) * 100 : 100
    const dropOffRate = previousCount > 0 ? ((previousCount - count) / previousCount) * 100 : 0

    funnel.push({
      stage: stage.name,
      count,
      conversionRate,
      dropOffRate,
      averageTime: 0, // Calcular tiempo promedio entre etapas
    })

    previousCount = count
  })

  return funnel
}

/**
 * Calcula el Customer Lifetime Value (CLV)
 */
export function calculateCustomerLifetimeValue(clientData: any[]): number {
  if (clientData.length === 0) return 0

  const totalRevenue = clientData.reduce((sum, client) => {
    return sum + (client.totalSpent || 0)
  }, 0)

  const averageLifespan = clientData.reduce((sum, client) => {
    const firstDate = new Date(client.firstQuoteDate)
    const lastDate = new Date(client.lastQuoteDate || Date.now())
    const lifespan = (lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24 * 30) // en meses
    return sum + lifespan
  }, 0) / clientData.length

  return totalRevenue / clientData.length * averageLifespan
}

/**
 * Calcula la tasa de retención de clientes
 */
export function calculateRetentionRate(clientData: any[]): number {
  if (clientData.length === 0) return 0

  const returningClients = clientData.filter(client => (client.quotesCount || 0) > 1).length
  return (returningClients / clientData.length) * 100
}

/**
 * Analiza el rendimiento de servicios
 */
export function analyzeServicePerformance(quoteData: any[]): AnalyticsMetrics['services'] {
  const serviceMap = new Map<string, {
    count: number
    revenue: number
    cost: number
  }>()

  quoteData.forEach(quote => {
    if (quote.quote_services) {
      quote.quote_services.forEach((qs: any) => {
        if (qs.services) {
          const serviceName = qs.services.name
          const current = serviceMap.get(serviceName) || { count: 0, revenue: 0, cost: 0 }
          
          serviceMap.set(serviceName, {
            count: current.count + 1,
            revenue: current.revenue + (qs.services.base_price || 0),
            cost: current.cost + (qs.services.cost || 0),
          })
        }
      })
    }
  })

  const topPerforming = Array.from(serviceMap.entries())
    .map(([name, data]) => ({
      name,
      count: data.count,
      revenue: data.revenue,
      margin: data.revenue > 0 ? ((data.revenue - data.cost) / data.revenue) * 100 : 0,
    }))
    .sort((a, b) => b.revenue - a.revenue)

  const totalRevenue = topPerforming.reduce((sum, service) => sum + service.revenue, 0)
  
  const revenueDistribution = topPerforming.map(service => ({
    category: service.name,
    percentage: totalRevenue > 0 ? (service.revenue / totalRevenue) * 100 : 0,
    amount: service.revenue,
  }))

  return {
    topPerforming,
    revenueDistribution,
  }
}

/**
 * Analiza métricas de pagos
 */
export function analyzePaymentMetrics(paymentData: any[]): AnalyticsMetrics['payments'] {
  const totalReceived = paymentData
    .filter(p => p.status === 'paid')
    .reduce((sum, p) => sum + (p.amount || 0), 0)

  const totalPending = paymentData
    .filter(p => p.status === 'pending')
    .reduce((sum, p) => sum + (p.amount || 0), 0)

  const totalOverdue = paymentData
    .filter(p => p.status === 'overdue')
    .reduce((sum, p) => sum + (p.amount || 0), 0)

  // Calcular tasa de pago a tiempo
  const onTimePayments = paymentData.filter(p => {
    if (p.status !== 'paid') return false
    const dueDate = new Date(p.due_date)
    const paidDate = new Date(p.paid_at || p.updated_at)
    return paidDate <= dueDate
  }).length

  const totalPayments = paymentData.filter(p => p.status === 'paid').length
  const onTimeRate = totalPayments > 0 ? (onTimePayments / totalPayments) * 100 : 0

  // Calcular retraso promedio
  const delays = paymentData
    .filter(p => p.status === 'paid' && p.due_date && p.paid_at)
    .map(p => {
      const dueDate = new Date(p.due_date)
      const paidDate = new Date(p.paid_at)
      return Math.max(0, (paidDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
    })

  const averageDelay = delays.length > 0 ? delays.reduce((sum, delay) => sum + delay, 0) / delays.length : 0

  // Analizar métodos de pago
  const methodMap = new Map<string, { count: number; amount: number }>()
  paymentData.forEach(payment => {
    if (payment.payment_method) {
      const current = methodMap.get(payment.payment_method) || { count: 0, amount: 0 }
      methodMap.set(payment.payment_method, {
        count: current.count + 1,
        amount: current.amount + (payment.amount || 0),
      })
    }
  })

  const totalPaymentAmount = Array.from(methodMap.values()).reduce((sum, method) => sum + method.amount, 0)
  const methods = Array.from(methodMap.entries()).map(([method, data]) => ({
    method,
    count: data.count,
    amount: data.amount,
    percentage: totalPaymentAmount > 0 ? (data.amount / totalPaymentAmount) * 100 : 0,
  }))

  return {
    totalReceived,
    pending: totalPending,
    overdue: totalOverdue,
    onTimeRate,
    averageDelay,
    methods,
  }
}

/**
 * Genera datos de series de tiempo para gráficos
 */
export function generateTimeSeriesData(
  quoteData: any[],
  paymentData: any[],
  startDate: Date,
  endDate: Date,
  granularity: 'daily' | 'weekly' | 'monthly' = 'daily'
): TimeSeriesData[] {
  const data: TimeSeriesData[] = []
  const currentDate = new Date(startDate)

  while (currentDate <= endDate) {
    const dateStr = format(currentDate, 'yyyy-MM-dd')
    
    // Filtrar datos para esta fecha
    const dayQuotes = quoteData.filter(quote => {
      const quoteDate = new Date(quote.created_at)
      return format(quoteDate, 'yyyy-MM-dd') === dateStr
    })

    const dayPayments = paymentData.filter(payment => {
      const paymentDate = new Date(payment.created_at)
      return format(paymentDate, 'yyyy-MM-dd') === dateStr
    })

    const revenue = dayPayments
      .filter(p => p.status === 'paid')
      .reduce((sum, p) => sum + (p.amount || 0), 0)

    const quotes = dayQuotes.length
    const conversions = dayQuotes.filter(q => q.status === 'approved').length
    const clients = new Set(dayQuotes.map(q => q.client_id)).size

    data.push({
      date: dateStr,
      revenue,
      quotes,
      conversions,
      clients,
    })

    // Avanzar a la siguiente fecha según granularidad
    switch (granularity) {
      case 'daily':
        currentDate.setDate(currentDate.getDate() + 1)
        break
      case 'weekly':
        currentDate.setDate(currentDate.getDate() + 7)
        break
      case 'monthly':
        currentDate.setMonth(currentDate.getMonth() + 1)
        break
    }
  }

  return data
}

/**
 * Calcula métricas de crecimiento
 */
export function calculateGrowthMetrics(
  currentData: TimeSeriesData[],
  previousData: TimeSeriesData[]
): {
  revenueGrowth: number
  quotesGrowth: number
  conversionGrowth: number
  clientGrowth: number
} {
  const currentRevenue = currentData.reduce((sum, d) => sum + d.revenue, 0)
  const previousRevenue = previousData.reduce((sum, d) => sum + d.revenue, 0)
  const revenueGrowth = previousRevenue > 0 ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 : 0

  const currentQuotes = currentData.reduce((sum, d) => sum + d.quotes, 0)
  const previousQuotes = previousData.reduce((sum, d) => sum + d.quotes, 0)
  const quotesGrowth = previousQuotes > 0 ? ((currentQuotes - previousQuotes) / previousQuotes) * 100 : 0

  const currentConversions = currentData.reduce((sum, d) => sum + d.conversions, 0)
  const previousConversions = previousData.reduce((sum, d) => sum + d.conversions, 0)
  const conversionGrowth = previousConversions > 0 ? ((currentConversions - previousConversions) / previousConversions) * 100 : 0

  const currentClients = currentData.reduce((sum, d) => sum + d.clients, 0)
  const previousClients = previousData.reduce((sum, d) => sum + d.clients, 0)
  const clientGrowth = previousClients > 0 ? ((currentClients - previousClients) / previousClients) * 100 : 0

  return {
    revenueGrowth,
    quotesGrowth,
    conversionGrowth,
    clientGrowth,
  }
}

/**
 * Predice ingresos futuros basados en tendencias históricas
 */
export function predictRevenue(timeSeriesData: TimeSeriesData[], daysAhead: number): number {
  if (timeSeriesData.length < 2) return 0

  // Simple linear regression para predicción
  const n = timeSeriesData.length
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0

  timeSeriesData.forEach((data, index) => {
    sumX += index
    sumY += data.revenue
    sumXY += index * data.revenue
    sumX2 += index * index
  })

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
  const intercept = (sumY - slope * sumX) / n

  // Predecir para los próximos días
  let predictedRevenue = 0
  for (let i = 1; i <= daysAhead; i++) {
    const futureX = n + i
    predictedRevenue += slope * futureX + intercept
  }

  return Math.max(0, predictedRevenue)
}

/**
 * Calcula el score de salud del negocio (0-100)
 */
export function calculateBusinessHealthScore(metrics: AnalyticsMetrics): number {
  let score = 0
  let weights = 0

  // Tasa de conversión (peso: 25%)
  const conversionScore = Math.min(100, metrics.quotes.conversionRate * 2) // 50% = 100 puntos
  score += conversionScore * 0.25
  weights += 0.25

  // Tasa de pago a tiempo (peso: 20%)
  const paymentScore = metrics.payments.onTimeRate
  score += paymentScore * 0.20
  weights += 0.20

  // Tasa de retención (peso: 20%)
  const retentionScore = metrics.clients.retentionRate
  score += retentionScore * 0.20
  weights += 0.20

  // Crecimiento de ingresos (peso: 20%)
  const revenueScore = Math.min(100, Math.max(0, metrics.revenue.trend))
  score += revenueScore * 0.20
  weights += 0.20

  // Margen promedio de servicios (peso: 15%)
  const avgMargin = metrics.services.topPerforming.reduce((sum, service) => sum + service.margin, 0) / Math.max(metrics.services.topPerforming.length, 1)
  const marginScore = Math.min(100, avgMargin * 2) // 50% = 100 puntos
  score += marginScore * 0.15
  weights += 0.15

  return weights > 0 ? score / weights : 0
}

/**
 * Genera insights automáticos basados en las métricas
 */
export function generateInsights(metrics: AnalyticsMetrics): string[] {
  const insights: string[] = []

  // Insights de conversión
  if (metrics.quotes.conversionRate < 30) {
    insights.push('⚠️ La tasa de conversión es baja. Considera revisar el proceso de seguimiento de cotizaciones.')
  } else if (metrics.quotes.conversionRate > 70) {
    insights.push('🎉 Excelente tasa de conversión. El equipo está haciendo un gran trabajo.')
  }

  // Insights de pagos
  if (metrics.payments.onTimeRate < 70) {
    insights.push('💰 La tasa de pago a tiempo es baja. Implementa recordatorios automáticos.')
  }

  // Insights de retención
  if (metrics.clients.retentionRate < 40) {
    insights.push('🔄 La tasa de retención es baja. Considera un programa de fidelización.')
  }

  // Insights de servicios
  if (metrics.services.topPerforming.length > 0) {
    const topService = metrics.services.topPerforming[0]
    if (topService.revenue > metrics.revenue.total * 0.5) {
      insights.push(`🎯 ${topService.name} concentra más del 50% de los ingresos. Considera diversificar.`)
    }
  }

  // Insights de vendedores
  const topVendor = metrics.vendors[0]
  if (topVendor && topVendor.conversionRate > 80) {
    insights.push(`🌟 ${topVendor.name} tiene un rendimiento excepcional. Considera compartir sus mejores prácticas.`)
  }

  return insights
}
