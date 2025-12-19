import { Resend } from 'resend'
import { logger } from '@/lib/utils/logger'

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

    const emailData: any = {
      from: options.from || process.env.RESEND_FROM_EMAIL || 'Eventos Web <noreply@eventos-web.com>',
      to: Array.isArray(options.to) ? options.to : [options.to],
      subject: options.subject,
      html: options.html,
    }

    if (options.replyTo) {
      emailData.replyTo = options.replyTo
    }

    if (options.attachments && options.attachments.length > 0) {
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
              <p>Hola ${clientName},</p>
              <p>Se ha creado una nueva cotización para ti:</p>
              <ul>
                <li><strong>ID:</strong> ${quoteId.slice(0, 8)}</li>
                <li><strong>Total:</strong> $${totalAmount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</li>
              </ul>
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://eventos-web-lovat.vercel.app'}/dashboard/quotes/${quoteId}" class="button">Ver Cotización</a>
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
              <p>Hola ${clientName},</p>
              <p>Tu cotización ha sido aprobada:</p>
              <ul>
                <li><strong>ID:</strong> ${quoteId.slice(0, 8)}</li>
                <li><strong>Total:</strong> $${totalAmount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</li>
              </ul>
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://eventos-web-lovat.vercel.app'}/dashboard/quotes/${quoteId}" class="button">Ver Cotización</a>
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
              <p>Hola ${clientName},</p>
              <p>Este es un recordatorio de tu próximo evento:</p>
              <ul>
                <li><strong>Evento:</strong> ${eventName}</li>
                <li><strong>Fecha:</strong> ${eventDate}</li>
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
