/**
 * Sistema de templates PDF reutilizable
 * Proporciona funciones helper para crear PDFs consistentes y profesionales
 */

import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { BrandingConfig } from '@/lib/config/branding'
import { getBrandingConfig } from '@/lib/config/branding'
import { logger } from '@/lib/utils/logger'

export interface PDFTableColumn {
  header: string
  dataKey: string
  width?: number
  align?: 'left' | 'center' | 'right'
}

export interface PDFTableData {
  [key: string]: string | number
}

/**
 * Crea un documento PDF base con configuración estándar
 */
export function createPDFDocument(orientation: 'portrait' | 'landscape' = 'portrait'): jsPDF {
  const doc = new jsPDF({
    orientation,
    unit: 'mm',
    format: 'a4',
  })
  return doc
}

/**
 * Convierte una imagen a base64 para usar en jsPDF
 * Solo funciona en el cliente (browser)
 */
async function imageToBase64(imagePath: string): Promise<string | null> {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    // Asegurar que la ruta sea absoluta si es relativa
    const absolutePath = imagePath.startsWith('/') 
      ? `${window.location.origin}${imagePath}`
      : imagePath.startsWith('http') 
        ? imagePath 
        : `${window.location.origin}/${imagePath.replace(/^\//, '')}`
    
    const response = await fetch(absolutePath)
    if (!response.ok) {
      logger.warn('pdfTemplates', `Failed to fetch image: ${absolutePath}`, { status: response.status, statusText: response.statusText })
      return null
    }
    
    const blob = await response.blob()
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        const base64 = reader.result as string
        resolve(base64)
      }
      reader.onerror = () => {
        logger.warn('pdfTemplates', 'Failed to read image as base64', { error: 'FileReader error' })
        reject(new Error('Failed to read image'))
      }
      reader.readAsDataURL(blob)
    })
  } catch (error) {
    logger.warn('pdfTemplates', 'Failed to load image for PDF', { error: error instanceof Error ? error.message : String(error) })
    return null
  }
}

/**
 * Agrega un header profesional con logo y nombre de empresa
 */
export async function addHeader(
  doc: jsPDF,
  title: string,
  branding?: Partial<BrandingConfig>
): Promise<number> {
  const config = getBrandingConfig(branding)
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 20
  let yPos = 15

  // Intentar cargar y agregar logo
  if (config.logoPath) {
    try {
      const logoBase64 = await imageToBase64(config.logoPath)
      if (logoBase64) {
        // Logo pequeño en la esquina superior izquierda
        doc.addImage(logoBase64, 'PNG', margin, yPos, 30, 30)
      }
    } catch (error) {
      logger.warn('pdfTemplates', 'Failed to add logo to PDF header', error as Error)
    }
  }

  // Nombre de empresa
  doc.setFontSize(18)
  doc.setTextColor(...config.primaryColor)
  doc.setFont('helvetica', 'bold')
  const companyX = config.logoPath ? margin + 35 : margin
  doc.text(config.companyName, companyX, yPos + 10)

  // Título del documento
  yPos += 15
  doc.setFontSize(16)
  doc.setTextColor(17, 24, 39) // Gris oscuro
  doc.setFont('helvetica', 'bold')
  doc.text(title, margin, yPos)

  // Línea decorativa
  yPos += 5
  doc.setDrawColor(...config.primaryColor)
  doc.setLineWidth(0.5)
  doc.line(margin, yPos, pageWidth - margin, yPos)

  return yPos + 10
}

/**
 * Agrega un footer con información de contacto
 */
export function addFooter(
  doc: jsPDF,
  pageNumber: number,
  totalPages?: number,
  branding?: Partial<BrandingConfig>
): void {
  const config = getBrandingConfig(branding)
  const pageHeight = doc.internal.pageSize.getHeight()
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 20
  const footerY = pageHeight - 15

  // Línea superior del footer
  doc.setDrawColor(229, 231, 235) // Gris claro
  doc.setLineWidth(0.3)
  doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5)

  // Información de contacto
  doc.setFontSize(8)
  doc.setTextColor(107, 114, 128) // Gris medio
  doc.setFont('helvetica', 'normal')

  const contactInfo: string[] = []
  if (config.companyAddress) contactInfo.push(config.companyAddress)
  if (config.companyPhone) contactInfo.push(`Tel: ${config.companyPhone}`)
  if (config.companyEmail) contactInfo.push(`Email: ${config.companyEmail}`)

  if (contactInfo.length > 0) {
    doc.text(contactInfo.join(' | '), pageWidth / 2, footerY, { align: 'center' })
  }

  // Número de página
  const pageText = totalPages ? `Página ${pageNumber} de ${totalPages}` : `Página ${pageNumber}`
  doc.text(pageText, pageWidth - margin, footerY, { align: 'right' })
}

/**
 * Agrega una tabla estilizada usando autoTable
 */
export function addTable(
  doc: jsPDF,
  data: PDFTableData[],
  columns: PDFTableColumn[],
  startY: number,
  branding?: Partial<BrandingConfig>
): number {
  const config = getBrandingConfig(branding)
  const margin = 20

  const tableData = data.map((row) => columns.map((col) => String(row[col.dataKey] || '')))

  autoTable(doc, {
    startY,
    head: [columns.map((col) => col.header)],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: config.primaryColor,
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 10,
    },
    bodyStyles: {
      fontSize: 9,
      textColor: [17, 24, 39],
    },
    alternateRowStyles: {
      fillColor: [249, 250, 251],
    },
    margin: { left: margin, right: margin },
    styles: {
      cellPadding: 3,
    },
  })

  const finalY = ((doc as unknown) as { lastAutoTable: { finalY: number } }).lastAutoTable?.finalY || startY + 20
  return finalY + 5
}

/**
 * Agrega una sección de totales destacada
 */
export function addTotalSection(
  doc: jsPDF,
  label: string,
  amount: number,
  startY: number,
  branding?: Partial<BrandingConfig>
): number {
  const config = getBrandingConfig(branding)
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 20
  const totalWidth = 80
  const totalX = pageWidth - margin - totalWidth

  // Fondo destacado
  doc.setFillColor(249, 250, 251)
  doc.rect(totalX, startY - 5, totalWidth, 15, 'F')

  // Borde
  doc.setDrawColor(...config.primaryColor)
  doc.setLineWidth(0.5)
  doc.rect(totalX, startY - 5, totalWidth, 15, 'S')

  // Label
  doc.setFontSize(11)
  doc.setTextColor(75, 85, 99)
  doc.setFont('helvetica', 'normal')
  doc.text(label, totalX + 5, startY + 3)

  // Amount
  doc.setFontSize(14)
  doc.setTextColor(17, 24, 39)
  doc.setFont('helvetica', 'bold')
  const amountText = `$${amount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`
  doc.text(amountText, totalX + totalWidth - 5, startY + 3, { align: 'right' })

  return startY + 20
}

/**
 * Agrega líneas para firmas
 */
export function addSignatureLines(
  doc: jsPDF,
  startY: number,
  leftLabel: string = 'Proveedor',
  rightLabel: string = 'Cliente'
): number {
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 20
  const signatureWidth = 60

  // Línea izquierda
  doc.setDrawColor(107, 114, 128)
  doc.setLineWidth(0.5)
  doc.line(margin, startY, margin + signatureWidth, startY)
  doc.setFontSize(9)
  doc.setTextColor(107, 114, 128)
  doc.setFont('helvetica', 'normal')
  doc.text(leftLabel, margin + signatureWidth / 2, startY + 8, { align: 'center' })

  // Línea derecha
  doc.line(pageWidth - margin - signatureWidth, startY, pageWidth - margin, startY)
  doc.text(rightLabel, pageWidth - margin - signatureWidth / 2, startY + 8, { align: 'center' })

  return startY + 20
}

/**
 * Verifica si hay espacio suficiente en la página actual
 * Si no hay espacio, agrega una nueva página
 */
export function ensurePageSpace(doc: jsPDF, requiredSpace: number, currentY: number): number {
  const pageHeight = doc.internal.pageSize.getHeight()
  const footerHeight = 20

  if (currentY + requiredSpace > pageHeight - footerHeight) {
    doc.addPage()
    return 20 // Margen superior
  }

  return currentY
}

/**
 * Agrega información de cliente/vendor en formato de dos columnas
 */
export function addTwoColumnInfo(
  doc: jsPDF,
  leftTitle: string,
  leftData: Array<{ label: string; value: string }>,
  rightTitle: string,
  rightData: Array<{ label: string; value: string }>,
  startY: number,
  branding?: Partial<BrandingConfig>
): number {
  const config = getBrandingConfig(branding)
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 20
  const columnWidth = (pageWidth - 3 * margin) / 2
  const leftX = margin
  const rightX = margin * 2 + columnWidth

  let yPos = startY

  // Título izquierdo
  doc.setFontSize(11)
  doc.setTextColor(...config.primaryColor)
  doc.setFont('helvetica', 'bold')
  doc.text(leftTitle, leftX, yPos)
  yPos += 7

  // Datos izquierdos
  doc.setFontSize(9)
  doc.setTextColor(17, 24, 39)
  doc.setFont('helvetica', 'normal')
  leftData.forEach((item) => {
    doc.text(`${item.label}:`, leftX, yPos)
    doc.setFont('helvetica', 'bold')
    doc.text(item.value, leftX + 30, yPos)
    doc.setFont('helvetica', 'normal')
    yPos += 5
  })

  // Resetear Y para columna derecha
  yPos = startY

  // Título derecho
  doc.setFontSize(11)
  doc.setTextColor(...config.primaryColor)
  doc.setFont('helvetica', 'bold')
  doc.text(rightTitle, rightX, yPos)
  yPos += 7

  // Datos derechos
  doc.setFontSize(9)
  doc.setTextColor(17, 24, 39)
  doc.setFont('helvetica', 'normal')
  rightData.forEach((item) => {
    doc.text(`${item.label}:`, rightX, yPos)
    doc.setFont('helvetica', 'bold')
    doc.text(item.value, rightX + 30, yPos)
    doc.setFont('helvetica', 'normal')
    yPos += 5
  })

  // Retornar la posición Y más baja
  return Math.max(
    startY + 7 + leftData.length * 5,
    startY + 7 + rightData.length * 5
  ) + 10
}

