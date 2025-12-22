import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { CookieOptions } from '@supabase/ssr'

export async function updateSession(request: NextRequest) {
  // Validar variables de entorno
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.next({ request })
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
            const cookieOptions: CookieOptions = {
              ...options,
              // Asegurar SameSite para evitar problemas con Cloudflare y CORS
              sameSite: options?.sameSite || 'lax',
              // Asegurar Secure en producción (HTTPS)
              secure: options?.secure ?? (process.env.NODE_ENV === 'production'),
              // Las cookies de Supabase necesitan ser accesibles desde JavaScript
              // No usar httpOnly para cookies de autenticación de Supabase
            }
            supabaseResponse.cookies.set(name, value, cookieOptions)
          })
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // Excluir solo rutas estáticas, NO APIs
  if (
    pathname.startsWith('/_next') ||
    pathname === '/favicon.ico' ||
    pathname.match(/\.(ico|png|jpg|jpeg|svg|gif|webp)$/)
  ) {
    return supabaseResponse
  }

  // Para rutas API, verificar autenticación pero no redirigir
  if (pathname.startsWith('/api')) {
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


