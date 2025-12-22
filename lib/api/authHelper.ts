/**
 * Helper para autenticación unificada (JWT o API Key)
 * Usado en rutas API para soportar ambos métodos de autenticación
 */

import { NextRequest } from 'next/server'
import { verifyAuth } from '@/lib/api/middleware'
import { validateApiKey } from '@/lib/api/apiKeys'

export interface AuthResult {
  userId: string
  permissions?: string[]
  isApiKey: boolean
  error?: string
}

/**
 * Obtener usuario autenticado usando API key o JWT
 * Intenta primero con API key, luego fallback a JWT
 */
export async function getAuthenticatedUser(request: NextRequest): Promise<AuthResult> {
  // Intentar primero con API key
  const apiKey = request.headers.get('x-api-key') || 
                 request.headers.get('authorization')?.replace('Bearer ', '')
  
  // Si parece una API key (longitud >= 32 caracteres), intentar validarla
  if (apiKey && apiKey.length >= 32) {
    const validation = await validateApiKey(request)
    if (validation.valid && validation.userId) {
      return {
        userId: validation.userId,
        permissions: validation.permissions,
        isApiKey: true,
      }
    }
    // Si la validación falló pero parece API key, retornar error
    if (apiKey.length >= 32) {
      return {
        userId: '',
        isApiKey: true,
        error: validation.error || 'Invalid API key',
      }
    }
  }
  
  // Fallback a JWT
  const { user, error: authError } = await verifyAuth(request)
  if (!user || authError) {
    return {
      userId: '',
      isApiKey: false,
      error: authError || 'Unauthorized',
    }
  }
  
  return {
    userId: user.id,
    isApiKey: false,
  }
}

/**
 * Verificar permisos para API keys
 */
export function checkApiKeyPermissions(
  auth: AuthResult,
  requiredPermission: 'read' | 'write' | 'admin'
): boolean {
  if (!auth.isApiKey || !auth.permissions) {
    return true // JWT auth no necesita verificación de permisos aquí
  }
  
  // Admin tiene todos los permisos
  if (auth.permissions.includes('admin')) {
    return true
  }
  
  // Verificar permiso específico
  return auth.permissions.includes(requiredPermission)
}

