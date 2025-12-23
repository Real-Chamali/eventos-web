/**
 * GET /api/templates/[id] - Get a specific template
 * PUT /api/templates/[id] - Update a template
 * DELETE /api/templates/[id] - Delete a template
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

const UpdateTemplateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  event_type: z.string().optional(),
  services: z.array(z.object({
    id: z.string(),
    name: z.string(),
    base_price: z.number(),
    quantity: z.number().optional(),
    final_price: z.number().optional(),
  })).optional(),
  default_notes: z.string().optional(),
  is_public: z.boolean().optional(),
})

/**
 * GET /api/templates/[id]
 * Retrieve a specific template
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const methodError = validateMethod(request, ['GET', 'OPTIONS'])
    if (methodError) return methodError

    const auth = await getAuthenticatedUser(request)
    if (auth.error || !auth.userId) {
      return errorResponse(auth.error || 'Unauthorized', 401)
    }
    
    if (auth.isApiKey && !checkApiKeyPermissions(auth, 'read')) {
      return errorResponse('Insufficient permissions. Required: read', 403)
    }

    const rateLimitAllowed = await checkRateLimitAsync(`templates-get-${auth.userId}`, 100, 60000)
    if (!rateLimitAllowed) {
      return errorResponse('Too many requests', 429)
    }

    const supabase = await createClient()
    const { data, error } = await supabase
      .from('quote_templates')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return errorResponse('Template not found', 404)
      }
      throw error
    }

    await auditAPIAction(auth.userId, 'READ', 'quote_templates', id, undefined, undefined, request)

    return successResponse(data, 'Template retrieved successfully')
  } catch (error) {
    return await handleAPIError(error, 'GET /api/templates/[id]')
  }
}

/**
 * PUT /api/templates/[id]
 * Update a template
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const methodError = validateMethod(request, ['PUT', 'OPTIONS'])
    if (methodError) return methodError

    const auth = await getAuthenticatedUser(request)
    if (auth.error || !auth.userId) {
      return errorResponse(auth.error || 'Unauthorized', 401)
    }
    
    if (auth.isApiKey && !checkApiKeyPermissions(auth, 'write')) {
      return errorResponse('Insufficient permissions. Required: write', 403)
    }

    const rateLimitAllowed = await checkRateLimitAsync(`templates-put-${auth.userId}`, 20, 60000)
    if (!rateLimitAllowed) {
      return errorResponse('Too many requests', 429)
    }

    const body = await request.json()
    const validation = UpdateTemplateSchema.safeParse(body)

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

    // Verificar que el template existe y pertenece al usuario
    const { data: existing, error: fetchError } = await supabase
      .from('quote_templates')
      .select('created_by')
      .eq('id', id)
      .single()

    if (fetchError || !existing) {
      return errorResponse('Template not found', 404)
    }

    // Verificar permisos (solo el creador o admin puede actualizar)
    const { checkAdmin } = await import('@/lib/api/middleware')
    const isAdmin = await checkAdmin(auth.userId)
    
    if (existing.created_by !== auth.userId && !isAdmin) {
      return errorResponse('Forbidden - You can only update your own templates', 403)
    }

    const { data, error } = await supabase
      .from('quote_templates')
      .update({
        ...validation.data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    await auditAPIAction(auth.userId, 'UPDATE', 'quote_templates', id, existing, data, request)

    logger.info('API', 'Template updated', sanitizeForLogging({
      templateId: id,
      userId: auth.userId,
    }))

    return successResponse(data, 'Template updated successfully')
  } catch (error) {
    return await handleAPIError(error, 'PUT /api/templates/[id]')
  }
}

/**
 * DELETE /api/templates/[id]
 * Delete a template
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const methodError = validateMethod(request, ['DELETE', 'OPTIONS'])
    if (methodError) return methodError

    const auth = await getAuthenticatedUser(request)
    if (auth.error || !auth.userId) {
      return errorResponse(auth.error || 'Unauthorized', 401)
    }
    
    if (auth.isApiKey && !checkApiKeyPermissions(auth, 'write')) {
      return errorResponse('Insufficient permissions. Required: write', 403)
    }

    const rateLimitAllowed = await checkRateLimitAsync(`templates-delete-${auth.userId}`, 10, 60000)
    if (!rateLimitAllowed) {
      return errorResponse('Too many requests', 429)
    }

    const supabase = await createClient()

    // Verificar que el template existe y pertenece al usuario
    const { data: existing, error: fetchError } = await supabase
      .from('quote_templates')
      .select('created_by')
      .eq('id', id)
      .single()

    if (fetchError || !existing) {
      return errorResponse('Template not found', 404)
    }

    // Verificar permisos (solo el creador o admin puede eliminar)
    const { checkAdmin } = await import('@/lib/api/middleware')
    const isAdmin = await checkAdmin(auth.userId)
    
    if (existing.created_by !== auth.userId && !isAdmin) {
      return errorResponse('Forbidden - You can only delete your own templates', 403)
    }

    const { error } = await supabase
      .from('quote_templates')
      .delete()
      .eq('id', id)

    if (error) throw error

    await auditAPIAction(auth.userId, 'DELETE', 'quote_templates', id, existing, undefined, request)

    logger.info('API', 'Template deleted', sanitizeForLogging({
      templateId: id,
      userId: auth.userId,
    }))

    return successResponse({ id }, 'Template deleted successfully')
  } catch (error) {
    return await handleAPIError(error, 'DELETE /api/templates/[id]')
  }
}

