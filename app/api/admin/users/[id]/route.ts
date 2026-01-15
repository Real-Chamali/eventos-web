import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/utils/logger'
import { checkAdmin } from '@/lib/api/middleware'
import { sanitizeForLogging } from '@/lib/utils/security'

/**
 * PATCH /api/admin/users/[id]
 * Permite a los administradores actualizar información de usuarios
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, email, password, phone } = body

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
      logger.warn('API /admin/users/[id]', 'Non-admin attempted user update', sanitizeForLogging({
        userId: user.id,
        targetUserId: id,
      }))
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    // Usar service role key para actualizar usuario
    const { createClient: createAdminClient } = await import('@supabase/supabase-js')
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !supabaseServiceKey) {
      logger.error('API /admin/users/[id]', 'Missing service role key', new Error('SUPABASE_SERVICE_ROLE_KEY not set'))
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

    // Actualizar perfil si hay cambios en name
    if (name !== undefined) {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ full_name: name })
        .eq('id', id)

      if (profileError) {
        logger.error('API /admin/users/[id]', 'Error updating profile', profileError as Error, {
          targetUserId: id,
        })
        return NextResponse.json(
          { error: 'Error al actualizar el perfil: ' + profileError.message },
          { status: 500 }
        )
      }

      // También actualizar metadata del usuario
      const { error: metadataError } = await adminClient.auth.admin.updateUserById(id, {
        user_metadata: { name },
      })

      if (metadataError) {
        logger.warn('API /admin/users/[id]', 'Error updating user metadata', {
          error: metadataError.message,
          targetUserId: id,
        })
      }
    }

    // Actualizar metadata si hay phone
    if (phone !== undefined) {
      const { error: metadataError } = await adminClient.auth.admin.updateUserById(id, {
        user_metadata: { phone },
      })

      if (metadataError) {
        logger.error('API /admin/users/[id]', 'Error updating user metadata', metadataError as Error, {
          targetUserId: id,
        })
        return NextResponse.json(
          { error: 'Error al actualizar metadata del usuario: ' + metadataError.message },
          { status: 500 }
        )
      }
    }

    // Actualizar email si hay cambios
    if (email !== undefined) {
      const { error: emailError } = await adminClient.auth.admin.updateUserById(id, {
        email,
      })

      if (emailError) {
        logger.error('API /admin/users/[id]', 'Error updating email', emailError as Error, {
          targetUserId: id,
        })
        return NextResponse.json(
          { error: 'Error al actualizar el email: ' + emailError.message },
          { status: 500 }
        )
      }
    }

    // Actualizar contraseña si se proporciona
    if (password !== undefined && password.length > 0) {
      if (password.length < 6) {
        return NextResponse.json(
          { error: 'La contraseña debe tener al menos 6 caracteres' },
          { status: 400 }
        )
      }

      const { error: passwordError } = await adminClient.auth.admin.updateUserById(id, {
        password,
      })

      if (passwordError) {
        logger.error('API /admin/users/[id]', 'Error updating password', passwordError as Error, {
          targetUserId: id,
        })
        return NextResponse.json(
          { error: 'Error al actualizar la contraseña: ' + passwordError.message },
          { status: 500 }
        )
      }
    }

    logger.info('API /admin/users/[id]', 'User updated successfully', sanitizeForLogging({
      adminUserId: user.id,
      targetUserId: id,
      updatedFields: { name: name !== undefined, email: email !== undefined, password: password !== undefined && password.length > 0 },
    }))

    return NextResponse.json({
      success: true,
      message: 'Usuario actualizado exitosamente',
    })
  } catch (error) {
    logger.error('API /admin/users/[id]', 'Unexpected error', error as Error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/users/[id]
 * Permite a los administradores eliminar usuarios (excepto a sí mismos)
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
      logger.warn('API /admin/users/[id]', 'Non-admin attempted user deletion', sanitizeForLogging({
        userId: user.id,
        targetUserId: id,
      }))
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    // No permitir que un admin se elimine a sí mismo
    if (id === user.id) {
      return NextResponse.json(
        { error: 'No puedes eliminar tu propia cuenta' },
        { status: 400 }
      )
    }

    // Verificar que el usuario objetivo existe
    const { data: targetProfile, error: fetchError } = await supabase
      .from('profiles')
      .select('id, role, full_name')
      .eq('id', id)
      .single()

    if (fetchError || !targetProfile) {
      logger.error('API /admin/users/[id]', 'User not found', new Error(fetchError?.message || 'User not found'), {
        targetUserId: id,
      })
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    // No permitir eliminar a otro admin (solo el super admin puede hacerlo)
    if (targetProfile.role === 'admin') {
      return NextResponse.json(
        { error: 'No se pueden eliminar otros administradores. Solo el super admin puede hacerlo.' },
        { status: 403 }
      )
    }

    // Admin puede eliminar usuarios incluso si tienen cotizaciones o eventos
    // Se eliminarán en cascada según las políticas de la base de datos

    // Usar service role key para eliminar usuario
    const { createClient: createAdminClient } = await import('@supabase/supabase-js')
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !supabaseServiceKey) {
      logger.error('API /admin/users/[id]', 'Missing service role key', new Error('SUPABASE_SERVICE_ROLE_KEY not set'))
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

    // Eliminar el perfil primero
    const { error: profileError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', id)

    if (profileError) {
      logger.warn('API /admin/users/[id]', 'Error deleting profile', {
        error: profileError.message,
        targetUserId: id,
      })
      // Continuar aunque haya error en el perfil
    }

    // Eliminar el usuario de Auth
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(id)

    if (deleteError) {
      logger.error('API /admin/users/[id]', 'Error deleting user', deleteError as Error, {
        targetUserId: id,
      })
      return NextResponse.json(
        { error: 'Error al eliminar el usuario: ' + deleteError.message },
        { status: 500 }
      )
    }

    logger.info('API /admin/users/[id]', 'User deleted successfully', sanitizeForLogging({
      adminUserId: user.id,
      targetUserId: id,
      targetUserRole: targetProfile.role,
    }))

    return NextResponse.json({
      success: true,
      message: 'Usuario eliminado exitosamente',
    })
  } catch (error) {
    logger.error('API /admin/users/[id]', 'Unexpected error', error as Error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
