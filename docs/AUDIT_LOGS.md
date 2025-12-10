# Audit Logs System Documentation

## Overview

The Audit Logs system provides comprehensive tracking of all data changes in the Events Management System. Every create, update, and delete operation is recorded with user context, timestamps, and before/after values.

## Database Schema

### audit_logs Table

The `audit_logs` table is immutable and stores complete audit trails:

```sql
CREATE TABLE audit_logs (
  id uuid PRIMARY KEY,              -- Unique identifier
  user_id uuid NOT NULL,            -- Who made the change
  action VARCHAR(50) NOT NULL,      -- CREATE, UPDATE, DELETE, etc.
  table_name VARCHAR(100) NOT NULL, -- Which table was modified
  old_values JSONB,                 -- Previous values (for updates)
  new_values JSONB,                 -- New values
  ip_address INET,                  -- Client IP address
  user_agent TEXT,                  -- Browser/client info
  created_at TIMESTAMP,             -- When it happened
  metadata JSONB                    -- Additional data
);
```

### Indexes

Several indexes optimize common queries:
- `idx_audit_logs_user_id` - Find by user
- `idx_audit_logs_table_name` - Find by table
- `idx_audit_logs_created_at` - Find by timestamp
- `idx_audit_logs_user_time` - Combined user + time queries
- `idx_audit_logs_table_time` - Combined table + time queries

### Row Level Security (RLS)

Policies enforce:
- **Admins** can view all audit logs
- **Users** can only view their own audit logs
- **No one** can delete audit logs (immutable)

## Setup Instructions

### 1. Create the Table in Supabase

1. Open your Supabase project dashboard
2. Go to **SQL Editor**
3. Create a new query
4. Copy the entire contents of `migrations/001_create_audit_logs_table.sql`
5. Execute the query

Expected output:
```
Query executed successfully
8 rows affected
```

### 2. Verify Installation

In your Supabase dashboard, verify:
- [ ] Table `audit_logs` exists
- [ ] 6 indexes are created
- [ ] RLS is enabled
- [ ] 4 RLS policies are active

## Usage

### Creating Audit Logs

```typescript
import { createAuditLog } from '@/lib/utils/audit'

// Basic usage
await createAuditLog({
  user_id: userId,
  action: 'UPDATE',
  table_name: 'quotes',
  old_values: { status: 'draft' },
  new_values: { status: 'sent' },
})

// With context
await createAuditLog({
  user_id: userId,
  action: 'CREATE',
  table_name: 'quotes',
  new_values: quoteData,
  ip_address: req.headers['x-forwarded-for'],
  user_agent: req.headers['user-agent'],
  metadata: {
    source: 'api',
    version: '1.0.0',
  },
})
```

### Action Types

Valid action values:
- `CREATE` - New record created
- `READ` - Record accessed
- `UPDATE` - Record modified
- `DELETE` - Record deleted
- `LOGIN` - User signed in
- `LOGOUT` - User signed out
- `EXPORT` - Data exported
- `REPORT` - Report generated

### Retrieving Audit Logs

```typescript
import { getAuditLogs, getRecordAuditTrail, getUserActivity } from '@/lib/utils/audit'

// Get all logs for a table
const logs = await getAuditLogs('quotes')

// Filter by user
const userLogs = await getAuditLogs('quotes', userId)

// Get full history of a specific record
const trail = await getRecordAuditTrail('quotes', quoteId)

// Get user activity summary
const activity = await getUserActivity(userId, 30) // Last 30 days
```

### Comparing Changes

```typescript
import { getChangedFields } from '@/lib/utils/audit'

const changes = getChangedFields(
  { name: 'Old Name', price: 100 },
  { name: 'New Name', price: 150 }
)

// Returns:
// [
//   { field: 'name', old: 'Old Name', new: 'New Name' },
//   { field: 'price', old: 100, new: 150 }
// ]
```

### Tracking Field Changes

```typescript
import { getFieldChanges } from '@/lib/utils/audit'

// Track all price changes across all services
const priceChanges = await getFieldChanges('services', 'base_price')

priceChanges.forEach(log => {
  console.log(
    `${log.created_at}: ${log.old_values?.base_price} → ${log.new_values?.base_price}`
  )
})
```

## Integration Patterns

### Pattern 1: Manual Form Submissions

```typescript
'use server'

import { updateQuote } from '@/lib/db'
import { createAuditLog, getChangedFields } from '@/lib/utils/audit'
import { auth } from '@/auth'

export async function updateQuoteAction(quoteId: string, newData: any) {
  const session = await auth()
  
  // Get current values
  const currentQuote = await getQuote(quoteId)
  
  // Update in database
  const updated = await updateQuote(quoteId, newData)
  
  // Log the change
  await createAuditLog({
    user_id: session.user.id,
    action: 'UPDATE',
    table_name: 'quotes',
    old_values: currentQuote,
    new_values: updated,
  })
  
  return updated
}
```

### Pattern 2: With Sentry Integration

```typescript
import { createAuditLog } from '@/lib/utils/audit'
import { reportErrorToSentry } from '@/sentry.config'

export async function deleteQuoteAction(quoteId: string) {
  try {
    const quote = await getQuote(quoteId)
    await deleteQuote(quoteId)
    
    // Log deletion
    await createAuditLog({
      user_id: userId,
      action: 'DELETE',
      table_name: 'quotes',
      old_values: quote,
    })
  } catch (error) {
    // Report to Sentry and log
    reportErrorToSentry(error as Error, 'DeleteQuote')
  }
}
```

### Pattern 3: Database Triggers (Advanced)

For automatic audit logging on Supabase, create triggers:

```sql
CREATE OR REPLACE FUNCTION audit_log_trigger()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_logs (
    user_id,
    action,
    table_name,
    old_values,
    new_values,
    created_at
  ) VALUES (
    auth.uid(),
    UPPER(TG_OP),
    TG_TABLE_NAME,
    CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END,
    NOW()
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach to tables
CREATE TRIGGER quotes_audit AFTER INSERT OR UPDATE OR DELETE ON quotes
FOR EACH ROW EXECUTE FUNCTION audit_log_trigger();
```

## Querying Examples

### View Recent Changes

```typescript
// Get last 50 quote changes
const recentChanges = await getAuditLogs('quotes', undefined, 50)

recentChanges.forEach(log => {
  console.log(`${log.created_at}: ${log.action} by ${log.user_id}`)
})
```

### Audit Trail for Compliance

```typescript
// Get full history of a specific quote for compliance
const trail = await getRecordAuditTrail('quotes', quoteId, 1000)

const report = trail.map(entry => ({
  timestamp: entry.created_at,
  user: entry.user_email,
  action: entry.action,
  changes: getChangedFields(entry.old_values, entry.new_values),
}))
```

### User Activity Report

```typescript
// Generate activity report for a user
const activity = await getUserActivity(userId, 30)

const summary = activity.reduce((acc, item) => {
  return `${acc}\n${item.action} on ${item.table_name}: ${item.count} times (last: ${item.last_activity})`
}, 'User Activity Report:')
```

### Track Specific Field

```typescript
// Monitor who changed prices and when
const priceHistory = await getFieldChanges('services', 'base_price', 200)

const analysis = priceHistory
  .map(log => ({
    service_id: log.new_values?.id || log.old_values?.id,
    old_price: log.old_values?.base_price,
    new_price: log.new_values?.base_price,
    changed_by: log.user_email,
    when: log.created_at,
  }))
  .sort((a, b) => new Date(b.when).getTime() - new Date(a.when).getTime())
```

## Performance Considerations

### Index Usage

The system automatically uses indexes for:
- Filtering by `user_id` - Fast user audit trails
- Filtering by `table_name` - Fast table change history
- Ordering by `created_at` - Fast time-range queries
- Composite queries - Multi-column filtering

### Query Limits

- Default limit: 100 records
- Maximum limit: 1,000 records
- Queries are paginated to prevent timeouts

### Storage

Estimate:
- ~500 bytes per audit log entry
- 100 changes/day = 50 KB/day
- 1 year ≈ 18 MB

### Retention Policy

Current: **Unlimited** (immutable, no deletion)

Consider adding a retention policy:
```sql
-- Optional: Archive logs older than 2 years
DELETE FROM audit_logs 
WHERE created_at < NOW() - INTERVAL '2 years'
  AND action NOT IN ('DELETE');
```

## Security

### RLS Policies

1. **Admin View Policy**: Admins see all logs
2. **User View Policy**: Users only see their own logs
3. **Create Policy**: Any authenticated user can create logs
4. **No Delete**: Audit logs are immutable (no delete policy)

### IP Address Privacy

Consider sanitizing IP addresses in GDPR compliance:
```typescript
function sanitizeIP(ip: string): string {
  const parts = ip.split('.')
  return `${parts[0]}.${parts[1]}.*.* `
}
```

### User Consent

Include in privacy policy:
- We collect audit logs for security and compliance
- Logs contain user ID, timestamp, and changed data
- Only admins can view audit logs
- Logs are retained indefinitely
- Users can request their audit trail

## Troubleshooting

### "relation 'audit_logs' does not exist"

**Problem**: Table hasn't been created yet.

**Solution**: 
1. Run the migration SQL from `migrations/001_create_audit_logs_table.sql`
2. Verify table exists in Supabase dashboard

### "No rows matched the update"

**Problem**: User doesn't have permission to view logs (RLS policy).

**Solution**:
1. User should be admin OR looking at their own logs
2. Check RLS policies are correctly set

### Slow Queries

**Problem**: Queries timing out.

**Solution**:
1. Use indexed columns: `user_id`, `table_name`, `created_at`
2. Reduce query limit
3. Use time range filtering

### Missing Logs

**Problem**: Some changes aren't logged.

**Solution**:
1. Check `createAuditLog()` calls are in correct places
2. Verify permissions (must be authenticated)
3. Check Sentry for error logs

## Best Practices

1. **Always log with user context**
   ```typescript
   // ✅ Good
   await createAuditLog({
     user_id: userId,
     action: 'UPDATE',
     table_name: 'quotes',
     ...
   })
   
   // ❌ Bad - Missing user
   await createAuditLog({
     action: 'UPDATE',
     table_name: 'quotes',
     ...
   })
   ```

2. **Include before/after values**
   ```typescript
   // ✅ Good - Can see what changed
   await createAuditLog({
     old_values: previousQuote,
     new_values: updatedQuote,
     ...
   })
   
   // ❌ Bad - No context
   await createAuditLog({
     new_values: updatedQuote,
     ...
   })
   ```

3. **Use appropriate action types**
   - CREATE for inserts
   - UPDATE for modifications
   - DELETE for removals

4. **Add metadata for context**
   ```typescript
   metadata: {
     source: 'mobile-app',
     version: '2.1.0',
     request_id: '12345',
   }
   ```

5. **Non-blocking failure handling**
   ```typescript
   // Audit logs should never break user operations
   try {
     await createAuditLog(...)
   } catch (error) {
     logger.error('audit', 'Logging failed', error)
     // Continue - don't throw
   }
   ```

## Related Documentation

- [Security Setup](./SECURITY.md)
- [Sentry Integration](./SENTRY_SETUP.md)
- [Database Schema](../README.md#database)
- [API Documentation](./API.md)
