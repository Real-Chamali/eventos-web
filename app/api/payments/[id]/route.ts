/**
 * API Route para operaciones individuales de pagos
 * DELETE /api/payments/[id] - Cancelar un pago (soft delete)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { logger } from '@/lib/utils/logger'
import { checkAdmin } from '@/lib/api/middleware'
import { sanitizeForLogging } from '@/lib/utils/security'
import { z } from 'zod'

const CancelPaymentSchema = z.object({
  cancellation_reason: z.string().optional().nullable(),
})

/**
 * DELETE /api/payments/[id]
 * Cancelar un pago (soft delete)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Obtener el pago
    const { data: payment, error: paymentError } = await supabase
      .from('partial_payments')
      .select('id, quote_id, created_by, is_cancelled, quotes!inner(vendor_id)')
      .eq('id', id)
      .single()

    if (paymentError || !payment) {
      logger.error('API /payments/[id]', 'Payment not found', new Error(paymentError?.message || 'Payment not found'), {
        paymentId: id,
      })
      return NextResponse.json({ error: 'Pago no encontrado' }, { status: 404 })
    }

    // Verificar si ya está cancelado
    if (payment.is_cancelled) {
      return NextResponse.json({ error: 'El pago ya está cancelado' }, { status: 400 })
    }

    // Verificar permisos: admin o creador del pago
    const isAdmin = await checkAdmin(user.id, user.email)
    const quote = Array.isArray(payment.quotes) ? payment.quotes[0] : payment.quotes
    
    if (!isAdmin && payment.created_by !== user.id && quote?.vendor_id !== user.id) {
      logger.warn('API /payments/[id]', 'Unauthorized payment cancellation', sanitizeForLogging({
        userId: user.id,
        paymentId: id,
        paymentCreatedBy: payment.created_by,
      }))
      return NextResponse.json({ error: 'No tienes permiso para cancelar este pago' }, { status: 403 })
    }

    // Obtener motivo de cancelación del body si existe
    let cancellation_reason: string | null = null
    try {
      const body = await request.json()
      const validation = CancelPaymentSchema.safeParse(body)
      if (validation.success) {
        cancellation_reason = validation.data.cancellation_reason || null
      }
    } catch {
      // Body vacío o inválido, continuar sin motivo
    }

    // Usar función SQL para cancelar pago
    const { error: cancelError } = await supabase.rpc('cancel_payment', {
      p_payment_id: id,
      p_cancelled_by: user.id,
      p_cancellation_reason: cancellation_reason,
    })

    if (cancelError) {
      logger.error('API /payments/[id]', 'Error cancelling payment', cancelError as Error, {
        paymentId: id,
        userId: user.id,
      })
      return NextResponse.json(
        { error: 'Error al cancelar el pago: ' + cancelError.message },
        { status: 500 }
      )
    }

    logger.info('API /payments/[id]', 'Payment cancelled successfully', sanitizeForLogging({
      userId: user.id,
      paymentId: id,
      quoteId: payment.quote_id,
    }))

    return NextResponse.json({
      success: true,
      message: 'Pago cancelado exitosamente',
    })
  } catch (error) {
    logger.error('API /payments/[id]', 'Unexpected error', error as Error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

