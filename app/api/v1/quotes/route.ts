import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

/**
 * API Pública REST - Endpoint de Cotizaciones
 * GET /api/v1/quotes - Listar cotizaciones
 * POST /api/v1/quotes - Crear cotización
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

    // Verificar API key si se proporciona
    const apiKey = request.headers.get('x-api-key')
    if (apiKey) {
      // TODO: Validar API key contra base de datos
      // Por ahora, solo verificamos autenticación
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const status = searchParams.get('status')

    let query = supabase
      .from('quotes')
      .select('id, total_price, status, created_at, client:clients(name)')
      .eq('vendor_id', user.id)
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
    console.error('Error in API route:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

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
    const { client_id, services, notes } = body

    // Validación básica
    if (!client_id || !services || !Array.isArray(services)) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    // Crear cotización
    const { data: quote, error: quoteError } = await supabase
      .from('quotes')
      .insert({
        client_id,
        vendor_id: user.id,
        notes: notes || null,
        status: 'draft',
        total_price: 0, // Se calculará después
      })
      .select()
      .single()

    if (quoteError) {
      return NextResponse.json({ error: quoteError.message }, { status: 400 })
    }

    // Agregar servicios
    // TODO: Implementar lógica completa de servicios

    return NextResponse.json({ data: quote }, { status: 201 })
  } catch (error) {
    console.error('Error in API route:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

