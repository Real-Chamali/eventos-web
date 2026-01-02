/**
 * API Route para pagos parciales
 * POST /api/payments - Registrar un nuevo pago
 * GET /api/payments?quote_id=xxx - Obtener pagos de una cotización
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { logger } from '@/lib/utils/logger'
import { checkAdmin } from '@/lib/api/middleware'
import { sanitizeForLogging } from '@/lib/utils/security'
import { z } from 'zod'

const PaymentSchema = z.object({
  quote_id: z.string().uuid('ID de cotización inválido'),
  amount: z.number().positive('El monto debe ser mayor a 0'),
  payment_date: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  payment_method: z.enum(['cash', 'transfer', 'card', 'check', 'other']),
  reference_number: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
})

/**
 * POST /api/payments
 * Registrar un nuevo pago parcial
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validation = PaymentSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Datos inválidos',
          details: validation.error.issues,
        },
        { status: 400 }
      )
    }

    const { quote_id, amount, payment_date, payment_method, reference_number, notes } = validation.data

    // Verificar que la cotización existe y el usuario tiene acceso
    const { data: quote, error: quoteError } = await supabase
      .from('quotes')
      .select('id, vendor_id, total_amount, status')
      .eq('id', quote_id)
      .single()

    if (quoteError || !quote) {
      logger.error('API /payments', 'Quote not found', new Error(quoteError?.message || 'Quote not found'), {
        quoteId: quote_id,
        userId: user.id,
      })
      return NextResponse.json({ error: 'Cotización no encontrada' }, { status: 404 })
    }

    // Verificar permisos: admin o vendedor de la cotización
    const isAdmin = await checkAdmin(user.id, user.email)
    if (!isAdmin && quote.vendor_id !== user.id) {
      logger.warn('API /payments', 'Unauthorized payment attempt', sanitizeForLogging({
        userId: user.id,
        quoteId: quote_id,
        quoteVendorId: quote.vendor_id,
      }))
      return NextResponse.json({ error: 'No tienes permiso para registrar pagos en esta cotización' }, { status: 403 })
    }

    // Usar función SQL para registrar pago con validaciones
    const { data: paymentResult, error: paymentError } = await supabase.rpc('register_payment', {
      p_quote_id: quote_id,
      p_amount: amount,
      p_created_by: user.id,
      p_payment_date: payment_date,
      p_payment_method: payment_method,
      p_reference_number: reference_number || null,
      p_notes: notes || null,
    })

    if (paymentError) {
      logger.error('API /payments', 'Error registering payment', paymentError as Error, {
        quoteId: quote_id,
        userId: user.id,
        amount,
      })
      return NextResponse.json(
        { error: 'Error al registrar el pago: ' + paymentError.message },
        { status: 500 }
      )
    }

    // Obtener el pago creado
    const { data: payment, error: fetchError } = await supabase
      .from('partial_payments')
      .select('*')
      .eq('id', paymentResult)
      .single()

    if (fetchError || !payment) {
      logger.error('API /payments', 'Error fetching created payment', fetchError as Error, {
        paymentId: paymentResult,
      })
      // Aún así retornar éxito ya que el pago se registró
    }

    logger.info('API /payments', 'Payment registered successfully', sanitizeForLogging({
      userId: user.id,
      quoteId: quote_id,
      paymentId: paymentResult,
      amount,
    }))

    return NextResponse.json({
      success: true,
      payment: payment || { id: paymentResult },
      message: 'Pago registrado exitosamente',
    })
  } catch (error) {
    logger.error('API /payments', 'Unexpected error', error as Error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/payments?quote_id=xxx
 * Obtener pagos de una cotización
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const quote_id = searchParams.get('quote_id')

    if (!quote_id) {
      return NextResponse.json({ error: 'quote_id es requerido' }, { status: 400 })
    }

    // Verificar que la cotización existe y el usuario tiene acceso
    const { data: quote, error: quoteError } = await supabase
      .from('quotes')
      .select('id, vendor_id')
      .eq('id', quote_id)
      .single()

    if (quoteError || !quote) {
      return NextResponse.json({ error: 'Cotización no encontrada' }, { status: 404 })
    }

    // Verificar permisos
    const isAdmin = await checkAdmin(user.id, user.email)
    if (!isAdmin && quote.vendor_id !== user.id) {
      return NextResponse.json({ error: 'No tienes permiso para ver pagos de esta cotización' }, { status: 403 })
    }

    // Obtener pagos (solo no cancelados por defecto)
    const { data: payments, error: paymentsError } = await supabase
      .from('partial_payments')
      .select('*')
      .eq('quote_id', quote_id)
      .eq('is_cancelled', false)
      .order('payment_date', { ascending: false })

    if (paymentsError) {
      logger.error('API /payments', 'Error fetching payments', paymentsError as Error, {
        quoteId: quote_id,
      })
      return NextResponse.json(
        { error: 'Error al obtener pagos: ' + paymentsError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      payments: payments || [],
    })
  } catch (error) {
    logger.error('API /payments', 'Unexpected error', error as Error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

