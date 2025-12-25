/**
 * Audit Logging para Acciones Críticas
 * 
 * Utilidad especializada para registrar acciones críticas del ADMIN/DUEÑO
 * y cambios importantes que requieren auditoría completa.
 * 
 * Acciones críticas incluyen:
 * - Cambios de estado de cotizaciones
 * - Eliminación de cotizaciones/pagos
 * - Modificaciones de precios en cotizaciones confirmadas
 * - Cambios de fechas de eventos
 * - Cancelaciones de eventos confirmados
 */

import { createAuditLog, type AuditAction } from './audit'
import { logger } from './logger'
import { sanitizeForLogging } from './security'

export type CriticalAction =
  | 'QUOTE_STATUS_CHANGE'
  | 'QUOTE_DELETE'
  | 'QUOTE_PRICE_OVERRIDE'
  | 'PAYMENT_DELETE'
  | 'PAYMENT_OVERRIDE'
  | 'EVENT_DATE_CHANGE'
  | 'EVENT_CANCEL'
  | 'SERVICE_PRICE_EDIT'
  | 'ADMIN_ACTION'

export interface CriticalAuditContext {
  userId: string
  action: CriticalAction
  entityType: 'quote' | 'payment' | 'event' | 'service' | 'other'
  entityId: string
  oldValues?: Record<string, unknown>
  newValues?: Record<string, unknown>
  reason?: string
  ipAddress?: string
  userAgent?: string
  metadata?: Record<string, unknown>
}

/**
 * Registra una acción crítica con contexto completo
 * 
 * @param context - Contexto de la acción crítica
 * 
 * @example
 * ```typescript
 * await logCriticalAction({
 *   userId: adminId,
 *   action: 'QUOTE_STATUS_CHANGE',
 *   entityType: 'quote',
 *   entityId: quoteId,
 *   oldValues: { status: 'pending' },
 *   newValues: { status: 'confirmed' },
 *   reason: 'Cliente confirmó el evento',
 *   ipAddress: req.headers['x-forwarded-for'],
 *   userAgent: req.headers['user-agent'],
 * })
 * ```
 */
export async function logCriticalAction(
  context: CriticalAuditContext
): Promise<void> {
  try {
    // Mapear acción crítica a acción de audit log estándar
    const auditAction: AuditAction = mapCriticalActionToAuditAction(context.action)

    // Construir metadata enriquecida
    const metadata = {
      criticalAction: context.action,
      entityType: context.entityType,
      entityId: context.entityId,
      reason: context.reason,
      timestamp: new Date().toISOString(),
      ...context.metadata,
    }

    // Crear audit log
    await createAuditLog({
      user_id: context.userId,
      action: auditAction,
      table_name: context.entityType === 'quote' ? 'quotes' :
                   context.entityType === 'payment' ? 'partial_payments' :
                   context.entityType === 'event' ? 'events' :
                   context.entityType === 'service' ? 'services' : 'other',
      old_values: context.oldValues || null,
      new_values: context.newValues || null,
      ip_address: context.ipAddress,
      user_agent: context.userAgent,
      metadata,
    })

    // Log adicional estructurado para acciones críticas
    logger.warn('CriticalAction', `${context.action} on ${context.entityType}`, sanitizeForLogging({
      userId: context.userId,
      entityType: context.entityType,
      entityId: context.entityId,
      action: context.action,
      reason: context.reason,
      hasOldValues: !!context.oldValues,
      hasNewValues: !!context.newValues,
    }))
  } catch (error) {
    // No fallar si el audit log falla, pero loguear el error
    logger.error('CriticalAudit', 'Failed to log critical action', error as Error, sanitizeForLogging({
      action: context.action,
      entityType: context.entityType,
      entityId: context.entityId,
    }))
  }
}

/**
 * Mapea acción crítica a acción de audit log estándar
 */
function mapCriticalActionToAuditAction(action: CriticalAction): AuditAction {
  switch (action) {
    case 'QUOTE_STATUS_CHANGE':
    case 'QUOTE_PRICE_OVERRIDE':
    case 'SERVICE_PRICE_EDIT':
    case 'EVENT_DATE_CHANGE':
      return 'UPDATE'
    case 'QUOTE_DELETE':
    case 'PAYMENT_DELETE':
    case 'EVENT_CANCEL':
      return 'DELETE'
    case 'PAYMENT_OVERRIDE':
      return 'UPDATE'
    case 'ADMIN_ACTION':
    default:
      return 'UPDATE'
  }
}

/**
 * Helper: Log cambio de estado de cotización
 */
export async function logQuoteStatusChange(
  userId: string,
  quoteId: string,
  oldStatus: string,
  newStatus: string,
  reason?: string,
  context?: { ipAddress?: string; userAgent?: string }
): Promise<void> {
  await logCriticalAction({
    userId,
    action: 'QUOTE_STATUS_CHANGE',
    entityType: 'quote',
    entityId: quoteId,
    oldValues: { status: oldStatus },
    newValues: { status: newStatus },
    reason,
    ipAddress: context?.ipAddress,
    userAgent: context?.userAgent,
    metadata: {
      transition: `${oldStatus} → ${newStatus}`,
    },
  })
}

/**
 * Helper: Log eliminación de cotización
 */
export async function logQuoteDelete(
  userId: string,
  quoteId: string,
  quoteData: Record<string, unknown>,
  reason?: string,
  context?: { ipAddress?: string; userAgent?: string }
): Promise<void> {
  await logCriticalAction({
    userId,
    action: 'QUOTE_DELETE',
    entityType: 'quote',
    entityId: quoteId,
    oldValues: quoteData,
    reason,
    ipAddress: context?.ipAddress,
    userAgent: context?.userAgent,
    metadata: {
      deletedAt: new Date().toISOString(),
    },
  })
}

/**
 * Helper: Log modificación de precio en cotización confirmada
 */
export async function logPriceOverride(
  userId: string,
  quoteId: string,
  serviceId: string,
  oldPrice: number,
  newPrice: number,
  reason?: string,
  context?: { ipAddress?: string; userAgent?: string }
): Promise<void> {
  await logCriticalAction({
    userId,
    action: 'SERVICE_PRICE_EDIT',
    entityType: 'service',
    entityId: serviceId,
    oldValues: { price: oldPrice, quoteId },
    newValues: { price: newPrice, quoteId },
    reason,
    ipAddress: context?.ipAddress,
    userAgent: context?.userAgent,
    metadata: {
      priceChange: newPrice - oldPrice,
      priceChangePercent: ((newPrice - oldPrice) / oldPrice) * 100,
    },
  })
}

/**
 * Helper: Log eliminación de pago
 */
export async function logPaymentDelete(
  userId: string,
  paymentId: string,
  paymentData: Record<string, unknown>,
  reason?: string,
  context?: { ipAddress?: string; userAgent?: string }
): Promise<void> {
  await logCriticalAction({
    userId,
    action: 'PAYMENT_DELETE',
    entityType: 'payment',
    entityId: paymentId,
    oldValues: paymentData,
    reason,
    ipAddress: context?.ipAddress,
    userAgent: context?.userAgent,
    metadata: {
      deletedAt: new Date().toISOString(),
    },
  })
}

/**
 * Helper: Log cambio de fecha de evento
 */
export async function logEventDateChange(
  userId: string,
  eventId: string,
  oldDate: string,
  newDate: string,
  reason?: string,
  context?: { ipAddress?: string; userAgent?: string }
): Promise<void> {
  await logCriticalAction({
    userId,
    action: 'EVENT_DATE_CHANGE',
    entityType: 'event',
    entityId: eventId,
    oldValues: { start_date: oldDate },
    newValues: { start_date: newDate },
    reason,
    ipAddress: context?.ipAddress,
    userAgent: context?.userAgent,
    metadata: {
      dateChange: newDate,
    },
  })
}

/**
 * Helper: Log cancelación de evento
 */
export async function logEventCancel(
  userId: string,
  eventId: string,
  eventData: Record<string, unknown>,
  reason?: string,
  context?: { ipAddress?: string; userAgent?: string }
): Promise<void> {
  await logCriticalAction({
    userId,
    action: 'EVENT_CANCEL',
    entityType: 'event',
    entityId: eventId,
    oldValues: eventData,
    newValues: { status: 'cancelled' },
    reason,
    ipAddress: context?.ipAddress,
    userAgent: context?.userAgent,
    metadata: {
      cancelledAt: new Date().toISOString(),
    },
  })
}

