/**
 * PUT /api/comments/[id] - Update a comment
 * DELETE /api/comments/[id] - Delete a comment
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
import { sanitizeForLogging, sanitizeHTMLSync } from '@/lib/utils/security'
import { z } from 'zod'

const UpdateCommentSchema = z.object({
  content: z.string().min(1).max(5000),
  mentions: z.array(z.string()).optional(),
})

/**
 * PUT /api/comments/[id]
 * Update a comment (only by the author)
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

    const rateLimitAllowed = await checkRateLimitAsync(`comments-put-${auth.userId}`, 20, 60000)
    if (!rateLimitAllowed) {
      return errorResponse('Too many requests', 429)
    }

    const body = await request.json()
    const validation = UpdateCommentSchema.safeParse(body)

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

    // Verificar que el comentario existe y pertenece al usuario
    const { data: existing, error: fetchError } = await supabase
      .from('comments')
      .select('user_id, entity_type, entity_id')
      .eq('id', id)
      .single()

    if (fetchError || !existing) {
      return errorResponse('Comment not found', 404)
    }

    if (existing.user_id !== auth.userId) {
      return errorResponse('Forbidden - You can only update your own comments', 403)
    }

    // Sanitizar contenido
    const sanitizedContent = sanitizeHTMLSync(validation.data.content)

    // Extraer mentions si no se proporcionaron
    const extractMentions = (text: string): string[] => {
      const mentionRegex = /@(\w+)/g
      const matches = text.match(mentionRegex)
      return matches ? matches.map((m) => m.substring(1)) : []
    }

    const mentions = validation.data.mentions || extractMentions(validation.data.content)

    const { data, error } = await supabase
      .from('comments')
      .update({
        content: sanitizedContent,
        mentions: mentions,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select(`
        *,
        user:profiles!comments_user_id_fkey(
          id,
          email,
          full_name
        )
      `)
      .single()

    if (error) throw error

    await auditAPIAction(auth.userId, 'UPDATE', 'comments', id, existing, data, request)

    logger.info('API', 'Comment updated', sanitizeForLogging({
      commentId: id,
      userId: auth.userId,
    }))

    return successResponse(data, 'Comment updated successfully')
  } catch (error) {
    return await handleAPIError(error, 'PUT /api/comments/[id]')
  }
}

/**
 * DELETE /api/comments/[id]
 * Delete a comment (only by the author or admin)
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

    const rateLimitAllowed = await checkRateLimitAsync(`comments-delete-${auth.userId}`, 10, 60000)
    if (!rateLimitAllowed) {
      return errorResponse('Too many requests', 429)
    }

    const supabase = await createClient()

    // Verificar que el comentario existe
    const { data: existing, error: fetchError } = await supabase
      .from('comments')
      .select('user_id')
      .eq('id', id)
      .single()

    if (fetchError || !existing) {
      return errorResponse('Comment not found', 404)
    }

    // Verificar permisos (solo el autor o admin puede eliminar)
    const { checkAdmin } = await import('@/lib/api/middleware')
    const isAdmin = await checkAdmin(auth.userId)
    
    if (existing.user_id !== auth.userId && !isAdmin) {
      return errorResponse('Forbidden - You can only delete your own comments', 403)
    }

    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', id)

    if (error) throw error

    await auditAPIAction(auth.userId, 'DELETE', 'comments', id, existing, undefined, request)

    logger.info('API', 'Comment deleted', sanitizeForLogging({
      commentId: id,
      userId: auth.userId,
    }))

    return successResponse({ id }, 'Comment deleted successfully')
  } catch (error) {
    return await handleAPIError(error, 'DELETE /api/comments/[id]')
  }
}

