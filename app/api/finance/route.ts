/**
 * GET /api/finance - Get finance data (admin only)
 * 
 * Authentication: Required (Bearer token)
 * Authorization: Admin only
 */

import { NextRequest } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import {
  verifyAuth,
  checkAdmin,
  errorResponse,
  successResponse,
  auditAPIAction,
  validateMethod,
  checkRateLimitAsync,
  handleAPIError,
} from '@/lib/api/middleware'
import { getAuthenticatedUser, checkApiKeyPermissions } from '@/lib/api/authHelper'
import { logger } from '@/lib/utils/logger'
import { sanitizeForLogging } from '@/lib/utils/security'

/**
 * GET /api/finance
 * Retrieve finance data with optional filtering
 * Query params: start_date, end_date, type
 */
export async function GET(request: NextRequest) {
  try {
    const methodError = validateMethod(request, ['GET', 'OPTIONS'])
    if (methodError) return methodError

    const auth = await getAuthenticatedUser(request)
    if (auth.error || !auth.userId) {
      return errorResponse(auth.error || 'Unauthorized', 401)
    }
    
    // Verificar permisos si es API key
    if (auth.isApiKey && !checkApiKeyPermissions(auth, 'admin')) {
      return errorResponse('Insufficient permissions. Required: admin', 403)
    }

    // Check admin role (para JWT también)
    const isAdmin = await checkAdmin(auth.userId)
    if (!isAdmin) {
      return errorResponse('Forbidden - Admin access required', 403)
    }

    // Rate limiting distribuido (Upstash Redis si está configurado)
    const rateLimitAllowed = await checkRateLimitAsync(`finance-get-${auth.userId}`, 30, 60000)
    if (!rateLimitAllowed) {
      return errorResponse('Too many requests', 429)
    }

    const supabase = await createClient()
    const url = new URL(request.url)

    const startDate = url.searchParams.get('start_date')
    const endDate = url.searchParams.get('end_date')
    const type = url.searchParams.get('type')

    // Get finance entries
    let query = supabase.from('finance_entries').select('*').order('date', { ascending: false })

    if (startDate) {
      query = query.gte('date', startDate)
    }
    if (endDate) {
      query = query.lte('date', endDate)
    }
    if (type) {
      query = query.eq('type', type)
    }

    const { data, error } = await query.limit(1000)

    if (error) throw error

    type FinanceEntry = {
      id: string
      type?: 'income' | 'expense' | string
      amount?: number
      date?: string
      [key: string]: unknown
    }

    const entries = (data as FinanceEntry[]) || []

    // Calculate summary
    const summary = {
      total_entries: entries.length,
      total_income:
        entries.filter((e) => e.type === 'income').reduce((sum, e) => sum + (e.amount || 0), 0) || 0,
      total_expense:
        entries.filter((e) => e.type === 'expense').reduce((sum, e) => sum + (e.amount || 0), 0) || 0,
    }

    summary.total_income = parseFloat((summary.total_income || 0).toFixed(2))
    summary.total_expense = parseFloat((summary.total_expense || 0).toFixed(2))

    await auditAPIAction(auth.userId, 'READ', 'finance_entries', undefined, undefined, undefined, request)

    // Sanitizar datos antes de loguear
    logger.info('API', 'Finance data retrieved', sanitizeForLogging({
      userId: auth.userId,
      entries: data?.length,
      isApiKey: auth.isApiKey,
    }))

    return successResponse(
      {
        entries,
        summary,
      },
      'Finance data retrieved successfully'
    )
  } catch (error) {
    return await handleAPIError(error, 'GET /api/finance')
  }
}

/**
 * OPTIONS /api/finance
 * CORS preflight
 */
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': process.env.NEXT_PUBLIC_APP_URL || '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}
