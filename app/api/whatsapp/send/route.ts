import { NextRequest, NextResponse } from 'next/server'
import { sendWhatsApp, normalizePhoneNumber } from '@/lib/integrations/whatsapp'
import { createClient } from '@/utils/supabase/server'
import { logger } from '@/lib/utils/logger'
import { handleError, createSuccessResponse, createErrorResponse } from '@/lib/utils/errorHandler'

/**
 * POST /api/whatsapp/send
 * Envía un mensaje de WhatsApp
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return createErrorResponse('No autenticado', 401)
    }

    const body = await request.json()
    const { to, message, mediaUrl } = body

    // Validaciones
    if (!to || !message) {
      return createErrorResponse('Se requiere "to" y "message"', 400)
    }

    // Normalizar número de teléfono
    const normalizedPhone = normalizePhoneNumber(to)
    if (!normalizedPhone) {
      return createErrorResponse('Número de teléfono inválido. Debe estar en formato E.164 (ej: +521234567890)', 400)
    }

    // Enviar mensaje
    const result = await sendWhatsApp({
      to: normalizedPhone,
      message,
      mediaUrl,
    })

    if (!result.success) {
      return createErrorResponse('Error al enviar mensaje de WhatsApp', 500)
    }

    logger.info('WhatsApp API', 'WhatsApp message sent via API', {
      userId: user.id,
      to: normalizedPhone,
      messageId: result.messageId,
    })

    return createSuccessResponse({
      success: true,
      messageId: result.messageId,
    })
  } catch (error) {
    return handleError(error, 'WhatsApp API', 'Error sending WhatsApp message')
  }
}

