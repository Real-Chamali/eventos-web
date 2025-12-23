import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import AdminSidebar from '@/components/AdminSidebar'
import Navbar from '@/components/Navbar'
import { logger } from '@/lib/utils/logger'

export default async function AdminLayout({
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
      logger.error('AdminLayout', 'Error getting user', authError as Error)
      redirect('/login')
    }

    user = authUser

    if (!user) {
      redirect('/login')
    }
  } catch (error) {
    logger.error('AdminLayout', 'Error initializing Supabase client', error as Error)
    // Redirigir a login en caso de error para evitar errores 5xx
    redirect('/login')
  }

  let userRole = 'vendor'

  if (!user || !supabase) {
    redirect('/login')
  }

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
        logger.warn('AdminLayout', 'Error fetching profile with admin client', {
          userId: user.id,
          error: profileError.message,
          code: profileError.code,
        })
        // Si hay error, no redirigir inmediatamente, intentar con cliente normal
      } else if (data && data.role) {
        // Manejar el enum de PostgreSQL correctamente
        // El enum puede venir como string o como objeto, normalizar
        let roleStr: string
        if (typeof data.role === 'string') {
          roleStr = data.role.trim().toLowerCase()
        } else if (data.role && typeof data.role === 'object' && 'value' in data.role) {
          roleStr = String(data.role.value).trim().toLowerCase()
        } else {
          roleStr = String(data.role).trim().toLowerCase()
        }
        
        userRole = roleStr === 'admin' ? 'admin' : 'vendor'
        
        logger.info('AdminLayout', 'Role determined', {
          userId: user.id,
          email: user.email,
          roleRaw: data.role,
          roleType: typeof data.role,
          roleStr,
          userRole,
        })
      }
      
      // Si aún no se determinó el rol y hubo error, intentar con cliente normal
      if (userRole === 'vendor' && profileError) {
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .maybeSingle()

        if (!fallbackError && fallbackData && fallbackData.role) {
          // Manejar enum de PostgreSQL correctamente
          let roleStr: string
          if (typeof fallbackData.role === 'string') {
            roleStr = fallbackData.role.trim().toLowerCase()
          } else if (fallbackData.role && typeof fallbackData.role === 'object' && 'value' in fallbackData.role) {
            roleStr = String(fallbackData.role.value).trim().toLowerCase()
          } else {
            roleStr = String(fallbackData.role).trim().toLowerCase()
          }
          userRole = roleStr === 'admin' ? 'admin' : 'vendor'
          
          logger.info('AdminLayout', 'Role determined from fallback', {
            userId: user.id,
            roleRaw: fallbackData.role,
            roleStr,
            userRole,
          })
        }
      }
    } else {
      // Fallback al cliente normal si no hay service key
      const { data, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle()

      if (!profileError && data && data.role) {
        // Manejar enum de PostgreSQL correctamente
        let roleStr: string
        if (typeof data.role === 'string') {
          roleStr = data.role.trim().toLowerCase()
        } else if (data.role && typeof data.role === 'object' && 'value' in data.role) {
          roleStr = String(data.role.value).trim().toLowerCase()
        } else {
          roleStr = String(data.role).trim().toLowerCase()
        }
        userRole = roleStr === 'admin' ? 'admin' : 'vendor'
        
        logger.info('AdminLayout', 'Role determined from normal client', {
          userId: user.id,
          roleRaw: data.role,
          roleStr,
          userRole,
        })
      }
    }
  } catch (error) {
    logger.error('AdminLayout', 'Unexpected error fetching profile', error as Error, {
      userId: user.id,
    })
    // No redirigir en catch, dejar que continúe y verifique el rol después
  }

  // Solo redirigir si definitivamente NO es admin
  // Si hay dudas o errores, permitir acceso temporalmente (mejor que bloquear acceso legítimo)
  // El usuario admin@chamali.com siempre debe tener acceso
  const isAdminEmail = user.email === 'admin@chamali.com'
  
  if (userRole !== 'admin' && !isAdminEmail) {
    logger.warn('AdminLayout', 'User is not admin, redirecting to dashboard', {
      userId: user.id,
      email: user.email,
      userRole,
      isAdminEmail,
      timestamp: new Date().toISOString(),
    })
    redirect('/dashboard')
  }
  
  // Si es admin@chamali.com pero el rol no se detectó, loguear pero permitir acceso
  if (isAdminEmail && userRole !== 'admin') {
    logger.warn('AdminLayout', 'Admin email detected but role not set correctly, allowing access', {
      userId: user.id,
      email: user.email,
      userRole,
    })
  }
  
  logger.info('AdminLayout', 'Admin access granted', {
    userId: user.id,
    email: user.email,
    userRole,
  })

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <AdminSidebar />
      <div className="flex flex-col flex-1 lg:pl-72">
        <Navbar />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
