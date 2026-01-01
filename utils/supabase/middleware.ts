import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { CookieOptions } from '@supabase/ssr'
import { logger } from '@/lib/utils/logger'

export async function updateSession(request: NextRequest) {
  // Validar variables de entorno
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseAnonKey) {
    // Si faltan variables de entorno, permitir acceso pero loguear el problema
    logger.error('Middleware', 'Missing Supabase environment variables', new Error('Missing env vars'), {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseAnonKey,
      pathname: request.nextUrl.pathname,
    })
    // Permitir acceso a login y raíz para que el usuario pueda ver el error
    const pathname = request.nextUrl.pathname
    if (pathname === '/login' || pathname === '/') {
      return NextResponse.next({ request })
    }
    // Redirigir a login si no hay variables de entorno
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }
  
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options: CookieOptions }>) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) => {
            // Asegurar que las cookies de Supabase tengan los atributos correctos
            const isProduction = process.env.NODE_ENV === 'production'
            const isHttps = request.url.startsWith('https://')
            
            const cookieOptions: CookieOptions = {
              ...options,
              // SameSite: 'lax' funciona bien para la mayoría de casos
              // 'none' solo es necesario si el frontend y backend están en dominios diferentes
              // y requiere Secure=true (HTTPS)
              sameSite: options?.sameSite || (isHttps && isProduction ? 'lax' : 'lax'),
              // Secure solo en HTTPS (producción)
              secure: options?.secure ?? isHttps,
              // Las cookies de Supabase necesitan ser accesibles desde JavaScript
              // No usar httpOnly para cookies de autenticación de Supabase
              // Asegurar que el dominio sea correcto
              domain: options?.domain,
              path: options?.path || '/',
              // Max age para persistencia
              maxAge: options?.maxAge || 60 * 60 * 24 * 7, // 7 días por defecto
            }
            supabaseResponse.cookies.set(name, value, cookieOptions)
          })
        },
      },
    }
  )

  // Intentar obtener el usuario - si falla, user será null
  let user = null
  try {
    const {
      data: { user: authUser },
      error: userError,
    } = await supabase.auth.getUser()
    
    if (userError) {
      // Si hay error, loguear pero no bloquear - dejar que el layout maneje
      logger.warn('Middleware', 'Error getting user in middleware', {
        error: userError.message,
        pathname: request.nextUrl.pathname,
        errorCode: userError.status,
      })
    } else {
      user = authUser
    }
  } catch (error) {
    // Si hay excepción, loguear pero no bloquear
    logger.warn('Middleware', 'Exception getting user in middleware', {
      error: error instanceof Error ? error.message : String(error),
      pathname: request.nextUrl.pathname,
    })
  }

  const pathname = request.nextUrl.pathname

  // Excluir solo rutas estáticas, NO APIs
  // PERO incluir manifest.json que debe ser público para PWA
  if (
    pathname.startsWith('/_next') ||
    pathname === '/favicon.ico' ||
    pathname === '/manifest.json' ||
    pathname.match(/\.(ico|png|jpg|jpeg|svg|gif|webp)$/)
  ) {
    return supabaseResponse
  }

  // Para rutas API, verificar autenticación pero no redirigir
  // EXCEPTO manifest.json que debe ser público
  if (pathname.startsWith('/api')) {
    // Permitir manifest.json sin autenticación
    if (pathname === '/api/manifest.json' || pathname.includes('/manifest.json')) {
      return supabaseResponse
    }
    
    if (!user) {
      // Para APIs, retornar JSON en lugar de redirigir
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    // Permitir que el endpoint maneje autorización específica
    return supabaseResponse
  }

  // Si el usuario no está autenticado
  if (!user) {
    // Permitir acceso a /login y / (la raíz redirigirá en el componente)
    if (pathname === '/login' || pathname === '/') {
      return supabaseResponse
    }
    // Redirigir cualquier otra ruta a /login
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // NOTA: Las redirecciones según rol se manejan en los layouts
  // para evitar bucles de redirección entre middleware y layouts
  // El perfil del usuario se obtiene en los layouts cuando es necesario

  return supabaseResponse
}


