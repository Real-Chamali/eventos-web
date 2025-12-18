/**
 * Sistema de Reportes Avanzados
 * Genera reportes PDF y Excel profesionales
 */

import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export interface ReportData {
  title: string
  period: string
  summary: {
    totalRevenue: number
    totalQuotes: number
    confirmedQuotes: number
    conversionRate: number
  }
  quotes: Array<{
    id: string
    clientName: string
    totalPrice: number
    status: string
    createdAt: string
  }>
  monthlyData: Array<{
    month: string
    revenue: number
    quotes: number
  }>
}

export async function generatePDFReport(data: ReportData): Promise<Blob> {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()

  // Header
  doc.setFontSize(24)
  doc.setTextColor(59, 130, 246) // Blue-600
  doc.text(data.title, pageWidth / 2, 20, { align: 'center' })

  doc.setFontSize(12)
  doc.setTextColor(107, 114, 128) // Gray-600
  doc.text(`Período: ${data.period}`, pageWidth / 2, 30, { align: 'center' })
  doc.text(
    `Generado: ${format(new Date(), "dd 'de' MMMM, yyyy 'a las' HH:mm", { locale: es })}`,
    pageWidth / 2,
    36,
    { align: 'center' }
  )

  // Summary Section
  let yPos = 50
  doc.setFontSize(16)
  doc.setTextColor(17, 24, 39) // Gray-900
  doc.text('Resumen Ejecutivo', 14, yPos)

  yPos += 10
  doc.setFontSize(10)
  doc.setTextColor(75, 85, 99) // Gray-600

  const summaryData = [
    ['Ingresos Totales', `$${data.summary.totalRevenue.toLocaleString('es-MX')}`],
    ['Total Cotizaciones', data.summary.totalQuotes.toString()],
    ['Cotizaciones Confirmadas', data.summary.confirmedQuotes.toString()],
    ['Tasa de Conversión', `${data.summary.conversionRate.toFixed(1)}%`],
  ]

  autoTable(doc, {
    startY: yPos,
    head: [['Métrica', 'Valor']],
    body: summaryData,
    theme: 'striped',
    headStyles: { fillColor: [59, 130, 246], textColor: 255 },
    styles: { fontSize: 10 },
    margin: { left: 14, right: 14 },
  })

  yPos = ((doc as unknown) as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15

  // Monthly Data Chart
  if (data.monthlyData.length > 0) {
    doc.setFontSize(16)
    doc.setTextColor(17, 24, 39)
    doc.text('Ingresos Mensuales', 14, yPos)

    yPos += 10
    const monthlyTableData = data.monthlyData.map((m) => [
      m.month,
      `$${m.revenue.toLocaleString('es-MX')}`,
      m.quotes.toString(),
    ])

    autoTable(doc, {
      startY: yPos,
      head: [['Mes', 'Ingresos', 'Cotizaciones']],
      body: monthlyTableData,
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246], textColor: 255 },
      styles: { fontSize: 10 },
      margin: { left: 14, right: 14 },
    })

    yPos = ((doc as unknown) as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15
  }

  // Quotes Table
  if (data.quotes.length > 0) {
    // Check if we need a new page
    if (yPos > pageHeight - 60) {
      doc.addPage()
      yPos = 20
    }

    doc.setFontSize(16)
    doc.setTextColor(17, 24, 39)
    doc.text('Detalle de Cotizaciones', 14, yPos)

    yPos += 10
    const quotesTableData = data.quotes.map((q) => [
      q.id.slice(0, 8),
      q.clientName,
      `$${q.totalPrice.toLocaleString('es-MX')}`,
      q.status,
      format(new Date(q.createdAt), 'dd/MM/yyyy', { locale: es }),
    ])

    autoTable(doc, {
      startY: yPos,
      head: [['ID', 'Cliente', 'Monto', 'Estado', 'Fecha']],
      body: quotesTableData,
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246], textColor: 255 },
      styles: { fontSize: 9 },
      margin: { left: 14, right: 14 },
      pageBreak: 'auto',
    })
  }

  // Footer
  const totalPages = doc.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(156, 163, 175) // Gray-400
    doc.text(
      `Página ${i} de ${totalPages}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    )
  }

  return doc.output('blob')
}

export async function generateExcelReport(data: ReportData): Promise<Blob> {
  // Para Excel, usaremos CSV por simplicidad (se puede mejorar con xlsx library)
  const csvRows: string[] = []

  // Header
  csvRows.push(data.title)
  csvRows.push(`Período: ${data.period}`)
  csvRows.push('')

  // Summary
  csvRows.push('Resumen Ejecutivo')
  csvRows.push('Métrica,Valor')
  csvRows.push(`Ingresos Totales,${data.summary.totalRevenue}`)
  csvRows.push(`Total Cotizaciones,${data.summary.totalQuotes}`)
  csvRows.push(`Cotizaciones Confirmadas,${data.summary.confirmedQuotes}`)
  csvRows.push(`Tasa de Conversión,${data.summary.conversionRate.toFixed(1)}%`)
  csvRows.push('')

  // Monthly Data
  if (data.monthlyData.length > 0) {
    csvRows.push('Ingresos Mensuales')
    csvRows.push('Mes,Ingresos,Cotizaciones')
    data.monthlyData.forEach((m) => {
      csvRows.push(`${m.month},${m.revenue},${m.quotes}`)
    })
    csvRows.push('')
  }

  // Quotes
  if (data.quotes.length > 0) {
    csvRows.push('Detalle de Cotizaciones')
    csvRows.push('ID,Cliente,Monto,Estado,Fecha')
    data.quotes.forEach((q) => {
      csvRows.push(
        `${q.id.slice(0, 8)},${q.clientName},${q.totalPrice},${q.status},${format(new Date(q.createdAt), 'dd/MM/yyyy', { locale: es })}`
      )
    })
  }

  const csv = csvRows.join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  return blob
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

