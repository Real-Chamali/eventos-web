/**
 * GET /api/templates - Get all templates
 * POST /api/templates - Create a new template
 * 
 * Authentication: Required (Bearer token)
 */

import { NextRequest } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import {
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
import { z } from 'zod'

const CreateTemplateSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  event_type: z.string().optional(),
  services: z.array(z.object({
    id: z.string(),
    name: z.string(),
    base_price: z.number(),
    quantity: z.number().optional(),
    final_price: z.number().optional(),
  })).default([]),
  default_notes: z.string().optional(),
  is_public: z.boolean().default(false),
})

/**
 * GET /api/templates
 * Retrieve all templates (public and user's own)
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

    // Rate limiting distribuido
    const rateLimitAllowed = await checkRateLimitAsync(`templates-get-${auth.userId}`, 100, 60000)
    if (!rateLimitAllowed) {
      return errorResponse('Too many requests', 429)
    }

    const supabase = await createClient()

    // Obtener plantillas públicas y del usuario
    const { data, error } = await supabase
      .from('quote_templates')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    await auditAPIAction(auth.userId, 'READ', 'quote_templates', undefined, undefined, undefined, request)

    logger.info('API', 'Templates retrieved', sanitizeForLogging({
      userId: auth.userId,
      count: data?.length,
      isApiKey: auth.isApiKey,
    }))

    return successResponse(data || [], 'Templates retrieved successfully')
  } catch (error) {
    return await handleAPIError(error, 'GET /api/templates')
  }
}

/**
 * POST /api/templates
 * Create a new template
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

    // Rate limiting distribuido (stricter for write operations)
    const rateLimitAllowed = await checkRateLimitAsync(`templates-post-${auth.userId}`, 10, 60000)
    if (!rateLimitAllowed) {
      return errorResponse('Too many requests', 429)
    }

    const body = await request.json()

    // Validate with Zod
    const validation = CreateTemplateSchema.safeParse(body)

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
      .from('quote_templates')
      .insert({
        name: payload.name,
        description: payload.description,
        event_type: payload.event_type,
        services: payload.services,
        default_notes: payload.default_notes,
        is_public: payload.is_public,
        created_by: auth.userId,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) throw error

    await auditAPIAction(auth.userId, 'CREATE', 'quote_templates', data.id, undefined, data, request)

    logger.info('API', 'Template created', sanitizeForLogging({
      templateId: data.id,
      userId: auth.userId,
      name: data.name,
      isApiKey: auth.isApiKey,
    }))

    return successResponse(data, 'Template created successfully', 201)
  } catch (error) {
    return await handleAPIError(error, 'POST /api/templates')
  }
}

