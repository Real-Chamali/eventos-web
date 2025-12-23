import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/utils/logger'
import { z } from 'zod'
import { checkAdmin } from '@/lib/api/middleware'
import { sanitizeForLogging } from '@/lib/utils/security'

const UUIDParamSchema = z.object({
  id: z.string().uuid('Invalid user ID format'),
})

const UserUpdateSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(100, 'El nombre es demasiado largo').optional(),
  email: z.string().email('Email inválido').optional(),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres').optional(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const rawParams = await params
    const paramValidation = UUIDParamSchema.safeParse(rawParams)
    
    if (!paramValidation.success) {
      return NextResponse.json(
        { 
          error: 'Invalid user ID format',
          details: paramValidation.error.issues,
        },
        { status: 400 }
      )
    }
    
    const { id } = paramValidation.data
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

    // Validar body con Zod
    const body = await request.json()
    const bodyValidation = UserUpdateSchema.safeParse(body)

    if (!bodyValidation.success) {
      return NextResponse.json(
        {
          error: 'Invalid request body',
          details: bodyValidation.error.issues,
        },
        { status: 400 }
      )
    }

    const { name, email, password } = bodyValidation.data

    // Si no hay nada que actualizar
    if (!name && !email && !password) {
      return NextResponse.json(
        { error: 'Al menos un campo debe ser actualizado' },
        { status: 400 }
      )
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

    // Preparar actualizaciones
    const updates: {
      email?: string
      password?: string
      user_metadata?: Record<string, unknown>
    } = {}

    if (email) {
      updates.email = email
    }

    if (password) {
      updates.password = password
    }

    if (name) {
      updates.user_metadata = {
        name,
      }
    }

    // Actualizar usuario en Auth
    const { data: updatedUser, error: updateError } = await adminClient.auth.admin.updateUserById(
      id,
      updates
    )

    if (updateError) {
      logger.error('API /admin/users/[id]', 'Error updating user', updateError as Error, {
        targetUserId: id,
      })
      return NextResponse.json(
        { error: updateError.message || 'Error al actualizar el usuario' },
        { status: 500 }
      )
    }

    // Actualizar perfil si existe
    if (name) {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ full_name: name })
        .eq('id', id)

      if (profileError) {
        logger.warn('API /admin/users/[id]', 'Error updating profile', {
          error: profileError instanceof Error ? profileError.message : String(profileError),
          targetUserId: id,
        })
        // No fallar si el perfil no existe, solo loguear
      }
    }

    logger.info('API /admin/users/[id]', 'User updated successfully', sanitizeForLogging({
      adminUserId: user.id,
      targetUserId: id,
      updatedFields: Object.keys(updates),
    }))

    return NextResponse.json({
      success: true,
      message: 'Usuario actualizado exitosamente',
      user: {
        id: updatedUser.user.id,
        email: updatedUser.user.email,
        user_metadata: updatedUser.user.user_metadata,
      },
    })
  } catch (error) {
    logger.error('API /admin/users/[id]', 'Unexpected error', error as Error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

