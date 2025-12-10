/**
 * Audit Logging System
 * 
 * Comprehensive audit trail system for tracking all data changes.
 * - User actions are recorded automatically
 * - Before/after values are captured for comparison
 * - IP address and user agent are logged
 * - Non-blocking (failures don't affect main operations)
 */

import { createClient } from '@/utils/supabase/client'
import { logger } from '@/lib/utils/logger'

export type AuditAction = 'CREATE' | 'READ' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'EXPORT' | 'REPORT'

export interface AuditLogEntry {
  user_id: string
  action: AuditAction
  table_name: string
  old_values?: Record<string, unknown> | null
  new_values?: Record<string, unknown> | null
  ip_address?: string
  user_agent?: string
  metadata?: Record<string, unknown>
}

/**
 * Create an audit log entry
 * 
 * @param entry - Audit log data
 * @returns Promise that resolves even if logging fails
 * 
 * Example:
 * ```typescript
 * await createAuditLog({
 *   user_id: userId,
 *   action: 'UPDATE',
 *   table_name: 'quotes',
 *   old_values: { status: 'draft', total: 100 },
 *   new_values: { status: 'sent', total: 110 },
 *   ip_address: req.headers['x-forwarded-for'],
 *   user_agent: req.headers['user-agent'],
 * })
 * ```
 */
export async function createAuditLog(entry: AuditLogEntry): Promise<void> {
  try {
    const supabase = createClient()

    const { error } = await supabase.from('audit_logs').insert({
      user_id: entry.user_id,
      action: entry.action,
      table_name: entry.table_name,
      old_values: entry.old_values || null,
      new_values: entry.new_values || null,
      ip_address: entry.ip_address || null,
      user_agent: entry.user_agent || null,
      metadata: entry.metadata || {},
      created_at: new Date().toISOString(),
    })

    if (error) throw error

    logger.info('AuditLog', `${entry.action} on ${entry.table_name}`, {
      userId: entry.user_id,
      tableName: entry.table_name,
      action: entry.action,
    })
  } catch (error) {
    logger.error('AuditLog', 'Failed to create audit log', error as Error, {
      action: entry.action,
      tableName: entry.table_name,
    })
    // Silently fail - don't disrupt user operations
  }
}


/**
 * Retrieve audit logs with optional filtering
 * 
 * @param tableName - Optional: Filter by table name
 * @param userId - Optional: Filter by user ID
 * @param limit - Maximum number of records to return (default: 100)
 * @returns Array of audit log entries
 * 
 * Example:
 * ```typescript
 * // Get last 50 quote changes
 * const logs = await getAuditLogs('quotes', undefined, 50)
 * 
 * // Get user's activities
 * const userActivity = await getAuditLogs(undefined, userId)
 * 
 * // Get specific user's quote changes
 * const userQuoteChanges = await getAuditLogs('quotes', userId, 30)
 * ```
 */
export async function getAuditLogs(
  tableName?: string,
  userId?: string,
  limit = 100
): Promise<AuditLogEntry[]> {
  try {
    const supabase = createClient()
    let query = supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(Math.min(limit, 1000)) // Cap at 1000

    if (tableName) {
      query = query.eq('table_name', tableName)
    }
    if (userId) {
      query = query.eq('user_id', userId)
    }

    const { data, error } = await query

    if (error) throw error

    logger.info('AuditLog', 'Audit logs retrieved', {
      count: data?.length || 0,
      tableName,
      userId,
    })

    return (data as AuditLogEntry[]) || []
  } catch (error) {
    logger.error('AuditLog', 'Failed to retrieve audit logs', error as Error, {
      tableName,
      userId,
    })
    return []
  }
}

/**
 * Compare two objects and return changed fields
 * 
 * @param oldValues - Previous object state
 * @param newValues - New object state
 * @returns Array of changed fields with old and new values
 * 
 * Example:
 * ```typescript
 * const changes = getChangedFields(
 *   { name: 'John', email: 'john@example.com' },
 *   { name: 'Jane', email: 'jane@example.com' }
 * )
 * // Returns:
 * // [
 * //   { field: 'name', old: 'John', new: 'Jane' },
 * //   { field: 'email', old: 'john@example.com', new: 'jane@example.com' }
 * // ]
 * ```
 */
export function getChangedFields(
  oldValues: Record<string, unknown> | null,
  newValues: Record<string, unknown> | null
): { field: string; old: unknown; new: unknown }[] {
  const changes: { field: string; old: unknown; new: unknown }[] = []

  const allKeys = new Set([
    ...Object.keys(oldValues || {}),
    ...Object.keys(newValues || {}),
  ])

  for (const key of allKeys) {
    const oldValue = oldValues?.[key]
    const newValue = newValues?.[key]
    
    // Only include fields that actually changed
    if (oldValue !== newValue) {
      changes.push({
        field: key,
        old: oldValue,
        new: newValue,
      })
    }
  }

  return changes
}

/**
 * Get audit trail for a specific record
 * 
 * @param tableName - Name of the table
 * @param recordId - ID of the record
 * @param limit - Maximum number of entries (default: 50)
 * @returns Array of audit log entries for that record
 * 
 * Example:
 * ```typescript
 * const trail = await getRecordAuditTrail('quotes', quoteId, 20)
 * trail.forEach(entry => {
 *   console.log(`${entry.created_at}: ${entry.action} by ${entry.user_email}`)
 *   console.log(`Changes:`, getChangedFields(entry.old_values, entry.new_values))
 * })
 * ```
 */
export async function getRecordAuditTrail(
  tableName: string,
  recordId: string,
  limit = 50
): Promise<Record<string, unknown>[]> {
  try {
    const supabase = createClient()
    
    // Use the stored procedure if available, otherwise query directly
    const { data, error } = await supabase.rpc('get_record_audit_trail', {
      p_table_name: tableName,
      p_record_id: recordId,
      p_limit: limit,
    })

    if (error) {
      // Fallback to direct query if stored procedure doesn't exist
      const fallbackData = await supabase
        .from('audit_logs')
        .select('*')
        .eq('table_name', tableName)
        .or(`new_values->id.eq.${recordId},old_values->id.eq.${recordId}`)
        .order('created_at', { ascending: false })
        .limit(limit)

      return (fallbackData.data as Record<string, unknown>[]) || []
    }
    return (data as Record<string, unknown>[]) || []
  } catch (error) {
    logger.error('AuditLog', 'Failed to get record audit trail', error as Error, {
      tableName,
      recordId,
    })
    return []
  }
}

/**
 * Get user activity summary for a time period
 * 
 * @param userId - User ID
 * @param days - Number of days to look back (default: 7)
 * @returns Summary of user activity grouped by action and table
 * 
 * Example:
 * ```typescript
 * const activity = await getUserActivity(userId, 30)
 * activity.forEach(item => {
 *   console.log(`${item.action} on ${item.table_name}: ${item.count} times`)
 * })
 * ```
 */
export interface UserActivityItem {
  action: string
  table_name: string
  count: number
}

export async function getUserActivity(
  userId: string,
  days = 7
): Promise<UserActivityItem[]> {
  try {
    const supabase = createClient()
    
    const { data, error } = await supabase.rpc('get_user_activity', {
      p_user_id: userId,
      p_days: days,
    })

    if (error) {
      // Fallback to direct query
      const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
      const fallbackData = await supabase
        .from('audit_logs')
        .select('action, table_name')
        .eq('user_id', userId)
        .gte('created_at', cutoffDate)

      // Group the results manually
      const grouped: Record<string, { action: string; table_name: string; count: number }> = {}
      
      fallbackData.data?.forEach(entry => {
        const key = `${entry.action}:${entry.table_name}`
        if (!grouped[key]) {
          grouped[key] = {
            action: entry.action,
            table_name: entry.table_name,
            count: 0,
          }
        }
        grouped[key].count++
      })

      return Object.values(grouped)
    }

    return (data as UserActivityItem[]) || []
  } catch (error) {
    logger.error('AuditLog', 'Failed to get user activity', error as Error, {
      userId,
      days,
    })
    return []
  }
}

/**
 * Get all changes to a field across all records
 * 
 * @param tableName - Table name
 * @param fieldName - Field name to track
 * @param limit - Maximum number of entries
 * @returns Array of changes to that field
 * 
 * Example:
 * ```typescript
 * const priceChanges = await getFieldChanges('services', 'base_price', 100)
 * priceChanges.forEach(log => {
 *   console.log(`${log.action}: ${log.old_values?.base_price} → ${log.new_values?.base_price}`)
 * })
 * ```
 */
export async function getFieldChanges(
  tableName: string,
  fieldName: string,
  limit = 100
): Promise<AuditLogEntry[]> {
  try {
    const allLogs = await getAuditLogs(tableName, undefined, limit)

    // Filter logs where this field actually changed
    const changes = allLogs.filter((log) => {
      const oldValue = (log.old_values as Record<string, unknown> | undefined)?.[fieldName]
      const newValue = (log.new_values as Record<string, unknown> | undefined)?.[fieldName]
      return oldValue !== newValue
    })

    return changes
  } catch (error) {
    logger.error('AuditLog', 'Failed to get field changes', error as Error, {
      tableName,
      fieldName,
    })
    return []
  }
}

/**
 * Helper: Create audit log from form submission
 * 
 * @param userId - User ID
 * @param action - Action type
 * @param tableName - Table name
 * @param oldValues - Old record values (for UPDATE)
 * @param newValues - New record values
 * @param context - Additional context (ip, user agent, etc.)
 */
export async function auditFormAction(
  userId: string,
  action: AuditAction,
  tableName: string,
  newValues: Record<string, unknown>,
  oldValues?: Record<string, unknown> | null,
  context?: { ip?: string; userAgent?: string; metadata?: Record<string, unknown> }
): Promise<void> {
  const changes = oldValues ? getChangedFields(oldValues, newValues) : []

  await createAuditLog({
    user_id: userId,
    action,
    table_name: tableName,
    old_values: oldValues || null,
    new_values: newValues || null,
    ip_address: context?.ip,
    user_agent: context?.userAgent,
    metadata: {
      ...(context?.metadata || {}),
      changedFields: changes.map((c) => c.field),
      changeCount: changes.length,
    },
  })
}
