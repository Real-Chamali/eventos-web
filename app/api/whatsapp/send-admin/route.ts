import { NextRequest } from 'next/server'
import { sendWhatsAppToAdmin } from '@/lib/integrations/whatsapp'
import { createClient } from '@/utils/supabase/server'
import { logger } from '@/lib/utils/logger'
import { handleError, createSuccessResponse, createErrorResponse } from '@/lib/utils/errorHandler'

/**
 * POST /api/whatsapp/send-admin
 * Envía un mensaje de WhatsApp al administrador
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
    const { message } = body

    // Validaciones
    if (!message) {
      return createErrorResponse('Se requiere "message"', 400)
    }

    // Enviar mensaje al admin
    const result = await sendWhatsAppToAdmin(message)

    if (!result.success) {
      return createErrorResponse('Error al enviar mensaje de WhatsApp al admin', 500)
    }

    logger.info('WhatsApp API', 'WhatsApp message sent to admin via API', {
      userId: user.id,
      messageId: result.messageId,
    })

    return createSuccessResponse({
      success: true,
      messageId: result.messageId,
    })
  } catch (error) {
    return handleError(error, 'WhatsApp API', 'Error sending WhatsApp message to admin')
  }
}

