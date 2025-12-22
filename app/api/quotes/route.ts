/**
 * GET /api/quotes - Get all quotes
 * POST /api/quotes - Create a new quote
 * 
 * Authentication: Required (Bearer token)
 * Authorization: Users see their own quotes, admins see all
 */

import { NextRequest } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import {
  verifyAuth,
  checkAdmin,
  errorResponse,
  successResponse,
  auditAPIAction,
  validateMethod,
  checkRateLimit,
  handleAPIError,
} from '@/lib/api/middleware'
import { getAuthenticatedUser, checkApiKeyPermissions } from '@/lib/api/authHelper'
import { logger } from '@/lib/utils/logger'
import { CreateQuoteSchema } from '@/lib/validations/schemas'
import { sanitizeForLogging } from '@/lib/utils/security'
import { createNotification } from '@/lib/utils/notifications'

/**
 * GET /api/quotes
 * Retrieve quotes (filtered by user or admin)
 */
export async function GET(request: NextRequest) {
  try {
    const methodError = validateMethod(request, ['GET', 'OPTIONS'])
    if (methodError) return methodError

    const auth = await getAuthenticatedUser(request)
    if (auth.error || !auth.userId) {
      return errorResponse(auth.error || 'Unauthorized', 401)
    }
    
    // Verificar permisos si es API key
    if (auth.isApiKey && !checkApiKeyPermissions(auth, 'read')) {
      return errorResponse('Insufficient permissions. Required: read', 403)
    }

    // Rate limiting
    const clientId = auth.userId
    if (!checkRateLimit(`quote-get-${clientId}`, 100, 60000)) {
      return errorResponse('Too many requests', 429)
    }

    const supabase = await createClient()
    const isAdmin = await checkAdmin(auth.userId)

    let query = supabase.from('quotes').select('*').order('created_at', { ascending: false })

    // Filter by user if not admin
    if (!isAdmin) {
      query = query.eq('vendor_id', auth.userId)
    }

    const { data, error } = await query.limit(100)

    if (error) throw error

    await auditAPIAction(auth.userId, 'READ', 'quotes', undefined, undefined, undefined, request)

    // Sanitizar datos antes de loguear
    const { sanitizeForLogging } = await import('@/lib/utils/security')
    logger.info('API', 'Quotes retrieved', sanitizeForLogging({
      userId: auth.userId,
      count: data?.length,
      isAdmin,
      isApiKey: auth.isApiKey,
    }))

    return successResponse(data || [], 'Quotes retrieved successfully')
  } catch (error) {
    return await handleAPIError(error, 'GET /api/quotes')
  }
}

/**
 * POST /api/quotes
 * Create a new quote
 */
export async function POST(request: NextRequest) {
  try {
    const methodError = validateMethod(request, ['POST', 'OPTIONS'])
    if (methodError) return methodError

    const auth = await getAuthenticatedUser(request)
    if (auth.error || !auth.userId) {
      return errorResponse(auth.error || 'Unauthorized', 401)
    }
    
    // Verificar permisos si es API key
    if (auth.isApiKey && !checkApiKeyPermissions(auth, 'write')) {
      return errorResponse('Insufficient permissions. Required: write', 403)
    }

    // Rate limiting
    if (!checkRateLimit(`quote-post-${auth.userId}`, 20, 60000)) {
      return errorResponse('Too many requests', 429)
    }

    const body = await request.json()

    // Validate with Zod
    const validation = CreateQuoteSchema.safeParse(body)

    if (!validation.success) {
      const fieldErrors = validation.error.issues.reduce(
        (acc, issue) => {
          acc[issue.path.join('.')] = issue.message
          return acc
        },
        {} as Record<string, string>
      )
      return errorResponse('Validation failed', 400, fieldErrors)
    }

    const payload = validation.data

    const supabase = await createClient()

    // Create quote
    const { data, error } = await supabase
      .from('quotes')
      .insert({
        vendor_id: auth.userId,
        client_id: payload.client_id,
        status: 'draft',
        total_price: payload.total_price,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) throw error

    // Create quote services
    if (payload.services && payload.services.length > 0) {
      const services = payload.services.map((service) => ({
        quote_id: data.id,
        service_id: service.service_id,
        quantity: service.quantity,
        final_price: service.final_price,
      }))

      const { error: servicesError } = await supabase.from('quote_services').insert(services)
      if (servicesError) throw servicesError
    }

    await auditAPIAction(auth.userId, 'CREATE', 'quotes', data.id, undefined, data, request)

    // Crear notificaciones
    try {
      // Notificar al vendedor
      await createNotification({
        userId: auth.userId,
        type: 'quote',
        title: 'Cotización creada',
        message: `Has creado una nueva cotización #${data.id.slice(0, 8)}`,
        metadata: {
          quote_id: data.id,
          link: `/dashboard/quotes/${data.id}`,
        },
      })

      // Notificar al cliente si existe
      if (payload.client_id) {
        // Obtener información del cliente para el mensaje
        const { data: clientData } = await supabase
          .from('clients')
          .select('name')
          .eq('id', payload.client_id)
          .single()

        await createNotification({
          userId: payload.client_id,
          type: 'quote',
          title: 'Nueva cotización recibida',
          message: `Has recibido una nueva cotización${clientData?.name ? ` de ${clientData.name}` : ''}`,
          metadata: {
            quote_id: data.id,
            link: `/dashboard/quotes/${data.id}`,
          },
        })
      }
    } catch (notificationError) {
      // No fallar si hay error en notificaciones
      logger.warn('API', 'Error creating notifications for quote', {
        error: notificationError instanceof Error ? notificationError.message : String(notificationError),
        quoteId: data.id,
      })
    }

    // Sanitizar datos antes de loguear
    logger.info('API', 'Quote created', sanitizeForLogging({
      userId: auth.userId,
      quoteId: data.id,
      clientId: payload.client_id,
      isApiKey: auth.isApiKey,
    }))

    return successResponse(data, 'Quote created successfully', 201)
  } catch (error) {
    return await handleAPIError(error, 'POST /api/quotes')
  }
}
