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
      return new NextResponse(JSON.stringify({ error: 'Acceso denegado' }), { status: 403 })
    }

    // 2. Lógica de Negocio: Ejecutar la consulta RPC para obtener los reportes
    // Esta es una función SQL que debemos crear en Supabase.
    const { data, error } = await supabase.rpc('get_vendor_performance_report')

    if (error) {
      logger.error('API:reports:vendors:GET', 'Error al llamar a la función RPC get_vendor_performance_report', error)
      // Fallback por si la función RPC no existe todavía.
      return new NextResponse(JSON.stringify({ error: 'La base de datos no está lista para este reporte. Por favor, ejecuta el script SQL necesario.' }), { status: 501 })
    }

    logger.info('API:reports:vendors:GET', 'Reporte de rendimiento de vendedores generado exitosamente', { adminId: user.id })
    return new NextResponse(JSON.stringify(data), { status: 200 })

  } catch (error) {
    logger.error('API:reports:vendors:GET', 'Error inesperado en la API de reportes', error as Error)
    return new NextResponse(JSON.stringify({ error: 'Error interno del servidor' }), { status: 500 })
  }
}
