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
import type { PDFTableColumn, PDFTableData } from './pdfTemplates'

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
 * Exporta reporte financiero a PDF con diseño profesional
 */
export async function exportToPDF(data: {
  executiveSummary?: ExecutiveFinancialSummary | null
  monthlyComparison?: MonthlyComparison[]
  serviceProfitability?: ServiceProfitability[]
  clientProfitability?: ClientProfitability[]
  cashFlowProjection?: CashFlowProjection[]
  profitabilityAnalysis?: ProfitabilityAnalysis | null
}): Promise<void> {
  try {
    const pdfTemplates = await import('@/lib/utils/pdfTemplates')
    const { createPDFDocument, addHeader, addFooter, addTable, ensurePageSpace } = pdfTemplates
    const { format } = await import('date-fns')
    const { es } = await import('date-fns/locale')

    const doc = createPDFDocument()
    const pageWidth = doc.internal.pageSize.getWidth()
    const margin = 20

    // Header
    let yPos = await addHeader(doc, 'REPORTE FINANCIERO')

    // Fecha del reporte
    const reportDate = format(new Date(), "dd 'de' MMMM, yyyy", { locale: es })
    doc.setFontSize(9)
    doc.setTextColor(107, 114, 128)
    doc.setFont('helvetica', 'normal')
    doc.text(`Generado el: ${reportDate}`, pageWidth - margin, yPos - 5, { align: 'right' })
    yPos += 10

    // Resumen Ejecutivo
    if (data.executiveSummary) {
      yPos = ensurePageSpace(doc, 80, yPos)

      doc.setFontSize(14)
      doc.setTextColor(59, 130, 246)
      doc.setFont('helvetica', 'bold')
      doc.text('RESUMEN EJECUTIVO', margin, yPos)
      yPos += 10

      const summaryColumns: PDFTableColumn[] = [
        { header: 'Métrica', dataKey: 'metric' },
        { header: 'Valor', dataKey: 'value', align: 'right' },
      ]

      const summaryData: PDFTableData[] = [
        { metric: 'Ventas del Mes', value: `$${data.executiveSummary.monthlySales.toLocaleString('es-MX', { minimumFractionDigits: 2 })}` },
        { metric: 'Ventas del Año', value: `$${data.executiveSummary.yearlySales.toLocaleString('es-MX', { minimumFractionDigits: 2 })}` },
        { metric: 'Utilidad del Mes', value: `$${data.executiveSummary.monthlyProfit.toLocaleString('es-MX', { minimumFractionDigits: 2 })}` },
        { metric: 'Utilidad del Año', value: `$${data.executiveSummary.yearlyProfit.toLocaleString('es-MX', { minimumFractionDigits: 2 })}` },
        { metric: 'Pagos del Mes', value: `$${data.executiveSummary.monthlyPayments.toLocaleString('es-MX', { minimumFractionDigits: 2 })}` },
        { metric: 'Pagos del Año', value: `$${data.executiveSummary.yearlyPayments.toLocaleString('es-MX', { minimumFractionDigits: 2 })}` },
        { metric: 'Total Pendiente', value: `$${data.executiveSummary.totalPending.toLocaleString('es-MX', { minimumFractionDigits: 2 })}` },
        { metric: 'Total Vencido', value: `$${data.executiveSummary.totalOverdue.toLocaleString('es-MX', { minimumFractionDigits: 2 })}` },
        { metric: 'Cotizaciones del Mes', value: data.executiveSummary.monthlyQuotes.toString() },
        { metric: 'Clientes del Mes', value: data.executiveSummary.monthlyClients.toString() },
        { metric: 'Ticket Promedio', value: `$${data.executiveSummary.averageQuoteValue.toLocaleString('es-MX', { minimumFractionDigits: 2 })}` },
      ]

      yPos = addTable(doc, summaryData, summaryColumns, yPos)
      yPos += 5
    }

    // Comparativa Mensual
    if (data.monthlyComparison && data.monthlyComparison.length > 0) {
      yPos = ensurePageSpace(doc, 60, yPos)

      doc.setFontSize(14)
      doc.setTextColor(59, 130, 246)
      doc.setFont('helvetica', 'bold')
      doc.text('COMPARATIVA MENSUAL', margin, yPos)
      yPos += 10

      const monthlyColumns: PDFTableColumn[] = [
        { header: 'Mes', dataKey: 'month' },
        { header: 'Cotizaciones', dataKey: 'quotes', align: 'center' },
        { header: 'Ventas', dataKey: 'sales', align: 'right' },
        { header: 'Utilidad', dataKey: 'profit', align: 'right' },
        { header: 'Clientes', dataKey: 'clients', align: 'center' },
        { header: 'Cambio Ventas %', dataKey: 'salesChange', align: 'right' },
        { header: 'Cambio Utilidad %', dataKey: 'profitChange', align: 'right' },
        { header: 'Margen %', dataKey: 'margin', align: 'right' },
      ]

      const monthlyData: PDFTableData[] = data.monthlyComparison.map((month) => ({
        month: month.monthName,
        quotes: month.confirmedQuotes.toString(),
        sales: `$${month.totalSales.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`,
        profit: `$${month.totalProfit.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`,
        clients: month.uniqueClients.toString(),
        salesChange: `${month.salesChangePercent.toFixed(2)}%`,
        profitChange: `${month.profitChangePercent.toFixed(2)}%`,
        margin: `${month.marginPercent.toFixed(2)}%`,
      }))

      yPos = addTable(doc, monthlyData, monthlyColumns, yPos)
      yPos += 5
    }

    // Rentabilidad por Servicio
    if (data.serviceProfitability && data.serviceProfitability.length > 0) {
      yPos = ensurePageSpace(doc, 60, yPos)

      doc.setFontSize(14)
      doc.setTextColor(59, 130, 246)
      doc.setFont('helvetica', 'bold')
      doc.text('RENTABILIDAD POR SERVICIO', margin, yPos)
      yPos += 10

      const serviceColumns: PDFTableColumn[] = [
        { header: 'Servicio', dataKey: 'service' },
        { header: 'Precio Base', dataKey: 'basePrice', align: 'right' },
        { header: 'Costo', dataKey: 'cost', align: 'right' },
        { header: 'Utilidad Unitaria', dataKey: 'unitProfit', align: 'right' },
        { header: 'Margen %', dataKey: 'margin', align: 'right' },
        { header: 'Veces Vendido', dataKey: 'timesSold', align: 'center' },
        { header: 'Cantidad Total', dataKey: 'quantity', align: 'center' },
        { header: 'Ingresos Totales', dataKey: 'revenue', align: 'right' },
        { header: 'Utilidad Total', dataKey: 'profit', align: 'right' },
      ]

      const serviceData: PDFTableData[] = data.serviceProfitability.map((service) => ({
        service: service.serviceName,
        basePrice: `$${service.basePrice.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`,
        cost: `$${service.costPrice.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`,
        unitProfit: `$${service.unitProfit.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`,
        margin: `${service.marginPercent.toFixed(2)}%`,
        timesSold: service.timesSold.toString(),
        quantity: service.totalQuantitySold.toString(),
        revenue: `$${service.totalRevenue.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`,
        profit: `$${service.totalProfit.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`,
      }))

      yPos = addTable(doc, serviceData, serviceColumns, yPos)
      yPos += 5
    }

    // Rentabilidad por Cliente
    if (data.clientProfitability && data.clientProfitability.length > 0) {
      yPos = ensurePageSpace(doc, 60, yPos)

      doc.setFontSize(14)
      doc.setTextColor(59, 130, 246)
      doc.setFont('helvetica', 'bold')
      doc.text('RENTABILIDAD POR CLIENTE', margin, yPos)
      yPos += 10

      const clientColumns: PDFTableColumn[] = [
        { header: 'Cliente', dataKey: 'client' },
        { header: 'Email', dataKey: 'email' },
        { header: 'Cotizaciones Totales', dataKey: 'totalQuotes', align: 'center' },
        { header: 'Cotizaciones Confirmadas', dataKey: 'confirmedQuotes', align: 'center' },
        { header: 'Ventas Totales', dataKey: 'sales', align: 'right' },
        { header: 'Utilidad Total', dataKey: 'profit', align: 'right' },
        { header: 'Ticket Promedio', dataKey: 'avgTicket', align: 'right' },
        { header: 'Pagado', dataKey: 'paid', align: 'right' },
        { header: 'Pendiente', dataKey: 'pending', align: 'right' },
      ]

      const clientData: PDFTableData[] = data.clientProfitability.map((client) => ({
        client: client.clientName,
        email: client.email || 'N/A',
        totalQuotes: client.totalQuotes.toString(),
        confirmedQuotes: client.confirmedQuotes.toString(),
        sales: `$${client.totalSales.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`,
        profit: `$${client.totalProfit.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`,
        avgTicket: `$${client.averageQuoteValue.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`,
        paid: `$${client.totalPaid.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`,
        pending: `$${client.totalPending.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`,
      }))

      yPos = addTable(doc, clientData, clientColumns, yPos)
      yPos += 5
    }

    // Proyección de Flujo de Caja
    if (data.cashFlowProjection && data.cashFlowProjection.length > 0) {
      yPos = ensurePageSpace(doc, 60, yPos)

      doc.setFontSize(14)
      doc.setTextColor(59, 130, 246)
      doc.setFont('helvetica', 'bold')
      doc.text('PROYECCIÓN DE FLUJO DE EFECTIVO', margin, yPos)
      yPos += 10

      const cashFlowColumns: PDFTableColumn[] = [
        { header: 'Fecha', dataKey: 'date' },
        { header: 'Tipo Día', dataKey: 'dayType' },
        { header: 'Depósitos Recibidos', dataKey: 'depositsReceived', align: 'right' },
        { header: 'Pagos Recibidos', dataKey: 'paymentsReceived', align: 'right' },
        { header: 'Total Entrada', dataKey: 'totalInflow', align: 'right' },
        { header: 'Pagos por Vencer', dataKey: 'paymentsDue', align: 'right' },
        { header: 'Depósitos por Vencer', dataKey: 'depositsDue', align: 'right' },
        { header: 'Total Salida', dataKey: 'totalOutflow', align: 'right' },
        { header: 'Flujo Neto', dataKey: 'netFlow', align: 'right' },
        { header: 'Balance Acumulado', dataKey: 'cumulativeBalance', align: 'right' },
      ]

      const cashFlowData: PDFTableData[] = data.cashFlowProjection.map((cf) => ({
        date: format(new Date(cf.date), 'dd/MM/yyyy', { locale: es }),
        dayType: cf.dayType === 'weekend' ? 'Fin de Semana' : 'Día Laboral',
        depositsReceived: `$${cf.depositsReceived.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`,
        paymentsReceived: `$${cf.paymentsReceived.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`,
        totalInflow: `$${cf.totalInflow.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`,
        paymentsDue: `$${cf.paymentsDue.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`,
        depositsDue: `$${cf.depositsDue.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`,
        totalOutflow: `$${cf.totalOutflow.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`,
        netFlow: `$${cf.netFlow.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`,
        cumulativeBalance: `$${cf.cumulativeBalance.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`,
      }))

      yPos = addTable(doc, cashFlowData, cashFlowColumns, yPos)
      yPos += 5
    }

    // Análisis de Rentabilidad
    if (data.profitabilityAnalysis) {
      yPos = ensurePageSpace(doc, 80, yPos)

      doc.setFontSize(14)
      doc.setTextColor(59, 130, 246)
      doc.setFont('helvetica', 'bold')
      doc.text('ANÁLISIS DE RENTABILIDAD', margin, yPos)
      yPos += 10

      const analysisColumns: PDFTableColumn[] = [
        { header: 'Métrica', dataKey: 'metric' },
        { header: 'Valor', dataKey: 'value', align: 'right' },
      ]

      const analysisData: PDFTableData[] = [
        { metric: 'Ingresos Totales', value: `$${data.profitabilityAnalysis.totalRevenue.toLocaleString('es-MX', { minimumFractionDigits: 2 })}` },
        { metric: 'Costos Totales', value: `$${data.profitabilityAnalysis.totalCost.toLocaleString('es-MX', { minimumFractionDigits: 2 })}` },
        { metric: 'Utilidad Total', value: `$${data.profitabilityAnalysis.totalProfit.toLocaleString('es-MX', { minimumFractionDigits: 2 })}` },
        { metric: 'Margen %', value: `${data.profitabilityAnalysis.marginPercent.toFixed(2)}%` },
        { metric: 'Total Cotizaciones', value: data.profitabilityAnalysis.totalQuotes.toString() },
        { metric: 'Ticket Promedio', value: `$${data.profitabilityAnalysis.averageQuoteValue.toLocaleString('es-MX', { minimumFractionDigits: 2 })}` },
        { metric: 'Utilidad por Cotización', value: `$${data.profitabilityAnalysis.averageProfitPerQuote.toLocaleString('es-MX', { minimumFractionDigits: 2 })}` },
      ]

      if (data.profitabilityAnalysis.topServiceName) {
        analysisData.push({
          metric: 'Servicio Más Rentable',
          value: data.profitabilityAnalysis.topServiceName,
        })
        analysisData.push({
          metric: 'Utilidad del Servicio',
          value: `$${data.profitabilityAnalysis.topServiceProfit.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`,
        })
      }

      if (data.profitabilityAnalysis.topClientName) {
        analysisData.push({
          metric: 'Cliente Más Valioso',
          value: data.profitabilityAnalysis.topClientName,
        })
        analysisData.push({
          metric: 'Ingresos del Cliente',
          value: `$${data.profitabilityAnalysis.topClientRevenue.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`,
        })
      }

      yPos = addTable(doc, analysisData, analysisColumns, yPos)
    }

    // Agregar footer en todas las páginas
    const totalPages = doc.getNumberOfPages()
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i)
      addFooter(doc, i, totalPages)
    }

    // Descargar
    const filename = `reporte-financiero-${format(new Date(), 'yyyy-MM-dd')}.pdf`
    doc.save(filename)
    logger.info('exportFinancialReports', 'PDF exported successfully', { filename })
  } catch (error) {
    logger.error('exportFinancialReports', 'Error exporting PDF', error as Error)
    // Fallback a CSV si hay error
    logger.warn('exportFinancialReports', 'Falling back to CSV export', {})
    const csvContent = exportToCSV(data)
    downloadCSV(csvContent, 'reporte-financiero.pdf')
  }
}

