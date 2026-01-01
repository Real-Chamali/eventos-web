import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/utils/logger'
import { checkAdmin } from '@/lib/api/middleware'
import { sanitizeForLogging } from '@/lib/utils/security'

/**
 * DELETE /api/admin/clients/[id]
 * Permite a los administradores eliminar cualquier cliente
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
      logger.warn('API /admin/clients/[id]', 'Non-admin attempted client deletion', sanitizeForLogging({
        userId: user.id,
        clientId: id,
      }))
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    // Verificar que el cliente existe
    const { data: client, error: fetchError } = await supabase
      .from('clients')
      .select('id, name, email')
      .eq('id', id)
      .single()

    if (fetchError || !client) {
      logger.error('API /admin/clients/[id]', 'Client not found', new Error(fetchError?.message || 'Client not found'), {
        clientId: id,
      })
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 })
    }

    // Verificar si el cliente tiene cotizaciones asociadas
    const { data: quotes, error: quotesError } = await supabase
      .from('quotes')
      .select('id')
      .eq('client_id', id)
      .limit(1)

    if (quotesError) {
      logger.warn('API /admin/clients/[id]', 'Error checking quotes', {
        error: quotesError.message,
        clientId: id,
      })
    }

    if (quotes && quotes.length > 0) {
      return NextResponse.json(
        { error: 'No se puede eliminar el cliente porque tiene cotizaciones asociadas' },
        { status: 400 }
      )
    }

    // Eliminar el cliente
    const { error: deleteError } = await supabase
      .from('clients')
      .delete()
      .eq('id', id)

    if (deleteError) {
      logger.error('API /admin/clients/[id]', 'Error deleting client', deleteError as Error, {
        clientId: id,
      })
      return NextResponse.json(
        { error: 'Error al eliminar el cliente: ' + deleteError.message },
        { status: 500 }
      )
    }

    logger.info('API /admin/clients/[id]', 'Client deleted successfully', sanitizeForLogging({
      adminUserId: user.id,
      clientId: id,
      clientName: client.name,
    }))

    return NextResponse.json({
      success: true,
      message: 'Cliente eliminado exitosamente',
    })
  } catch (error) {
    logger.error('API /admin/clients/[id]', 'Unexpected error', error as Error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

