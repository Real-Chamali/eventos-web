import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { sendWhatsApp, whatsappTemplates } from '@/lib/integrations/whatsapp'
import { logger } from '@/lib/utils/logger'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

/**
 * GET /api/events/reminders
 * Envía recordatorios de WhatsApp para eventos próximos
 * 
 * Esta función debe ser llamada por un cron job (Vercel Cron, GitHub Actions, etc.)
 * Ejemplo de cron: "0 9 * * *" (todos los días a las 9 AM)
 */
export async function GET(request: NextRequest) {
  try {
    // Verificar que sea una llamada autorizada (cron job)
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createClient()
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const nextWeek = new Date(today)
    nextWeek.setDate(nextWeek.getDate() + 7)

    // Obtener eventos que están mañana (recordatorio 1 día antes)
    const { data: eventsTomorrow, error: errorTomorrow } = await supabase
      .from('events')
      .select(`
        id,
        start_date,
        quotes:quote_id (
          id,
          total_amount,
          clients:client_id (
            name,
            phone
          )
        )
      `)
      .gte('start_date', tomorrow.toISOString().split('T')[0])
      .lt('start_date', new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0])
      .eq('status', 'confirmed')

    if (errorTomorrow) {
      logger.error('Events Reminders', 'Error fetching events for tomorrow', errorTomorrow)
    }

    // Obtener eventos que están en una semana (recordatorio 1 semana antes)
    const { data: eventsNextWeek, error: errorNextWeek } = await supabase
      .from('events')
      .select(`
        id,
        start_date,
        quotes:quote_id (
          id,
          total_amount,
          clients:client_id (
            name,
            phone
          )
        )
      `)
      .gte('start_date', nextWeek.toISOString().split('T')[0])
      .lt('start_date', new Date(nextWeek.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0])
      .eq('status', 'confirmed')

    if (errorNextWeek) {
      logger.error('Events Reminders', 'Error fetching events for next week', errorNextWeek)
    }

    const results = {
      tomorrow: { sent: 0, failed: 0 },
      nextWeek: { sent: 0, failed: 0 },
    }

    // Enviar recordatorios para eventos de mañana
    if (eventsTomorrow && eventsTomorrow.length > 0) {
      for (const event of eventsTomorrow) {
        try {
          const quote = event.quotes as any
          if (!quote || !quote.clients) continue

          const clientsArray = Array.isArray(quote.clients) ? quote.clients : [quote.clients]
          const client = clientsArray[0] as { name?: string; phone?: string } | undefined

          if (client?.phone && client?.name && event.start_date) {
            const eventDate = format(new Date(event.start_date), "dd 'de' MMMM, yyyy", { locale: es })
            const message = whatsappTemplates.eventReminder(
              eventDate,
              `Evento #${event.id.slice(0, 8)}`,
              client.name,
              1 // 1 día hasta el evento
            )

            const result = await sendWhatsApp({
              to: client.phone,
              message,
            })

            if (result.success) {
              results.tomorrow.sent++
              logger.info('Events Reminders', 'Reminder sent for tomorrow event', {
                eventId: event.id,
                clientPhone: client.phone,
              })
            } else {
              results.tomorrow.failed++
            }
          }
        } catch (error) {
          results.tomorrow.failed++
          logger.error('Events Reminders', 'Error sending reminder for tomorrow event', error as Error, {
            eventId: event.id,
          })
        }
      }
    }

    // Enviar recordatorios para eventos de la próxima semana
    if (eventsNextWeek && eventsNextWeek.length > 0) {
      for (const event of eventsNextWeek) {
        try {
          const quote = event.quotes as any
          if (!quote || !quote.clients) continue

          const clientsArray = Array.isArray(quote.clients) ? quote.clients : [quote.clients]
          const client = clientsArray[0] as { name?: string; phone?: string } | undefined

          if (client?.phone && client?.name && event.start_date) {
            const eventDate = format(new Date(event.start_date), "dd 'de' MMMM, yyyy", { locale: es })
            const message = whatsappTemplates.eventReminder(
              eventDate,
              `Evento #${event.id.slice(0, 8)}`,
              client.name,
              7 // 7 días hasta el evento
            )

            const result = await sendWhatsApp({
              to: client.phone,
              message,
            })

            if (result.success) {
              results.nextWeek.sent++
              logger.info('Events Reminders', 'Reminder sent for next week event', {
                eventId: event.id,
                clientPhone: client.phone,
              })
            } else {
              results.nextWeek.failed++
            }
          }
        } catch (error) {
          results.nextWeek.failed++
          logger.error('Events Reminders', 'Error sending reminder for next week event', error as Error, {
            eventId: event.id,
          })
        }
      }
    }

    return NextResponse.json({
      success: true,
      results,
      message: `Recordatorios enviados: ${results.tomorrow.sent + results.nextWeek.sent} exitosos, ${results.tomorrow.failed + results.nextWeek.failed} fallidos`,
    })
  } catch (error) {
    logger.error('Events Reminders', 'Error in reminders cron job', error as Error)
    return NextResponse.json(
      { error: 'Error processing reminders', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

