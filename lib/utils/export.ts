/**
 * Utilidades para exportación de datos
 */

import jsPDF from 'jspdf'
import 'jspdf-autotable'
import { logger } from '@/lib/utils/logger'
import {
  createPDFDocument,
  addHeader,
  addFooter,
  addTable,
  addTotalSection,
  ensurePageSpace,
  addTwoColumnInfo,
  type PDFTableColumn,
  type PDFTableData,
} from '@/lib/utils/pdfTemplates'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface Quote {
  id: string
  client?: { name: string; email: string; phone?: string }
  vendor?: { name?: string; email?: string }
  total_price: number
  status: string
  created_at?: string
  updated_at?: string
  event_date?: string | null
  notes?: string | null
  quote_services?: Array<{
    service?: { name: string }
    quantity: number
    final_price: number
  }>
}

/**
 * Exportar cotización a PDF con diseño profesional
 */
export async function exportQuoteToPDF(quote: Quote): Promise<void> {
  try {
    const doc = createPDFDocument()
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const margin = 20

    // Agregar header con logo
    let yPos = await addHeader(doc, 'COTIZACIÓN')

    // Información de la cotización y cliente
    const quoteDate = quote.created_at
      ? format(new Date(quote.created_at), "dd 'de' MMMM, yyyy", { locale: es })
      : format(new Date(), "dd 'de' MMMM, yyyy", { locale: es })

    const statusLabels: Record<string, string> = {
      DRAFT: 'Borrador',
      APPROVED: 'Aprobada',
      REJECTED: 'Rechazada',
      draft: 'Borrador',
      approved: 'Aprobada',
      rejected: 'Rechazada',
      confirmed: 'Confirmada',
      cancelled: 'Cancelada',
    }

    const statusLabel = statusLabels[quote.status] || quote.status

    // Información en dos columnas
    const leftData = [
      { label: 'ID Cotización', value: quote.id.slice(0, 8).toUpperCase() },
      { label: 'Fecha', value: quoteDate },
      { label: 'Estado', value: statusLabel },
    ]

    if (quote.event_date) {
      leftData.push({
        label: 'Fecha del Evento',
        value: format(new Date(quote.event_date), "dd 'de' MMMM, yyyy", { locale: es }),
      })
    }

    const rightData = [
      { label: 'Cliente', value: quote.client?.name || 'N/A' },
      { label: 'Email', value: quote.client?.email || 'N/A' },
    ]

    if (quote.client?.phone) {
      rightData.push({ label: 'Teléfono', value: quote.client.phone })
    }

    yPos = addTwoColumnInfo(doc, 'INFORMACIÓN DE LA COTIZACIÓN', leftData, 'INFORMACIÓN DEL CLIENTE', rightData, yPos)

    // Espacio antes de la tabla
    yPos += 5

    // Tabla de servicios
    if (quote.quote_services && quote.quote_services.length > 0) {
      yPos = ensurePageSpace(doc, 50, yPos)

      const tableColumns: PDFTableColumn[] = [
        { header: 'Servicio', dataKey: 'service' },
        { header: 'Cantidad', dataKey: 'quantity', align: 'center' },
        { header: 'Precio Unitario', dataKey: 'unitPrice', align: 'right' },
        { header: 'Subtotal', dataKey: 'subtotal', align: 'right' },
      ]

      const tableData: PDFTableData[] = quote.quote_services.map((qs) => ({
        service: qs.service?.name || 'N/A',
        quantity: qs.quantity.toString(),
        unitPrice: `$${qs.final_price.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`,
        subtotal: `$${(qs.quantity * qs.final_price).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`,
      }))

      yPos = addTable(doc, tableData, tableColumns, yPos)
    }

    // Sección de totales
    yPos = ensurePageSpace(doc, 30, yPos)
    yPos = addTotalSection(doc, 'TOTAL', quote.total_price, yPos)

    // Notas adicionales si existen
    if (quote.notes) {
      yPos = ensurePageSpace(doc, 30, yPos)
      yPos += 10

      doc.setFontSize(11)
      doc.setTextColor(59, 130, 246)
      doc.setFont('helvetica', 'bold')
      doc.text('NOTAS ADICIONALES', margin, yPos)
      yPos += 7

      doc.setFontSize(9)
      doc.setTextColor(75, 85, 99)
      doc.setFont('helvetica', 'normal')
      const notesLines = doc.splitTextToSize(quote.notes, pageWidth - 2 * margin)
      notesLines.forEach((line: string) => {
        yPos = ensurePageSpace(doc, 10, yPos)
        doc.text(line, margin, yPos)
        yPos += 5
      })
    }

    // Agregar footer en todas las páginas
    const totalPages = doc.getNumberOfPages()
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i)
      addFooter(doc, i, totalPages)
    }

    // Descargar
    doc.save(`cotizacion-${quote.id.slice(0, 8)}.pdf`)
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
