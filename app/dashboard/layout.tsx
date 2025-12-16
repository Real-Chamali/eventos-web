import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
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

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profileError) {
    // Convertir error de Supabase a Error estándar
    const errorMessage = profileError?.message || 'Error fetching profile'
    const errorForLogging = profileError instanceof Error 
      ? profileError 
      : new Error(errorMessage)
    logger.error('DashboardLayout', 'Error fetching profile', errorForLogging, {
      supabaseError: errorMessage,
      supabaseCode: profileError?.code,
      userId: user.id,
    })
    
    // Si el error es de esquema o tabla no encontrada, usar rol por defecto
    // en lugar de redirigir a login (evita bucles)
    if (profileError.code === 'PGRST106' || profileError.message?.includes('schema')) {
      logger.warn('DashboardLayout', 'Profile table not accessible, using default role', {
        userId: user.id,
        error: errorMessage,
      })
      // Continuar con rol por defecto (vendor)
    } else {
      // Para otros errores, redirigir a login
      redirect('/login')
    }
  }

  // Si no hay perfil o hay error de esquema, usar rol por defecto
  const userRole = profile?.role || 'vendor'

  if (userRole === 'admin') {
    redirect('/admin')
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
