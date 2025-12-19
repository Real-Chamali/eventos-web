import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { logger } from '@/lib/utils/logger'

export default async function Home() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      redirect('/login')
    }

    // Usar el cliente admin para obtener el perfil sin problemas de RLS
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    let role = 'vendor' // Rol por defecto
    
    if (supabaseUrl && supabaseServiceKey) {
      try {
        const { createClient: createAdminClient } = await import('@supabase/supabase-js')
        const adminClient = createAdminClient(supabaseUrl, supabaseServiceKey, {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
          },
        })

        const { data: profile, error: profileError } = await adminClient
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .maybeSingle()

        if (profileError) {
          logger.warn('Home', 'Error fetching profile with admin client', {
            userId: user.id,
            error: profileError.message,
            code: profileError.code,
          })
        } else if (profile && profile.role) {
          // Manejar el enum de PostgreSQL correctamente
          const roleStr = String(profile.role).trim().toLowerCase()
          role = roleStr === 'admin' ? 'admin' : 'vendor'
        }
      } catch (error) {
        logger.warn('Home', 'Error using admin client, falling back to normal client', {
          userId: user.id,
          error: error instanceof Error ? error.message : String(error),
        })
        
        // Fallback al cliente normal
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .maybeSingle()

        if (profile && profile.role) {
          const roleStr = String(profile.role).trim().toLowerCase()
          role = roleStr === 'admin' ? 'admin' : 'vendor'
        }
      }
    } else {
      // Fallback al cliente normal si no hay service key
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle()

      if (profile && profile.role) {
        const roleStr = String(profile.role).trim().toLowerCase()
        role = roleStr === 'admin' ? 'admin' : 'vendor'
      }
    }
  
    redirect(role === 'admin' ? '/admin' : '/dashboard')
  } catch (error) {
    // Si hay un error (ej: variables de entorno faltantes), redirigir a login
    logger.error('Home', 'Error in home page', error as Error)
    redirect('/login')
  }
}
