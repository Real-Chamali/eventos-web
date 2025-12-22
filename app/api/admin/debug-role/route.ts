import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { logger } from '@/lib/utils/logger'
import { sanitizeForLogging } from '@/lib/utils/security'
import { getUserFromSession, checkAdmin, checkRateLimit } from '@/lib/api/middleware'

/**
 * GET /api/admin/debug-role - Debug endpoint para verificar roles
 * 
 * ⚠️ IMPORTANTE: Este endpoint está protegido por autenticación admin
 * pero debería ser removido o protegido adicionalmente en producción
 * 
 * Uso: Solo para debugging durante desarrollo
 */
export async function GET() {
  // BLOQUEAR COMPLETAMENTE EN PRODUCCIÓN
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // Verificar feature flag adicional
  if (process.env.ENABLE_DEBUG_ENDPOINTS !== 'true') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  try {
    // Usar función centralizada para obtener usuario de sesión
    const { user, error: authError } = await getUserFromSession()

    if (!user || authError) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verificar que sea admin usando checkAdmin para consistencia
    const isAdmin = await checkAdmin(user.id)

    if (!isAdmin) {
      logger.warn('API /admin/debug-role', 'Non-admin attempted access', sanitizeForLogging({
        userId: user.id,
      }))
      const response = NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      response.headers.set('X-Content-Type-Options', 'nosniff')
      return response
    }

    // Rate limiting agresivo: 1 request por hora
    if (!checkRateLimit(`debug-${user.id}`, 1, 3600000)) {
      const response = NextResponse.json({ error: 'Too many requests' }, { status: 429 })
      response.headers.set('X-Content-Type-Options', 'nosniff')
      return response
    }

          // Logging de acceso
          logger.warn('API /admin/debug-role', 'Debug endpoint accessed', sanitizeForLogging({
            userId: user.id,
            timestamp: new Date().toISOString(),
          }))

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      const response = NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
      response.headers.set('X-Content-Type-Options', 'nosniff')
      return response
    }

    const adminClient = createAdminClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Obtener el usuario admin@chamali.com específicamente
    const { data: adminUser } = await adminClient.auth.admin.getUserById('0f5f8080-5bfb-4f8a-a110-09887a250d7a')
    
    // Obtener su perfil
    const { data: adminProfile } = await adminClient
      .from('profiles')
      .select('id, role, full_name')
      .eq('id', '0f5f8080-5bfb-4f8a-a110-09887a250d7a')
      .single()

    // Obtener todos los perfiles
    const { data: allProfiles } = await adminClient
      .from('profiles')
      .select('id, role, full_name')

    return NextResponse.json({
      adminUser: {
        id: adminUser?.user?.id,
        email: adminUser?.user?.email,
      },
      adminProfile: {
        id: adminProfile?.id,
        role: adminProfile?.role,
        roleType: typeof adminProfile?.role,
        roleString: String(adminProfile?.role),
        full_name: adminProfile?.full_name,
      },
      allProfiles: allProfiles?.map(p => ({
        id: p.id,
        role: p.role,
        roleType: typeof p.role,
        roleString: String(p.role),
        full_name: p.full_name,
      })),
    })
  } catch (error) {
    logger.error('API /admin/debug-role', 'Error', error as Error, sanitizeForLogging({}))
    const response = NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
    response.headers.set('X-Content-Type-Options', 'nosniff')
    return response
  }
}

