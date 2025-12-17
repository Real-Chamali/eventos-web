import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { logger } from '@/lib/utils/logger'

export default async function Home() {
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
    .maybeSingle()

  // Si hay error de esquema, usar rol por defecto
  const role = profile?.role || 'vendor'
  
  // Si el error es de esquema, loguear pero continuar con rol por defecto
  if (profileError && (profileError.code === 'PGRST106' || profileError.message?.includes('schema'))) {
    logger.warn('Home', 'Profile table not accessible, using default role', {
      userId: user.id,
      error: profileError.message,
      code: profileError.code,
    })
  }
  
  redirect(role === 'admin' ? '/admin' : '/dashboard')
}
