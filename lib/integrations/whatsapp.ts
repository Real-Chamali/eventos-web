import { logger } from '@/lib/utils/logger'

// Importar Twilio solo cuando sea necesario (solo en servidor)
let twilioModule: any = null

const getTwilio = async () => {
  if (typeof window !== 'undefined') {
    // No importar Twilio en el cliente
    return null
  }
  if (!twilioModule) {
    twilioModule = await import('twilio')
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
  const Twilio = twilioModule.default || (twilioModule as any)
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
    const messageData: any = {
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
 * Plantillas de mensajes de WhatsApp
 * Los mensajes de WhatsApp deben ser más cortos y directos que los emails
 */
export const whatsappTemplates = {
  /**
   * Mensaje cuando se crea una nueva cotización
   */
  quoteCreated: (quoteId: string, clientName: string, totalAmount: number) => {
    const shortId = quoteId.slice(0, 8)
    const formattedAmount = new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(totalAmount)

    return `Hola ${clientName}! 👋

Hemos creado una nueva cotización para ti:

📄 ID: ${shortId}
💰 Total: ${formattedAmount}

Puedes ver todos los detalles en:
${process.env.NEXT_PUBLIC_APP_URL || 'https://eventos-web-lovat.vercel.app'}/dashboard/quotes/${quoteId}

¡Gracias por confiar en nosotros! 🙏`
  },

  /**
   * Mensaje cuando se aprueba una cotización
   */
  quoteApproved: (quoteId: string, clientName: string, totalAmount: number) => {
    const shortId = quoteId.slice(0, 8)
    const formattedAmount = new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(totalAmount)

    return `¡Excelente noticia, ${clientName}! 🎉

Tu cotización ha sido *APROBADA*:

📄 ID: ${shortId}
💰 Total: ${formattedAmount}

Puedes ver todos los detalles en:
${process.env.NEXT_PUBLIC_APP_URL || 'https://eventos-web-lovat.vercel.app'}/dashboard/quotes/${quoteId}

¡Estamos listos para hacer tu evento inolvidable! 🎊`
  },

  /**
   * Mensaje cuando se rechaza una cotización
   */
  quoteRejected: (quoteId: string, clientName: string) => {
    const shortId = quoteId.slice(0, 8)

    return `Hola ${clientName},

Lamentamos informarte que tu cotización #${shortId} ha sido rechazada.

Si tienes alguna pregunta o deseas hacer cambios, no dudes en contactarnos.

Gracias por tu interés.`
  },

  /**
   * Mensaje cuando se registra un pago
   */
  paymentRegistered: (
    quoteId: string,
    clientName: string,
    amount: number,
    totalPaid: number,
    totalAmount: number
  ) => {
    const shortId = quoteId.slice(0, 8)
    const formattedAmount = new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(amount)
    const formattedTotalPaid = new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(totalPaid)
    const formattedTotal = new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(totalAmount)
    const remaining = totalAmount - totalPaid
    const formattedRemaining = new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(remaining)

    return `Hola ${clientName}! ✅

Hemos registrado tu pago:

📄 Cotización: #${shortId}
💵 Pago recibido: ${formattedAmount}
💰 Total pagado: ${formattedTotalPaid}
📊 Total de cotización: ${formattedTotal}
⏳ Pendiente: ${formattedRemaining}

Ver detalles:
${process.env.NEXT_PUBLIC_APP_URL || 'https://eventos-web-lovat.vercel.app'}/dashboard/quotes/${quoteId}

¡Gracias por tu pago! 🙏`
  },

  /**
   * Recordatorio de evento próximo
   */
  eventReminder: (eventDate: string, eventName: string, clientName: string, daysUntil: number) => {
    const daysText = daysUntil === 1 ? 'mañana' : `en ${daysUntil} días`

    return `Hola ${clientName}! ⏰

Este es un recordatorio de tu próximo evento:

📅 Evento: ${eventName}
🗓️ Fecha: ${eventDate}
⏱️ Tiempo restante: ${daysText}

Por favor, asegúrate de tener todo listo.

¡Estamos emocionados de hacer tu evento inolvidable! 🎊`
  },

  /**
   * Mensaje cuando se crea un evento
   */
  eventCreated: (eventName: string, clientName: string, eventDate: string) => {
    return `Hola ${clientName}! 🎉

Tu evento ha sido creado exitosamente:

📅 Evento: ${eventName}
🗓️ Fecha: ${eventDate}

Estamos trabajando para hacer tu evento perfecto. Te mantendremos informado.

¡Gracias por confiar en nosotros! 🙏`
  },

  /**
   * Mensajes para el administrador
   */
  admin: {
    /**
     * Notificación al admin cuando se crea una nueva cotización
     */
    quoteCreated: (quoteId: string, clientName: string, totalAmount: number, vendorName?: string) => {
      const shortId = quoteId.slice(0, 8)
      const formattedAmount = new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN',
      }).format(totalAmount)

      return `📄 Nueva Cotización Creada

ID: ${shortId}
Cliente: ${clientName}
${vendorName ? `Vendedor: ${vendorName}\n` : ''}Total: ${formattedAmount}

Ver detalles:
${process.env.NEXT_PUBLIC_APP_URL || 'https://eventos-web-lovat.vercel.app'}/dashboard/quotes/${quoteId}`
    },

    /**
     * Notificación al admin cuando se registra un pago importante
     */
    paymentReceived: (quoteId: string, clientName: string, amount: number, totalPaid: number, totalAmount: number) => {
      const shortId = quoteId.slice(0, 8)
      const formattedAmount = new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN',
      }).format(amount)
      const formattedTotalPaid = new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN',
      }).format(totalPaid)
      const percentage = totalAmount > 0 ? Math.round((totalPaid / totalAmount) * 100) : 0

      return `💰 Pago Recibido

Cotización: #${shortId}
Cliente: ${clientName}
Monto: ${formattedAmount}
Total pagado: ${formattedTotalPaid} (${percentage}%)

Ver detalles:
${process.env.NEXT_PUBLIC_APP_URL || 'https://eventos-web-lovat.vercel.app'}/dashboard/quotes/${quoteId}`
    },

    /**
     * Notificación al admin cuando se aprueba una cotización
     */
    quoteApproved: (quoteId: string, clientName: string, totalAmount: number) => {
      const shortId = quoteId.slice(0, 8)
      const formattedAmount = new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN',
      }).format(totalAmount)

      return `✅ Cotización Aprobada

ID: ${shortId}
Cliente: ${clientName}
Total: ${formattedAmount}

Ver detalles:
${process.env.NEXT_PUBLIC_APP_URL || 'https://eventos-web-lovat.vercel.app'}/dashboard/quotes/${quoteId}`
    },
  },
}

