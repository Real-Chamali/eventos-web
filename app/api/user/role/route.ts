import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import { logger } from '@/lib/utils/logger'
import { sanitizeForLogging } from '@/lib/utils/security'
import { getUserFromSession } from '@/lib/api/middleware'

export async function GET() {
  try {
    // Usar función centralizada para obtener usuario de sesión
    const { user, error: authError } = await getUserFromSession()

    if (!user || authError) {
      const response = NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      response.headers.set('X-Content-Type-Options', 'nosniff')
      return response
    }

    const supabase = await createClient()

    // Intentar obtener el perfil desde el servidor
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

    if (profileError) {
      // Si el error es de esquema (PGRST106), loguear pero retornar rol por defecto
      if (profileError.code === 'PGRST106' || profileError.message?.includes('schema')) {
        logger.warn('API /user/role', 'Profile table not accessible (schema error), using default role', sanitizeForLogging({
          userId: user.id,
          error: profileError.message,
          code: profileError.code,
        }))
        const response = NextResponse.json({ role: 'vendor' })
        response.headers.set('X-Content-Type-Options', 'nosniff')
        return response
      } else if (profileError.code === 'PGRST116') {
        // No encontrado
        logger.info('API /user/role', 'Profile not found, using default role', sanitizeForLogging({
          userId: user.id,
        }))
        const response = NextResponse.json({ role: 'vendor' })
        response.headers.set('X-Content-Type-Options', 'nosniff')
        return response
      } else {
        // Otros errores
        logger.error('API /user/role', 'Error fetching profile', new Error(profileError.message), sanitizeForLogging({
          supabaseError: profileError.message,
          supabaseCode: profileError.code,
          userId: user.id,
        }))
        const response = NextResponse.json({ role: 'vendor' })
        response.headers.set('X-Content-Type-Options', 'nosniff')
        return response
      }
    }

    // Convertir el enum a string si es necesario
    let role = typeof profile?.role === 'string' ? profile.role : String(profile?.role || 'vendor')
    role = role === 'admin' ? 'admin' : 'vendor'

    return NextResponse.json({ role })
  } catch (error) {
    logger.error('API /user/role', 'Unexpected error', error as Error, sanitizeForLogging({}))
    const response = NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    response.headers.set('X-Content-Type-Options', 'nosniff')
    return response
  }
}

