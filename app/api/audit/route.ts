import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { logger } from '@/lib/utils/logger'

export async function GET(request: NextRequest) {
  const supabase = createClient()

  try {
    // 1. Autenticación y Autorización de Administrador
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return new NextResponse(JSON.stringify({ error: 'No autenticado' }), { status: 401 })
    }

    const role = user.user_metadata?.role || 'vendor'
    if (role !== 'admin') {
      return new NextResponse(JSON.stringify({ error: 'Acceso denegado: Se requiere rol de administrador' }), { status: 403 })
    }

    // 2. Lógica para obtener los registros de auditoría
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = 20 // 20 registros por página
    const offset = (page - 1) * limit

    // La consulta a la DB para obtener los logs, uniendo con la tabla de perfiles para obtener el email del vendedor.
    const { data, error, count } = await supabase
      .from('audit_logs')
      .select(`
        id,
        created_at,
        action,
        table_name,
        record_id,
        ip_address,
        user:profiles(id, email)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      logger.error('API:audit:GET', 'Error al obtener los registros de auditoría', error)
      throw error
    }

    return new NextResponse(JSON.stringify({ 
      logs: data, 
      totalPages: Math.ceil((count || 0) / limit) 
    }), { status: 200 })

  } catch (error) {
    logger.error('API:audit:GET', 'Error inesperado en la API de auditoría', error as Error)
    return new NextResponse(JSON.stringify({ error: 'Error interno del servidor' }), { status: 500 })
  }
}
