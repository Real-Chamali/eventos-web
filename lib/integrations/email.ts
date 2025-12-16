/**
 * Integración con Email
 * Envío de cotizaciones y notificaciones por email
 */

export interface EmailTemplate {
  subject: string
  body: string
  variables?: Record<string, string>
}

export function replaceTemplateVariables(template: string, variables: Record<string, string>): string {
  let result = template
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`{{${key}}}`, 'g')
    result = result.replace(regex, value)
  })
  return result
}

export const DEFAULT_EMAIL_TEMPLATES = {
  quote_sent: {
    subject: 'Cotización #{{quote_id}} - {{client_name}}',
    body: `
Estimado/a {{client_name}},

Adjunto encontrará la cotización #{{quote_id}} con un total de {{total_price}}.

Esta cotización incluye:
{{services_list}}

Por favor, revise los detalles y no dude en contactarnos si tiene alguna pregunta.

Saludos cordiales,
{{vendor_name}}
    `.trim(),
  },
  quote_approved: {
    subject: 'Cotización Aprobada - #{{quote_id}}',
    body: `
¡Excelente noticia!

La cotización #{{quote_id}} ha sido aprobada por {{client_name}}.

Monto total: {{total_price}}
Fecha del evento: {{event_date}}

El evento ha sido creado y está listo para ejecutarse.

Saludos,
Sistema de Eventos
    `.trim(),
  },
  payment_received: {
    subject: 'Pago Recibido - Evento #{{event_id}}',
    body: `
Se ha registrado un pago para el evento #{{event_id}}.

Monto: {{amount}}
Método: {{payment_method}}
Fecha: {{payment_date}}

Saludos,
Sistema de Eventos
    `.trim(),
  },
  reminder: {
    subject: 'Recordatorio - Evento Próximo',
    body: `
Recordatorio: Tienes un evento programado para {{event_date}}.

Cliente: {{client_name}}
Evento: {{event_id}}
Servicios: {{services_count}}

Por favor, asegúrate de tener todo listo.

Saludos,
Sistema de Eventos
    `.trim(),
  },
}

export function generateEmailHTML(template: EmailTemplate): string {
  const body = replaceTemplateVariables(template.body, template.variables || {})
  const htmlBody = body.replace(/\n/g, '<br>')

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%);
      color: white;
      padding: 30px;
      border-radius: 8px 8px 0 0;
      text-align: center;
    }
    .content {
      background: #ffffff;
      padding: 30px;
      border: 1px solid #e5e7eb;
      border-top: none;
      border-radius: 0 0 8px 8px;
    }
    .footer {
      text-align: center;
      margin-top: 20px;
      color: #6b7280;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Eventos CRM</h1>
  </div>
  <div class="content">
    ${htmlBody}
  </div>
  <div class="footer">
    <p>Este es un email automático del sistema de gestión de eventos.</p>
  </div>
</body>
</html>
  `.trim()
}

export async function sendEmail(
  to: string,
  template: EmailTemplate,
  attachments?: Array<{ filename: string; content: string; type: string }>
): Promise<boolean> {
  // Esta función se integraría con un servicio de email como SendGrid, Resend, o Supabase Edge Functions
  // Por ahora, retornamos un placeholder
  console.log('Sending email:', { to, subject: template.subject })
  
  // En producción, esto llamaría a una API route que use un servicio de email
  try {
    const response = await fetch('/api/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to,
        subject: template.subject,
        html: generateEmailHTML(template),
        attachments,
      }),
    })
    return response.ok
  } catch (error) {
    console.error('Error sending email:', error)
    return false
  }
}

