import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import { logger } from '@/lib/utils/logger'

export async function PATCH(
  request: Request,
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
    const { data: adminProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

    if (adminProfile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Obtener el nuevo rol del body
    const { role } = await request.json()

    if (!role || !['admin', 'vendor'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be "admin" or "vendor"' },
        { status: 400 }
      )
    }

    // No permitir que un admin se quite su propio rol de admin
    if (id === user.id && role !== 'admin') {
      return NextResponse.json(
        { error: 'No puedes quitarte tu propio rol de administrador' },
        { status: 400 }
      )
    }

    // Actualizar el rol
    const { data, error } = await supabase
      .from('profiles')
      .update({ role })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      logger.error('API /admin/users/[id]/role', 'Error updating role', new Error(error.message))
      return NextResponse.json(
        { error: 'Error al actualizar el rol' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, profile: data })
  } catch (error) {
    logger.error('API /admin/users/[id]/role', 'Unexpected error', error as Error)
    return NextResponse.json(
      { error: 'Error inesperado' },
      { status: 500 }
    )
  }
}

