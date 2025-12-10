/**
 * Quote History Utilities
 * ========================
 * Handles version tracking, history retrieval, and comparison for quotes
 */

import { createClient } from '@/utils/supabase/server'
import { logger } from './logger'

// Types for quote versions
export interface QuoteVersion {
  version_number: number
  status: string
  total_price: number
  services: Array<{
    service_id: string
    quantity: number
    final_price: number
  }>
  created_by_name: string | null
  created_at: string
}

export interface QuoteHistoryComparison {
  field_name: string
  version1_value: string | null
  version2_value: string | null
  changed: boolean
}

export interface QuoteHistorySummary {
  quote_id: string
  total_versions: number
  current_version: number
  versions: QuoteVersion[]
  created_at: string
  last_modified_at: string
}

/**
 * Get complete quote history
 * ===========================
 * Retrieves all versions of a quote with user information
 *
 * @param quoteId - UUID of the quote
 * @returns Array of quote versions
 *
 * @example
 * const history = await getQuoteHistory('550e8400-e29b-41d4-a716-446655440000')
 */
export async function getQuoteHistory(quoteId: string, supabase?: Awaited<ReturnType<typeof createClient>>): Promise<QuoteVersion[]> {
  try {
    const client = supabase || (await createClient())

    const { data, error } = await client.rpc('get_quote_history', {
      quote_uuid: quoteId,
    })

    if (error) {
      logger.error('lib/utils/quote-history', 'Failed to fetch quote history', new Error(error.message), {
        quoteId,
      })
      throw error
    }

    return data || []
  } catch (error) {
    logger.error('lib/utils/quote-history', 'Error in getQuoteHistory', error instanceof Error ? error : new Error(String(error)), {
      quoteId,
    })
    throw error
  }
}

/**
 * Get quote history summary
 * ==========================
 * Returns a summary of quote versions with metadata
 *
 * @param quoteId - UUID of the quote
 * @returns Quote history summary with all versions
 *
 * @example
 * const summary = await getQuoteHistorySummary('550e8400-e29b-41d4-a716-446655440000')
 */
export async function getQuoteHistorySummary(
  quoteId: string
): Promise<QuoteHistorySummary> {
  try {
    const supabase = await createClient()

    // Get quote basic info
    const { data: quoteData, error: quoteError } = await supabase
      .from('quotes')
      .select('id, created_at, updated_at')
      .eq('id', quoteId)
      .single()

    if (quoteError) {
      throw quoteError
    }

    // Get quote history
    const versions = await getQuoteHistory(quoteId)

    return {
      quote_id: quoteId,
      total_versions: versions.length,
      current_version: versions.length,
      versions,
      created_at: quoteData.created_at,
      last_modified_at: quoteData.updated_at,
    }
  } catch (error) {
    logger.error('lib/utils/quote-history', 'Error in getQuoteHistorySummary', error instanceof Error ? error : new Error(String(error)), {
      quoteId,
    })
    throw error
  }
}

/**
 * Compare two quote versions
 * ===========================
 * Shows differences between two versions of a quote
 *
 * @param quoteId - UUID of the quote
 * @param version1 - First version number
 * @param version2 - Second version number
 * @returns Array of field changes
 *
 * @example
 * const diff = await compareQuoteVersions('550e8400-e29b-41d4-a716-446655440000', 1, 2)
 * console.log(diff) // Shows what changed between v1 and v2
 */
export async function compareQuoteVersions(
  quoteId: string,
  version1: number,
  version2: number
): Promise<QuoteHistoryComparison[]> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase.rpc('compare_quote_versions', {
      quote_uuid: quoteId,
      v1: version1,
      v2: version2,
    })

    if (error) {
      logger.error('lib/utils/quote-history', 'Failed to compare quote versions', new Error(error.message), {
        quoteId,
        version1,
        version2,
      })
      throw error
    }

    return data || []
  } catch (error) {
    logger.error('lib/utils/quote-history', 'Error in compareQuoteVersions', error instanceof Error ? error : new Error(String(error)), {
      quoteId,
      version1,
      version2,
    })
    throw error
  }
}

/**
 * Get specific quote version
 * ===========================
 * Retrieves a specific version of a quote
 *
 * @param quoteId - UUID of the quote
 * @param versionNumber - Version number to retrieve
 * @returns Quote version data
 *
 * @example
 * const version = await getQuoteVersion('550e8400-e29b-41d4-a716-446655440000', 2)
 */
export async function getQuoteVersion(
  quoteId: string,
  versionNumber: number
): Promise<QuoteVersion | null> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('quote_versions')
      .select('version_number, status, total_price, services, created_by_name, created_at')
      .eq('quote_id', quoteId)
      .eq('version_number', versionNumber)
      .single()

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows found
      throw error
    }

    return data || null
  } catch (error) {
    logger.error('lib/utils/quote-history', 'Error in getQuoteVersion', error instanceof Error ? error : new Error(String(error)), {
      quoteId,
      versionNumber,
    })
    throw error
  }
}

/**
 * Get latest quote version
 * ==========================
 * Retrieves the most recent version of a quote
 *
 * @param quoteId - UUID of the quote
 * @returns Latest quote version
 *
 * @example
 * const latest = await getLatestQuoteVersion('550e8400-e29b-41d4-a716-446655440000')
 */
export async function getLatestQuoteVersion(quoteId: string): Promise<QuoteVersion | null> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('quote_versions')
      .select('version_number, status, total_price, services, created_by_name, created_at')
      .eq('quote_id', quoteId)
      .order('version_number', { ascending: false })
      .limit(1)
      .single()

    if (error && error.code !== 'PGRST116') {
      throw error
    }

    return data || null
  } catch (error) {
    logger.error('lib/utils/quote-history', 'Error in getLatestQuoteVersion', error instanceof Error ? error : new Error(String(error)), {
      quoteId,
    })
    throw error
  }
}

/**
 * Get version count
 * ==================
 * Returns how many versions exist for a quote
 *
 * @param quoteId - UUID of the quote
 * @returns Number of versions
 *
 * @example
 * const count = await getVersionCount('550e8400-e29b-41d4-a716-446655440000')
 */
export async function getVersionCount(quoteId: string): Promise<number> {
  try {
    const supabase = await createClient()

    const { count, error } = await supabase
      .from('quote_versions')
      .select('*', { count: 'exact', head: true })
      .eq('quote_id', quoteId)

    if (error) {
      throw error
    }

    return count || 0
  } catch (error) {
    logger.error('lib/utils/quote-history', 'Error in getVersionCount', error instanceof Error ? error : new Error(String(error)), {
      quoteId,
    })
    throw error
  }
}

/**
 * Get quote history by date range
 * ================================
 * Retrieves versions created within a specific date range
 *
 * @param quoteId - UUID of the quote
 * @param startDate - Start date (ISO string)
 * @param endDate - End date (ISO string)
 * @returns Array of quote versions in date range
 *
 * @example
 * const versions = await getQuoteHistoryByDateRange(
 *   '550e8400-e29b-41d4-a716-446655440000',
 *   '2025-01-01T00:00:00Z',
 *   '2025-12-31T23:59:59Z'
 * )
 */
export async function getQuoteHistoryByDateRange(
  quoteId: string,
  startDate: string,
  endDate: string
): Promise<QuoteVersion[]> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('quote_versions')
      .select('version_number, status, total_price, services, created_by_name, created_at')
      .eq('quote_id', quoteId)
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .order('version_number', { ascending: false })

    if (error) {
      throw error
    }

    return data || []
  } catch (error) {
    logger.error('lib/utils/quote-history', 'Error in getQuoteHistoryByDateRange', error instanceof Error ? error : new Error(String(error)), {
      quoteId,
      startDate,
      endDate,
    })
    throw error
  }
}

/**
 * Get quote history statistics
 * =============================
 * Returns statistics about quote changes
 *
 * @param quoteId - UUID of the quote
 * @returns Object with version stats
 *
 * @example
 * const stats = await getQuoteHistoryStats('550e8400-e29b-41d4-a716-446655440000')
 */
export async function getQuoteHistoryStats(
  quoteId: string
): Promise<{
  total_versions: number
  status_changes: number
  price_changes: number
  first_created: string
  last_modified: string
}> {
  try {
    const client = await createClient()

    const versions = await getQuoteHistory(quoteId, client)

    if (versions.length === 0) {
      throw new Error('No versions found for quote')
    }

    // Count status changes
    let statusChanges = 0
    let priceChanges = 0

    for (let i = 1; i < versions.length; i++) {
      const prev = versions[i - 1]
      const curr = versions[i]

      if (prev.status !== curr.status) {
        statusChanges++
      }
      if (prev.total_price !== curr.total_price) {
        priceChanges++
      }
    }

    return {
      total_versions: versions.length,
      status_changes: statusChanges,
      price_changes: priceChanges,
      first_created: versions[versions.length - 1]?.created_at || new Date().toISOString(),
      last_modified: versions[0]?.created_at || new Date().toISOString(),
    }
  } catch (error) {
    logger.error('lib/utils/quote-history', 'Error in getQuoteHistoryStats', error instanceof Error ? error : new Error(String(error)), {
      quoteId,
    })
    throw error
  }
}
