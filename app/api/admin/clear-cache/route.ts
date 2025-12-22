import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { clearRoleCache } from '@/lib/api/middleware'
import { logger } from '@/lib/utils/logger'

/**
 * POST /api/admin/clear-cache
 * Limpia el caché de roles (útil después de actualizar un rol)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Limpiar caché de roles para este usuario
    clearRoleCache(user.id)
    
    logger.info('API /admin/clear-cache', 'Role cache cleared', {
      userId: user.id,
    })

    return NextResponse.json({ 
      success: true, 
      message: 'Cache cleared successfully' 
    })
  } catch (error) {
    logger.error('API /admin/clear-cache', 'Error clearing cache', error as Error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

