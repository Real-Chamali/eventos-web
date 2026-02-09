import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export default async function Home() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // OPTIMIZADO: Leer el rol directamente de los metadatos del usuario.
  const role = user.user_metadata?.role || 'vendor'
  
  redirect(role === 'admin' ? '/admin' : '/dashboard')
}
