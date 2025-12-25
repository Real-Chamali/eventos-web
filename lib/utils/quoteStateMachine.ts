/**
 * Máquina de Estados para Cotizaciones
 * 
 * Define las transiciones válidas entre estados de cotizaciones
 * y proporciona utilidades para validar y gestionar cambios de estado
 * 
 * Estados válidos:
 * - draft: Borrador, puede editarse libremente
 * - pending: Pendiente de confirmación
 * - confirmed: Confirmada, evento programado
 * - cancelled: Cancelada, estado terminal
 * 
 * CRÍTICO: Esta lógica debe coincidir con el trigger de BD
 * en la migración 033_critical_validations.sql
 */

export type QuoteStatus = 'draft' | 'pending' | 'confirmed' | 'cancelled'

export interface StateTransition {
  from: QuoteStatus
  to: QuoteStatus
  requiresAdmin?: boolean
  description: string
}

/**
 * Definición de transiciones válidas
 * Debe coincidir con validate_quote_status_transition() en BD
 */
export const VALID_TRANSITIONS: Record<QuoteStatus, StateTransition[]> = {
  draft: [
    {
      from: 'draft',
      to: 'pending',
      description: 'Enviar cotización al cliente',
    },
    {
      from: 'draft',
      to: 'cancelled',
      description: 'Cancelar borrador',
    },
  ],
  pending: [
    {
      from: 'pending',
      to: 'confirmed',
      description: 'Confirmar cotización',
    },
    {
      from: 'pending',
      to: 'cancelled',
      description: 'Cancelar cotización pendiente',
    },
  ],
  confirmed: [
    {
      from: 'confirmed',
      to: 'cancelled',
      requiresAdmin: true,
      description: 'Cancelar cotización confirmada (solo admin)',
    },
  ],
  cancelled: [], // Terminal state - no transitions allowed
}

/**
 * Verifica si una transición de estado es válida
 */
export function isValidTransition(
  from: QuoteStatus,
  to: QuoteStatus,
  isAdmin: boolean = false
): { valid: boolean; reason?: string } {
  // Si no hay cambio, es válido
  if (from === to) {
    return { valid: true }
  }

  // Estado terminal no puede cambiar
  if (from === 'cancelled') {
    return {
      valid: false,
      reason: 'No se puede cambiar el estado de una cotización cancelada',
    }
  }

  // Buscar transición válida
  const transitions = VALID_TRANSITIONS[from]
  const transition = transitions.find((t) => t.to === to)

  if (!transition) {
    return {
      valid: false,
      reason: `Transición inválida: de ${from} a ${to}. Transiciones válidas desde ${from}: ${transitions.map((t) => t.to).join(', ')}`,
    }
  }

  // Verificar si requiere admin
  if (transition.requiresAdmin && !isAdmin) {
    return {
      valid: false,
      reason: 'Solo los administradores pueden realizar esta acción',
    }
  }

  return { valid: true }
}

/**
 * Obtiene las transiciones válidas desde un estado
 */
export function getValidTransitions(
  from: QuoteStatus,
  isAdmin: boolean = false
): StateTransition[] {
  return VALID_TRANSITIONS[from].filter(
    (t) => !t.requiresAdmin || isAdmin
  )
}

/**
 * Obtiene el siguiente estado sugerido desde un estado actual
 */
export function getSuggestedNextState(
  current: QuoteStatus
): QuoteStatus | null {
  const transitions = VALID_TRANSITIONS[current]
  if (transitions.length === 0) {
    return null
  }

  // Priorizar: confirmed > pending > cancelled
  const priority: QuoteStatus[] = ['confirmed', 'pending', 'cancelled']
  for (const priorityState of priority) {
    if (transitions.some((t) => t.to === priorityState)) {
      return priorityState
    }
  }

  // Si no hay prioridad, retornar la primera
  return transitions[0]?.to || null
}

/**
 * Obtiene el color/badge variant para un estado
 */
export function getStatusVariant(
  status: QuoteStatus
): 'default' | 'warning' | 'success' | 'error' {
  switch (status) {
    case 'draft':
      return 'default'
    case 'pending':
      return 'warning'
    case 'confirmed':
      return 'success'
    case 'cancelled':
      return 'error'
    default:
      return 'default'
  }
}

/**
 * Obtiene el label en español para un estado
 */
export function getStatusLabel(status: QuoteStatus): string {
  switch (status) {
    case 'draft':
      return 'Borrador'
    case 'pending':
      return 'Pendiente'
    case 'confirmed':
      return 'Confirmada'
    case 'cancelled':
      return 'Cancelada'
    default:
      return status
  }
}

/**
 * Verifica si un estado permite edición
 */
export function canEditQuote(status: QuoteStatus, isAdmin: boolean): boolean {
  // Borradores siempre se pueden editar
  if (status === 'draft') {
    return true
  }

  // Pendientes se pueden editar
  if (status === 'pending') {
    return true
  }

  // Confirmadas solo admin puede editar
  if (status === 'confirmed' && isAdmin) {
    return true
  }

  // Canceladas no se pueden editar
  return false
}

/**
 * Verifica si un estado permite eliminar
 */
export function canDeleteQuote(status: QuoteStatus, isAdmin: boolean): boolean {
  // Solo admin puede eliminar, y solo borradores o pendientes
  return isAdmin && (status === 'draft' || status === 'pending')
}

