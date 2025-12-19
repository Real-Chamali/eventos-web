import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { logger } from '@/lib/utils/logger'

/**
 * GET /api/admin/debug-role - Debug endpoint para verificar roles
 * Solo para debugging, remover en producción
 */
export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verificar que sea admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    const adminClient = createAdminClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Obtener el usuario admin@chamali.com específicamente
    const { data: adminUser } = await adminClient.auth.admin.getUserById('0f5f8080-5bfb-4f8a-a110-09887a250d7a')
    
    // Obtener su perfil
    const { data: adminProfile } = await adminClient
      .from('profiles')
      .select('id, role, full_name')
      .eq('id', '0f5f8080-5bfb-4f8a-a110-09887a250d7a')
      .single()

    // Obtener todos los perfiles
    const { data: allProfiles } = await adminClient
      .from('profiles')
      .select('id, role, full_name')

    return NextResponse.json({
      adminUser: {
        id: adminUser?.user?.id,
        email: adminUser?.user?.email,
      },
      adminProfile: {
        id: adminProfile?.id,
        role: adminProfile?.role,
        roleType: typeof adminProfile?.role,
        roleString: String(adminProfile?.role),
        full_name: adminProfile?.full_name,
      },
      allProfiles: allProfiles?.map(p => ({
        id: p.id,
        role: p.role,
        roleType: typeof p.role,
        roleString: String(p.role),
        full_name: p.full_name,
      })),
    })
  } catch (error) {
    logger.error('API /admin/debug-role', 'Error', error as Error)
    return NextResponse.json({ error: 'Internal server error', details: error instanceof Error ? error.message : String(error) }, { status: 500 })
  }
}

