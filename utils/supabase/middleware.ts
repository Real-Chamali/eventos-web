import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { CookieOptions } from '@supabase/ssr'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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

  // Si el usuario no está autenticado y no está en /login, redirigir a /login
  if (!user && pathname !== '/login' && !pathname.startsWith('/_next')) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (user) {
    // OPTIMIZADO: Leer el rol desde los metadatos del usuario en lugar de consultar la DB.
    const role = user.user_metadata?.role || 'vendor'
    const url = request.nextUrl.clone()

    // Si el usuario está autenticado y en /login, redirigir a su dashboard
    if (pathname === '/login') {
      url.pathname = role === 'admin' ? '/admin' : '/dashboard'
      return NextResponse.redirect(url)
    }

    // Proteger rutas según el rol
    // Si intenta acceder a /admin y no es admin
    if (pathname.startsWith('/admin') && role !== 'admin') {
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }

    // Si intenta acceder a /dashboard y es admin
    if (pathname.startsWith('/dashboard') && role === 'admin') {
      url.pathname = '/admin'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}
