import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { logger } from '@/lib/utils/logger'
import { validateApiKey } from '@/lib/api/apiKeys'
import { CreateQuoteV1Schema, PaginationSchema } from '@/lib/validations/v1Quotes'
import { sanitizeHTML, sanitizeForLogging } from '@/lib/utils/security'
import { checkAdmin } from '@/lib/api/middleware'

// Constantes de validación
const MAX_BODY_SIZE = 1024 * 1024 // 1MB
const MAX_LIMIT = 100
const DEFAULT_LIMIT = 50

/**
 * Helper para agregar headers de seguridad
 */
function addSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains'
    )
  }
  
  return response
}

/**
 * Validar tamaño de request body
 */
async function validateBodySize(request: NextRequest): Promise<NextResponse | null> {
  const contentLength = request.headers.get('content-length')
  
  if (contentLength && parseInt(contentLength) > MAX_BODY_SIZE) {
    return NextResponse.json(
      { error: 'Request body too large. Maximum size is 1MB' },
      { status: 413 }
    )
  }
  
  return null
}

/**
 * Validar CORS para APIs públicas
 */
function validateCORS(request: NextRequest): boolean {
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || []
  const origin = request.headers.get('origin')
  
  // Si no hay origen (request del mismo dominio), permitir
  if (!origin) {
    return true
  }
  
  // Si hay origen y está en la lista, permitir
  if (allowedOrigins.length > 0 && allowedOrigins.includes(origin)) {
    return true
  }
  
  // Si no hay lista configurada, permitir en desarrollo
  if (allowedOrigins.length === 0 && process.env.NODE_ENV !== 'production') {
    return true
  }
  
  return false
}

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
    // Validar CORS
    if (!validateCORS(request)) {
      return addSecurityHeaders(
        NextResponse.json(
          { error: 'Origin not allowed' },
          { status: 403 }
        )
      )
    }

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
        return addSecurityHeaders(
          NextResponse.json(
            { error: validation.error || 'Invalid API key' },
            { status: 401 }
          )
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
        return addSecurityHeaders(
          NextResponse.json(
            { error: 'Insufficient permissions. Required: read' },
            { status: 403 }
          )
        )
      }
    } else {
      // Fallback a autenticación JWT
      const supabase = await createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        return addSecurityHeaders(
          NextResponse.json(
            { error: 'Unauthorized. Provide API key or JWT token' },
            { status: 401 }
          )
        )
      }
      
      userId = user.id
    }

    // Validar y parsear parámetros de paginación
    const { searchParams } = new URL(request.url)
    const paginationValidation = PaginationSchema.safeParse({
      limit: searchParams.get('limit'),
      offset: searchParams.get('offset'),
      status: searchParams.get('status'),
    })

    if (!paginationValidation.success) {
      return addSecurityHeaders(
        NextResponse.json(
          {
            error: 'Invalid pagination parameters',
            details: paginationValidation.error.issues.map(i => ({
              path: i.path.join('.'),
              message: i.message,
            })),
          },
          { status: 400 }
        )
      )
    }

    const { limit, offset, status } = paginationValidation.data

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
      return addSecurityHeaders(
        NextResponse.json(
          { error: error.message },
          { status: 400 }
        )
      )
    }

    const origin = request.headers.get('origin')
    const response = NextResponse.json({
      data,
      pagination: {
        limit,
        offset,
        total: data?.length || 0,
      },
    })

    // Agregar headers CORS si es necesario
    if (origin && validateCORS(request)) {
      response.headers.set('Access-Control-Allow-Origin', origin)
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-key')
    }

    return addSecurityHeaders(response)
  } catch (error) {
    logger.error('API /v1/quotes', 'Error in GET route', error instanceof Error ? error : new Error(String(error)))
    return addSecurityHeaders(
      NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Validar tamaño de body
    const sizeCheck = await validateBodySize(request)
    if (sizeCheck) {
      return addSecurityHeaders(sizeCheck)
    }

    // Validar CORS
    if (!validateCORS(request)) {
      return addSecurityHeaders(
        NextResponse.json(
          { error: 'Origin not allowed' },
          { status: 403 }
        )
      )
    }

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
        return addSecurityHeaders(
          NextResponse.json(
            { error: validation.error || 'Invalid API key' },
            { status: 401 }
          )
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
        return addSecurityHeaders(
          NextResponse.json(
            { error: 'Insufficient permissions. Required: write' },
            { status: 403 }
          )
        )
      }
    } else {
      // Fallback a autenticación JWT
      const supabase = await createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        return addSecurityHeaders(
          NextResponse.json(
            { error: 'Unauthorized. Provide API key or JWT token' },
            { status: 401 }
          )
        )
      }
      
      userId = user.id
    }

    // Parsear y validar body con Zod
    const body = await request.json()
    const validation = CreateQuoteV1Schema.safeParse(body)

    if (!validation.success) {
      return addSecurityHeaders(
        NextResponse.json(
          {
            error: 'Validation failed',
            details: validation.error.issues.map(i => ({
              path: i.path.join('.'),
              message: i.message,
            })),
          },
          { status: 400 }
        )
      )
    }

    const { client_id, services, notes } = validation.data
    const supabase = await createClient()

    // Validar que el cliente existe
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id, created_by')
      .eq('id', client_id)
      .single()

    if (clientError || !client) {
      return addSecurityHeaders(
        NextResponse.json(
          { error: 'Client not found' },
          { status: 404 }
        )
      )
    }

    // Validar ownership del cliente (si tiene created_by)
    if (client.created_by && client.created_by !== userId && userId) {
      const isAdmin = await checkAdmin(userId)
      if (!isAdmin) {
        return addSecurityHeaders(
          NextResponse.json(
            { error: 'Client does not belong to you' },
            { status: 403 }
          )
        )
      }
    }

    // Validar que todos los servicios existen
    const serviceIds = services.map(s => s.service_id)
    const { data: servicesData, error: servicesError } = await supabase
      .from('services')
      .select('id, base_price')
      .in('id', serviceIds)

    if (servicesError) {
      logger.error('API /v1/quotes', 'Error fetching services', servicesError)
      return addSecurityHeaders(
        NextResponse.json(
          { error: 'Error fetching services' },
          { status: 500 }
        )
      )
    }

    if (!servicesData || servicesData.length !== serviceIds.length) {
      return addSecurityHeaders(
        NextResponse.json(
          { error: 'One or more services not found' },
          { status: 404 }
        )
      )
    }

    // Calcular total con validación de precios
    let totalAmount = 0
    const quoteServices = services.map((s) => {
      const service = servicesData.find((svc) => svc.id === s.service_id)
      if (!service) {
        throw new Error(`Service ${s.service_id} not found`)
      }

      const quantity = Math.max(1, Math.min(1000, s.quantity || 1))
      
      // Validar precio override
      let price: number
      if (s.price !== undefined) {
        // Validar que el precio override no sea más del 200% del precio base
        const basePrice = service.base_price || 0
        const maxPrice = basePrice * 2
        price = Math.max(0, Math.min(maxPrice, s.price))
        
        if (price <= 0) {
          throw new Error(`Invalid price for service ${s.service_id}`)
        }
      } else {
        price = service.base_price || 0
      }

      if (price <= 0) {
        throw new Error(`Invalid price for service ${s.service_id}`)
      }

      const serviceTotal = price * quantity
      totalAmount += serviceTotal

      return {
        quote_id: '', // Se asignará después
        service_id: s.service_id,
        quantity,
        price,
      }
    })

    // Sanitizar notes
    const sanitizedNotes = notes 
      ? sanitizeHTML(notes).substring(0, 5000)
      : null

    // Crear cotización usando función RPC para transacción atómica
    // Si no existe la función, usar inserción normal con rollback manual
    const { data: quote, error: quoteError } = await supabase
      .from('quotes')
      .insert({
        client_id,
        vendor_id: userId,
        notes: sanitizedNotes,
        status: 'DRAFT',
        total_amount: totalAmount,
      })
      .select()
      .single()

    if (quoteError) {
      logger.error('API /v1/quotes', 'Error creating quote', quoteError)
      return addSecurityHeaders(
        NextResponse.json(
          { error: quoteError.message },
          { status: 400 }
        )
      )
    }

    // Asignar quote_id a los servicios
    const quoteServicesWithId = quoteServices.map(s => ({
      ...s,
      quote_id: quote.id,
    }))

    // Insertar servicios
    const { error: quoteServicesError } = await supabase
      .from('quote_services')
      .insert(quoteServicesWithId)

    if (quoteServicesError) {
      logger.error('API /v1/quotes', 'Error creating quote services', quoteServicesError)
      // Rollback: eliminar la cotización creada
      await supabase.from('quotes').delete().eq('id', quote.id)
      return addSecurityHeaders(
        NextResponse.json(
          { error: 'Error creating quote services' },
          { status: 500 }
        )
      )
    }

    // Obtener la cotización completa con servicios
    const { data: quoteWithServices, error: fetchError } = await supabase
      .from('quotes')
      .select('*, quote_services(*)')
      .eq('id', quote.id)
      .single()

    if (fetchError) {
      logger.error('API /v1/quotes', 'Error fetching quote with services', fetchError)
      return addSecurityHeaders(
        NextResponse.json(
          { error: 'Error fetching created quote' },
          { status: 500 }
        )
      )
    }

    // Sanitizar datos para logging
    logger.info('API /v1/quotes', 'Quote created successfully', sanitizeForLogging({
      quoteId: quote.id,
      userId,
      totalAmount,
    }))

    const origin = request.headers.get('origin')
    const response = NextResponse.json(
      {
        data: quoteWithServices,
      },
      { status: 201 }
    )

    // Agregar headers CORS si es necesario
    if (origin && validateCORS(request)) {
      response.headers.set('Access-Control-Allow-Origin', origin)
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-key')
    }

    return addSecurityHeaders(response)
  } catch (error) {
    logger.error('API /v1/quotes', 'Error in POST route', error instanceof Error ? error : new Error(String(error)))
    return addSecurityHeaders(
      NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    )
  }
}

