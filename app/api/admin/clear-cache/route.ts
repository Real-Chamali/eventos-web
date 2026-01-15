import { NextRequest } from 'next/server'
import { clearRoleCache, checkAdmin, errorResponse, successResponse, validateMethod, checkRateLimitAsync, handleAPIError } from '@/lib/api/middleware'
import { getAuthenticatedUser, checkApiKeyPermissions } from '@/lib/api/authHelper'
import { logger } from '@/lib/utils/logger'
import { sanitizeForLogging } from '@/lib/utils/security'

/**
 * POST /api/admin/clear-cache
 * Limpia el caché de roles (útil después de actualizar un rol)
 * Requiere permisos de admin
 */
export async function POST(request: NextRequest) {
  try {
    const methodError = validateMethod(request, ['POST', 'OPTIONS'])
    if (methodError) return methodError

    const auth = await getAuthenticatedUser(request)
    if (auth.error || !auth.userId) {
      return errorResponse(auth.error || 'Unauthorized', 401)
    }
    
    // Verificar permisos si es API key
    if (auth.isApiKey && !checkApiKeyPermissions(auth, 'admin')) {
      return errorResponse('Insufficient permissions. Required: admin', 403)
    }

    // Verificar que sea admin
    const isAdmin = await checkAdmin(auth.userId)
    if (!isAdmin) {
      return errorResponse('Forbidden - Admin access required', 403)
    }

    // Rate limiting
    const rateLimitAllowed = await checkRateLimitAsync(`clear-cache-${auth.userId}`, 5, 60000)
    if (!rateLimitAllowed) {
      return errorResponse('Too many requests', 429)
    }

    // Limpiar caché de roles para este usuario
    clearRoleCache(auth.userId)
    
    logger.info('API /admin/clear-cache', 'Role cache cleared', sanitizeForLogging({
      userId: auth.userId,
      isApiKey: auth.isApiKey,
    }))

    return successResponse({ 
      cleared: true 
    }, 'Cache cleared successfully')
  } catch (error) {
    return await handleAPIError(error, 'POST /api/admin/clear-cache')
  }
}

