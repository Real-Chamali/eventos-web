/**
 * GET /api/comments - Get comments for an entity
 * POST /api/comments - Create a new comment
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

const CreateCommentSchema = z.object({
  entity_type: z.enum(['quote', 'event', 'client']),
  entity_id: z.string().uuid(),
  content: z.string().min(1).max(5000),
  mentions: z.array(z.string()).default([]),
})

/**
 * GET /api/comments
 * Retrieve comments for an entity
 * Query params: entity_type, entity_id
 */
export async function GET(request: NextRequest) {
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

    const rateLimitAllowed = await checkRateLimitAsync(`comments-get-${auth.userId}`, 100, 60000)
    if (!rateLimitAllowed) {
      return errorResponse('Too many requests', 429)
    }

    const url = new URL(request.url)
    const entityType = url.searchParams.get('entity_type')
    const entityId = url.searchParams.get('entity_id')

    if (!entityType || !entityId) {
      return errorResponse('entity_type and entity_id are required', 400)
    }

    if (!['quote', 'event', 'client'].includes(entityType)) {
      return errorResponse('Invalid entity_type. Must be: quote, event, or client', 400)
    }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from('comments')
      .select(`
        *,
        user:profiles!comments_user_id_fkey(
          id,
          email,
          full_name
        )
      `)
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .order('created_at', { ascending: true })

    if (error) throw error

    await auditAPIAction(auth.userId, 'READ', 'comments', undefined, undefined, undefined, request)

    logger.info('API', 'Comments retrieved', sanitizeForLogging({
      userId: auth.userId,
      entityType,
      entityId,
      count: data?.length,
      isApiKey: auth.isApiKey,
    }))

    return successResponse(data || [], 'Comments retrieved successfully')
  } catch (error) {
    return await handleAPIError(error, 'GET /api/comments')
  }
}

/**
 * POST /api/comments
 * Create a new comment
 */
export async function POST(request: NextRequest) {
  try {
    const methodError = validateMethod(request, ['POST', 'OPTIONS'])
    if (methodError) return methodError

    const auth = await getAuthenticatedUser(request)
    if (auth.error || !auth.userId) {
      return errorResponse(auth.error || 'Unauthorized', 401)
    }
    
    if (auth.isApiKey && !checkApiKeyPermissions(auth, 'write')) {
      return errorResponse('Insufficient permissions. Required: write', 403)
    }

    const rateLimitAllowed = await checkRateLimitAsync(`comments-post-${auth.userId}`, 30, 60000)
    if (!rateLimitAllowed) {
      return errorResponse('Too many requests', 429)
    }

    const body = await request.json()
    const validation = CreateCommentSchema.safeParse(body)

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

    // Sanitizar contenido
    const sanitizedContent = sanitizeHTMLSync(payload.content)

    // Extraer mentions del contenido si no se proporcionaron
    const extractMentions = (text: string): string[] => {
      const mentionRegex = /@(\w+)/g
      const matches = text.match(mentionRegex)
      return matches ? matches.map((m) => m.substring(1)) : []
    }

    const mentions = payload.mentions.length > 0 
      ? payload.mentions 
      : extractMentions(payload.content)

    const { data, error } = await supabase
      .from('comments')
      .insert({
        entity_type: payload.entity_type,
        entity_id: payload.entity_id,
        user_id: auth.userId,
        content: sanitizedContent,
        mentions: mentions,
        created_at: new Date().toISOString(),
      })
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

    // Crear notificaciones para usuarios mencionados
    if (mentions.length > 0) {
      try {
        const { createNotification } = await import('@/lib/utils/notifications')
        
        // Obtener IDs de usuarios mencionados por email
        const { data: mentionedUsers } = await supabase
          .from('profiles')
          .select('id')
          .in('email', mentions)

        if (mentionedUsers) {
          for (const user of mentionedUsers) {
            await createNotification({
              userId: user.id,
              type: 'system',
              title: 'Te mencionaron en un comentario',
              message: `Te mencionaron en un comentario`,
              metadata: {
                entity_type: payload.entity_type,
                entity_id: payload.entity_id,
                comment_id: data.id,
              },
            })
          }
        }
      } catch (notifError) {
        logger.warn('API', 'Failed to create mention notifications', {
          error: notifError instanceof Error ? notifError.message : String(notifError),
        })
      }
    }

    await auditAPIAction(auth.userId, 'CREATE', 'comments', data.id, undefined, data, request)

    logger.info('API', 'Comment created', sanitizeForLogging({
      commentId: data.id,
      userId: auth.userId,
      entityType: payload.entity_type,
      entityId: payload.entity_id,
      mentionsCount: mentions.length,
      isApiKey: auth.isApiKey,
    }))

    return successResponse(data, 'Comment created successfully', 201)
  } catch (error) {
    return await handleAPIError(error, 'POST /api/comments')
  }
}

