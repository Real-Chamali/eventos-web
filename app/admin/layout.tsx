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
      // Si el error es de esquema (PGRST106), redirigir a dashboard
      if (profileError.code === 'PGRST106' || profileError.message?.includes('schema')) {
        logger.warn('AdminLayout', 'Profile table not accessible (schema error), redirecting to dashboard', {
          userId: user.id,
          error: profileError.message,
          code: profileError.code,
        })
        redirect('/dashboard')
      } else if (profileError.code === 'PGRST116') {
        // No encontrado - redirigir a dashboard
        logger.info('AdminLayout', 'Profile not found, redirecting to dashboard', {
          userId: user.id,
        })
        redirect('/dashboard')
      } else {
        // Otros errores - loguear y redirigir a dashboard
        logger.error('AdminLayout', 'Error fetching profile', new Error(profileError.message), {
          supabaseError: profileError.message,
          supabaseCode: profileError.code,
          userId: user.id,
        })
        redirect('/dashboard')
      }
    } else if (data) {
      profile = data
      // Convertir el enum a string si es necesario
      userRole = typeof data.role === 'string' ? data.role : String(data.role)
      userRole = (userRole === 'admin' ? 'admin' : 'vendor')
    }
  } catch (error) {
    // Error inesperado - redirigir a dashboard
    logger.error('AdminLayout', 'Unexpected error fetching profile', error as Error, {
      userId: user.id,
    })
    redirect('/dashboard')
  }

  // Si no es admin, redirigir a dashboard
  if (userRole !== 'admin') {
    redirect('/dashboard')
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950">
      <AdminSidebar />
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
