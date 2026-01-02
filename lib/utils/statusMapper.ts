/**
 * Utilidades para mapear estados entre frontend y base de datos
 * 
 * El frontend usa valores en minúsculas y nombres diferentes
 * La base de datos usa enums en mayúsculas
 */

/**
 * Mapea estado de cotización del frontend a la base de datos
 */
export function mapQuoteStatusToDB(status: 'draft' | 'pending' | 'confirmed' | 'cancelled'): 'DRAFT' | 'APPROVED' | 'REJECTED' {
  switch (status) {
    case 'draft':
      return 'DRAFT'
    case 'pending':
      return 'DRAFT' // pending se mapea a DRAFT en BD (pendiente de aprobación)
    case 'confirmed':
      return 'APPROVED'
    case 'cancelled':
      return 'REJECTED'
    default:
      return 'DRAFT'
  }
}

/**
 * Mapea estado de cotización de la base de datos al frontend
 */
export function mapQuoteStatusFromDB(status: string): 'draft' | 'pending' | 'confirmed' | 'cancelled' {
  const upperStatus = status.toUpperCase()
  switch (upperStatus) {
    case 'DRAFT':
      return 'draft' // Por defecto, DRAFT se mapea a draft
    case 'APPROVED':
      return 'confirmed'
    case 'REJECTED':
      return 'cancelled'
    default:
      return 'draft'
  }
}

/**
 * Mapea estado de evento del frontend a la base de datos
 */
export function mapEventStatusToDB(status: 'pending' | 'confirmed' | 'completed' | 'cancelled'): 'CONFIRMED' | 'LOGISTICS' | 'IN_PROGRESS' | 'FINISHED' | 'CANCELLED' | 'NO_SHOW' {
  switch (status) {
    case 'pending':
      return 'LOGISTICS' // pending se mapea a LOGISTICS
    case 'confirmed':
      return 'CONFIRMED'
    case 'completed':
      return 'FINISHED'
    case 'cancelled':
      return 'CANCELLED'
    default:
      return 'CONFIRMED'
  }
}

/**
 * Mapea estado de evento de la base de datos al frontend
 */
export function mapEventStatusFromDB(status: string): 'pending' | 'confirmed' | 'completed' | 'cancelled' {
  const upperStatus = status.toUpperCase()
  switch (upperStatus) {
    case 'LOGISTICS':
      return 'pending'
    case 'CONFIRMED':
      return 'confirmed'
    case 'IN_PROGRESS':
      return 'confirmed' // IN_PROGRESS se mapea a confirmed
    case 'FINISHED':
      return 'completed'
    case 'CANCELLED':
      return 'cancelled'
    case 'NO_SHOW':
      return 'cancelled' // NO_SHOW se mapea a cancelled
    default:
      return 'confirmed'
  }
}

