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
 * Verify JWT token and get authenticated user
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
 * Check if user has admin role
 */
export async function checkAdmin(userId: string): Promise<boolean> {
  try {
    const supabase = await createClient()

    const res = await supabase.from('profiles').select('role').eq('user_id', userId).single()
    const data = res.data as { role?: string } | null
    const error = res.error

    if (error || !data) return false
    return data.role === 'admin'
  } catch (error) {
    logger.error('Auth Middleware', 'Failed to check admin role', error as Error)
    return false
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
 * Rate limiting (simple in-memory implementation)
 * For production, use Redis
 */
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

export function checkRateLimit(
  key: string,
  maxRequests: number = 60,
  windowMs: number = 60000 // 1 minute
): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(key)

  if (!entry || entry.resetTime < now) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs })
    return true
  }

  if (entry.count >= maxRequests) {
    return false
  }

  entry.count++
  return true
}

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
