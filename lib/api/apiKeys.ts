/**
 * Sistema de validación de API keys
 * Reemplaza los TODOs pendientes en el código
 */

import { createClient } from '@/utils/supabase/server'
import { logger } from '@/lib/utils/logger'
import { NextRequest } from 'next/server'

export interface ApiKey {
  id: string
  key: string
  name: string
  user_id: string
  permissions: string[]
  created_at: string
  last_used_at?: string | null
  expires_at?: string | null
  is_active: boolean
}

/**
 * Validar API key desde header o query param
 */
export async function validateApiKey(request: NextRequest): Promise<{
  valid: boolean
  userId?: string
  permissions?: string[]
  error?: string
}> {
  try {
    // Buscar API key en headers o query params
    const apiKey = 
      request.headers.get('x-api-key') || 
      request.headers.get('authorization')?.replace('Bearer ', '') ||
      request.nextUrl.searchParams.get('api_key')
    
    if (!apiKey) {
      return {
        valid: false,
        error: 'API key no proporcionada',
      }
    }
    
    const supabase = await createClient()
    
    // Buscar API key en la base de datos
    // NOTA: En producción, deberías tener una tabla 'api_keys'
    // Por ahora, validamos contra profiles si es necesario
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('api_key', apiKey) // Asumiendo que agregas este campo
      .eq('is_active', true)
      .single()
    
    if (error || !profile) {
      logger.warn('API Keys', 'Invalid API key attempted', {
        apiKey: apiKey.substring(0, 8) + '...',
        error: error?.message,
      })
      return {
        valid: false,
        error: 'API key inválida o expirada',
      }
    }
    
    // Actualizar last_used_at (si tienes tabla api_keys)
    // await supabase
    //   .from('api_keys')
    //   .update({ last_used_at: new Date().toISOString() })
    //   .eq('key', apiKey)
    
    logger.info('API Keys', 'API key validated', {
      userId: profile.id,
      role: profile.role,
    })
    
    // Mapear roles a permisos
    const permissions = profile.role === 'admin'
      ? ['read', 'write', 'delete', 'admin']
      : ['read', 'write']
    
    return {
      valid: true,
      userId: profile.id,
      permissions,
    }
  } catch (error) {
    logger.error('API Keys', 'Error validating API key', error instanceof Error ? error : new Error(String(error)))
    return {
      valid: false,
      error: 'Error interno al validar API key',
    }
  }
}

/**
 * Middleware para proteger rutas API con API keys
 */
export function withApiKeyAuth(
  handler: (request: NextRequest, context: { userId: string; permissions: string[] }) => Promise<Response>
) {
  return async (request: NextRequest, context?: any) => {
    const validation = await validateApiKey(request)
    
    if (!validation.valid) {
      return new Response(
        JSON.stringify({ error: validation.error || 'Unauthorized' }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }
    
    return handler(request, {
      userId: validation.userId!,
      permissions: validation.permissions!,
      ...context,
    })
  }
}

