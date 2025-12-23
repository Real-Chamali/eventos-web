import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { logger } from '@/lib/utils/logger'
import { sendEmail, EmailOptions } from '@/lib/integrations/email'
import { getAuthenticatedUser, checkApiKeyPermissions } from '@/lib/api/authHelper'
import { checkAdmin, errorResponse, successResponse, validateMethod, checkRateLimitAsync, handleAPIError } from '@/lib/api/middleware'
import { sanitizeForLogging } from '@/lib/utils/security'

/**
 * API Route para envío de emails
 * Integrado con Resend para envío profesional
 * Requiere autenticación y permisos de escritura
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

    // Rate limiting distribuido
    const rateLimitAllowed = await checkRateLimitAsync(`email-send-${auth.userId}`, 10, 60000)
    if (!rateLimitAllowed) {
      return errorResponse('Too many requests', 429)
    }

    const body = await request.json()
    const { to, subject, html, from, replyTo, attachments } = body

    if (!to || !subject || !html) {
      return errorResponse('to, subject, and html are required', 400)
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const recipients = Array.isArray(to) ? to : [to]
    for (const recipient of recipients) {
      if (!emailRegex.test(recipient)) {
        return errorResponse(`Invalid email address: ${recipient}`, 400)
      }
    }

    const emailOptions: EmailOptions = {
      to,
      subject,
      html,
      from,
      replyTo,
      attachments,
    }

    const result = await sendEmail(emailOptions)

    if (!result.success) {
      logger.error('API /email/send', 'Failed to send email', new Error('Unknown error'), sanitizeForLogging({
        userId: auth.userId,
        to: Array.isArray(to) ? to.join(', ') : to,
        subject,
      }))
      return errorResponse('Failed to send email', 500)
    }

    logger.info('API /email/send', 'Email sent successfully', sanitizeForLogging({
      userId: auth.userId,
      messageId: result.messageId,
      to: Array.isArray(to) ? to.join(', ') : to,
      subject,
      isApiKey: auth.isApiKey,
    }))

    return successResponse({
      messageId: result.messageId,
    }, 'Email sent successfully')
  } catch (error) {
    return await handleAPIError(error, 'POST /api/email/send')
  }
}

