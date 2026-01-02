/**
 * API Route para crear eventos con cotizaciones
 * POST /api/events/create - Crear evento y cotización en una transacción
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { logger } from '@/lib/utils/logger'
import { checkAdmin } from '@/lib/api/middleware'
import { sanitizeForLogging } from '@/lib/utils/security'
import { z } from 'zod'
import { mapQuoteStatusToDB, mapEventStatusToDB } from '@/lib/utils/statusMapper'

const CreateEventSchema = z.object({
  client_id: z.string().uuid('ID de cliente inválido'),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha de inicio inválida'),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  start_time: z.string().regex(/^\d{2}:\d{2}$/).optional().nullable(),
  end_time: z.string().regex(/^\d{2}:\d{2}$/).optional().nullable(),
  total_amount: z.number().positive('El monto total debe ser mayor a 0'),
  notes: z.string().optional().nullable(),
  event_status: z.enum(['pending', 'confirmed', 'completed', 'cancelled']).default('pending'),
  quote_status: z.enum(['draft', 'pending', 'confirmed', 'cancelled']).default('draft'),
  location: z.string().optional().nullable(),
  guest_count: z.number().int().positive().optional().nullable(),
  event_type: z.string().optional().nullable(),
  emergency_contact: z.string().optional().nullable(),
  emergency_phone: z.string().optional().nullable(),
  special_requirements: z.string().optional().nullable(),
  additional_notes: z.string().optional().nullable(),
})

/**
 * POST /api/events/create
 * Crear evento y cotización en una transacción atómica
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
    const validation = CreateEventSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Datos inválidos',
          details: validation.error.issues,
        },
        { status: 400 }
      )
    }

    const {
      client_id,
      start_date,
      end_date,
      start_time,
      end_time,
      total_amount,
      notes,
      event_status,
      quote_status,
      location,
      guest_count,
      event_type,
      emergency_contact,
      emergency_phone,
      special_requirements,
      additional_notes,
    } = validation.data

    // Verificar que el cliente existe
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id')
      .eq('id', client_id)
      .single()

    if (clientError || !client) {
      logger.error('API /events/create', 'Client not found', new Error(clientError?.message || 'Client not found'), {
        clientId: client_id,
        userId: user.id,
      })
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 })
    }

    // Validar que end_date no sea anterior a start_date
    if (end_date && end_date < start_date) {
      return NextResponse.json(
        { error: 'La fecha de fin no puede ser anterior a la fecha de inicio' },
        { status: 400 }
      )
    }

    // Verificar que no haya eventos solapados en la misma fecha
    const { data: overlappingEvents, error: overlapError } = await supabase
      .from('events')
      .select('id, start_date, end_date, status')
      .or(`and(start_date.lte.${end_date || start_date},end_date.gte.${start_date}),and(start_date.is.null,end_date.is.null)`)
      .neq('status', 'CANCELLED')
      .neq('status', 'NO_SHOW')

    if (overlapError) {
      logger.warn('API /events/create', 'Error checking overlapping events', {
        error: overlapError.message,
        code: overlapError.code,
      })
      // Continuar aunque haya error en la verificación
    } else if (overlappingEvents && overlappingEvents.length > 0) {
      // Verificar solapamiento real
      const hasOverlap = overlappingEvents.some((event: any) => {
        const eventStart = event.start_date
        const eventEnd = event.end_date || event.start_date
        const newStart = start_date
        const newEnd = end_date || start_date
        
        return (
          (newStart >= eventStart && newStart <= eventEnd) ||
          (newEnd >= eventStart && newEnd <= eventEnd) ||
          (newStart <= eventStart && newEnd >= eventEnd)
        )
      })

      if (hasOverlap) {
        return NextResponse.json(
          { error: 'Ya existe un evento activo en estas fechas' },
          { status: 409 }
        )
      }
    }

    // Usar función SQL para crear evento y cotización en una transacción
    const { data: result, error: createError } = await supabase.rpc('create_event_with_quote', {
      p_client_id: client_id,
      p_vendor_id: user.id,
      p_start_date: start_date,
      p_end_date: end_date || null,
      p_start_time: start_time || null,
      p_end_time: end_time || null,
      p_total_amount: total_amount,
      p_notes: notes || null,
      p_event_status: mapEventStatusToDB(event_status),
      p_quote_status: mapQuoteStatusToDB(quote_status),
      p_location: location || null,
      p_guest_count: guest_count || null,
      p_event_type: event_type || null,
      p_emergency_contact: emergency_contact || null,
      p_emergency_phone: emergency_phone || null,
      p_special_requirements: special_requirements || null,
      p_additional_notes: additional_notes || null,
    })

    if (createError) {
      logger.error('API /events/create', 'Error creating event with quote', createError as Error, {
        clientId: client_id,
        userId: user.id,
        startDate: start_date,
      })
      return NextResponse.json(
        { error: 'Error al crear evento: ' + createError.message },
        { status: 500 }
      )
    }

    if (!result || result.length === 0) {
      logger.error('API /events/create', 'No result from create_event_with_quote', new Error('No result'))
      return NextResponse.json(
        { error: 'Error al crear evento: no se retornó resultado' },
        { status: 500 }
      )
    }

    const { event_id, quote_id } = result[0]

    logger.info('API /events/create', 'Event and quote created successfully', sanitizeForLogging({
      userId: user.id,
      clientId: client_id,
      eventId: event_id,
      quoteId: quote_id,
      startDate: start_date,
    }))

    return NextResponse.json({
      success: true,
      event_id,
      quote_id,
      message: 'Evento y cotización creados exitosamente',
    })
  } catch (error) {
    logger.error('API /events/create', 'Unexpected error', error as Error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

