import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/utils/logger'
import { checkAdmin } from '@/lib/api/middleware'
import { sanitizeForLogging } from '@/lib/utils/security'

/**
 * DELETE /api/admin/quotes/[id]
 * Permite a los administradores eliminar cualquier cotización
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
      logger.warn('API /admin/quotes/[id]', 'Non-admin attempted quote deletion', sanitizeForLogging({
        userId: user.id,
        quoteId: id,
      }))
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    // Verificar que la cotización existe
    const { data: quote, error: fetchError } = await supabase
      .from('quotes')
      .select('id, vendor_id, client_id, status, total_amount')
      .eq('id', id)
      .single()

    if (fetchError || !quote) {
      logger.error('API /admin/quotes/[id]', 'Quote not found', new Error(fetchError?.message || 'Quote not found'), {
        quoteId: id,
      })
      return NextResponse.json({ error: 'Cotización no encontrada' }, { status: 404 })
    }

    // Usar service role key para eliminar cotización (bypass RLS)
    const { createClient: createAdminClient } = await import('@supabase/supabase-js')
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !supabaseServiceKey) {
      logger.error('API /admin/quotes/[id]', 'Missing service role key', new Error('SUPABASE_SERVICE_ROLE_KEY not set'))
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }
    
    const adminClient = createAdminClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Verificar si hay eventos asociados a esta cotización
    const { data: associatedEvents, error: eventsCheckError } = await adminClient
      .from('events')
      .select('id, name, event_date, status')
      .eq('quote_id', id)

    if (eventsCheckError) {
      logger.warn('API /admin/quotes/[id]', 'Error checking associated events', {
        error: eventsCheckError.message,
        quoteId: id,
      })
    }

    // Si hay eventos asociados, eliminarlos primero
    if (associatedEvents && associatedEvents.length > 0) {
      logger.info('API /admin/quotes/[id]', 'Deleting associated events before quote', {
        quoteId: id,
        eventsCount: associatedEvents.length,
      })

      const { error: eventsDeleteError } = await adminClient
        .from('events')
        .delete()
        .eq('quote_id', id)

      if (eventsDeleteError) {
        logger.error('API /admin/quotes/[id]', 'Error deleting associated events', eventsDeleteError as Error, {
          quoteId: id,
        })
        return NextResponse.json(
          { 
            error: 'No se pueden eliminar los eventos asociados. La cotización no puede ser eliminada mientras tenga eventos vinculados.',
            details: `Hay ${associatedEvents.length} evento(s) asociado(s) a esta cotización.`
          },
          { status: 400 }
        )
      }
    }

    // Nota: Las notificaciones no se eliminan automáticamente porque:
    // 1. Tienen quote_id en metadata JSONB (difícil de consultar eficientemente)
    // 2. No bloquean la eliminación de la cotización (no hay foreign key)
    // 3. Pueden ser útiles para historial incluso después de eliminar la cotización
    // Si se necesita limpiar notificaciones, hacerlo manualmente o con un job programado

    // Eliminar pagos parciales asociados
    const { error: paymentsError } = await adminClient
      .from('partial_payments')
      .delete()
      .eq('quote_id', id)

    if (paymentsError) {
      logger.warn('API /admin/quotes/[id]', 'Error deleting payments', {
        error: paymentsError.message,
        quoteId: id,
      })
      // Continuar aunque haya error, puede que no existan pagos
    }

    // Eliminar servicios de la cotización primero (CASCADE debería hacerlo automáticamente, pero por seguridad)
    const { error: servicesError } = await adminClient
      .from('quote_services')
      .delete()
      .eq('quote_id', id)

    if (servicesError) {
      logger.warn('API /admin/quotes/[id]', 'Error deleting quote services', {
        error: servicesError.message,
        quoteId: id,
      })
      // Continuar aunque haya error, puede que no existan servicios
    }

    // Eliminar la cotización usando service role (bypass RLS)
    const { error: deleteError } = await adminClient
      .from('quotes')
      .delete()
      .eq('id', id)

    if (deleteError) {
      logger.error('API /admin/quotes/[id]', 'Error deleting quote', deleteError as Error, {
        quoteId: id,
      })
      
      // Mensaje de error más claro
      let errorMessage = 'Error al eliminar la cotización: ' + deleteError.message
      if (deleteError.message.includes('foreign key constraint')) {
        errorMessage = 'No se puede eliminar la cotización porque tiene eventos, pagos u otros registros asociados. Por favor, elimina primero los registros relacionados.'
      }
      
      return NextResponse.json(
        { error: errorMessage },
        { status: 500 }
      )
    }

    logger.info('API /admin/quotes/[id]', 'Quote deleted successfully', sanitizeForLogging({
      adminUserId: user.id,
      quoteId: id,
      quoteVendorId: quote.vendor_id,
      quoteStatus: quote.status,
    }))

    return NextResponse.json({
      success: true,
      message: 'Cotización eliminada exitosamente',
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorStack = error instanceof Error ? error.stack : undefined
    
    logger.error('API /admin/quotes/[id]', 'Unexpected error', error instanceof Error ? error : new Error(errorMessage), {
      quoteId: id,
      errorMessage,
      errorStack,
    })
    
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    )
  }
}

