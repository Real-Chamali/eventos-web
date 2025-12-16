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
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // Excluir rutas estáticas y de Next.js del middleware
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname === '/favicon.ico' ||
    pathname.match(/\.(ico|png|jpg|jpeg|svg|gif|webp)$/)
  ) {
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

  // Obtener el perfil del usuario una sola vez si está autenticado
  let userRole: string | null = null
  if (user) {
    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
      
      // Si hay error al obtener el perfil, usar rol por defecto
      if (profileError || !profile) {
        userRole = 'vendor'
      } else {
        userRole = profile.role || 'vendor'
      }
    } catch {
      // En caso de error, usar rol por defecto
      userRole = 'vendor'
    }
  }

  // Si el usuario está autenticado y está en /login, redirigir según su rol
  if (user && pathname === '/login') {
    const url = request.nextUrl.clone()
    url.pathname = userRole === 'admin' ? '/admin' : '/dashboard'
    url.searchParams.delete('redirected')
    return NextResponse.redirect(url)
  }

  // Proteger rutas según el rol
  if (user && userRole) {
    // Si intenta acceder a /admin y no es admin
    if (pathname.startsWith('/admin') && userRole !== 'admin') {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }

    // Si intenta acceder a /dashboard y es admin
    if (pathname.startsWith('/dashboard') && userRole === 'admin') {
      const url = request.nextUrl.clone()
      url.pathname = '/admin'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}


