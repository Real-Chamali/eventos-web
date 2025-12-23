/**
 * Utilidades para exportar reportes financieros
 * PDF, Excel, CSV
 */

import { logger } from './logger'
import type {
  ExecutiveFinancialSummary,
  MonthlyComparison,
  ServiceProfitability,
  ClientProfitability,
  CashFlowProjection,
  ProfitabilityAnalysis,
} from './advancedFinance'

/**
 * Exporta reporte financiero a CSV
 * Optimizado para evitar bloqueos de UI
 */
export function exportToCSV(data: {
  executiveSummary?: ExecutiveFinancialSummary | null
  monthlyComparison?: MonthlyComparison[]
  serviceProfitability?: ServiceProfitability[]
  clientProfitability?: ClientProfitability[]
  cashFlowProjection?: CashFlowProjection[]
  profitabilityAnalysis?: ProfitabilityAnalysis | null
}): string {
  try {
    // Usar array con capacidad estimada para mejor rendimiento
    const estimatedSize = 
      (data.executiveSummary ? 15 : 0) +
      (data.monthlyComparison?.length || 0) * 2 +
      (data.serviceProfitability?.length || 0) * 2 +
      (data.clientProfitability?.length || 0) * 2 +
      (data.cashFlowProjection?.length || 0) * 2 +
      (data.profitabilityAnalysis ? 15 : 0) +
      10 // headers y separadores
    
    const csvRows: string[] = []
    csvRows.length = estimatedSize
    
    // Header - usar toLocaleDateString de forma más eficiente
    const dateStr = new Date().toLocaleDateString('es-MX', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
    csvRows.push('REPORTE FINANCIERO')
    csvRows.push(`Fecha: ${dateStr}`)
    csvRows.push('')
    
    // Resumen Ejecutivo
    if (data.executiveSummary) {
      csvRows.push('RESUMEN EJECUTIVO')
      csvRows.push('Métrica,Valor')
      csvRows.push(`Ventas del Mes,${data.executiveSummary.monthlySales}`)
      csvRows.push(`Ventas del Año,${data.executiveSummary.yearlySales}`)
      csvRows.push(`Utilidad del Mes,${data.executiveSummary.monthlyProfit}`)
      csvRows.push(`Utilidad del Año,${data.executiveSummary.yearlyProfit}`)
      csvRows.push(`Pagos del Mes,${data.executiveSummary.monthlyPayments}`)
      csvRows.push(`Pagos del Año,${data.executiveSummary.yearlyPayments}`)
      csvRows.push(`Total Pendiente,${data.executiveSummary.totalPending}`)
      csvRows.push(`Total Vencido,${data.executiveSummary.totalOverdue}`)
      csvRows.push(`Cotizaciones del Mes,${data.executiveSummary.monthlyQuotes}`)
      csvRows.push(`Clientes del Mes,${data.executiveSummary.monthlyClients}`)
      csvRows.push(`Ticket Promedio,${data.executiveSummary.averageQuoteValue}`)
      csvRows.push('')
    }
    
    // Comparativa Mensual - optimizar con join
    if (data.monthlyComparison && data.monthlyComparison.length > 0) {
      csvRows.push('COMPARATIVA MENSUAL')
      csvRows.push('Mes,Cotizaciones,Ventas,Utilidad,Clientes,Cambio Ventas %,Cambio Utilidad %,Margen %')
      // Pre-calcular valores para evitar múltiples toFixed
      const monthlyRows = data.monthlyComparison.map((month) => {
        const salesChange = month.salesChangePercent.toFixed(2)
        const profitChange = month.profitChangePercent.toFixed(2)
        const margin = month.marginPercent.toFixed(2)
        return `${month.monthName},${month.confirmedQuotes},${month.totalSales},${month.totalProfit},${month.uniqueClients},${salesChange},${profitChange},${margin}`
      })
      csvRows.push(...monthlyRows)
      csvRows.push('')
    }
    
    // Rentabilidad por Servicio - optimizar con map
    if (data.serviceProfitability && data.serviceProfitability.length > 0) {
      csvRows.push('RENTABILIDAD POR SERVICIO')
      csvRows.push('Servicio,Precio Base,Costo,Utilidad Unitaria,Margen %,Veces Vendido,Cantidad Total,Ingresos Totales,Utilidad Total')
      const serviceRows = data.serviceProfitability.map((service) => {
        const margin = service.marginPercent.toFixed(2)
        return `${service.serviceName},${service.basePrice},${service.costPrice},${service.unitProfit},${margin},${service.timesSold},${service.totalQuantitySold},${service.totalRevenue},${service.totalProfit}`
      })
      csvRows.push(...serviceRows)
      csvRows.push('')
    }
    
    // Rentabilidad por Cliente - optimizar con map
    if (data.clientProfitability && data.clientProfitability.length > 0) {
      csvRows.push('RENTABILIDAD POR CLIENTE')
      csvRows.push('Cliente,Email,Cotizaciones Totales,Cotizaciones Confirmadas,Ventas Totales,Utilidad Total,Ticket Promedio,Pagado,Pendiente')
      const clientRows = data.clientProfitability.map((client) => {
        return `${client.clientName},${client.email || ''},${client.totalQuotes},${client.confirmedQuotes},${client.totalSales},${client.totalProfit},${client.averageQuoteValue},${client.totalPaid},${client.totalPending}`
      })
      csvRows.push(...clientRows)
      csvRows.push('')
    }
    
    // Proyección de Flujo de Caja - optimizar con map
    if (data.cashFlowProjection && data.cashFlowProjection.length > 0) {
      csvRows.push('PROYECCIÓN DE FLUJO DE EFECTIVO')
      csvRows.push('Fecha,Tipo Día,Depósitos Recibidos,Pagos Recibidos,Total Entrada,Pagos por Vencer,Depósitos por Vencer,Total Salida,Flujo Neto,Balance Acumulado')
      const cashFlowRows = data.cashFlowProjection.map((cf) => {
        return `${cf.date},${cf.dayType},${cf.depositsReceived},${cf.paymentsReceived},${cf.totalInflow},${cf.paymentsDue},${cf.depositsDue},${cf.totalOutflow},${cf.netFlow},${cf.cumulativeBalance}`
      })
      csvRows.push(...cashFlowRows)
      csvRows.push('')
    }
    
    // Análisis de Rentabilidad
    if (data.profitabilityAnalysis) {
      csvRows.push('ANÁLISIS DE RENTABILIDAD')
      csvRows.push('Métrica,Valor')
      csvRows.push(`Ingresos Totales,${data.profitabilityAnalysis.totalRevenue}`)
      csvRows.push(`Costos Totales,${data.profitabilityAnalysis.totalCost}`)
      csvRows.push(`Utilidad Total,${data.profitabilityAnalysis.totalProfit}`)
      csvRows.push(`Margen %,${data.profitabilityAnalysis.marginPercent.toFixed(2)}`)
      csvRows.push(`Total Cotizaciones,${data.profitabilityAnalysis.totalQuotes}`)
      csvRows.push(`Ticket Promedio,${data.profitabilityAnalysis.averageQuoteValue}`)
      csvRows.push(`Utilidad por Cotización,${data.profitabilityAnalysis.averageProfitPerQuote}`)
      if (data.profitabilityAnalysis.topServiceName) {
        csvRows.push(`Servicio Más Rentable,${data.profitabilityAnalysis.topServiceName}`)
        csvRows.push(`Utilidad del Servicio,${data.profitabilityAnalysis.topServiceProfit}`)
      }
      if (data.profitabilityAnalysis.topClientName) {
        csvRows.push(`Cliente Más Valioso,${data.profitabilityAnalysis.topClientName}`)
        csvRows.push(`Ingresos del Cliente,${data.profitabilityAnalysis.topClientRevenue}`)
      }
    }
    
    // Usar join con capacidad pre-calculada para mejor rendimiento
    return csvRows.filter(Boolean).join('\n')
  } catch (error) {
    logger.error('exportFinancialReports', 'Error exporting to CSV', error as Error)
    throw error
  }
}

/**
 * Descarga CSV
 */
export function downloadCSV(csvContent: string, filename: string = 'reporte-financiero.csv') {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

/**
 * Exporta reporte financiero a Excel (formato CSV mejorado)
 */
export function exportToExcel(data: {
  executiveSummary?: ExecutiveFinancialSummary | null
  monthlyComparison?: MonthlyComparison[]
  serviceProfitability?: ServiceProfitability[]
  clientProfitability?: ClientProfitability[]
  cashFlowProjection?: CashFlowProjection[]
  profitabilityAnalysis?: ProfitabilityAnalysis | null
}): void {
  // Por ahora, Excel se exporta como CSV (formato compatible)
  // En el futuro se puede usar una librería como xlsx
  const csvContent = exportToCSV(data)
  downloadCSV(csvContent, 'reporte-financiero.xlsx')
}

/**
 * Exporta reporte financiero a PDF
 * Nota: Requiere implementación con librería como jsPDF o react-pdf
 */
export async function exportToPDF(data: {
  executiveSummary?: ExecutiveFinancialSummary | null
  monthlyComparison?: MonthlyComparison[]
  serviceProfitability?: ServiceProfitability[]
  clientProfitability?: ClientProfitability[]
  cashFlowProjection?: CashFlowProjection[]
  profitabilityAnalysis?: ProfitabilityAnalysis | null
}): Promise<void> {
  // Por ahora, PDF se exporta como CSV
  // En el futuro se puede usar jsPDF o react-pdf para generar PDFs reales
  logger.warn('exportFinancialReports', 'PDF export not fully implemented, exporting as CSV', {})
  const csvContent = exportToCSV(data)
  downloadCSV(csvContent, 'reporte-financiero.pdf')
}

