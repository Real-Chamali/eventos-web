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
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  let userRole = 'vendor'

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
        const roleStr = String(data.role).trim().toLowerCase()
        userRole = roleStr === 'admin' ? 'admin' : 'vendor'
        
        logger.debug('AdminLayout', 'Role determined', {
          userId: user.id,
          email: user.email,
          roleRaw: data.role,
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
          const roleStr = String(fallbackData.role).trim().toLowerCase()
          userRole = roleStr === 'admin' ? 'admin' : 'vendor'
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
        const roleStr = String(data.role).trim().toLowerCase()
        userRole = roleStr === 'admin' ? 'admin' : 'vendor'
      }
    }
  } catch (error) {
    logger.error('AdminLayout', 'Unexpected error fetching profile', error as Error, {
      userId: user.id,
    })
    // No redirigir en catch, dejar que continúe y verifique el rol después
  }

  // Solo redirigir si definitivamente NO es admin
  // Si hay dudas, permitir acceso (mejor que bucle infinito)
  if (userRole !== 'admin') {
    logger.warn('AdminLayout', 'User is not admin, redirecting to dashboard', {
      userId: user.id,
      userRole,
    })
    redirect('/dashboard')
  }

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
