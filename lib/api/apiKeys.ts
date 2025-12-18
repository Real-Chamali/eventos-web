/**
 * Sistema de validación de API keys
 * Usa la tabla api_keys de Supabase con hash SHA-256
 */

import { createClient } from '@/utils/supabase/server'
import { logger } from '@/lib/utils/logger'
import { hashSHA256, generateSecureToken } from '@/lib/utils/security'
import { NextRequest } from 'next/server'

export interface ApiKey {
  id: string
  name: string
  user_id: string
  permissions: string[]
  created_at: string
  last_used_at?: string | null
  expires_at?: string | null
  is_active: boolean
}

/**
 * Hashear API key usando SHA-256
 */
export function hashApiKey(apiKey: string): string {
  return hashSHA256(apiKey)
}

/**
 * Generar una nueva API key segura
 */
export function generateApiKey(): string {
  // Generar key aleatoria de 64 caracteres (32 bytes = 64 hex chars)
  return generateSecureToken(32)
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
    
    // Hashear la API key para buscar en la BD
    const keyHash = hashApiKey(apiKey)
    
    // Usar service_role para poder leer todas las API keys
    // En producción, esto debería hacerse desde un edge function o middleware
    const supabase = await createClient()
    
    // Buscar API key en la tabla api_keys usando el hash
    const { data: apiKeyData, error } = await supabase
      .from('api_keys')
      .select('user_id, permissions, is_active, expires_at')
      .eq('key_hash', keyHash)
      .single()
    
    if (error || !apiKeyData) {
      logger.warn('API Keys', 'Invalid API key attempted', {
        keyHashPrefix: keyHash.substring(0, 8) + '...',
        error: error?.message,
      })
      return {
        valid: false,
        error: 'API key inválida o no encontrada',
      }
    }
    
    // Verificar que esté activa
    if (!apiKeyData.is_active) {
      logger.warn('API Keys', 'Inactive API key attempted', {
        userId: apiKeyData.user_id,
      })
      return {
        valid: false,
        error: 'API key inactiva',
      }
    }
    
    // Verificar expiración
    if (apiKeyData.expires_at && new Date(apiKeyData.expires_at) < new Date()) {
      logger.warn('API Keys', 'Expired API key attempted', {
        userId: apiKeyData.user_id,
        expiresAt: apiKeyData.expires_at,
      })
      return {
        valid: false,
        error: 'API key expirada',
      }
    }
    
    // Actualizar last_used_at (usar service_role para poder actualizar)
    // Nota: Esto requiere permisos especiales, puede hacerse desde un edge function
    try {
      await supabase
        .from('api_keys')
        .update({ last_used_at: new Date().toISOString() })
        .eq('key_hash', keyHash)
    } catch (updateError) {
      // No fallar si no se puede actualizar last_used_at
      logger.warn('API Keys', 'Could not update last_used_at', {
        error: updateError instanceof Error ? updateError.message : String(updateError),
      })
    }
    
    logger.info('API Keys', 'API key validated', {
      userId: apiKeyData.user_id,
      permissions: apiKeyData.permissions,
    })
    
    return {
      valid: true,
      userId: apiKeyData.user_id,
      permissions: apiKeyData.permissions || ['read', 'write'],
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

/**
 * Crear una nueva API key para un usuario
 * @param userId - ID del usuario
 * @param name - Nombre descriptivo para la API key
 * @param permissions - Permisos (default: ['read', 'write'])
 * @param expiresAt - Fecha de expiración opcional
 * @returns La API key generada (solo se muestra una vez)
 */
export async function createApiKey(
  userId: string,
  name: string,
  permissions: string[] = ['read', 'write'],
  expiresAt?: Date
): Promise<{ apiKey: string; id: string }> {
  const supabase = await createClient()
  
  // Generar API key
  const apiKey = generateApiKey()
  const keyHash = hashApiKey(apiKey)
  
  // Insertar en la BD
  const { data, error } = await supabase
    .from('api_keys')
    .insert({
      user_id: userId,
      name,
      key_hash: keyHash,
      permissions,
      expires_at: expiresAt?.toISOString() || null,
      is_active: true,
    })
    .select('id')
    .single()
  
  if (error || !data) {
    logger.error('API Keys', 'Error creating API key', error as Error)
    throw new Error('Error al crear API key')
  }
  
  logger.info('API Keys', 'API key created', {
    userId,
    apiKeyId: data.id,
    name,
  })
  
  // Retornar la API key (solo se muestra una vez, no se almacena)
  return {
    apiKey,
    id: data.id,
  }
}

/**
 * Listar API keys de un usuario
 */
export async function listUserApiKeys(userId: string): Promise<ApiKey[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('api_keys')
    .select('id, name, user_id, permissions, created_at, last_used_at, expires_at, is_active')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  
  if (error) {
    logger.error('API Keys', 'Error listing API keys', error as Error)
    throw error
  }
  
  return (data || []) as ApiKey[]
}

/**
 * Revocar (desactivar) una API key
 */
export async function revokeApiKey(apiKeyId: string, userId: string): Promise<void> {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('api_keys')
    .update({ is_active: false })
    .eq('id', apiKeyId)
    .eq('user_id', userId)
  
  if (error) {
    logger.error('API Keys', 'Error revoking API key', error as Error)
    throw error
  }
  
  logger.info('API Keys', 'API key revoked', {
    apiKeyId,
    userId,
  })
}

