/**
 * Sistema de Reportes Automáticos Semanales
 * 
 * Genera y envía reportes automáticos:
 * - Reporte semanal de ventas y métricas
 * - Reporte de rendimiento de vendedores
 * - Reporte de servicios más vendidos
 * - Reporte de conversión de cotizaciones
 */

import { createClient } from '@/utils/supabase/client'
import { sendWhatsAppWithRetry } from '@/lib/integrations/whatsapp'
import { logger } from '@/lib/utils/logger'
import { format, addDays, startOfWeek, endOfWeek, subDays } from 'date-fns'
import { es } from 'date-fns/locale'

interface WeeklyReportConfig {
  adminPhoneNumber: string
  enableSalesReport: boolean
  enablePerformanceReport: boolean
  enableServicesReport: boolean
  enableConversionReport: boolean
}

interface WeeklyStats {
  period: {
    start: string
    end: string
  }
  sales: {
    totalQuotes: number
    approvedQuotes: number
    rejectedQuotes: number
    pendingQuotes: number
    totalRevenue: number
    averageTicket: number
    conversionRate: number
  }
  payments: {
    totalReceived: number
    totalPending: number
    totalOverdue: number
    paymentRate: number
  }
  services: {
    topServices: Array<{
      name: string
      count: number
      revenue: number
    }>
  }
  vendors: Array<{
    name: string
    email: string
    quotes: number
    approvals: number
    revenue: number
    conversionRate: number
  }>
}

const DEFAULT_CONFIG: WeeklyReportConfig = {
  adminPhoneNumber: process.env.ADMIN_PHONE_NUMBER || '',
  enableSalesReport: true,
  enablePerformanceReport: true,
  enableServicesReport: true,
  enableConversionReport: true,
}

/**
 * Plantillas de reportes semanales
 */
const weeklyReportTemplates = {
  sales: (stats: WeeklyStats) => 
    `📊 *REPORTE SEMANAL DE VENTAS*\n\n` +
    `📅 *Período:* ${format(new Date(stats.period.start), 'dd/MM/yyyy')} - ${format(new Date(stats.period.end), 'dd/MM/yyyy')}\n\n` +
    `💰 *Resumen de Ventas:*\n` +
    `• Cotizaciones creadas: ${stats.sales.totalQuotes}\n` +
    `• Cotizaciones aprobadas: ${stats.sales.approvedQuotes}\n` +
    `• Cotizaciones rechazadas: ${stats.sales.rejectedQuotes}\n` +
    `• Cotizaciones pendientes: ${stats.sales.pendingQuotes}\n` +
    `• Ingreso total: $${stats.sales.totalRevenue.toFixed(2)}\n` +
    `• Ticket promedio: $${stats.sales.averageTicket.toFixed(2)}\n` +
    `• Tasa de conversión: ${stats.sales.conversionRate.toFixed(1)}%\n\n` +
    `💳 *Resumen de Pagos:*\n` +
    `• Total recibido: $${stats.payments.totalReceived.toFixed(2)}\n` +
    `• Total pendiente: $${stats.payments.totalPending.toFixed(2)}\n` +
    `• Total vencido: $${stats.payments.totalOverdue.toFixed(2)}\n` +
    `• Tasa de pago: ${stats.payments.paymentRate.toFixed(1)}%\n\n` +
    `🎯 *Conclusiones:*\n` +
    `${generateSalesInsights(stats)}`,

  performance: (stats: WeeklyStats) => {
    const topVendor = stats.vendors.reduce((top, vendor) => 
      vendor.revenue > top.revenue ? vendor : top, stats.vendors[0]
    )
    
    return `🏆 *REPORTE DE RENDIMIENTO DE VENDEDORES*\n\n` +
      `📅 *Período:* ${format(new Date(stats.period.start), 'dd/MM/yyyy')} - ${format(new Date(stats.period.end), 'dd/MM/yyyy')}\n\n` +
      `🥇 *Mejor Vendedor:* ${topVendor.name}\n` +
      `• Cotizaciones: ${topVendor.quotes}\n` +
      `• Aprobaciones: ${topVendor.approvals}\n` +
      `• Ingresos: $${topVendor.revenue.toFixed(2)}\n` +
      `• Tasa conversión: ${topVendor.conversionRate.toFixed(1)}%\n\n` +
      `📈 *Ranking Completo:*\n${stats.vendors.map((vendor, index) => 
        `${index + 1}. ${vendor.name}: $${vendor.revenue.toFixed(2)} (${vendor.conversionRate.toFixed(1)}%)`
      ).join('\n')}\n\n` +
      `📊 *Métricas del Equipo:*\n` +
      `• Promedio de cotizaciones por vendedor: ${(stats.sales.totalQuotes / stats.vendors.length).toFixed(1)}\n` +
      `• Promedio de conversión: ${(stats.vendors.reduce((sum, v) => sum + v.conversionRate, 0) / stats.vendors.length).toFixed(1)}%\n` +
      `• Ingreso promedio por vendedor: $${(stats.sales.totalRevenue / stats.vendors.length).toFixed(2)}\n\n` +
      `${generatePerformanceInsights(stats)}`
  },

  services: (stats: WeeklyStats) => 
    `🎯 *REPORTE DE SERVICIOS MÁS VENDIDOS*\n\n` +
    `📅 *Período:* ${format(new Date(stats.period.start), 'dd/MM/yyyy')} - ${format(new Date(stats.period.end), 'dd/MM/yyyy')}\n\n` +
    `🏆 *Top 5 Servicios:*\n${stats.services.topServices.slice(0, 5).map((service, index) => 
      `${index + 1}. ${service.name}\n   • Ventas: ${service.count}\n   • Ingresos: $${service.revenue.toFixed(2)}`
    ).join('\n\n')}\n\n` +
    `📊 *Análisis de Servicios:*\n` +
    `• Total de servicios diferentes vendidos: ${stats.services.topServices.length}\n` +
    `• Servicio más rentable: ${stats.services.topServices[0]?.name || 'N/A'}\n` +
    `• Ingreso promedio por servicio: $${(stats.services.topServices.reduce((sum, s) => sum + s.revenue, 0) / Math.max(stats.services.topServices.length, 1)).toFixed(2)}\n\n` +
    `${generateServicesInsights(stats)}`,

  conversion: (stats: WeeklyStats) => 
    `🔄 *REPORTE DE CONVERSIÓN DE COTIZACIONES*\n\n` +
    `📅 *Período:* ${format(new Date(stats.period.start), 'dd/MM/yyyy')} - ${format(new Date(stats.period.end), 'dd/MM/yyyy')}\n\n` +
    `📊 *Funnel de Conversión:*\n` +
    `📝 Cotizaciones Creadas: ${stats.sales.totalQuotes}\n` +
    `   ↓\n` +
    `✅ Cotizaciones Aprobadas: ${stats.sales.approvedQuotes} (${stats.sales.conversionRate.toFixed(1)}%)\n` +
    `   ↓\n` +
    `💰 Pagos Recibidos: $${stats.payments.totalReceived.toFixed(2)}\n\n` +
    `📈 *Métricas Clave:*\n` +
    `• Tasa de aprobación: ${stats.sales.conversionRate.toFixed(1)}%\n` +
    `• Tasa de rechazo: ${((stats.sales.rejectedQuotes / stats.sales.totalQuotes) * 100).toFixed(1)}%\n` +
    `• Tasa de pendientes: ${((stats.sales.pendingQuotes / stats.sales.totalQuotes) * 100).toFixed(1)}%\n` +
    `• Valor promedio de cotización aprobada: $${stats.sales.averageTicket.toFixed(2)}\n\n` +
    `${generateConversionInsights(stats)}`,

  summary: (stats: WeeklyStats) => 
    `📋 *RESUMEN EJECUTIVO SEMANAL*\n\n` +
    `📅 ${format(new Date(stats.period.start), 'dd/MM/yyyy')} - ${format(new Date(stats.period.end), 'dd/MM/yyyy')}\n\n` +
    `💰 *Resultados Financieros:*\n` +
    `• Ingresos totales: $${stats.sales.totalRevenue.toFixed(2)}\n` +
    `• Pagos recibidos: $${stats.payments.totalReceived.toFixed(2)}\n` +
    `• Pagos pendientes: $${stats.payments.totalPending.toFixed(2)}\n\n` +
    `📊 *Operaciones:*\n` +
    `• Cotizaciones creadas: ${stats.sales.totalQuotes}\n` +
    `• Tasa de conversión: ${stats.sales.conversionRate.toFixed(1)}%\n` +
    `• Ticket promedio: $${stats.sales.averageTicket.toFixed(2)}\n\n` +
    `🎯 *Aspectos Destacados:*\n` +
    `${generateExecutiveInsights(stats)}\n\n` +
    `📈 *Recomendaciones:*\n` +
    `${generateRecommendations(stats)}`,
}

/**
 * Genera insights basados en los datos
 */
function generateSalesInsights(stats: WeeklyStats): string {
  const insights: string[] = []
  
  if (stats.sales.conversionRate > 70) {
    insights.push('✅ Excelente tasa de conversión esta semana')
  } else if (stats.sales.conversionRate < 40) {
    insights.push('⚠️ La tasa de conversión es baja, revisar proceso de ventas')
  }
  
  if (stats.sales.totalRevenue > 10000) {
    insights.push('🎉 Semana de altas ventas')
  } else if (stats.sales.totalRevenue < 5000) {
    insights.push('📉 Ventas por debajo del objetivo semanal')
  }
  
  if (stats.payments.paymentRate > 80) {
    insights.push('💳 Buen rendimiento en cobranza')
  } else if (stats.payments.paymentRate < 60) {
    insights.push('💰 Mejorar seguimiento de pagos pendientes')
  }
  
  return insights.length > 0 ? insights.join('\n') + '\n' : '📊 Semana estable sin anomalías significativas\n'
}

function generatePerformanceInsights(stats: WeeklyStats): string {
  const insights: string[] = []
  const avgConversion = stats.vendors.reduce((sum, v) => sum + v.conversionRate, 0) / stats.vendors.length
  
  if (avgConversion > 60) {
    insights.push('🏆 El equipo muestra buen desempeño general')
  }
  
  const topPerformer = stats.vendors.reduce((top, vendor) => 
    vendor.conversionRate > top.conversionRate ? vendor : top, stats.vendors[0]
  )
  
  if (topPerformer.conversionRate > 80) {
    insights.push(`🌟 Destaca el rendimiento de ${topPerformer.name}`)
  }
  
  return insights.length > 0 ? insights.join('\n') + '\n' : '📊 Rendimiento equilibrado del equipo\n'
}

function generateServicesInsights(stats: WeeklyStats): string {
  const insights: string[] = []
  
  if (stats.services.topServices.length > 0) {
    const topService = stats.services.topServices[0]
    const topRevenue = stats.services.topServices.reduce((sum, s) => sum + s.revenue, 0)
    const topConcentration = (topService.revenue / topRevenue) * 100
    
    if (topConcentration > 50) {
      insights.push(`🎯 ${topService.name} concentra el ${topConcentration.toFixed(1)}% de los ingresos`)
    }
    
    if (stats.services.topServices.length >= 5) {
      insights.push('🌈 Buena diversificación de servicios')
    }
  }
  
  return insights.length > 0 ? insights.join('\n') + '\n' : '📊 Distribución normal de servicios\n'
}

function generateConversionInsights(stats: WeeklyStats): string {
  const insights: string[] = []
  
  if (stats.sales.conversionRate > 70) {
    insights.push('✅ Excelente rendimiento en conversión')
  } else if (stats.sales.conversionRate < 40) {
    insights.push('🔍 Revisar calidad de las cotizaciones y proceso de seguimiento')
  }
  
  const rejectionRate = (stats.sales.rejectedQuotes / stats.sales.totalQuotes) * 100
  if (rejectionRate > 30) {
    insights.push('❌ Alta tasa de rechazo, analizar causas')
  }
  
  return insights.length > 0 ? insights.join('\n') + '\n' : '📊 Proceso de conversión estable\n'
}

function generateExecutiveInsights(stats: WeeklyStats): string {
  const insights: string[] = []
  
  if (stats.sales.totalRevenue > 15000) {
    insights.push('🎉 Semana excepcional en ingresos')
  }
  
  if (stats.sales.conversionRate > 65) {
    insights.push('📈 Alta eficiencia en ventas')
  }
  
  if (stats.payments.paymentRate > 85) {
    insights.push('💳 Excelente gestión de cobranza')
  }
  
  return insights.length > 0 ? insights.join('\n') : '📊 Semana operativamente normal'
}

function generateRecommendations(stats: WeeklyStats): string {
  const recommendations: string[] = []
  
  if (stats.sales.conversionRate < 50) {
    recommendations.push('• Capacitar al equipo en técnicas de cierre')
  }
  
  if (stats.payments.totalOverdue > 5000) {
    recommendations.push('• Intensificar seguimiento de pagos vencidos')
  }
  
  if (stats.sales.pendingQuotes > stats.sales.approvedQuotes) {
    recommendations.push('• Reducir tiempo de respuesta a cotizaciones')
  }
  
  return recommendations.length > 0 ? recommendations.join('\n') : '• Continuar con las estrategias actuales'
}

/**
 * Obtiene estadísticas semanales
 */
async function getWeeklyStats(): Promise<WeeklyStats> {
  const supabase = createClient()
  
  try {
    const now = new Date()
    const weekStart = startOfWeek(subDays(now, 1), { weekStartsOn: 1 }) // Semana empieza lunes
    const weekEnd = endOfWeek(subDays(now, 1), { weekStartsOn: 1 })
    
    // Obtener cotizaciones de la semana
    const { data: quotes, error: quotesError } = await supabase
      .from('quotes')
      .select(`
        *,
        clients!inner(name, email),
        profiles!inner(full_name, email),
        quote_services!inner(
          services!inner(name, base_price)
        )
      `)
      .gte('created_at', weekStart.toISOString())
      .lte('created_at', weekEnd.toISOString())

    if (quotesError) throw quotesError

    // Obtener pagos de la semana
    const { data: payments, error: paymentsError } = await supabase
      .from('partial_payments')
      .select('*')
      .gte('created_at', weekStart.toISOString())
      .lte('created_at', weekEnd.toISOString())

    if (paymentsError) throw paymentsError

    // Procesar datos
    const stats = processWeeklyData(quotes || [], payments || [], weekStart, weekEnd)
    
    return stats
  } catch (error) {
    logger.error('WeeklyReports', 'Error fetching weekly stats', error as Error)
    throw error
  }
}

/**
 * Procesa los datos crudos para generar estadísticas
 */
function processWeeklyData(
  quotes: any[],
  payments: any[],
  weekStart: Date,
  weekEnd: Date
): WeeklyStats {
  // Estadísticas de ventas
  const totalQuotes = quotes.length
  const approvedQuotes = quotes.filter(q => q.status === 'approved').length
  const rejectedQuotes = quotes.filter(q => q.status === 'rejected').length
  const pendingQuotes = quotes.filter(q => q.status === 'pending').length
  const totalRevenue = quotes
    .filter(q => q.status === 'approved')
    .reduce((sum, q) => sum + (q.total_amount || 0), 0)
  const averageTicket = approvedQuotes > 0 ? totalRevenue / approvedQuotes : 0
  const conversionRate = totalQuotes > 0 ? (approvedQuotes / totalQuotes) * 100 : 0

  // Estadísticas de pagos
  const totalReceived = payments
    .filter(p => p.status === 'paid')
    .reduce((sum, p) => sum + (p.amount || 0), 0)
  const totalPending = payments
    .filter(p => p.status === 'pending')
    .reduce((sum, p) => sum + (p.amount || 0), 0)
  const totalOverdue = payments
    .filter(p => p.status === 'overdue')
    .reduce((sum, p) => sum + (p.amount || 0), 0)
  const paymentRate = totalReceived > 0 ? (totalReceived / (totalReceived + totalPending + totalOverdue)) * 100 : 0

  // Procesar servicios
  const servicesMap = new Map<string, { count: number; revenue: number }>()
  
  quotes.forEach(quote => {
    if (quote.quote_services) {
      quote.quote_services.forEach((qs: any) => {
        if (qs.services) {
          const serviceName = qs.services.name
          const current = servicesMap.get(serviceName) || { count: 0, revenue: 0 }
          servicesMap.set(serviceName, {
            count: current.count + 1,
            revenue: current.revenue + (qs.services.base_price || 0),
          })
        }
      })
    }
  })

  const topServices = Array.from(servicesMap.entries())
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.revenue - a.revenue)

  // Procesar vendedores
  const vendorsMap = new Map<string, {
    name: string
    email: string
    quotes: number
    approvals: number
    revenue: number
  }>()

  quotes.forEach(quote => {
    if (quote.profiles) {
      const vendorEmail = quote.profiles.email
      const vendorName = quote.profiles.full_name || vendorEmail
      const current = vendorsMap.get(vendorEmail) || {
        name: vendorName,
        email: vendorEmail,
        quotes: 0,
        approvals: 0,
        revenue: 0,
      }
      
      vendorsMap.set(vendorEmail, {
        ...current,
        quotes: current.quotes + 1,
        approvals: current.approvals + (quote.status === 'approved' ? 1 : 0),
        revenue: current.revenue + (quote.status === 'approved' ? (quote.total_amount || 0) : 0),
      })
    }
  })

  const vendors = Array.from(vendorsMap.values()).map(vendor => ({
    ...vendor,
    conversionRate: vendor.quotes > 0 ? (vendor.approvals / vendor.quotes) * 100 : 0,
  }))

  return {
    period: {
      start: weekStart.toISOString(),
      end: weekEnd.toISOString(),
    },
    sales: {
      totalQuotes,
      approvedQuotes,
      rejectedQuotes,
      pendingQuotes,
      totalRevenue,
      averageTicket,
      conversionRate,
    },
    payments: {
      totalReceived,
      totalPending,
      totalOverdue,
      paymentRate,
    },
    services: {
      topServices,
    },
    vendors,
  }
}

/**
 * Envía reportes semanales completos
 */
export async function sendWeeklyReports(): Promise<void> {
  try {
    logger.info('WeeklyReports', 'Starting weekly reports generation')
    
    if (!DEFAULT_CONFIG.adminPhoneNumber) {
      logger.warn('WeeklyReports', 'Admin phone number not configured')
      return
    }

    const stats = await getWeeklyStats()
    
    // Enviar reporte ejecutivo
    if (DEFAULT_CONFIG.enableSalesReport) {
      await sendWhatsAppWithRetry({
        to: DEFAULT_CONFIG.adminPhoneNumber,
        message: weeklyReportTemplates.summary(stats),
      })
    }

    logger.info('WeeklyReports', 'Weekly reports sent successfully', {
      period: `${format(new Date(stats.period.start), 'dd/MM/yyyy')} - ${format(new Date(stats.period.end), 'dd/MM/yyyy')}`,
      totalRevenue: stats.sales.totalRevenue,
      conversionRate: stats.sales.conversionRate,
    })
  } catch (error) {
    logger.error('WeeklyReports', 'Error sending weekly reports', error as Error)
  }
}

/**
 * Endpoint API para ejecutar reportes manualmente
 */
export async function triggerWeeklyReports(): Promise<{ success: boolean; message: string }> {
  try {
    await sendWeeklyReports()
    return {
      success: true,
      message: 'Reportes semanales enviados exitosamente',
    }
  } catch (error) {
    logger.error('WeeklyReports', 'Manual trigger failed', error as Error)
    return {
      success: false,
      message: 'Error al enviar reportes semanales',
    }
  }
}
