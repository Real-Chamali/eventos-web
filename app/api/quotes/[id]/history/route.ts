/**
 * Quote History API Route
 * =======================
 * Endpoints for retrieving and comparing quote versions
 *
 * GET    /api/quotes/:id/history        - Get all versions of a quote
 * GET    /api/quotes/:id/history/:version - Get specific version
 * POST   /api/quotes/:id/history/compare - Compare two versions
 * GET    /api/quotes/:id/history/stats   - Get history statistics
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth, errorResponse, successResponse } from '@/lib/api/middleware'
import {
  getQuoteVersion,
  compareQuoteVersions,
  getQuoteHistoryStats,
  getQuoteHistorySummary,
} from '@/lib/utils/quote-history'
import { logger } from '@/lib/utils/logger'
import { z } from 'zod'
import { sanitizeForLogging } from '@/lib/utils/security'

// Validation schemas
const CompareVersionSchema = z.object({
  version1: z.number().min(1, 'Version 1 must be at least 1'),
  version2: z.number().min(1, 'Version 2 must be at least 1'),
})

/**
 * GET /api/quotes/:id/history
 * ============================
 * Get complete history of a quote with all versions
 *
 * @param request - NextRequest object
 * @returns Array of quote versions with comparison info
 *
 * @example
 * GET /api/quotes/550e8400-e29b-41d4-a716-446655440000/history
 * Authorization: Bearer token
 *
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "quote_id": "550e8400-e29b-41d4-a716-446655440000",
 *     "total_versions": 3,
 *     "current_version": 3,
 *     "versions": [
 *       {
 *         "version_number": 3,
 *         "status": "accepted",
 *         "total_price": 1500,
 *         "services": [...],
 *         "created_by_name": "John Doe",
 *         "created_at": "2025-12-08T10:30:00Z"
 *       },
 *       ...
 *     ]
 *   }
 * }
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: quoteId } = await params
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const version = searchParams.get('version')

    // Verify authentication
    const { user, error: authError } = await verifyAuth(request)
    if (!user || authError) {
      return errorResponse('Unauthorized', 401)
    }

    // Handle specific version request
    if (action === 'version' && version) {
      const versionNum = parseInt(version, 10)
      if (isNaN(versionNum)) {
        return errorResponse('Invalid version number', 400)
      }

      const versionData = await getQuoteVersion(quoteId, versionNum)
      if (!versionData) {
        return errorResponse('Version not found', 404)
      }

      return successResponse(versionData, 'Quote version retrieved successfully')
    }

    // Handle stats request
    if (action === 'stats') {
      const stats = await getQuoteHistoryStats(quoteId)
      return successResponse(stats, 'Quote history statistics retrieved successfully')
    }

    // Default: get full history summary
    const history = await getQuoteHistorySummary(quoteId)

    // Sanitizar datos antes de loguear
    logger.info('api/quotes/history', 'Quote history retrieved', sanitizeForLogging({
      quoteId,
      userId: user.id,
      totalVersions: history.total_versions,
    }))

    return successResponse(history, 'Quote history retrieved successfully')
  } catch (error) {
    logger.error('api/quotes/history', 'Error retrieving quote history', error instanceof Error ? error : new Error(String(error)), sanitizeForLogging({
      request: request.url,
    }))
    return errorResponse(
      'Failed to retrieve quote history',
      500,
      error instanceof Error ? { message: error.message } : {}
    )
  }
}

/**
 * POST /api/quotes/:id/history/compare
 * =====================================
 * Compare two versions of a quote to see what changed
 *
 * @param request - NextRequest with comparison parameters
 * @returns Array of field differences
 *
 * @example
 * POST /api/quotes/550e8400-e29b-41d4-a716-446655440000/history
 * Authorization: Bearer token
 * Content-Type: application/json
 *
 * {
 *   "version1": 1,
 *   "version2": 2
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "data": [
 *     {
 *       "field_name": "status",
 *       "version1_value": "draft",
 *       "version2_value": "sent",
 *       "changed": true
 *     },
 *     {
 *       "field_name": "total_price",
 *       "version1_value": "1000.00",
 *       "version2_value": "1200.00",
 *       "changed": true
 *     }
 *   ]
 * }
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: quoteId } = await params

    // Verify authentication
    const { user, error: authError } = await verifyAuth(request)
    if (!user || authError) {
      return errorResponse('Unauthorized', 401)
    }

    // Parse request body
    const body = await request.json()

    // Validate request
    const validation = CompareVersionSchema.safeParse(body)
    if (!validation.success) {
      const fieldErrors = validation.error.issues.reduce(
        (acc, issue) => {
          acc[issue.path.join('.')] = issue.message
          return acc
        },
        {} as Record<string, string>
      )
      return errorResponse('Validation failed', 400, fieldErrors)
    }

    const { version1, version2 } = validation.data

    // Get comparison
    const comparison = await compareQuoteVersions(quoteId, version1, version2)

    // Sanitizar datos antes de loguear
    logger.info('api/quotes/history', 'Quote versions compared', sanitizeForLogging({
      quoteId,
      userId: user.id,
      version1,
      version2,
      changedFields: comparison.filter((c) => c.changed).length,
    }))

    return successResponse(
      comparison,
      `Comparison between version ${version1} and ${version2} retrieved successfully`,
      200
    )
  } catch (error) {
    logger.error('api/quotes/history', 'Error comparing quote versions', error instanceof Error ? error : new Error(String(error)), sanitizeForLogging({
      request: request.url,
    }))
    return errorResponse(
      'Failed to compare quote versions',
      500,
      error instanceof Error ? { message: error.message } : {}
    )
  }
}

/**
 * OPTIONS /api/quotes/:id/history
 * ================================
 * CORS preflight handler
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': process.env.NEXT_PUBLIC_APP_URL || '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}
