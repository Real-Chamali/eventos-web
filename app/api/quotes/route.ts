import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { CreateQuoteSchema } from '@/lib/validations/schemas'
import { logger } from '@/lib/utils/logger'

export async function POST(request: NextRequest) {
  const supabase = createClient()

  try {
    // 1. Autenticación y Validación
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return new NextResponse(JSON.stringify({ error: 'No autenticado' }), { status: 401 })
    }

    const body = await request.json()
    const validation = CreateQuoteSchema.safeParse(body)

    if (!validation.success) {
      return new NextResponse(JSON.stringify({ error: 'Datos inválidos', details: validation.error.format() }), { status: 400 })
    }

    // MEJORADO: El `total_price` se calcula en el backend.
    const { client_id, services, event_date } = validation.data
    const totalPrice = services.reduce((sum, s) => sum + s.quantity * s.final_price, 0)

    // 2. Lógica de Negocio - Crear Cotización
    const { data: quote, error: quoteError } = await supabase
      .from('quotes')
      .insert({ client_id, vendor_id: user.id, status: 'draft', total_price: totalPrice })
      .select().single()

    if (quoteError) throw quoteError

    // 3. Lógica de Negocio - Insertar Servicios
    const quoteServicesData = services.map(s => ({ quote_id: quote.id, ...s }))
    const { error: servicesError } = await supabase.from('quote_services').insert(quoteServicesData)

    if (servicesError) throw servicesError

    // 4. MEJORADO: Crear el Evento si se proporciona una fecha
    if (event_date) {
      const { error: eventError } = await supabase
        .from('events')
        .insert({ quote_id: quote.id, start_date: event_date, status: 'TENTATIVE' })
      
      if (eventError) {
        // Loguear que el evento no se pudo crear pero continuar, ya que la cotización es lo principal.
        logger.warn('API:quotes:POST', 'La cotización se creó pero falló la creación del evento asociado', { ...eventError, quoteId: quote.id })
      }
    }

    logger.info('API:quotes:POST', 'Cotización creada exitosamente', { quoteId: quote.id, vendorId: user.id })
    return new NextResponse(JSON.stringify(quote), { status: 201 })

  } catch (error: any) {
    logger.error('API:quotes:POST', 'Error inesperado al crear cotización', error)
    return new NextResponse(JSON.stringify({ error: error.message || 'Error interno del servidor' }), { status: 500 })
  }
}
