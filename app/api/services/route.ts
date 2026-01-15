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
  checkAdmin,
  errorResponse,
  successResponse,
  auditAPIAction,
  validateMethod,
  checkRateLimitAsync,
  handleAPIError,
} from '@/lib/api/middleware'
import { getAuthenticatedUser, checkApiKeyPermissions } from '@/lib/api/authHelper'
import { logger } from '@/lib/utils/logger'
import { sanitizeForLogging } from '@/lib/utils/security'

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

    const auth = await getAuthenticatedUser(request)
    if (auth.error || !auth.userId) {
      return errorResponse(auth.error || 'Unauthorized', 401)
    }
    
    // Verificar permisos si es API key
    if (auth.isApiKey && !checkApiKeyPermissions(auth, 'read')) {
      return errorResponse('Insufficient permissions. Required: read', 403)
    }

    // Rate limiting distribuido (Upstash Redis si está configurado)
    const rateLimitAllowed = await checkRateLimitAsync(`service-get-${auth.userId}`, 100, 60000)
    if (!rateLimitAllowed) {
      return errorResponse('Too many requests', 429)
    }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from('services')
      .select('*')
      .order('name', { ascending: true })
      .limit(1000)

    if (error) throw error

    await auditAPIAction(auth.userId, 'READ', 'services', undefined, undefined, undefined, request)

    // Sanitizar datos antes de loguear
    logger.info('API', 'Services retrieved', sanitizeForLogging({
      userId: auth.userId,
      count: data?.length,
      isApiKey: auth.isApiKey,
    }))

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

    const auth = await getAuthenticatedUser(request)
    if (auth.error || !auth.userId) {
      return errorResponse(auth.error || 'Unauthorized', 401)
    }
    
    // Verificar permisos si es API key
    if (auth.isApiKey && !checkApiKeyPermissions(auth, 'admin')) {
      return errorResponse('Insufficient permissions. Required: admin', 403)
    }

    // Check admin role (para JWT también)
    const isAdmin = await checkAdmin(auth.userId)
    if (!isAdmin) {
      return errorResponse('Forbidden - Admin access required', 403)
    }

    // Rate limiting distribuido (stricter for write operations)
    const rateLimitAllowed = await checkRateLimitAsync(`service-post-${auth.userId}`, 10, 60000)
    if (!rateLimitAllowed) {
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
    const payload = validation.data

    const { data, error } = await supabase
      .from('services')
      .insert({
        name: payload.name,
        base_price: payload.base_price,
        cost_price: payload.cost_price,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) throw error

    await auditAPIAction(auth.userId, 'CREATE', 'services', data.id, undefined, data, request)

    // Sanitizar datos antes de loguear
    logger.info('API', 'Service created', sanitizeForLogging({
      userId: auth.userId,
      serviceId: data.id,
      name: data.name,
      isApiKey: auth.isApiKey,
    }))

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
