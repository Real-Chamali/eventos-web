/**
 * Generador de Contratos Digitales
 * Crea contratos profesionales desde cotizaciones
 */

import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  createPDFDocument,
  addHeader,
  addFooter,
  addTable,
  addSignatureLines,
  addTotalSection,
  ensurePageSpace,
  addTwoColumnInfo,
  type PDFTableColumn,
  type PDFTableData,
} from '@/lib/utils/pdfTemplates'

export interface ContractData {
  quoteId: string
  clientName: string
  clientEmail: string
  clientAddress?: string
  vendorName: string
  vendorEmail: string
  vendorAddress?: string
  eventDate?: string
  eventLocation?: string
  services: Array<{
    name: string
    quantity: number
    unitPrice: number
    total: number
  }>
  totalAmount: number
  paymentTerms: string
  cancellationPolicy: string
  notes?: string
}

export async function generateContractPDF(data: ContractData): Promise<Blob> {
  const doc = createPDFDocument()
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 20

  // Header con logo
  let yPos = await addHeader(doc, 'CONTRATO DE SERVICIOS')

  // Información del contrato
  doc.setFontSize(10)
  doc.setTextColor(107, 114, 128)
  doc.setFont('helvetica', 'normal')
  doc.text(`Contrato #${data.quoteId.slice(0, 8).toUpperCase()}`, pageWidth / 2, yPos - 5, { align: 'center' })
  doc.text(
    `Fecha: ${format(new Date(), "dd 'de' MMMM, yyyy", { locale: es })}`,
    pageWidth / 2,
    yPos,
    { align: 'center' }
  )
  yPos += 15

  // Información de las partes en dos columnas
  const vendorData = [
    { label: 'Nombre', value: data.vendorName },
    { label: 'Email', value: data.vendorEmail },
  ]
  if (data.vendorAddress) {
    vendorData.push({ label: 'Dirección', value: data.vendorAddress })
  }

  const clientData = [
    { label: 'Nombre', value: data.clientName },
    { label: 'Email', value: data.clientEmail },
  ]
  if (data.clientAddress) {
    clientData.push({ label: 'Dirección', value: data.clientAddress })
  }

  yPos = addTwoColumnInfo(doc, 'PROVEEDOR', vendorData, 'CLIENTE', clientData, yPos)

  // Servicios contratados
  yPos = ensurePageSpace(doc, 50, yPos)
  yPos += 5

  doc.setFontSize(12)
  doc.setTextColor(59, 130, 246)
  doc.setFont('helvetica', 'bold')
  doc.text('SERVICIOS CONTRATADOS', margin, yPos)
  yPos += 10

  const serviceColumns: PDFTableColumn[] = [
    { header: 'Servicio', dataKey: 'service' },
    { header: 'Cantidad', dataKey: 'quantity', align: 'center' },
    { header: 'Precio Unitario', dataKey: 'unitPrice', align: 'right' },
    { header: 'Total', dataKey: 'total', align: 'right' },
  ]

  const serviceData: PDFTableData[] = data.services.map((s) => ({
    service: s.name,
    quantity: s.quantity.toString(),
    unitPrice: `$${s.unitPrice.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`,
    total: `$${s.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`,
  }))

  yPos = addTable(doc, serviceData, serviceColumns, yPos)

  // Total
  yPos = ensurePageSpace(doc, 30, yPos)
  yPos = addTotalSection(doc, 'TOTAL', data.totalAmount, yPos)

  // Términos y condiciones
  yPos = ensurePageSpace(doc, 50, yPos)
  yPos += 10

  doc.setFontSize(12)
  doc.setTextColor(59, 130, 246)
  doc.setFont('helvetica', 'bold')
  doc.text('TÉRMINOS Y CONDICIONES', margin, yPos)
  yPos += 10

  doc.setFontSize(10)
  doc.setTextColor(75, 85, 99)
  doc.setFont('helvetica', 'normal')

  const terms: string[] = []
  if (data.eventDate) {
    terms.push(`Fecha del Evento: ${format(new Date(data.eventDate), "dd 'de' MMMM, yyyy", { locale: es })}`)
  }
  if (data.eventLocation) {
    terms.push(`Ubicación: ${data.eventLocation}`)
  }
  terms.push(`Términos de Pago: ${data.paymentTerms}`)
  terms.push(`Política de Cancelación: ${data.cancellationPolicy}`)

  terms.forEach((term) => {
    const lines = doc.splitTextToSize(term, pageWidth - 2 * margin)
    lines.forEach((line: string) => {
      yPos = ensurePageSpace(doc, 10, yPos)
      doc.text(line, margin, yPos)
      yPos += 6
    })
    yPos += 3
  })

  // Notas adicionales
  if (data.notes) {
    yPos = ensurePageSpace(doc, 30, yPos)
    yPos += 5

    doc.setFontSize(11)
    doc.setTextColor(59, 130, 246)
    doc.setFont('helvetica', 'bold')
    doc.text('NOTAS ADICIONALES', margin, yPos)
    yPos += 7

    doc.setFontSize(10)
    doc.setTextColor(75, 85, 99)
    doc.setFont('helvetica', 'normal')
    const notesLines = doc.splitTextToSize(data.notes, pageWidth - 2 * margin)
    notesLines.forEach((line: string) => {
      yPos = ensurePageSpace(doc, 10, yPos)
      doc.text(line, margin, yPos)
      yPos += 6
    })
  }

  // Líneas de firma
  yPos = ensurePageSpace(doc, 40, yPos)
  yPos += 20
  yPos = addSignatureLines(doc, yPos, 'Proveedor', 'Cliente')

  // Agregar footer en todas las páginas
  const totalPages = doc.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    addFooter(doc, i, totalPages)
  }

  return doc.output('blob')
}

export function downloadContract(blob: Blob, filename: string = 'contrato.pdf') {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

