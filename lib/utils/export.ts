/**
 * Utilidades para exportación de datos
 */

import jsPDF from 'jspdf'
import 'jspdf-autotable'
import { logger } from '@/lib/utils/logger'

interface Quote {
  id: string
  client?: { name: string; email: string }
  total_price: number
  status: string
  created_at?: string
  quote_services?: Array<{
    service?: { name: string }
    quantity: number
    final_price: number
  }>
}

/**
 * Exportar cotización a PDF
 */
interface PDFWithAutoTable {
  autoTable?: (opts: unknown) => void
  lastAutoTable?: { finalY?: number }
}

export function exportQuoteToPDF(quote: Quote): void {
  try {
    const pdf = new jsPDF()

    // Título
    pdf.setFontSize(16)
    pdf.text('Cotización', 20, 20)

    // Info básica
    pdf.setFontSize(11)
    pdf.text(`ID: ${quote.id}`, 20, 35)
    pdf.text(`Cliente: ${quote.client?.name || 'N/A'}`, 20, 45)
    pdf.text(`Email: ${quote.client?.email || 'N/A'}`, 20, 55)
    pdf.text(`Estado: ${quote.status}`, 20, 65)
    pdf.text(`Fecha: ${new Date(quote.created_at || Date.now()).toLocaleDateString('es-MX')}`, 20, 75)

    // Tabla de servicios
    if (quote.quote_services && quote.quote_services.length > 0) {
      const tableData = quote.quote_services.map((qs) => [
        qs.service?.name || 'N/A',
        String(qs.quantity),
        `$${qs.final_price.toLocaleString('es-MX')}`,
        `$${(qs.quantity * qs.final_price).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`,
      ])

      ;(pdf as unknown as PDFWithAutoTable).autoTable?.({
        head: [['Servicio', 'Cantidad', 'Precio Unitario', 'Subtotal']],
        body: tableData,
        startY: 90,
        theme: 'grid',
        headerStyles: { fillColor: [59, 130, 246] },
      })
    }

    // Total
    const finalY = (pdf as unknown as PDFWithAutoTable).lastAutoTable?.finalY || 150
    pdf.setFontSize(12)
    pdf.text(
      `Total: $${quote.total_price.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`,
      20,
      finalY + 20
    )

    // Descargar
    pdf.save(`cotizacion-${quote.id}.pdf`)
    logger.info('exportQuoteToPDF', 'PDF exported successfully', { quoteId: quote.id })
  } catch (error) {
    logger.error('exportQuoteToPDF', 'Error exporting PDF', error instanceof Error ? error : new Error(String(error)))
    throw new Error('Error al exportar PDF')
  }
}

/**
 * Exportar a CSV
 */
export function exportToCSV<T extends Record<string, unknown>>(
  data: T[],
  filename: string,
  headers?: Record<string, string>
): void {
  try {
    if (data.length === 0) {
      throw new Error('No hay datos para exportar')
    }

    // Obtener headers de la data o usar los proporcionados
    const keys = Object.keys(data[0])
    const headerRow = headers ? keys.map((k) => headers[k] || k) : keys

    // Crear CSV
    const csvContent = [
      headerRow.join(','),
      ...data.map((row) =>
        keys.map((key) => {
          const value = row[key] as unknown
          // Escapar comillas y envolver en comillas si contiene comas
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`
          }
          return value
        }).join(',')
      ),
    ].join('\n')

    // Crear blob y descargar
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `${filename}.csv`)
    link.click()

    logger.info('exportToCSV', 'CSV exported successfully', { filename, rowCount: data.length })
  } catch (error) {
    logger.error('exportToCSV', 'Error exporting CSV', error instanceof Error ? error : new Error(String(error)))
    throw error
  }
}

/**
 * Exportar múltiples cotizaciones a CSV
 */
export function exportQuotesToCSV(quotes: Quote[]): void {
  const data = quotes.map((q) => ({
    id: q.id,
    cliente: q.client?.name || 'N/A',
    email: q.client?.email || 'N/A',
    total: q.total_price,
    estado: q.status,
    fecha: new Date(q.created_at || Date.now()).toLocaleDateString('es-MX'),
  }))

  exportToCSV(data, 'cotizaciones', {
    id: 'ID',
    cliente: 'Cliente',
    email: 'Email',
    total: 'Total',
    estado: 'Estado',
    fecha: 'Fecha',
  })
}
