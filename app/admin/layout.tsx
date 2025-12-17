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
    const { data, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

    if (profileError) {
      if (profileError.code === 'PGRST106' || profileError.message?.includes('schema')) {
        logger.warn('AdminLayout', 'Profile table not accessible (schema error), redirecting to dashboard', {
          userId: user.id,
          error: profileError.message,
          code: profileError.code,
        })
        redirect('/dashboard')
      } else if (profileError.code === 'PGRST116') {
        logger.info('AdminLayout', 'Profile not found, redirecting to dashboard', {
          userId: user.id,
        })
        redirect('/dashboard')
      } else {
        logger.error('AdminLayout', 'Error fetching profile', new Error(profileError.message), {
          supabaseError: profileError.message,
          supabaseCode: profileError.code,
          userId: user.id,
        })
        redirect('/dashboard')
      }
    } else if (data) {
      userRole = typeof data.role === 'string' ? data.role : String(data.role)
      userRole = (userRole === 'admin' ? 'admin' : 'vendor')
    }
  } catch (error) {
    logger.error('AdminLayout', 'Unexpected error fetching profile', error as Error, {
      userId: user.id,
    })
    redirect('/dashboard')
  }

  if (userRole !== 'admin') {
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
