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
  // PERMITIR ACCESO AL DASHBOARD INCLUSO SI HAY ERRORES AL OBTENER EL PERFIL
  // Solo redirigir a /admin si definitivamente es admin, pero no bloquear acceso
  let userRole = 'vendor' // Rol por defecto
  let shouldRedirectToAdmin = false

  try {
    // Usar el cliente admin para obtener el perfil sin problemas de RLS
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (supabaseUrl && supabaseServiceKey) {
      try {
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
      } catch (adminClientError) {
        logger.warn('DashboardLayout', 'Error creating admin client, using fallback', {
          userId: user.id,
          error: adminClientError instanceof Error ? adminClientError.message : String(adminClientError),
        })
      }
    }
    
    // Fallback al cliente normal si no hay service key o si falló el admin client
    if (userRole === 'vendor') {
      try {
        const { data, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .maybeSingle()

        if (!profileError && data && data.role) {
          const roleStr = String(data.role).trim().toLowerCase()
          userRole = roleStr === 'admin' ? 'admin' : 'vendor'
        }
      } catch (fallbackError) {
        logger.warn('DashboardLayout', 'Error in fallback profile fetch', {
          userId: user.id,
          error: fallbackError instanceof Error ? fallbackError.message : String(fallbackError),
        })
        // Continuar con rol por defecto (vendor) - no bloquear acceso
      }
    }
  } catch (error) {
    // Error inesperado - usar rol por defecto y PERMITIR ACCESO
    logger.error('DashboardLayout', 'Unexpected error fetching profile', error as Error, {
      userId: user.id,
    })
    // Continuar con rol por defecto - NO bloquear acceso al dashboard
  }

  // Solo redirigir a /admin si definitivamente es admin
  // Si hay dudas, permitir acceso al dashboard (mejor que bloquear)
  if (userRole === 'admin') {
    shouldRedirectToAdmin = true
    logger.info('DashboardLayout', 'Admin user detected, redirecting to admin panel', {
      userId: user.id,
      email: user.email,
    })
  }

  // Redirigir solo si definitivamente es admin
  if (shouldRedirectToAdmin) {
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
