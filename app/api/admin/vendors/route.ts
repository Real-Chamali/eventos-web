import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { logger } from '@/lib/utils/logger'

/**
 * GET /api/admin/vendors - Get all vendors with statistics
 * Requires admin role
 */
export async function GET(request: NextRequest) {
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

    // Crear cliente de administración con service role key
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      logger.error('API /admin/vendors', 'Missing service role key', new Error('SUPABASE_SERVICE_ROLE_KEY not set'))
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    const adminClient = createAdminClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Obtener todos los usuarios usando Admin API
    const { data: usersData, error: usersError } = await adminClient.auth.admin.listUsers()

    if (usersError) {
      logger.error('API /admin/vendors', 'Error listing users', new Error(usersError.message))
      return NextResponse.json({ error: 'Error al obtener usuarios' }, { status: 500 })
    }

    // Obtener estadísticas de cotizaciones por vendedor
    const { data: quotesData, error: quotesError } = await supabase
      .from('quotes')
      .select('vendor_id, total_price, status')

    if (quotesError) {
      logger.warn('API /admin/vendors', 'Error loading quotes stats', { error: quotesError.message })
    }

    // Calcular estadísticas por vendedor
    const statsMap = new Map<string, { count: number; sales: number }>()
    if (quotesData) {
      quotesData.forEach((quote) => {
        if (quote.vendor_id) {
          const existing = statsMap.get(quote.vendor_id) || { count: 0, sales: 0 }
          existing.count++
          if (quote.status === 'confirmed') {
            existing.sales += quote.total_price || 0
          }
          statsMap.set(quote.vendor_id, existing)
        }
      })
    }

    // Combinar datos de usuarios con estadísticas
    const vendorsWithStats = (usersData?.users || []).map((user) => {
      const stats = statsMap.get(user.id) || { count: 0, sales: 0 }
      return {
        id: user.id,
        email: user.email || '',
        raw_user_meta_data: user.user_metadata || {},
        created_at: user.created_at,
        last_sign_in_at: user.last_sign_in_at,
        quotes_count: stats.count,
        total_sales: stats.sales,
      }
    })

    return NextResponse.json({ data: vendorsWithStats })
  } catch (error) {
    logger.error('API /admin/vendors', 'Unexpected error', error as Error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

