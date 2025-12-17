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
      // Intentar obtener el perfil con manejo de errores mejorado
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle() // Usar maybeSingle en lugar de single para evitar errores si no existe
      
      // Si hay error al obtener el perfil, usar rol por defecto
      if (profileError) {
        // Log del error solo si no es un error de "no encontrado"
        if (profileError.code !== 'PGRST116' && profileError.code !== 'PGRST106') {
          console.warn('Middleware: Error fetching profile', {
            code: profileError.code,
            message: profileError.message,
            userId: user.id,
          })
        }
        userRole = 'vendor'
      } else if (profile) {
        // Convertir el enum a string si es necesario
        userRole = typeof profile.role === 'string' ? profile.role : String(profile.role)
        // Asegurar que sea 'admin' o 'vendor'
        userRole = (userRole === 'admin' ? 'admin' : 'vendor')
      } else {
        // No hay perfil, usar rol por defecto
        userRole = 'vendor'
      }
    } catch (error) {
      // En caso de error inesperado, usar rol por defecto
      console.warn('Middleware: Unexpected error fetching profile', error)
      userRole = 'vendor'
    }
  }

  // Si el usuario está autenticado y está en /login, permitir acceso
  // La página de login mostrará un mensaje si ya está autenticado
  // Esto permite cambiar de cuenta si es necesario
  // if (user && pathname === '/login') {
  //   const url = request.nextUrl.clone()
  //   url.pathname = userRole === 'admin' ? '/admin' : '/dashboard'
  //   return NextResponse.redirect(url)
  // }

  // NOTA: Las redirecciones según rol se manejan en los layouts
  // para evitar bucles de redirección entre middleware y layouts

  return supabaseResponse
}


