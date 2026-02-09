import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import AdminSidebar from '@/components/AdminSidebar'

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

  // OPTIMIZADO: Leer el rol desde los metadatos del usuario.
  const role = user.user_metadata?.role || 'vendor'

  // Si un no-admin intenta acceder al panel de admin, redirigirlo a su dashboard.
  if (role !== 'admin') {
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
