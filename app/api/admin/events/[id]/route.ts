import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/utils/logger'
import { checkAdmin } from '@/lib/api/middleware'
import { sanitizeForLogging } from '@/lib/utils/security'

/**
 * DELETE /api/admin/events/[id]
 * Permite a los administradores eliminar cualquier evento
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verificar que el usuario es admin
    const isAdmin = await checkAdmin(user.id, user.email)
    if (!isAdmin) {
      logger.warn('API /admin/events/[id]', 'Non-admin attempted event deletion', sanitizeForLogging({
        userId: user.id,
        eventId: id,
      }))
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    // Verificar que el evento existe
    const { data: event, error: fetchError } = await supabase
      .from('events')
      .select('id, quote_id, status, start_date')
      .eq('id', id)
      .single()

    if (fetchError || !event) {
      logger.error('API /admin/events/[id]', 'Event not found', new Error(fetchError?.message || 'Event not found'), {
        eventId: id,
      })
      return NextResponse.json({ error: 'Evento no encontrado' }, { status: 404 })
    }

    // Eliminar el evento
    const { error: deleteError } = await supabase
      .from('events')
      .delete()
      .eq('id', id)

    if (deleteError) {
      logger.error('API /admin/events/[id]', 'Error deleting event', deleteError as Error, {
        eventId: id,
      })
      return NextResponse.json(
        { error: 'Error al eliminar el evento: ' + deleteError.message },
        { status: 500 }
      )
    }

    logger.info('API /admin/events/[id]', 'Event deleted successfully', sanitizeForLogging({
      adminUserId: user.id,
      eventId: id,
      eventQuoteId: event.quote_id,
      eventStatus: event.status,
    }))

    return NextResponse.json({
      success: true,
      message: 'Evento eliminado exitosamente',
    })
  } catch (error) {
    logger.error('API /admin/events/[id]', 'Unexpected error', error as Error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

