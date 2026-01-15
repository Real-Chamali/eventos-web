import { logger } from '@/lib/utils/logger'

type TwilioClient = {
  messages: {
    create: (params: { to: string; from: string; body: string; mediaUrl?: string[] }) => Promise<{ sid: string }>
  }
}

type TwilioModule = {
  default?: (accountSid?: string, authToken?: string) => TwilioClient
}

// Importar Twilio solo cuando sea necesario (solo en servidor)
let twilioModule: TwilioModule | null = null

const getTwilio = async (): Promise<TwilioModule | null> => {
  if (typeof window !== 'undefined') {
    // No importar Twilio en el cliente
    return null
  }
  if (!twilioModule) {
    twilioModule = (await import('twilio')) as TwilioModule
  }
  return twilioModule
}

// Inicializar Twilio solo si hay credenciales (para evitar errores en build)
const getTwilioClient = async () => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN
  const whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER

  if (!accountSid || !authToken || !whatsappNumber) {
    return null
  }

  const twilioModule = await getTwilio()
  if (!twilioModule) {
    return null
  }

  // Twilio se importa como namespace, usar el constructor directamente
  const Twilio = (twilioModule.default || twilioModule) as (accountSid: string, authToken: string) => TwilioClient
  return {
    client: Twilio(accountSid, authToken),
    from: whatsappNumber,
  }
}

export interface WhatsAppOptions {
  to: string // Número de teléfono en formato E.164 (ej: +521234567890)
  message: string
  mediaUrl?: string // URL de imagen o documento (opcional)
}

/**
 * Normaliza un número de teléfono al formato E.164 requerido por WhatsApp
 * @param phone - Número de teléfono en cualquier formato
 * @returns Número normalizado en formato E.164 o null si es inválido
 */
export function normalizePhoneNumber(phone: string | null | undefined): string | null {
  if (!phone) return null

  // Remover todos los caracteres que no sean dígitos o +
  let cleaned = phone.replace(/[^\d+]/g, '')

  // Si no empieza con +, asumir que es número mexicano y agregar +52
  if (!cleaned.startsWith('+')) {
    // Si empieza con 52, agregar +
    if (cleaned.startsWith('52')) {
      cleaned = '+' + cleaned
    } else if (cleaned.startsWith('1')) {
      // Número de 10 dígitos mexicano, agregar +52
      cleaned = '+52' + cleaned
    } else {
      // Asumir número mexicano de 10 dígitos
      cleaned = '+52' + cleaned
    }
  }

  // Validar formato E.164 básico (debe empezar con + y tener al menos 10 dígitos)
  if (!/^\+[1-9]\d{9,14}$/.test(cleaned)) {
    logger.warn('WhatsApp', 'Invalid phone number format', {
      original: phone,
      cleaned,
    })
    return null
  }

  return cleaned
}

/**
 * Obtiene el número de teléfono del administrador desde variables de entorno
 */
export function getAdminPhoneNumber(): string | null {
  const adminPhone = process.env.ADMIN_PHONE_NUMBER || process.env.TWILIO_ADMIN_NUMBER
  if (!adminPhone) return null
  return normalizePhoneNumber(adminPhone)
}

/**
 * Envía un mensaje de WhatsApp al administrador
 */
export async function sendWhatsAppToAdmin(message: string): Promise<{ success: boolean; messageId?: string }> {
  const adminPhone = getAdminPhoneNumber()
  if (!adminPhone) {
    logger.warn('WhatsApp', 'Admin phone number not configured, WhatsApp not sent to admin', {
      message: message.substring(0, 50) + '...',
    })
    return { success: false }
  }

  return sendWhatsApp({
    to: adminPhone,
    message,
  })
}

/**
 * Envía un mensaje de WhatsApp usando Twilio
 */
export async function sendWhatsApp(options: WhatsAppOptions): Promise<{ success: boolean; messageId?: string }> {
  try {
    const twilioConfig = await getTwilioClient()

    if (!twilioConfig) {
      logger.warn('WhatsApp', 'Twilio credentials not configured, WhatsApp message not sent', {
        to: options.to,
      })
      return { success: false }
    }

    // Normalizar número de teléfono
    const normalizedPhone = normalizePhoneNumber(options.to)
    if (!normalizedPhone) {
      logger.error('WhatsApp', 'Invalid phone number format', new Error('Invalid phone number'), {
        original: options.to,
      })
      return { success: false }
    }

    // Preparar mensaje
    interface TwilioMessageData {
      from: string
      to: string
      body: string
      mediaUrl?: string[]
    }

    const messageData: TwilioMessageData = {
      from: `whatsapp:${twilioConfig.from}`,
      to: `whatsapp:${normalizedPhone}`,
      body: options.message,
    }

    // Agregar media si existe
    if (options.mediaUrl) {
      messageData.mediaUrl = [options.mediaUrl]
    }

    // Enviar mensaje
    const message = await twilioConfig.client.messages.create(messageData)

    logger.info('WhatsApp', 'WhatsApp message sent successfully', {
      to: normalizedPhone,
      messageId: message.sid,
    })

    return { success: true, messageId: message.sid }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    logger.error('WhatsApp', 'Error sending WhatsApp message', error instanceof Error ? error : new Error(errorMessage), {
      to: options.to,
    })
    return { success: false }
  }
}

/**
 * Plantillas de mensajes de WhatsApp Premium
 * Mensajes profesionales, bien formateados y con emojis estratégicos
 */
export const whatsappTemplates = {
  /**
   * Mensaje cuando se crea una nueva cotización
   * Formato premium con mejor estructura y presentación
   */
  quoteCreated: (quoteId: string, clientName: string, totalAmount: number) => {
    const shortId = quoteId.slice(0, 8).toUpperCase()
    const formattedAmount = new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 2,
    }).format(totalAmount)

    return `✨ *Nueva Cotización Creada* ✨

Hola ${clientName}! 👋

Hemos preparado una cotización personalizada para ti:

━━━━━━━━━━━━━━━━━━━━
📋 *ID de Cotización:* ${shortId}
💰 *Monto Total:* ${formattedAmount}
━━━━━━━━━━━━━━━━━━━━

🔗 Ver detalles completos:
${process.env.NEXT_PUBLIC_APP_URL || 'https://eventos-web-lovat.vercel.app'}/dashboard/quotes/${quoteId}

Estamos aquí para ayudarte. Si tienes alguna pregunta, no dudes en contactarnos.

¡Gracias por confiar en nosotros! 🙏✨`
  },

  /**
   * Mensaje cuando se aprueba una cotización
   * Mensaje celebratorio y profesional
   */
  quoteApproved: (quoteId: string, clientName: string, totalAmount: number) => {
    const shortId = quoteId.slice(0, 8).toUpperCase()
    const formattedAmount = new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 2,
    }).format(totalAmount)

    return `🎉 *¡Cotización Aprobada!* 🎉

¡Excelente noticia, ${clientName}!

Tu cotización ha sido *APROBADA* y estamos listos para comenzar:

━━━━━━━━━━━━━━━━━━━━
✅ *Estado:* Aprobada
📋 *ID:* ${shortId}
💰 *Monto Total:* ${formattedAmount}
━━━━━━━━━━━━━━━━━━━━

🔗 Ver detalles y gestionar pagos:
${process.env.NEXT_PUBLIC_APP_URL || 'https://eventos-web-lovat.vercel.app'}/dashboard/quotes/${quoteId}

Nuestro equipo está trabajando para hacer tu evento inolvidable. Te mantendremos informado en cada paso.

¡Gracias por confiar en nosotros! 🎊✨`
  },

  /**
   * Mensaje cuando se rechaza una cotización
   * Mensaje empático y profesional
   */
  quoteRejected: (quoteId: string, clientName: string) => {
    const shortId = quoteId.slice(0, 8).toUpperCase()

    return `Hola ${clientName},

Lamentamos informarte que tu cotización #${shortId} ha sido rechazada.

━━━━━━━━━━━━━━━━━━━━
❌ *Estado:* Rechazada
📋 *ID:* ${shortId}
━━━━━━━━━━━━━━━━━━━━

Entendemos que esto puede ser decepcionante. Si tienes alguna pregunta o deseas hacer cambios para una nueva cotización, estamos aquí para ayudarte.

No dudes en contactarnos para discutir alternativas o ajustes.

Gracias por tu interés y confianza. 🙏`
  },

  /**
   * Mensaje cuando se registra un pago
   * Mensaje detallado con información financiera clara
   */
  paymentRegistered: (
    quoteId: string,
    clientName: string,
    amount: number,
    totalPaid: number,
    totalAmount: number
  ) => {
    const shortId = quoteId.slice(0, 8).toUpperCase()
    const formattedAmount = new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 2,
    }).format(amount)
    const formattedTotalPaid = new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 2,
    }).format(totalPaid)
    const formattedTotal = new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 2,
    }).format(totalAmount)
    const remaining = totalAmount - totalPaid
    const formattedRemaining = new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 2,
    }).format(remaining)
    const percentagePaid = totalAmount > 0 ? Math.round((totalPaid / totalAmount) * 100) : 0
    const isFullyPaid = remaining <= 0

    return `✅ *Pago Registrado Exitosamente* ✅

Hola ${clientName}!

Hemos registrado tu pago y actualizado el estado de tu cotización:

━━━━━━━━━━━━━━━━━━━━
📋 *Cotización:* #${shortId}
💵 *Pago Recibido:* ${formattedAmount}
━━━━━━━━━━━━━━━━━━━━

📊 *Resumen Financiero:*
💰 Total Pagado: ${formattedTotalPaid} (${percentagePaid}%)
📈 Total Cotización: ${formattedTotal}
${isFullyPaid ? '✅ *Estado:* Liquidado' : `⏳ Pendiente: ${formattedRemaining}`}
━━━━━━━━━━━━━━━━━━━━

🔗 Ver detalles y recibos:
${process.env.NEXT_PUBLIC_APP_URL || 'https://eventos-web-lovat.vercel.app'}/dashboard/quotes/${quoteId}

${isFullyPaid ? '🎉 ¡Gracias por completar tu pago! Tu evento está confirmado.' : '¡Gracias por tu pago! Te recordaremos cuando sea necesario completar el saldo.'}

¡Estamos emocionados de hacer tu evento realidad! 🎊✨`
  },

  /**
   * Recordatorio de evento próximo
   * Mensaje proactivo y útil
   */
  eventReminder: (eventDate: string, eventName: string, clientName: string, daysUntil: number) => {
    const daysText = daysUntil === 1 ? 'mañana' : daysUntil === 0 ? 'hoy' : `en ${daysUntil} días`
    const urgency = daysUntil <= 1 ? '🔴' : daysUntil <= 3 ? '🟡' : '🟢'

    return `${urgency} *Recordatorio de Evento* ${urgency}

Hola ${clientName}!

Este es un recordatorio amigable de tu próximo evento:

━━━━━━━━━━━━━━━━━━━━
📅 *Evento:* ${eventName}
🗓️ *Fecha:* ${eventDate}
⏱️ *Tiempo Restante:* ${daysText}
━━━━━━━━━━━━━━━━━━━━

${daysUntil <= 1 ? '⚠️ Tu evento es muy pronto. Por favor, asegúrate de tener todo listo y confirma cualquier detalle pendiente.' : '💡 Sugerencia: Revisa los detalles de tu evento y confirma que todo esté en orden.'}

Nuestro equipo está listo y emocionado de hacer tu evento inolvidable.

Si tienes alguna pregunta o necesitas hacer cambios, no dudes en contactarnos.

¡Nos vemos pronto! 🎊✨`
  },

  /**
   * Mensaje cuando se crea un evento
   * Mensaje celebratorio y profesional
   */
  eventCreated: (eventName: string, clientName: string, eventDate: string) => {
    return `🎉 *¡Evento Creado Exitosamente!* 🎉

Hola ${clientName}!

Tu evento ha sido creado y está en nuestro sistema:

━━━━━━━━━━━━━━━━━━━━
📅 *Evento:* ${eventName}
🗓️ *Fecha:* ${eventDate}
✅ *Estado:* Confirmado
━━━━━━━━━━━━━━━━━━━━

Nuestro equipo está trabajando para hacer tu evento perfecto. Te mantendremos informado en cada paso del proceso.

Recibirás recordatorios automáticos antes de la fecha del evento.

Si tienes alguna pregunta o necesitas hacer cambios, estamos aquí para ayudarte.

¡Gracias por confiar en nosotros! 🙏✨`
  },

  /**
   * Mensajes para el administrador
   * Formato premium para notificaciones internas
   */
  admin: {
    /**
     * Notificación al admin cuando se crea una nueva cotización
     */
    quoteCreated: (quoteId: string, clientName: string, totalAmount: number, vendorName?: string) => {
      const shortId = quoteId.slice(0, 8).toUpperCase()
      const formattedAmount = new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN',
        minimumFractionDigits: 2,
      }).format(totalAmount)

      return `📄 *Nueva Cotización Creada*

━━━━━━━━━━━━━━━━━━━━
📋 *ID:* ${shortId}
👤 *Cliente:* ${clientName}
${vendorName ? `👨‍💼 *Vendedor:* ${vendorName}\n` : ''}💰 *Total:* ${formattedAmount}
━━━━━━━━━━━━━━━━━━━━

🔗 Ver y gestionar:
${process.env.NEXT_PUBLIC_APP_URL || 'https://eventos-web-lovat.vercel.app'}/dashboard/quotes/${quoteId}

⏰ Revisa y aprueba cuando esté listo.`
    },

    /**
     * Notificación al admin cuando se registra un pago importante
     */
    paymentReceived: (quoteId: string, clientName: string, amount: number, totalPaid: number, totalAmount: number) => {
      const shortId = quoteId.slice(0, 8).toUpperCase()
      const formattedAmount = new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN',
        minimumFractionDigits: 2,
      }).format(amount)
      const formattedTotalPaid = new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN',
        minimumFractionDigits: 2,
      }).format(totalPaid)
      const percentage = totalAmount > 0 ? Math.round((totalPaid / totalAmount) * 100) : 0
      const isFullyPaid = totalPaid >= totalAmount

      return `💰 *Pago Recibido* ${isFullyPaid ? '✅' : ''}

━━━━━━━━━━━━━━━━━━━━
📋 *Cotización:* #${shortId}
👤 *Cliente:* ${clientName}
💵 *Monto Recibido:* ${formattedAmount}
━━━━━━━━━━━━━━━━━━━━

📊 *Estado Financiero:*
💰 Total Pagado: ${formattedTotalPaid} (${percentage}%)
📈 Total Cotización: ${new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN',
        minimumFractionDigits: 2,
      }).format(totalAmount)}
${isFullyPaid ? '✅ *Estado:* Liquidado' : `⏳ Pendiente: ${new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN',
        minimumFractionDigits: 2,
      }).format(totalAmount - totalPaid)}`}
━━━━━━━━━━━━━━━━━━━━

🔗 Ver detalles:
${process.env.NEXT_PUBLIC_APP_URL || 'https://eventos-web-lovat.vercel.app'}/dashboard/quotes/${quoteId}

${isFullyPaid ? '🎉 ¡Cotización completamente pagada!' : '💡 El cliente aún tiene saldo pendiente.'}`
    },

    /**
     * Notificación al admin cuando se aprueba una cotización
     */
    quoteApproved: (quoteId: string, clientName: string, totalAmount: number) => {
      const shortId = quoteId.slice(0, 8).toUpperCase()
      const formattedAmount = new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN',
        minimumFractionDigits: 2,
      }).format(totalAmount)

      return `✅ *Cotización Aprobada*

━━━━━━━━━━━━━━━━━━━━
📋 *ID:* ${shortId}
👤 *Cliente:* ${clientName}
💰 *Total:* ${formattedAmount}
✅ *Estado:* Aprobada
━━━━━━━━━━━━━━━━━━━━

🔗 Ver y gestionar:
${process.env.NEXT_PUBLIC_APP_URL || 'https://eventos-web-lovat.vercel.app'}/dashboard/quotes/${quoteId}

💡 El cliente ha sido notificado. Puedes comenzar a trabajar en el evento.`
    },
  },
}

/**
 * Timing inteligente para envío de WhatsApp
 * Evita enviar mensajes en horarios inapropiados
 */
export function getOptimalSendTime(): Date | null {
  const now = new Date()
  const hour = now.getHours()
  const day = now.getDay() // 0 = Domingo, 6 = Sábado

  // No enviar en horarios inapropiados (antes de 9 AM o después de 9 PM)
  if (hour < 9 || hour >= 21) {
    // Si es muy temprano, programar para las 9 AM
    if (hour < 9) {
      const sendTime = new Date(now)
      sendTime.setHours(9, 0, 0, 0)
      return sendTime
    }
    // Si es muy tarde, programar para mañana a las 9 AM
    const sendTime = new Date(now)
    sendTime.setDate(sendTime.getDate() + 1)
    sendTime.setHours(9, 0, 0, 0)
    return sendTime
  }

  // No enviar los domingos (excepto si es urgente)
  if (day === 0 && hour < 12) {
    const sendTime = new Date(now)
    sendTime.setHours(12, 0, 0, 0)
    return sendTime
  }

  // Enviar inmediatamente si está en horario apropiado
  return null
}

/**
 * Envía WhatsApp con timing inteligente y retry logic
 */
export async function sendWhatsAppWithRetry(
  options: WhatsAppOptions,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<{ success: boolean; messageId?: string; retries?: number }> {
  let lastError: Error | null = null
  let retries = 0

  // Verificar timing óptimo
  const optimalTime = getOptimalSendTime()
  if (optimalTime) {
    // Si no es el momento óptimo, programar para más tarde
    const delay = optimalTime.getTime() - Date.now()
    if (delay > 0) {
      logger.info('WhatsApp', 'Message scheduled for optimal time', {
        to: options.to,
        scheduledFor: optimalTime.toISOString(),
      })
      // En producción, aquí podrías usar un job queue
      // Por ahora, enviamos inmediatamente pero logueamos
    }
  }

  // Intentar enviar con retry logic
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const result = await sendWhatsApp(options)
      if (result.success) {
        return { ...result, retries: attempt }
      }
      lastError = new Error('WhatsApp send failed')
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      retries = attempt + 1

      // Esperar antes del siguiente intento (exponential backoff)
      if (attempt < maxRetries - 1) {
        const backoffDelay = delayMs * Math.pow(2, attempt)
        await new Promise(resolve => setTimeout(resolve, backoffDelay))
      }
    }
  }

  logger.error('WhatsApp', 'Failed to send after retries', lastError || new Error('Unknown error'), {
    to: options.to,
    retries,
  })

  return { success: false, retries }
}

