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
    const csvRows: string[] = []
    
    // Header
    csvRows.push('REPORTE FINANCIERO')
    csvRows.push(`Fecha: ${new Date().toLocaleDateString('es-MX')}`)
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
    
    // Comparativa Mensual
    if (data.monthlyComparison && data.monthlyComparison.length > 0) {
      csvRows.push('COMPARATIVA MENSUAL')
      csvRows.push('Mes,Cotizaciones,Ventas,Utilidad,Clientes,Cambio Ventas %,Cambio Utilidad %,Margen %')
      data.monthlyComparison.forEach((month) => {
        csvRows.push(
          `${month.monthName},${month.confirmedQuotes},${month.totalSales},${month.totalProfit},${month.uniqueClients},${month.salesChangePercent.toFixed(2)},${month.profitChangePercent.toFixed(2)},${month.marginPercent.toFixed(2)}`
        )
      })
      csvRows.push('')
    }
    
    // Rentabilidad por Servicio
    if (data.serviceProfitability && data.serviceProfitability.length > 0) {
      csvRows.push('RENTABILIDAD POR SERVICIO')
      csvRows.push('Servicio,Precio Base,Costo,Utilidad Unitaria,Margen %,Veces Vendido,Cantidad Total,Ingresos Totales,Utilidad Total')
      data.serviceProfitability.forEach((service) => {
        csvRows.push(
          `${service.serviceName},${service.basePrice},${service.costPrice},${service.unitProfit},${service.marginPercent.toFixed(2)},${service.timesSold},${service.totalQuantitySold},${service.totalRevenue},${service.totalProfit}`
        )
      })
      csvRows.push('')
    }
    
    // Rentabilidad por Cliente
    if (data.clientProfitability && data.clientProfitability.length > 0) {
      csvRows.push('RENTABILIDAD POR CLIENTE')
      csvRows.push('Cliente,Email,Cotizaciones Totales,Cotizaciones Confirmadas,Ventas Totales,Utilidad Total,Ticket Promedio,Pagado,Pendiente')
      data.clientProfitability.forEach((client) => {
        csvRows.push(
          `${client.clientName},${client.email || ''},${client.totalQuotes},${client.confirmedQuotes},${client.totalSales},${client.totalProfit},${client.averageQuoteValue},${client.totalPaid},${client.totalPending}`
        )
      })
      csvRows.push('')
    }
    
    // Proyección de Flujo de Caja
    if (data.cashFlowProjection && data.cashFlowProjection.length > 0) {
      csvRows.push('PROYECCIÓN DE FLUJO DE EFECTIVO')
      csvRows.push('Fecha,Tipo Día,Depósitos Recibidos,Pagos Recibidos,Total Entrada,Pagos por Vencer,Depósitos por Vencer,Total Salida,Flujo Neto,Balance Acumulado')
      data.cashFlowProjection.forEach((cf) => {
        csvRows.push(
          `${cf.date},${cf.dayType},${cf.depositsReceived},${cf.paymentsReceived},${cf.totalInflow},${cf.paymentsDue},${cf.depositsDue},${cf.totalOutflow},${cf.netFlow},${cf.cumulativeBalance}`
        )
      })
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
    
    return csvRows.join('\n')
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

