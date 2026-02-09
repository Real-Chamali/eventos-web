import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { z } from 'zod'
import { logger } from '@/lib/utils/logger'

// Esquema para validar los datos que llegan a la API
const UpdateServiceSchema = z.object({
  field: z.enum(['base_price', 'cost_price']),
  value: z.number().nonnegative('El valor no puede ser negativo'),
})

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const { id: serviceId } = params

  try {
    // 1. Autenticación y Autorización
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return new NextResponse(JSON.stringify({ error: 'No autenticado' }), { status: 401 })
    }

    const role = user.user_metadata?.role || 'vendor'
    if (role !== 'admin') {
      return new NextResponse(JSON.stringify({ error: 'No autorizado' }), { status: 403 })
    }

    // 2. Validación del Body
    const body = await request.json()
    const validation = UpdateServiceSchema.safeParse(body)

    if (!validation.success) {
      logger.warn('API:services:PUT', 'Validación fallida', { errors: validation.error.format() })
      return new NextResponse(JSON.stringify({ error: 'Datos inválidos', details: validation.error.format() }), { status: 400 })
    }

    const { field, value } = validation.data

    // 3. Lógica de Negocio (Actualización en la DB)
    const { data, error } = await supabase
      .from('services')
      .update({ [field]: value })
      .eq('id', serviceId)
      .select()
      .single()

    if (error) {
      logger.error('API:services:PUT', 'Error al actualizar servicio en Supabase', error)
      throw error
    }

    logger.info('API:services:PUT', 'Servicio actualizado exitosamente', { serviceId, adminId: user.id })
    return new NextResponse(JSON.stringify(data), { status: 200 })

  } catch (error) {
    logger.error('API:services:PUT', 'Error inesperado en la API', error as Error)
    return new NextResponse(JSON.stringify({ error: 'Error interno del servidor' }), { status: 500 })
  }
}
