import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import AdminSidebar from '@/components/AdminSidebar'
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
    logger.error('AdminLayout', 'Error fetching profile', errorForLogging, {
      supabaseError: errorMessage,
      supabaseCode: profileError?.code,
      userId: user.id,
    })
    
    // Si el error es de esquema o tabla no encontrada, redirigir a dashboard
    // en lugar de login (evita bucles y permite acceso básico)
    if (profileError.code === 'PGRST106' || profileError.message?.includes('schema')) {
      logger.warn('AdminLayout', 'Profile table not accessible, redirecting to dashboard', {
        userId: user.id,
        error: errorMessage,
      })
      redirect('/dashboard')
    } else {
      // Para otros errores, redirigir a login
      redirect('/login')
    }
  }

  // Si no hay perfil o no es admin, redirigir a dashboard
  if (!profile || profile.role !== 'admin') {
    redirect('/dashboard')
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
