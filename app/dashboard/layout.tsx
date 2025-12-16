import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import Navbar from '@/components/Navbar'
import { logger } from '@/lib/utils/logger'

export default async function DashboardLayout({
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

  // Intentar obtener el perfil con manejo mejorado de errores
  let profile: { role: string } | null = null
  let userRole = 'vendor' // Rol por defecto

  try {
    const { data, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle() // Usar maybeSingle para evitar errores si no existe

    if (profileError) {
      // Si el error es de esquema (PGRST106), usar rol por defecto
      if (profileError.code === 'PGRST106' || profileError.message?.includes('schema')) {
        logger.warn('DashboardLayout', 'Profile table not accessible (schema error), using default role', {
          userId: user.id,
          error: profileError.message,
          code: profileError.code,
        })
        // Continuar con rol por defecto
      } else if (profileError.code === 'PGRST116') {
        // No encontrado - usar rol por defecto
        logger.info('DashboardLayout', 'Profile not found, using default role', {
          userId: user.id,
        })
        // Continuar con rol por defecto
      } else {
        // Otros errores - loguear pero continuar con rol por defecto
        logger.error('DashboardLayout', 'Error fetching profile', new Error(profileError.message), {
          supabaseError: profileError.message,
          supabaseCode: profileError.code,
          userId: user.id,
        })
        // Continuar con rol por defecto en lugar de redirigir (evita bucles)
      }
    } else if (data) {
      profile = data
      // Convertir el enum a string si es necesario
      userRole = typeof data.role === 'string' ? data.role : String(data.role)
      userRole = (userRole === 'admin' ? 'admin' : 'vendor')
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
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950">
      <Sidebar />
      <div className="flex flex-col flex-1 lg:pl-64">
        <Navbar />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
