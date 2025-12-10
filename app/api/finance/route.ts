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
  checkRateLimit,
  handleAPIError,
} from '@/lib/api/middleware'
import { logger } from '@/lib/utils/logger'

/**
 * GET /api/finance
 * Retrieve finance data with optional filtering
 * Query params: start_date, end_date, type
 */
export async function GET(request: NextRequest) {
  try {
    const methodError = validateMethod(request, ['GET', 'OPTIONS'])
    if (methodError) return methodError

    const { user, error: authError } = await verifyAuth(request)
    if (!user || authError) {
      return errorResponse('Unauthorized', 401)
    }

    // Check admin role
    const isAdmin = await checkAdmin(user.id)
    if (!isAdmin) {
      return errorResponse('Forbidden - Admin access required', 403)
    }

    // Rate limiting
    if (!checkRateLimit(`finance-get-${user.id}`, 30, 60000)) {
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

    await auditAPIAction(user.id, 'READ', 'finance_entries', undefined, undefined, undefined, request)

    logger.info('API', 'Finance data retrieved', {
      userId: user.id,
      entries: data?.length,
    })

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
