import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/Sidebar'

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

  // OPTIMIZADO: Leer el rol desde los metadatos del usuario.
  const role = user.user_metadata?.role || 'vendor'

  // Si un admin intenta acceder al dashboard de vendedor, redirigirlo a su panel.
  if (role === 'admin') {
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
