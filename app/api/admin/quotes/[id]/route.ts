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

    // Eliminar servicios de la cotización primero (CASCADE debería hacerlo automáticamente, pero por seguridad)
    const { error: servicesError } = await supabase
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

    // Eliminar la cotización
    const { error: deleteError } = await supabase
      .from('quotes')
      .delete()
      .eq('id', id)

    if (deleteError) {
      logger.error('API /admin/quotes/[id]', 'Error deleting quote', deleteError as Error, {
        quoteId: id,
      })
      return NextResponse.json(
        { error: 'Error al eliminar la cotización: ' + deleteError.message },
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
    logger.error('API /admin/quotes/[id]', 'Unexpected error', error as Error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

