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
import { logger } from '@/lib/utils/logger'
import { CreateQuoteSchema } from '@/lib/validations/schemas'

/**
 * GET /api/quotes
 * Retrieve quotes (filtered by user or admin)
 */
export async function GET(request: NextRequest) {
  try {
    const methodError = validateMethod(request, ['GET', 'OPTIONS'])
    if (methodError) return methodError

    const { user, error: authError } = await verifyAuth(request)
    if (!user || authError) {
      return errorResponse('Unauthorized', 401)
    }

    // Rate limiting
    const clientId = user.id
    if (!checkRateLimit(`quote-get-${clientId}`, 100, 60000)) {
      return errorResponse('Too many requests', 429)
    }

    const supabase = await createClient()
    const isAdmin = await checkAdmin(user.id)

    let query = supabase.from('quotes').select('*').order('created_at', { ascending: false })

    // Filter by user if not admin
    if (!isAdmin) {
      query = query.eq('user_id', user.id)
    }

    const { data, error } = await query.limit(100)

    if (error) throw error

    await auditAPIAction(user.id, 'READ', 'quotes', undefined, undefined, undefined, request)

    logger.info('API', 'Quotes retrieved', {
      userId: user.id,
      count: data?.length,
      isAdmin,
    })

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

    const { user, error: authError } = await verifyAuth(request)
    if (!user || authError) {
      return errorResponse('Unauthorized', 401)
    }

    // Rate limiting
    if (!checkRateLimit(`quote-post-${user.id}`, 20, 60000)) {
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
        user_id: user.id,
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

    await auditAPIAction(user.id, 'CREATE', 'quotes', data.id, undefined, data, request)

    logger.info('API', 'Quote created', {
      userId: user.id,
      quoteId: data.id,
    })

    return successResponse(data, 'Quote created successfully', 201)
  } catch (error) {
    return await handleAPIError(error, 'POST /api/quotes')
  }
}
