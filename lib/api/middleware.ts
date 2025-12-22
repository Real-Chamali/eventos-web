/**
 * API Route Middleware
 * 
 * Provides authentication, authorization, rate limiting, and error handling
 * for REST API routes.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { logger } from '@/lib/utils/logger'
import { createAuditLog } from '@/lib/utils/audit'

/**
 * Verify JWT token and get authenticated user (from Authorization header)
 * Use this for REST APIs that use Bearer tokens
 */
export async function verifyAuth(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return { user: null, error: 'Missing or invalid Authorization header' }
    }

    const token = authHeader.slice(7)
    const supabase = await createClient()

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token)

    if (error || !user) {
      return { user: null, error: 'Invalid or expired token' }
    }

    return { user, error: null }
  } catch (error) {
    logger.error('Auth Middleware', 'Failed to verify token', error as Error)
    return { user: null, error: 'Authentication failed' }
  }
}

/**
 * Get authenticated user from session cookies
 * Use this for endpoints that rely on browser session cookies
 * This is a centralized way to get the user from cookies
 */
export async function getUserFromSession(): Promise<{
  user: { id: string; email?: string } | null
  error: string | null
}> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error || !user) {
      return { user: null, error: error?.message || 'Not authenticated' }
    }

    return { user, error: null }
  } catch (error) {
    logger.error('Auth Middleware', 'Failed to get user from session', error as Error)
    return { user: null, error: 'Authentication failed' }
  }
}

// Caché simple para roles (TTL: 5 minutos)
const roleCache = new Map<string, { role: string; expires: number }>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutos

/**
 * Check if user has admin role
 * Incluye caché y manejo correcto de enum de PostgreSQL
 */
export async function checkAdmin(userId: string): Promise<boolean> {
  try {
    // Verificar caché
    const cached = roleCache.get(userId)
    if (cached && cached.expires > Date.now()) {
      return cached.role === 'admin'
    }

    const supabase = await createClient()
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .maybeSingle()

    if (error) {
      logger.error('Auth Middleware', 'Error checking admin role', new Error(error.message), {
        userId,
        errorCode: error.code,
      })
      return false // Fail secure
    }

    if (!profile || !profile.role) {
      // Cachear resultado negativo
      roleCache.set(userId, { role: 'vendor', expires: Date.now() + CACHE_TTL })
      return false
    }

    // Manejar enum de PostgreSQL correctamente
    const roleStr = String(profile.role).trim().toLowerCase()
    const isAdmin = roleStr === 'admin'

    // Cachear resultado
    roleCache.set(userId, { 
      role: roleStr, 
      expires: Date.now() + CACHE_TTL 
    })

    return isAdmin
  } catch (error) {
    logger.error('Auth Middleware', 'Failed to check admin role', error as Error, {
      userId,
    })
    return false // Fail secure
  }
}

/**
 * Limpiar caché de roles (útil para testing o cuando se actualiza un rol)
 */
export function clearRoleCache(userId?: string): void {
  if (userId) {
    roleCache.delete(userId)
  } else {
    roleCache.clear()
  }
}

/**
 * Extract IP address from request
 */
export function getClientIP(request: NextRequest): string | undefined {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0] ||
    request.headers.get('x-real-ip') ||
    'unknown'
  )
}

/**
 * Format error response
 */
export function errorResponse(message: string, status: number, details?: Record<string, unknown>) {
  return NextResponse.json(
    {
      error: message,
      ...(details && { details }),
    },
    { status }
  )
}

/**
 * Format success response
 */
export function successResponse<T>(data: T, message?: string, status = 200) {
  return NextResponse.json(
    {
      success: true,
      ...(message && { message }),
      data,
    },
    { status }
  )
}

/**
 * Create audit log for API action
 */
export async function auditAPIAction(
  userId: string,
  action: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE',
  tableName: string,
  recordId?: string,
  oldValues?: Record<string, unknown>,
  newValues?: Record<string, unknown>,
  request?: NextRequest
) {
  try {
    await createAuditLog({
      user_id: userId,
      action,
      table_name: tableName,
      old_values: oldValues,
      new_values: newValues,
      ip_address: request ? getClientIP(request) : undefined,
      user_agent: request?.headers.get('user-agent') || undefined,
      metadata: {
        api_endpoint: request?.nextUrl.pathname,
        record_id: recordId,
      },
    })
  } catch (error) {
    logger.error('Audit', 'Failed to create API audit log', error as Error)
    // Don't throw - auditing should not break API
  }
}

/**
 * Rate limiting
 * Importa desde rateLimit.ts para usar implementación distribuida
 */
export { checkRateLimit, clearRateLimit } from '@/lib/api/rateLimit'

/**
 * Handle API errors with proper logging
 */
export async function handleAPIError(
  error: unknown,
  context: string,
  userId?: string
): Promise<NextResponse> {
  const err = error instanceof Error ? error : new Error(String(error))

  logger.error('API', `${context} - ${err.message}`, err, {
    userId,
  })

  // Don't expose internal errors to client
  return errorResponse('An error occurred processing your request', 500)
}

/**
 * Validate request method
 */
export function validateMethod(
  request: NextRequest,
  allowedMethods: string[]
): NextResponse | null {
  if (!allowedMethods.includes(request.method)) {
    return errorResponse(`Method ${request.method} not allowed`, 405, {
      allowed: allowedMethods,
    })
  }
  return null
}
