/**
 * GET /api/services - Get all services
 * POST /api/services - Create a new service (admin only)
 * 
 * Authentication: Required (Bearer token)
 * Authorization: POST requires admin role
 */

import { NextRequest } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { z } from 'zod'
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

const CreateServiceSchema = z.object({
  name: z.string().min(1).max(100),
  base_price: z.number().positive(),
  cost_price: z.number().nonnegative(),
})

/**
 * GET /api/services
 * Retrieve all services (public)
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
    if (!checkRateLimit(`service-get-${user.id}`, 100, 60000)) {
      return errorResponse('Too many requests', 429)
    }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from('services')
      .select('*')
      .order('name', { ascending: true })
      .limit(1000)

    if (error) throw error

    await auditAPIAction(user.id, 'READ', 'services', undefined, undefined, undefined, request)

    logger.info('API', 'Services retrieved', {
      userId: user.id,
      count: data?.length,
    })

    return successResponse(data || [], 'Services retrieved successfully')
  } catch (error) {
    return await handleAPIError(error, 'GET /api/services')
  }
}

/**
 * POST /api/services
 * Create a new service (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const methodError = validateMethod(request, ['POST', 'OPTIONS'])
    if (methodError) return methodError

    const { user, error: authError } = await verifyAuth(request)
    if (!user || authError) {
      return errorResponse('Unauthorized', 401)
    }

    // Check admin role
    const isAdmin = await checkAdmin(user.id)
    if (!isAdmin) {
      return errorResponse('Forbidden - Admin access required', 403)
    }

    // Rate limiting (stricter for write operations)
    if (!checkRateLimit(`service-post-${user.id}`, 10, 60000)) {
      return errorResponse('Too many requests', 429)
    }

    const body = await request.json()

    // Validate with Zod
    const validation = CreateServiceSchema.safeParse(body)

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

    const supabase = await createClient()

    const { data, error } = await supabase
      .from('services')
      .insert({
        name: body.name,
        base_price: body.base_price,
        cost_price: body.cost_price,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) throw error

    await auditAPIAction(user.id, 'CREATE', 'services', data.id, undefined, data, request)

    logger.info('API', 'Service created', {
      userId: user.id,
      serviceId: data.id,
    })

    return successResponse(data, 'Service created successfully', 201)
  } catch (error) {
    return await handleAPIError(error, 'POST /api/services')
  }
}

/**
 * OPTIONS /api/services
 * CORS preflight
 */
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': process.env.NEXT_PUBLIC_APP_URL || '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}
