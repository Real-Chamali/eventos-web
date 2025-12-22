import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { logger } from '@/lib/utils/logger'
import { sanitizeForLogging } from '@/lib/utils/security'
import { getUserFromSession, checkAdmin } from '@/lib/api/middleware'

/**
 * GET /api/admin/vendors - Get all vendors with statistics
 * Requires admin role
 */
export async function GET() {
  try {
    // Usar función centralizada para obtener usuario de sesión
    const { user, error: authError } = await getUserFromSession()

    if (!user || authError) {
      const response = NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      response.headers.set('X-Content-Type-Options', 'nosniff')
      return response
    }

    // Verificar que sea admin usando checkAdmin
    const isAdmin = await checkAdmin(user.id)

    if (!isAdmin) {
      logger.warn('API /admin/vendors', 'Non-admin attempted access', sanitizeForLogging({
        userId: user.id,
      }))
      const response = NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      response.headers.set('X-Content-Type-Options', 'nosniff')
      return response
    }

    // Crear cliente de administración con service role key
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      logger.error('API /admin/vendors', 'Missing service role key', new Error('SUPABASE_SERVICE_ROLE_KEY not set'), sanitizeForLogging({}))
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

    // Obtener todos los usuarios usando Admin API
    const { data: usersData, error: usersError } = await adminClient.auth.admin.listUsers()

    if (usersError) {
      logger.error('API /admin/vendors', 'Error listing users', new Error(usersError.message), sanitizeForLogging({}))
      const response = NextResponse.json({ error: 'Error al obtener usuarios' }, { status: 500 })
      response.headers.set('X-Content-Type-Options', 'nosniff')
      return response
    }

    // Crear cliente de Supabase para queries regulares
    const supabase = await createClient()

    // Obtener estadísticas de cotizaciones por vendedor
    const { data: quotesData, error: quotesError } = await supabase
      .from('quotes')
      .select('vendor_id, total_amount, status')

    if (quotesError) {
      logger.warn('API /admin/vendors', 'Error loading quotes stats', sanitizeForLogging({ error: quotesError.message }))
    }

    // Calcular estadísticas por vendedor
    const statsMap = new Map<string, { count: number; sales: number }>()
    if (quotesData) {
      quotesData.forEach((quote) => {
        if (quote.vendor_id) {
          const existing = statsMap.get(quote.vendor_id) || { count: 0, sales: 0 }
          existing.count++
          if (quote.status === 'APPROVED' || quote.status === 'confirmed') {
            existing.sales += Number(quote.total_amount) || 0
          }
          statsMap.set(quote.vendor_id, existing)
        }
      })
    }

    // Obtener roles de perfiles usando el cliente admin para evitar problemas con RLS
    const { data: profilesData, error: profilesError } = await adminClient
      .from('profiles')
      .select('id, role, full_name')
    
    if (profilesError) {
      logger.warn('API /admin/vendors', 'Error loading profiles', sanitizeForLogging({ error: profilesError.message }))
    }
    
    const profilesMap = new Map<string, { role: 'admin' | 'vendor'; full_name: string | null }>()
    if (profilesData) {
      profilesData.forEach((profile) => {
        // Manejar el enum de PostgreSQL correctamente
        let role: 'admin' | 'vendor' = 'vendor' // default
        
        if (profile.role !== null && profile.role !== undefined) {
          // Convertir a string y normalizar
          const roleStr = String(profile.role).trim().toLowerCase()
          
          // Verificar explícitamente si es 'admin'
          if (roleStr === 'admin') {
            role = 'admin'
          } else {
            role = 'vendor'
          }
          
          // Log para debugging (sanitizado)
          logger.debug('API /admin/vendors', 'Processing role', sanitizeForLogging({
            userId: profile.id,
            roleRaw: String(profile.role),
            roleStr,
            roleFinal: role,
            roleType: typeof profile.role,
          }))
        }
        
        profilesMap.set(profile.id, {
          role,
          full_name: profile.full_name,
        })
      })
    }

    // Combinar datos de usuarios con estadísticas y roles
    const vendorsWithStats = (usersData?.users || []).map((user) => {
      const stats = statsMap.get(user.id) || { count: 0, sales: 0 }
      const profile = profilesMap.get(user.id)
      
      // Usar el rol del mapa de perfiles (ya procesado correctamente)
      const role: 'admin' | 'vendor' = profile?.role || 'vendor'
      
      // Log para debugging del usuario admin (sanitizado)
      if (user.email === 'admin@chamali.com') {
        logger.info('API /admin/vendors', 'Admin user found', sanitizeForLogging({
          userId: user.id,
          email: user.email,
          profileRole: String(profile?.role || ''),
          finalRole: role,
        }))
      }
      
      return {
        id: user.id,
        email: user.email || '',
        raw_user_meta_data: user.user_metadata || {},
        created_at: user.created_at,
        last_sign_in_at: user.last_sign_in_at,
        quotes_count: stats.count,
        total_sales: stats.sales,
        role,
        full_name: profile?.full_name || user.user_metadata?.name || null,
      }
    })

    const response = NextResponse.json({ data: vendorsWithStats })
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('X-XSS-Protection', '1; mode=block')
    return response
  } catch (error) {
    logger.error('API /admin/vendors', 'Unexpected error', error as Error, sanitizeForLogging({}))
    const response = NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    response.headers.set('X-Content-Type-Options', 'nosniff')
    return response
  }
}

