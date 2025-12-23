import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import { logger } from '@/lib/utils/logger'
import { z } from 'zod'
import { checkAdmin, clearRoleCache } from '@/lib/api/middleware'
import { sanitizeForLogging } from '@/lib/utils/security'

const UUIDParamSchema = z.object({
  id: z.string().uuid('Invalid user ID format'),
})

const RoleUpdateSchema = z.object({
  role: z.enum(['admin', 'vendor']).refine((val) => val === 'admin' || val === 'vendor', {
    message: 'El rol debe ser "admin" o "vendor"',
  }),
})

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Validar parámetros de ruta
    const rawParams = await params
    const paramValidation = UUIDParamSchema.safeParse(rawParams)
    
    if (!paramValidation.success) {
      const response = NextResponse.json(
        { 
          error: 'Invalid user ID format',
          details: paramValidation.error.issues,
        },
        { status: 400 }
      )
      response.headers.set('X-Content-Type-Options', 'nosniff')
      return response
    }
    
    const { id } = paramValidation.data
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verificar que el usuario es admin usando checkAdmin
    const isAdmin = await checkAdmin(user.id, user.email)
    if (!isAdmin) {
      logger.warn('API /admin/users/[id]/role', 'Non-admin attempted role update', sanitizeForLogging({
        userId: user.id,
        targetUserId: id,
      }))
      const response = NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      response.headers.set('X-Content-Type-Options', 'nosniff')
      return response
    }

    // Validar body con Zod
    const body = await request.json()
    const bodyValidation = RoleUpdateSchema.safeParse(body)

    if (!bodyValidation.success) {
      const response = NextResponse.json(
        {
          error: 'Invalid request body',
          details: bodyValidation.error.issues,
        },
        { status: 400 }
      )
      response.headers.set('X-Content-Type-Options', 'nosniff')
      return response
    }

    const { role } = bodyValidation.data

    // Verificar que solo admin@chamali.com puede tener rol admin
    if (role === 'admin') {
      // Obtener el email del usuario objetivo
      const { createClient: createAdminClient } = await import('@supabase/supabase-js')
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
      
      if (!supabaseUrl || !supabaseServiceKey) {
        logger.error('API /admin/users/[id]/role', 'Missing service role key', new Error('SUPABASE_SERVICE_ROLE_KEY not set'))
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
      
      const { data: targetUser } = await adminClient.auth.admin.getUserById(id)
      
      if (!targetUser || targetUser.user?.email !== 'admin@chamali.com') {
        const response = NextResponse.json(
          { error: 'Solo admin@chamali.com puede tener rol de administrador' },
          { status: 403 }
        )
        response.headers.set('X-Content-Type-Options', 'nosniff')
        logger.warn('API /admin/users/[id]/role', 'Attempt to assign admin role to unauthorized user', sanitizeForLogging({
          adminUserId: user.id,
          targetUserId: id,
          targetEmail: targetUser?.user?.email,
        }))
        return response
      }
    }

    // No permitir que un admin se quite su propio rol de admin
    if (id === user.id && role !== 'admin') {
      const response = NextResponse.json(
        { error: 'No puedes quitarte tu propio rol de administrador' },
        { status: 400 }
      )
      response.headers.set('X-Content-Type-Options', 'nosniff')
      return response
    }

    // Actualizar el rol usando service role para evitar problemas de RLS
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      logger.error('API /admin/users/[id]/role', 'Missing service role key', new Error('SUPABASE_SERVICE_ROLE_KEY not set'))
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    const { createClient: createAdminClient } = await import('@supabase/supabase-js')
    const adminClient = createAdminClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    const { data, error } = await adminClient
      .from('profiles')
      .update({ role })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      logger.error('API /admin/users/[id]/role', 'Error updating role', new Error(error.message), sanitizeForLogging({
        userId: user.id,
        targetUserId: id,
        newRole: role,
      }))
      const response = NextResponse.json(
        { error: 'Error al actualizar el rol' },
        { status: 500 }
      )
      response.headers.set('X-Content-Type-Options', 'nosniff')
      return response
    }

    // Limpiar caché de roles para el usuario actualizado
    clearRoleCache(id)

          logger.info('API /admin/users/[id]/role', 'Role updated successfully', sanitizeForLogging({
            adminId: user.id,
            targetUserId: id,
            newRole: role,
          }))

    return NextResponse.json({ success: true, profile: data })
  } catch (error) {
    logger.error('API /admin/users/[id]/role', 'Unexpected error', error as Error, sanitizeForLogging({}))
    const response = NextResponse.json(
      { error: 'Error inesperado' },
      { status: 500 }
    )
    response.headers.set('X-Content-Type-Options', 'nosniff')
    return response
  }
}

