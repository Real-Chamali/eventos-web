import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

/**
 * Endpoint de debug para verificar autenticación
 * Solo disponible en desarrollo o con flag específico
 */
export async function GET(request: NextRequest) {
  // Solo permitir en desarrollo o con flag explícito
  const isDev = process.env.NODE_ENV === 'development'
  const debugEnabled = process.env.ENABLE_DEBUG_ENDPOINTS === 'true'
  
  if (!isDev && !debugEnabled) {
    return NextResponse.json(
      { error: 'Not available in production' },
      { status: 403 }
    )
  }

  try {
    const supabase = await createClient()
    
    // Verificar variables de entorno
    const envCheck = {
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing',
    }

    // Intentar obtener usuario
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    // Obtener cookies
    const cookies = request.cookies.getAll()
    const cookieNames = cookies.map(c => c.name)

    return NextResponse.json({
      success: true,
      environment: {
        nodeEnv: process.env.NODE_ENV,
        ...envCheck,
      },
      authentication: {
        user: user ? {
          id: user.id,
          email: user.email,
        } : null,
        error: userError?.message || null,
      },
      cookies: {
        count: cookies.length,
        names: cookieNames,
        hasAuthCookies: cookieNames.some(name => 
          name.includes('supabase') || name.includes('auth')
        ),
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString(),
    }, { status: 500 })
  }
}

