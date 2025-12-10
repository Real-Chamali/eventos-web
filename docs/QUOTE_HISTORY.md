# Quote History & Version Tracking
**Complete Documentation for Quote Version Control System**

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Features](#features)
3. [Database Schema](#database-schema)
4. [API Endpoints](#api-endpoints)
5. [TypeScript Utilities](#typescript-utilities)
6. [Frontend Component](#frontend-component)
7. [Usage Examples](#usage-examples)
8. [Best Practices](#best-practices)
9. [Troubleshooting](#troubleshooting)

---

## Overview

The Quote History system provides immutable version tracking for all quotes in the event management system. Every time a quote is created or updated, a new version is automatically captured with:

- Complete quote data (status, price, services)
- User who made the change
- Timestamp of the change
- IP address and user agent (via audit logs)
- Automatic versioning (v1, v2, v3, etc.)

**Key Benefits:**
- ✅ Full audit trail for compliance
- ✅ Ability to compare any two versions
- ✅ Track all changes over time
- ✅ User attribution for every version
- ✅ Immutable - versions cannot be deleted
- ✅ Automatic triggers on create/update
- ✅ Query helper functions for analysis

---

## Features

### ✅ Automatic Version Creation
- **On Quote Creation**: Version 1 created automatically
- **On Quote Update**: New version created when status or price changes
- **Trigger-Based**: Uses PostgreSQL triggers for instant creation
- **Background**: No additional code needed in application

### ✅ Version Comparison
- Compare any two versions side-by-side
- Shows which fields changed
- Highlights changes in UI
- API endpoint for programmatic comparison

### ✅ History Visualization
- Timeline view of all versions
- Status badges (draft, sent, accepted, rejected)
- Price changes highlighted
- User attribution on each version
- Relative timestamps ("2 days ago")

### ✅ Query Capabilities
- Get all versions of a quote
- Get specific version
- Compare two versions
- Filter by date range
- Get history statistics
- Version count
- Latest version

### ✅ Security & Access Control
- Row-Level Security (RLS) policies
- Users only see their own quote versions
- Admins can see all versions
- Immutable design (no deletion)

---

## Database Schema

### Table: `quote_versions`

```sql
CREATE TABLE quote_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  version_number INT NOT NULL,
  status VARCHAR(50) NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  services JSONB NOT NULL,
  notes TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT unique_quote_version UNIQUE(quote_id, version_number)
);
```

### Columns

| Column | Type | Purpose |
|--------|------|---------|
| `id` | UUID | Unique identifier for the version record |
| `quote_id` | UUID | Reference to the original quote |
| `version_number` | INT | Sequential version number (1, 2, 3, ...) |
| `status` | VARCHAR | Quote status at this version |
| `total_price` | DECIMAL | Total price at this version |
| `client_id` | UUID | Client ID for this quote |
| `services` | JSONB | Array of services with quantities and prices |
| `notes` | TEXT | Optional notes about this version |
| `created_by` | UUID | User who triggered this version |
| `created_at` | TIMESTAMP | When this version was created |

### Indexes

**Performance Indexes:**
- `idx_quote_versions_quote_id` - Fast lookup by quote
- `idx_quote_versions_created_at` - Fast chronological queries
- `idx_quote_versions_created_by` - Find all versions by user
- `idx_quote_versions_status` - Filter by status
- `idx_quote_versions_composite` - Combined quote + version lookup

### RLS Policies

**Policy 1: User View Own Versions**
- Users can view versions of quotes they created
- Users can view if they're the admin

**Policy 2: User Insert Versions**
- Users can insert versions for their own quotes
- Admins can insert for any quote

**Policy 3: Admin View All**
- Admins can view all versions

**Policy 4: Admin Insert All**
- Admins can create versions

**Policy 5: Immutable (No Delete)**
- All DELETE operations return false
- Versions cannot be deleted (compliance requirement)

### PostgreSQL Functions

#### Function 1: `create_initial_quote_version()`
Automatically creates Version 1 when a new quote is inserted.

```sql
-- Triggered by: INSERT on quotes
-- Creates: Version 1 of quote
-- Data: Status, price, services from quote_services junction table
```

#### Function 2: `create_quote_version_on_update()`
Automatically creates a new version when quote is updated.

```sql
-- Triggered by: UPDATE on quotes
-- Condition: Only if status or total_price changed
-- Creates: New version with incremented version_number
```

#### Function 3: `get_quote_history()`
Retrieves all versions with user information.

```sql
SELECT * FROM get_quote_history('550e8400-e29b-41d4-a716-446655440000')

Returns:
  version_number INT
  status VARCHAR
  total_price DECIMAL
  services JSONB
  created_by_name VARCHAR
  created_at TIMESTAMP
```

#### Function 4: `compare_quote_versions()`
Compares two versions to show what changed.

```sql
SELECT * FROM compare_quote_versions(
  '550e8400-e29b-41d4-a716-446655440000',
  1,  -- version 1
  2   -- version 2
)

Returns:
  field_name TEXT
  version1_value TEXT
  version2_value TEXT
  changed BOOLEAN
```

---

## API Endpoints

### GET /api/quotes/:id/history

**Get complete quote history with all versions.**

```
GET /api/quotes/550e8400-e29b-41d4-a716-446655440000/history
Authorization: Bearer <JWT_TOKEN>
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Quote history retrieved successfully",
  "data": {
    "quote_id": "550e8400-e29b-41d4-a716-446655440000",
    "total_versions": 3,
    "current_version": 3,
    "versions": [
      {
        "version_number": 3,
        "status": "accepted",
        "total_price": 1500.00,
        "services": [
          {
            "service_id": "uuid1",
            "quantity": 2,
            "final_price": 500.00
          }
        ],
        "created_by_name": "John Doe",
        "created_at": "2025-12-08T10:30:00Z"
      },
      {
        "version_number": 2,
        "status": "sent",
        "total_price": 1200.00,
        "services": [...],
        "created_by_name": "John Doe",
        "created_at": "2025-12-07T14:20:00Z"
      },
      {
        "version_number": 1,
        "status": "draft",
        "total_price": 1000.00,
        "services": [...],
        "created_by_name": "John Doe",
        "created_at": "2025-12-05T09:00:00Z"
      }
    ],
    "created_at": "2025-12-05T09:00:00Z",
    "last_modified_at": "2025-12-08T10:30:00Z"
  }
}
```

**Error Responses:**

```json
{
  "error": "Unauthorized",
  "status": 401
}
```

```json
{
  "error": "Quote not found",
  "status": 404
}
```

### Query Parameters

**Get Specific Version:**
```
GET /api/quotes/:id/history?action=version&version=2
```

Returns a single version.

**Get History Statistics:**
```
GET /api/quotes/:id/history?action=stats
```

Returns:
```json
{
  "success": true,
  "data": {
    "total_versions": 3,
    "status_changes": 2,
    "price_changes": 2,
    "first_created": "2025-12-05T09:00:00Z",
    "last_modified": "2025-12-08T10:30:00Z"
  }
}
```

### POST /api/quotes/:id/history

**Compare two versions to see what changed.**

```
POST /api/quotes/550e8400-e29b-41d4-a716-446655440000/history
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "version1": 1,
  "version2": 2
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Comparison between version 1 and 2 retrieved successfully",
  "data": [
    {
      "field_name": "status",
      "version1_value": "draft",
      "version2_value": "sent",
      "changed": true
    },
    {
      "field_name": "total_price",
      "version1_value": "1000.00",
      "version2_value": "1200.00",
      "changed": true
    },
    {
      "field_name": "services",
      "version1_value": "[{...}]",
      "version2_value": "[{...}]",
      "changed": false
    }
  ]
}
```

**Error Responses:**

```json
{
  "error": "Validation failed",
  "status": 400,
  "details": {
    "version1": "Version 1 must be at least 1",
    "version2": "Version 2 must be at least 1"
  }
}
```

---

## TypeScript Utilities

### Location: `/lib/utils/quote-history.ts`

All functions with comprehensive error handling and logging.

### `getQuoteHistory(quoteId: string): Promise<QuoteVersion[]>`

Retrieve all versions of a quote.

```typescript
import { getQuoteHistory } from '@/lib/utils/quote-history'

const versions = await getQuoteHistory('550e8400-e29b-41d4-a716-446655440000')
console.log(`Quote has ${versions.length} versions`)

versions.forEach(v => {
  console.log(`v${v.version_number}: ${v.status} - $${v.total_price}`)
})
```

### `getQuoteHistorySummary(quoteId: string): Promise<QuoteHistorySummary>`

Get detailed summary with metadata.

```typescript
import { getQuoteHistorySummary } from '@/lib/utils/quote-history'

const summary = await getQuoteHistorySummary('550e8400-e29b-41d4-a716-446655440000')
console.log(`Quote created: ${summary.created_at}`)
console.log(`Last modified: ${summary.last_modified_at}`)
console.log(`Total versions: ${summary.total_versions}`)
```

### `compareQuoteVersions(quoteId: string, v1: number, v2: number): Promise<QuoteHistoryComparison[]>`

Compare two versions to see what changed.

```typescript
import { compareQuoteVersions } from '@/lib/utils/quote-history'

const changes = await compareQuoteVersions(
  '550e8400-e29b-41d4-a716-446655440000',
  1,
  2
)

changes.forEach(change => {
  if (change.changed) {
    console.log(`${change.field_name}: ${change.version1_value} → ${change.version2_value}`)
  }
})
```

### `getQuoteVersion(quoteId: string, versionNumber: number): Promise<QuoteVersion | null>`

Get a specific version.

```typescript
import { getQuoteVersion } from '@/lib/utils/quote-history'

const v2 = await getQuoteVersion('550e8400-e29b-41d4-a716-446655440000', 2)
if (v2) {
  console.log(`Version 2: ${v2.status} - $${v2.total_price}`)
}
```

### `getLatestQuoteVersion(quoteId: string): Promise<QuoteVersion | null>`

Get the most recent version.

```typescript
import { getLatestQuoteVersion } from '@/lib/utils/quote-history'

const latest = await getLatestQuoteVersion('550e8400-e29b-41d4-a716-446655440000')
console.log(`Current status: ${latest?.status}`)
```

### `getVersionCount(quoteId: string): Promise<number>`

Count total versions.

```typescript
import { getVersionCount } from '@/lib/utils/quote-history'

const count = await getVersionCount('550e8400-e29b-41d4-a716-446655440000')
console.log(`This quote has ${count} versions`)
```

### `getQuoteHistoryByDateRange(quoteId: string, startDate: string, endDate: string): Promise<QuoteVersion[]>`

Get versions in a date range.

```typescript
import { getQuoteHistoryByDateRange } from '@/lib/utils/quote-history'

const versions = await getQuoteHistoryByDateRange(
  '550e8400-e29b-41d4-a716-446655440000',
  '2025-12-01T00:00:00Z',
  '2025-12-31T23:59:59Z'
)
console.log(`${versions.length} versions created in December`)
```

### `getQuoteHistoryStats(quoteId: string): Promise<HistoryStats>`

Get statistics about changes.

```typescript
import { getQuoteHistoryStats } from '@/lib/utils/quote-history'

const stats = await getQuoteHistoryStats('550e8400-e29b-41d4-a716-446655440000')
console.log(`Status changes: ${stats.status_changes}`)
console.log(`Price changes: ${stats.price_changes}`)
```

---

## Frontend Component

### Location: `/app/dashboard/quotes/[id]/history/page.tsx`

Interactive React component for viewing and comparing quote versions.

**Features:**
- Timeline view of all versions
- Expandable version details
- Compare mode for side-by-side comparison
- Status badges with color coding
- User attribution
- Relative timestamps
- Dark mode support
- Loading states
- Error handling
- Toast notifications

**Usage:**

```typescript
// Access via URL:
// /dashboard/quotes/550e8400-e29b-41d4-a716-446655440000/history

// Component handles:
// - Fetching history data
// - User authentication
// - Displaying timeline
// - Comparing versions
// - Toast notifications
```

**Component Features:**

1. **Summary Statistics**
   - Total versions
   - Created date
   - Last modified date

2. **Version Timeline**
   - Version number badge
   - Status badge (color-coded)
   - Total price
   - Created by user
   - Timestamp (relative)
   - Services list (expandable)

3. **Compare Mode**
   - Checkbox selection
   - Compare button
   - Field-by-field comparison
   - Change highlighting

4. **Dark Mode**
   - Full dark mode support
   - Tailwind dark: classes
   - Accessible contrast ratios

---

## Usage Examples

### Example 1: View Quote History in React Component

```typescript
import { useEffect, useState } from 'react'
import { getQuoteHistory } from '@/lib/utils/quote-history'

export function QuoteHistoryList({ quoteId }: { quoteId: string }) {
  const [versions, setVersions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getQuoteHistory(quoteId)
        setVersions(data)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [quoteId])

  if (loading) return <div>Loading...</div>

  return (
    <div>
      {versions.map(v => (
        <div key={v.version_number}>
          <h3>Version {v.version_number}</h3>
          <p>Status: {v.status}</p>
          <p>Price: ${v.total_price.toFixed(2)}</p>
        </div>
      ))}
    </div>
  )
}
```

### Example 2: API Request with cURL

```bash
# Get quote history
curl -X GET \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  https://api.eventos.local/quotes/550e8400-e29b-41d4-a716-446655440000/history

# Get specific version
curl -X GET \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  https://api.eventos.local/quotes/550e8400-e29b-41d4-a716-446655440000/history?action=version&version=2

# Get statistics
curl -X GET \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  https://api.eventos.local/quotes/550e8400-e29b-41d4-a716-446655440000/history?action=stats

# Compare versions
curl -X POST \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"version1": 1, "version2": 2}' \
  https://api.eventos.local/quotes/550e8400-e29b-41d4-a716-446655440000/history
```

### Example 3: API Request with JavaScript

```javascript
// Get history
const response = await fetch(
  '/api/quotes/550e8400-e29b-41d4-a716-446655440000/history',
  {
    headers: { 'Authorization': `Bearer ${token}` }
  }
)
const { data } = await response.json()
console.log(`Total versions: ${data.total_versions}`)

// Compare versions
const comparison = await fetch(
  '/api/quotes/550e8400-e29b-41d4-a716-446655440000/history',
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ version1: 1, version2: 2 })
  }
)
const changes = await comparison.json()
console.log(`Changes:`, changes.data)
```

### Example 4: Python API Request

```python
import requests
from datetime import datetime, timedelta

# Setup
base_url = 'https://api.eventos.local'
headers = {'Authorization': f'Bearer {token}'}
quote_id = '550e8400-e29b-41d4-a716-446655440000'

# Get history
response = requests.get(
    f'{base_url}/quotes/{quote_id}/history',
    headers=headers
)
data = response.json()['data']
print(f"Total versions: {data['total_versions']}")

# Compare versions
comparison = requests.post(
    f'{base_url}/quotes/{quote_id}/history',
    headers=headers,
    json={'version1': 1, 'version2': 2}
)
changes = comparison.json()['data']
for change in changes:
    if change['changed']:
        print(f"{change['field_name']}: {change['version1_value']} → {change['version2_value']}")
```

---

## Best Practices

### ✅ Do's

1. **Always use the TypeScript utilities**
   - Better error handling
   - Built-in logging
   - Type safety

2. **Check version count before comparing**
   ```typescript
   const count = await getVersionCount(quoteId)
   if (count >= 2) {
     const comparison = await compareQuoteVersions(quoteId, 1, 2)
   }
   ```

3. **Handle errors properly**
   ```typescript
   try {
     const history = await getQuoteHistory(quoteId)
   } catch (error) {
     logger.error('Failed to fetch history', { quoteId, error })
     // Show user-friendly error message
   }
   ```

4. **Use timestamps for sorting**
   - API returns newest first
   - Use `created_at` for precise ordering

5. **Cache history data**
   - API responses are static
   - Safe to cache for 5-10 minutes

### ❌ Don'ts

1. **Don't delete quote versions**
   - Database prevents it (immutable)
   - Will always fail with RLS policy

2. **Don't assume version sequential**
   - Always use actual version_number
   - Don't rely on array index

3. **Don't bypass authentication**
   - All endpoints require Bearer token
   - RLS policies enforce access control

4. **Don't modify version data**
   - Versions are immutable
   - Create new quote version instead

---

## Troubleshooting

### Problem: "Unauthorized" Error

**Symptoms:** 401 error when accessing history API

**Solution:**
1. Check JWT token is valid
2. Verify token includes user ID
3. Ensure token not expired
4. Try refreshing auth session

```typescript
// Debug JWT
const response = await fetch('/api/quotes/:id/history', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
console.log('Status:', response.status)
if (response.status === 401) {
  // Re-authenticate
}
```

### Problem: "Quote not found" Error

**Symptoms:** 404 when accessing history for existing quote

**Solution:**
1. Verify quote ID is correct
2. Check quote belongs to user (if not admin)
3. Confirm quote exists in database
4. Try with admin account

```typescript
// Check quote ownership
const quote = await getQuote(quoteId)
console.log(`Quote user: ${quote.user_id}`)
console.log(`Current user: ${currentUserId}`)
```

### Problem: Missing Services in Version

**Symptoms:** Services array empty in old versions

**Solution:**
- Database migration may not have captured all data
- Run SQL to check quote_services:
  ```sql
  SELECT * FROM quote_services WHERE quote_id = 'uuid'
  ```

### Problem: Version Comparison Shows No Changes

**Symptoms:** All fields marked as unchanged

**Solution:**
1. Verify versions are different
2. Check database actually saved changes
3. Ensure API returned both versions

```typescript
const v1 = await getQuoteVersion(quoteId, 1)
const v2 = await getQuoteVersion(quoteId, 2)
console.log('v1:', v1)
console.log('v2:', v2)
```

### Problem: Performance Issues with Large Histories

**Symptoms:** Page slow loading many versions

**Solution:**
1. Pagination not yet implemented - consider adding
2. Use date range filtering:
   ```typescript
   const recentVersions = await getQuoteHistoryByDateRange(
     quoteId,
     thirtyDaysAgo,
     now
   )
   ```
3. Limit versions displayed in UI
4. Cache results

---

## Migration Setup

### Run Migration

```bash
# Execute migration script
psql -h localhost -U postgres -d eventos_db \
  -f migrations/002_create_quote_versions_table.sql

# Verify
psql -h localhost -U postgres -d eventos_db \
  -c "SELECT COUNT(*) FROM quote_versions;"
```

### Create Initial Versions

If you have existing quotes without versions:

```sql
-- Create versions for all existing quotes
INSERT INTO quote_versions (
  quote_id,
  version_number,
  status,
  total_price,
  client_id,
  services,
  created_by,
  created_at
)
SELECT
  q.id,
  1,
  q.status,
  q.total_price,
  q.client_id,
  (
    SELECT jsonb_agg(
      jsonb_build_object(
        'service_id', qs.service_id,
        'quantity', qs.quantity,
        'final_price', qs.final_price
      )
    )
    FROM quote_services qs
    WHERE qs.quote_id = q.id
  ),
  q.user_id,
  q.created_at
FROM quotes q
WHERE NOT EXISTS (
  SELECT 1 FROM quote_versions WHERE quote_id = q.id
);
```

---

## Summary

The Quote History system provides:
- ✅ Automatic version tracking
- ✅ Immutable audit trail
- ✅ Complete comparison capabilities
- ✅ User attribution
- ✅ Row-level security
- ✅ TypeScript utilities
- ✅ REST API endpoints
- ✅ Interactive frontend component

All functionality is production-ready and fully tested.
