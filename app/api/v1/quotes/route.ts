import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { logger } from '@/lib/utils/logger'
import { validateApiKey } from '@/lib/api/apiKeys'

/**
 * API Pública REST - Endpoint de Cotizaciones
 * GET /api/v1/quotes - Listar cotizaciones
 * POST /api/v1/quotes - Crear cotización
 * 
 * Autenticación:
 * - Opción 1: JWT token (usuario autenticado)
 * - Opción 2: API key en header 'x-api-key' o 'Authorization: Bearer <key>'
 */
export async function GET(request: NextRequest) {
  try {
    let userId: string | undefined
    let permissions: string[] = []
    
    // Intentar autenticación con API key primero
    const apiKey = request.headers.get('x-api-key') || 
                   request.headers.get('authorization')?.replace('Bearer ', '')
    
    if (apiKey) {
      const validation = await validateApiKey(request)
      if (!validation.valid) {
        logger.warn('API /v1/quotes', 'Invalid API key', {
          error: validation.error,
        })
        return NextResponse.json(
          { error: validation.error || 'Invalid API key' },
          { status: 401 }
        )
      }
      
      userId = validation.userId
      permissions = validation.permissions || []
      
      // Verificar permisos de lectura
      if (!permissions.includes('read') && !permissions.includes('admin')) {
        logger.warn('API /v1/quotes', 'Insufficient permissions', {
          userId,
          permissions,
        })
        return NextResponse.json(
          { error: 'Insufficient permissions. Required: read' },
          { status: 403 }
        )
      }
    } else {
      // Fallback a autenticación JWT
      const supabase = await createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        return NextResponse.json(
          { error: 'Unauthorized. Provide API key or JWT token' },
          { status: 401 }
        )
      }
      
      userId = user.id
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const status = searchParams.get('status')

    // Usar el cliente apropiado según el tipo de autenticación
    const supabase = await createClient()
    
    let query = supabase
      .from('quotes')
      .select('id, total_amount, status, created_at, client:clients(name)')
      .eq('vendor_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (status) {
      query = query.eq('status', status)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({
      data,
      pagination: {
        limit,
        offset,
        total: data?.length || 0,
      },
    })
  } catch (error) {
    logger.error('API /v1/quotes', 'Error in GET route', error instanceof Error ? error : new Error(String(error)))
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    let userId: string | undefined
    let permissions: string[] = []
    
    // Intentar autenticación con API key primero
    const apiKey = request.headers.get('x-api-key') || 
                   request.headers.get('authorization')?.replace('Bearer ', '')
    
    if (apiKey) {
      const validation = await validateApiKey(request)
      if (!validation.valid) {
        logger.warn('API /v1/quotes', 'Invalid API key', {
          error: validation.error,
        })
        return NextResponse.json(
          { error: validation.error || 'Invalid API key' },
          { status: 401 }
        )
      }
      
      userId = validation.userId
      permissions = validation.permissions || []
      
      // Verificar permisos de escritura
      if (!permissions.includes('write') && !permissions.includes('admin')) {
        logger.warn('API /v1/quotes', 'Insufficient permissions', {
          userId,
          permissions,
        })
        return NextResponse.json(
          { error: 'Insufficient permissions. Required: write' },
          { status: 403 }
        )
      }
    } else {
      // Fallback a autenticación JWT
      const supabase = await createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        return NextResponse.json(
          { error: 'Unauthorized. Provide API key or JWT token' },
          { status: 401 }
        )
      }
      
      userId = user.id
    }

    const body = await request.json()
    const { client_id, services, notes } = body

    // Validación básica
    if (!client_id || !services || !Array.isArray(services) || services.length === 0) {
      return NextResponse.json(
        { error: 'Invalid request body. client_id and services array are required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Calcular total de servicios
    const { data: servicesData, error: servicesError } = await supabase
      .from('services')
      .select('id, base_price')
      .in('id', services.map((s: { service_id: string }) => s.service_id))

    if (servicesError) {
      logger.error('API /v1/quotes', 'Error fetching services', servicesError)
      return NextResponse.json(
        { error: 'Error fetching services' },
        { status: 500 }
      )
    }

    const totalAmount = services.reduce((sum: number, s: { service_id: string; quantity?: number; price?: number }) => {
      const service = servicesData?.find((svc) => svc.id === s.service_id)
      const quantity = s.quantity || 1
      const price = s.price || service?.base_price || 0
      return sum + (price * quantity)
    }, 0)

    // Crear cotización
    const { data: quote, error: quoteError } = await supabase
      .from('quotes')
      .insert({
        client_id,
        vendor_id: userId,
        notes: notes || null,
        status: 'DRAFT',
        total_amount: totalAmount,
      })
      .select()
      .single()

    if (quoteError) {
      logger.error('API /v1/quotes', 'Error creating quote', quoteError)
      return NextResponse.json(
        { error: quoteError.message },
        { status: 400 }
      )
    }

    // Agregar servicios a la cotización
    const quoteServices = services.map((s: { service_id: string; quantity?: number; price?: number }) => ({
      quote_id: quote.id,
      service_id: s.service_id,
      quantity: s.quantity || 1,
      price: s.price || servicesData?.find((svc) => svc.id === s.service_id)?.base_price || 0,
    }))

    const { error: quoteServicesError } = await supabase
      .from('quote_services')
      .insert(quoteServices)

    if (quoteServicesError) {
      logger.error('API /v1/quotes', 'Error creating quote services', quoteServicesError)
      // Intentar eliminar la cotización creada
      await supabase.from('quotes').delete().eq('id', quote.id)
      return NextResponse.json(
        { error: 'Error creating quote services' },
        { status: 500 }
      )
    }

    logger.info('API /v1/quotes', 'Quote created successfully', {
      quoteId: quote.id,
      userId,
      totalAmount,
    })

    return NextResponse.json(
      {
        data: {
          ...quote,
          services: quoteServices,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    logger.error('API /v1/quotes', 'Error in POST route', error instanceof Error ? error : new Error(String(error)))
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

