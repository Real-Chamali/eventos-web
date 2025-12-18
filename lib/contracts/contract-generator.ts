/**
 * Generador de Contratos Digitales
 * Crea contratos profesionales desde cotizaciones
 */

import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

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
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 20

  // Header
  doc.setFontSize(20)
  doc.setTextColor(59, 130, 246)
  doc.text('CONTRATO DE SERVICIOS', pageWidth / 2, 30, { align: 'center' })

  doc.setFontSize(10)
  doc.setTextColor(107, 114, 128)
  doc.text(`Contrato #${data.quoteId.slice(0, 8)}`, pageWidth / 2, 40, { align: 'center' })
  doc.text(
    `Fecha: ${format(new Date(), "dd 'de' MMMM, yyyy", { locale: es })}`,
    pageWidth / 2,
    46,
    { align: 'center' }
  )

  let yPos = 60

  // Parties
  doc.setFontSize(12)
  doc.setTextColor(17, 24, 39)
  doc.text('PARTES', margin, yPos)

  yPos += 10
  doc.setFontSize(10)
  doc.text('PROVEEDOR:', margin, yPos)
  yPos += 6
  doc.text(data.vendorName, margin + 5, yPos)
  yPos += 6
  doc.text(data.vendorEmail, margin + 5, yPos)
  if (data.vendorAddress) {
    yPos += 6
    doc.text(data.vendorAddress, margin + 5, yPos)
  }

  yPos += 10
  doc.text('CLIENTE:', margin, yPos)
  yPos += 6
  doc.text(data.clientName, margin + 5, yPos)
  yPos += 6
  doc.text(data.clientEmail, margin + 5, yPos)
  if (data.clientAddress) {
    yPos += 6
    doc.text(data.clientAddress, margin + 5, yPos)
  }

  yPos += 15

  // Services
  doc.setFontSize(12)
  doc.setTextColor(17, 24, 39)
  doc.text('SERVICIOS CONTRATADOS', margin, yPos)

  yPos += 10
  const servicesData = data.services.map((s) => [
    s.name,
    s.quantity.toString(),
    `$${s.unitPrice.toLocaleString('es-MX')}`,
    `$${s.total.toLocaleString('es-MX')}`,
  ])

  autoTable(doc, {
    startY: yPos,
    head: [['Servicio', 'Cantidad', 'Precio Unitario', 'Total']],
    body: servicesData,
    theme: 'striped',
    headStyles: { fillColor: [59, 130, 246], textColor: 255 },
    styles: { fontSize: 9 },
    margin: { left: margin, right: margin },
  })

  yPos = ((doc as unknown) as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15

  // Total
  doc.setFontSize(11)
  doc.setTextColor(17, 24, 39)
  doc.text(
    `TOTAL: $${data.totalAmount.toLocaleString('es-MX')}`,
    pageWidth - margin,
    yPos,
    { align: 'right' }
  )

  yPos += 15

  // Terms
  doc.setFontSize(12)
  doc.setTextColor(17, 24, 39)
  doc.text('TÉRMINOS Y CONDICIONES', margin, yPos)

  yPos += 10
  doc.setFontSize(10)
  doc.setTextColor(75, 85, 99)

  const terms = [
    `Términos de Pago: ${data.paymentTerms}`,
    `Política de Cancelación: ${data.cancellationPolicy}`,
  ]

  if (data.eventDate) {
    terms.unshift(`Fecha del Evento: ${format(new Date(data.eventDate), "dd 'de' MMMM, yyyy", { locale: es })}`)
  }
  if (data.eventLocation) {
    terms.splice(1, 0, `Ubicación: ${data.eventLocation}`)
  }

  terms.forEach((term) => {
    const lines = doc.splitTextToSize(term, pageWidth - 2 * margin)
    lines.forEach((line: string) => {
      if (yPos > doc.internal.pageSize.getHeight() - 30) {
        doc.addPage()
        yPos = 20
      }
      doc.text(line, margin, yPos)
      yPos += 6
    })
    yPos += 3
  })

  if (data.notes) {
    yPos += 5
    doc.setFontSize(11)
    doc.setTextColor(17, 24, 39)
    doc.text('NOTAS ADICIONALES', margin, yPos)
    yPos += 6
    doc.setFontSize(10)
    doc.setTextColor(75, 85, 99)
    const notesLines = doc.splitTextToSize(data.notes, pageWidth - 2 * margin)
    notesLines.forEach((line: string) => {
      if (yPos > doc.internal.pageSize.getHeight() - 30) {
        doc.addPage()
        yPos = 20
      }
      doc.text(line, margin, yPos)
      yPos += 6
    })
  }

  // Signature lines
  if (yPos > doc.internal.pageSize.getHeight() - 60) {
    doc.addPage()
    yPos = 50
  } else {
    yPos += 20
  }

  doc.setFontSize(10)
  doc.setTextColor(17, 24, 39)
  doc.line(margin, yPos, margin + 60, yPos)
  doc.text('Proveedor', margin + 30, yPos + 10, { align: 'center' })

  doc.line(pageWidth - margin - 60, yPos, pageWidth - margin, yPos)
  doc.text('Cliente', pageWidth - margin - 30, yPos + 10, { align: 'center' })

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

