import { Resend } from 'resend'
import { logger } from '@/lib/utils/logger'
import { sanitizeForEmail } from '@/lib/utils/security'

// Inicializar Resend solo si hay API key (para evitar errores en build)
const getResend = () => {
  if (!process.env.RESEND_API_KEY) {
    return null
  }
  return new Resend(process.env.RESEND_API_KEY)
}

export interface EmailOptions {
  to: string | string[]
  subject: string
  html: string
  from?: string
  replyTo?: string
  attachments?: Array<{
    filename: string
    content: string | Buffer
    contentType?: string
  }>
}

// Tipos MIME permitidos para attachments
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/gif',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'text/csv',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]

const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024 // 10MB
const MAX_ATTACHMENTS = 5

export async function sendEmail(options: EmailOptions): Promise<{ success: boolean; messageId?: string }> {
  try {
    const resend = getResend()
    
    if (!resend) {
      logger.warn('Email', 'RESEND_API_KEY not configured, email not sent', {
        to: options.to,
        subject: options.subject,
      })
      return { success: false }
    }

    interface ResendEmailData {
      from: string
      to: string[]
      subject: string
      html: string
      replyTo?: string
      attachments?: Array<{
        filename: string
        content: Buffer
        contentType?: string
      }>
    }

    const emailData: ResendEmailData = {
      from: options.from || process.env.RESEND_FROM_EMAIL || 'Eventos Web <noreply@eventos-web.com>',
      to: Array.isArray(options.to) ? options.to : [options.to],
      subject: options.subject,
      html: options.html,
    }

    if (options.replyTo) {
      emailData.replyTo = options.replyTo
    }

    // Validar y procesar attachments
    if (options.attachments && options.attachments.length > 0) {
      // Validar número de attachments
      if (options.attachments.length > MAX_ATTACHMENTS) {
        throw new Error(`Maximum ${MAX_ATTACHMENTS} attachments allowed`)
      }

      // Validar cada attachment
      for (const att of options.attachments) {
        // Validar tamaño
        const size = typeof att.content === 'string' 
          ? Buffer.byteLength(att.content)
          : att.content.length
        
        if (size > MAX_ATTACHMENT_SIZE) {
          throw new Error(`Attachment ${att.filename} exceeds maximum size of ${MAX_ATTACHMENT_SIZE / 1024 / 1024}MB`)
        }

        // Validar tipo MIME si se proporciona
        if (att.contentType && !ALLOWED_MIME_TYPES.includes(att.contentType)) {
          throw new Error(`Attachment type ${att.contentType} not allowed. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`)
        }

        // Validar nombre de archivo (prevenir path traversal)
        if (att.filename.includes('..') || att.filename.includes('/') || att.filename.includes('\\')) {
          throw new Error(`Invalid filename: ${att.filename}`)
        }
      }

      emailData.attachments = options.attachments.map((att) => ({
        filename: att.filename,
        content: typeof att.content === 'string' ? Buffer.from(att.content) : att.content,
        contentType: att.contentType,
      }))
    }

    const { data, error } = await resend.emails.send(emailData)

    if (error) {
      logger.error('Email', 'Error sending email', new Error(error.message), {
        to: options.to,
        subject: options.subject,
      })
      return { success: false }
    }

    logger.info('Email', 'Email sent successfully', {
      to: options.to,
      subject: options.subject,
      messageId: data?.id,
    })

    return { success: true, messageId: data?.id }
  } catch (error) {
    logger.error('Email', 'Error sending email', error as Error, {
      to: options.to,
      subject: options.subject,
    })
    return { success: false }
  }
}

// Plantillas de email
export const emailTemplates = {
  quoteCreated: (quoteId: string, clientName: string, totalAmount: number) => ({
    subject: `Nueva Cotización #${quoteId.slice(0, 8)}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
            .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Nueva Cotización Creada</h1>
            </div>
            <div class="content">
              <p>Hola ${sanitizeForEmail(clientName)},</p>
              <p>Se ha creado una nueva cotización para ti:</p>
              <ul>
                <li><strong>ID:</strong> ${sanitizeForEmail(quoteId.slice(0, 8))}</li>
                <li><strong>Total:</strong> $${sanitizeForEmail(totalAmount.toLocaleString('es-MX', { minimumFractionDigits: 2 }))}</li>
              </ul>
              <a href="${sanitizeForEmail(process.env.NEXT_PUBLIC_APP_URL || 'https://eventos-web-lovat.vercel.app')}/dashboard/quotes/${sanitizeForEmail(quoteId)}" class="button">Ver Cotización</a>
            </div>
            <div class="footer">
              <p>Este es un email automático, por favor no responder.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  }),

  quoteApproved: (quoteId: string, clientName: string, totalAmount: number) => ({
    subject: `Cotización Aprobada #${quoteId.slice(0, 8)}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 12px 24px; background: #10b981; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
            .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>¡Cotización Aprobada!</h1>
            </div>
            <div class="content">
              <p>Hola ${sanitizeForEmail(clientName)},</p>
              <p>Tu cotización ha sido aprobada:</p>
              <ul>
                <li><strong>ID:</strong> ${sanitizeForEmail(quoteId.slice(0, 8))}</li>
                <li><strong>Total:</strong> $${sanitizeForEmail(totalAmount.toLocaleString('es-MX', { minimumFractionDigits: 2 }))}</li>
              </ul>
              <a href="${sanitizeForEmail(process.env.NEXT_PUBLIC_APP_URL || 'https://eventos-web-lovat.vercel.app')}/dashboard/quotes/${sanitizeForEmail(quoteId)}" class="button">Ver Cotización</a>
            </div>
            <div class="footer">
              <p>Este es un email automático, por favor no responder.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  }),

  quoteRejected: (quoteId: string, clientName: string) => ({
    subject: `Cotización Rechazada #${quoteId.slice(0, 8)}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 12px 24px; background: #ef4444; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
            .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Cotización Rechazada</h1>
            </div>
            <div class="content">
              <p>Hola ${sanitizeForEmail(clientName)},</p>
              <p>Lamentamos informarte que tu cotización ha sido rechazada:</p>
              <ul>
                <li><strong>ID:</strong> ${sanitizeForEmail(quoteId.slice(0, 8))}</li>
              </ul>
              <p>Entendemos que esto puede ser decepcionante. Si tienes alguna pregunta o deseas hacer cambios para una nueva cotización, estamos aquí para ayudarte.</p>
              <a href="${sanitizeForEmail(process.env.NEXT_PUBLIC_APP_URL || 'https://eventos-web-lovat.vercel.app')}/dashboard/quotes/${sanitizeForEmail(quoteId)}" class="button">Ver Cotización</a>
            </div>
            <div class="footer">
              <p>Este es un email automático, por favor no responder.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  }),

  paymentRegistered: (quoteId: string, clientName: string, amount: number, totalPaid: number, totalAmount: number) => ({
    subject: `Pago Registrado #${quoteId.slice(0, 8)}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 12px 24px; background: #10b981; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
            .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 12px; }
            .amount-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Pago Registrado</h1>
            </div>
            <div class="content">
              <p>Hola ${sanitizeForEmail(clientName)},</p>
              <p>Hemos registrado tu pago exitosamente:</p>
              <div class="amount-box">
                <p><strong>Pago recibido:</strong> $${sanitizeForEmail(amount.toLocaleString('es-MX', { minimumFractionDigits: 2 }))}</p>
                <p><strong>Total pagado:</strong> $${sanitizeForEmail(totalPaid.toLocaleString('es-MX', { minimumFractionDigits: 2 }))}</p>
                <p><strong>Total cotización:</strong> $${sanitizeForEmail(totalAmount.toLocaleString('es-MX', { minimumFractionDigits: 2 }))}</p>
                ${totalPaid >= totalAmount ? '<p style="color: #10b981; font-weight: bold;">✅ Cotización completamente pagada</p>' : ''}
              </div>
              <a href="${sanitizeForEmail(process.env.NEXT_PUBLIC_APP_URL || 'https://eventos-web-lovat.vercel.app')}/dashboard/quotes/${sanitizeForEmail(quoteId)}" class="button">Ver Detalles</a>
            </div>
            <div class="footer">
              <p>Este es un email automático, por favor no responder.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  }),

  eventReminder: (eventDate: string, eventName: string, clientName: string) => ({
    subject: `Recordatorio: Evento ${eventName}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Recordatorio de Evento</h1>
            </div>
            <div class="content">
              <p>Hola ${sanitizeForEmail(clientName)},</p>
              <p>Este es un recordatorio de tu próximo evento:</p>
              <ul>
                <li><strong>Evento:</strong> ${sanitizeForEmail(eventName)}</li>
                <li><strong>Fecha:</strong> ${sanitizeForEmail(eventDate)}</li>
              </ul>
              <p>Por favor, asegúrate de tener todo listo.</p>
            </div>
            <div class="footer">
              <p>Este es un email automático, por favor no responder.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  }),
}
