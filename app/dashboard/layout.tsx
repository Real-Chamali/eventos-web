import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import Navbar from '@/components/Navbar'
import { SkipLinks } from '@/components/accessibility/SkipLinks'
import { logger } from '@/lib/utils/logger'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  let supabase
  let user
  
  try {
    supabase = await createClient()
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError) {
      logger.error('DashboardLayout', 'Error getting user', authError as Error)
      redirect('/login')
    }

    user = authUser

    if (!user) {
      redirect('/login')
    }
  } catch (error) {
    logger.error('DashboardLayout', 'Error initializing Supabase client', error as Error)
    // Redirigir a login en caso de error para evitar errores 5xx
    redirect('/login')
  }

  if (!user || !supabase) {
    redirect('/login')
  }

  // Intentar obtener el perfil con manejo mejorado de errores
  let userRole = 'vendor' // Rol por defecto

  try {
    // Usar el cliente admin para obtener el perfil sin problemas de RLS
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (supabaseUrl && supabaseServiceKey) {
      const { createClient: createAdminClient } = await import('@supabase/supabase-js')
      const adminClient = createAdminClient(supabaseUrl, supabaseServiceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      })

      const { data, error: profileError } = await adminClient
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle()

      if (profileError) {
        logger.warn('DashboardLayout', 'Error fetching profile with admin client', {
          userId: user.id,
          error: profileError.message,
          code: profileError.code,
        })
      } else if (data && data.role) {
        // Manejar el enum de PostgreSQL correctamente
        const roleStr = String(data.role).trim().toLowerCase()
        userRole = roleStr === 'admin' ? 'admin' : 'vendor'
        
        logger.debug('DashboardLayout', 'Role determined', {
          userId: user.id,
          roleRaw: data.role,
          roleStr,
          userRole,
        })
      }
    } else {
      // Fallback al cliente normal si no hay service key
      const { data, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle()

      if (!profileError && data && data.role) {
        const roleStr = String(data.role).trim().toLowerCase()
        userRole = roleStr === 'admin' ? 'admin' : 'vendor'
      }
    }
  } catch (error) {
    // Error inesperado - usar rol por defecto
    logger.error('DashboardLayout', 'Unexpected error fetching profile', error as Error, {
      userId: user.id,
    })
    // Continuar con rol por defecto
  }

  if (userRole === 'admin') {
    redirect('/admin')
  }

  return (
    <>
      <SkipLinks />
      <div className="flex h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
        <nav id="navigation" aria-label="Navegación principal">
          <Sidebar />
        </nav>
        <div className="flex flex-col flex-1 lg:pl-72">
          <Navbar />
          <main id="main-content" className="flex-1 overflow-y-auto" role="main">
            <div className="mx-auto w-full">
              {children}
            </div>
          </main>
        </div>
      </div>
    </>
  )
}
