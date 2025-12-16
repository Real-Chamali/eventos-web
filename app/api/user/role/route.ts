import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import { logger } from '@/lib/utils/logger'

export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Intentar obtener el perfil desde el servidor
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

    if (profileError) {
      // Si el error es de esquema (PGRST106), loguear pero retornar rol por defecto
      if (profileError.code === 'PGRST106' || profileError.message?.includes('schema')) {
        logger.warn('API /user/role', 'Profile table not accessible (schema error), using default role', {
          userId: user.id,
          error: profileError.message,
          code: profileError.code,
        })
        return NextResponse.json({ role: 'vendor' })
      } else if (profileError.code === 'PGRST116') {
        // No encontrado
        logger.info('API /user/role', 'Profile not found, using default role', {
          userId: user.id,
        })
        return NextResponse.json({ role: 'vendor' })
      } else {
        // Otros errores
        logger.error('API /user/role', 'Error fetching profile', new Error(profileError.message), {
          supabaseError: profileError.message,
          supabaseCode: profileError.code,
          userId: user.id,
        })
        return NextResponse.json({ role: 'vendor' })
      }
    }

    // Convertir el enum a string si es necesario
    let role = typeof profile?.role === 'string' ? profile.role : String(profile?.role || 'vendor')
    role = role === 'admin' ? 'admin' : 'vendor'

    return NextResponse.json({ role })
  } catch (error) {
    logger.error('API /user/role', 'Unexpected error', error as Error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

