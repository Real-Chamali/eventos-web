# REST API Documentation

## Overview

The Events Management System provides a REST API for integrating with external applications. The API uses JWT authentication and includes rate limiting, validation, and comprehensive audit logging.

## Base URL

```
https://eventos-web.local/api/v1
```

For development:
```
http://localhost:3000/api
```

## Authentication

All API endpoints require Bearer token authentication:

```bash
Authorization: Bearer <JWT_TOKEN>
```

### Getting a Token

1. Use the login endpoint or Supabase authentication
2. Extract the JWT token from the response
3. Include it in all API requests

Example:
```bash
curl -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  https://eventos-web.local/api/quotes
```

## Rate Limiting

API requests are rate-limited per user:

| Endpoint | Limit | Window |
|----------|-------|--------|
| GET /api/quotes | 100 | 1 minute |
| POST /api/quotes | 20 | 1 minute |
| GET /api/services | 100 | 1 minute |
| POST /api/services | 10 | 1 minute |
| GET /api/finance | 30 | 1 minute |

When limit exceeded: `429 Too Many Requests`

## Error Handling

All errors follow a consistent format:

```json
{
  "error": "Error message",
  "details": {
    "field": "error details"
  }
}
```

### Common Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized (missing/invalid token) |
| 403 | Forbidden (insufficient permissions) |
| 405 | Method Not Allowed |
| 429 | Too Many Requests (rate limited) |
| 500 | Server Error |

## Endpoints

### Quotes

#### GET /api/quotes

Retrieve all quotes (filtered by user unless admin).

**Authentication**: Required  
**Authorization**: User sees own quotes, admin sees all  
**Rate Limit**: 100 requests/minute  

**Request**:
```bash
curl -H "Authorization: Bearer TOKEN" \
  https://eventos-web.local/api/quotes
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Quotes retrieved successfully",
  "data": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "client_id": "uuid",
      "status": "draft",
      "total_price": 1500.00,
      "created_at": "2025-12-08T10:00:00Z"
    }
  ]
}
```

#### POST /api/quotes

Create a new quote.

**Authentication**: Required  
**Authorization**: Any authenticated user  
**Rate Limit**: 20 requests/minute  

**Request**:
```bash
curl -X POST \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "client_id": "uuid",
    "services": [
      {
        "service_id": "uuid",
        "quantity": 2,
        "final_price": 500
      }
    ],
    "total_price": 1000
  }' \
  https://eventos-web.local/api/quotes
```

**Validation**:
- `client_id`: Required, valid UUID
- `services`: Array of services (required)
  - `service_id`: Required, UUID
  - `quantity`: Required, positive number
  - `final_price`: Required, positive number
- `total_price`: Required, positive number

**Response** (201 Created):
```json
{
  "success": true,
  "message": "Quote created successfully",
  "data": {
    "id": "new-uuid",
    "user_id": "uuid",
    "client_id": "uuid",
    "status": "draft",
    "total_price": 1000,
    "created_at": "2025-12-08T10:00:00Z"
  }
}
```

**Error** (400 Bad Request):
```json
{
  "error": "Validation failed",
  "details": {
    "client_id": "Client ID is required",
    "total_price": "Total price must be positive"
  }
}
```

### Services

#### GET /api/services

Retrieve all services.

**Authentication**: Required  
**Authorization**: Any authenticated user  
**Rate Limit**: 100 requests/minute  

**Request**:
```bash
curl -H "Authorization: Bearer TOKEN" \
  https://eventos-web.local/api/services
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Services retrieved successfully",
  "data": [
    {
      "id": "uuid",
      "name": "Setup Inicial",
      "base_price": 500,
      "cost_price": 200,
      "created_at": "2025-12-01T00:00:00Z"
    },
    {
      "id": "uuid",
      "name": "Configuración Avanzada",
      "base_price": 1000,
      "cost_price": 400,
      "created_at": "2025-12-02T00:00:00Z"
    }
  ]
}
```

#### POST /api/services

Create a new service (admin only).

**Authentication**: Required  
**Authorization**: Admin only  
**Rate Limit**: 10 requests/minute  

**Request**:
```bash
curl -X POST \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "New Service",
    "base_price": 750,
    "cost_price": 300
  }' \
  https://eventos-web.local/api/services
```

**Validation**:
- `name`: Required, 1-100 characters
- `base_price`: Required, positive number
- `cost_price`: Required, non-negative number

**Response** (201 Created):
```json
{
  "success": true,
  "message": "Service created successfully",
  "data": {
    "id": "new-uuid",
    "name": "New Service",
    "base_price": 750,
    "cost_price": 300,
    "created_at": "2025-12-08T10:00:00Z"
  }
}
```

**Error** (403 Forbidden):
```json
{
  "error": "Forbidden - Admin access required"
}
```

### Finance

#### GET /api/finance

Retrieve finance entries (admin only).

**Authentication**: Required  
**Authorization**: Admin only  
**Rate Limit**: 30 requests/minute  

**Query Parameters**:
- `start_date`: (optional) Filter from date (ISO 8601)
- `end_date`: (optional) Filter to date (ISO 8601)
- `type`: (optional) Filter by type (income/expense)

**Request**:
```bash
curl -H "Authorization: Bearer TOKEN" \
  "https://eventos-web.local/api/finance?start_date=2025-12-01&type=income"
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Finance data retrieved successfully",
  "data": {
    "entries": [
      {
        "id": "uuid",
        "description": "Quote invoice",
        "amount": 1500,
        "type": "income",
        "date": "2025-12-08",
        "created_at": "2025-12-08T10:00:00Z"
      }
    ],
    "summary": {
      "total_entries": 10,
      "total_income": 15000,
      "total_expense": 5000
    }
  }
}
```

## Usage Examples

### JavaScript/TypeScript

```typescript
// Using fetch
const token = 'your-jwt-token'

// Get quotes
const quotes = await fetch('https://eventos-web.local/api/quotes', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
}).then(r => r.json())

// Create quote
const newQuote = await fetch('https://eventos-web.local/api/quotes', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    client_id: 'client-uuid',
    services: [
      { service_id: 'service-uuid', quantity: 1, final_price: 1000 }
    ],
    total_price: 1000
  })
}).then(r => r.json())
```

### cURL

```bash
# Set token
TOKEN="your-jwt-token"

# Get quotes
curl -H "Authorization: Bearer $TOKEN" \
  https://eventos-web.local/api/quotes

# Create quote
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{...}' \
  https://eventos-web.local/api/quotes

# Get finance with filters
curl -H "Authorization: Bearer $TOKEN" \
  "https://eventos-web.local/api/finance?start_date=2025-12-01&end_date=2025-12-31"
```

### Python

```python
import requests

token = 'your-jwt-token'
headers = {'Authorization': f'Bearer {token}'}

# Get quotes
response = requests.get(
  'https://eventos-web.local/api/quotes',
  headers=headers
)
quotes = response.json()['data']

# Create quote
response = requests.post(
  'https://eventos-web.local/api/quotes',
  headers={**headers, 'Content-Type': 'application/json'},
  json={
    'client_id': 'client-uuid',
    'services': [...],
    'total_price': 1000
  }
)
new_quote = response.json()['data']
```

## CORS

CORS is enabled for the API domain:

```
Access-Control-Allow-Origin: https://eventos-web.local
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
```

## Audit Logging

All API actions are automatically logged to the audit_logs table:
- User ID
- Action (READ, CREATE, UPDATE, DELETE)
- Table name
- IP address
- User agent
- Timestamp

Audit logs can be retrieved via the audit system.

## Webhook Support (Future)

The API is designed to support webhooks in the future:
- Quote status changes
- Service updates
- Finance entries

## Best Practices

1. **Always use HTTPS** in production
2. **Keep tokens secure** - never expose in frontend code
3. **Handle rate limits** - implement exponential backoff
4. **Validate responses** - Always check the success field
5. **Use try/catch** for error handling
6. **Log API calls** for debugging
7. **Cache responses** when appropriate
8. **Compress requests** for large payloads

## Troubleshooting

### 401 Unauthorized
- Check token is included in Authorization header
- Verify token hasn't expired
- Ensure token format is: `Bearer TOKEN`

### 403 Forbidden
- Verify admin role for admin-only endpoints
- Check user permissions

### 429 Too Many Requests
- Wait before making new requests
- Implement exponential backoff
- Consider batch operations

### 400 Bad Request
- Validate request body format
- Check all required fields are present
- Verify data types match schema

## Rate Limiting Strategy

For handling rate limits in your client:

```typescript
async function apiCall(url: string, options: RequestInit = {}) {
  const maxRetries = 3
  let retries = 0
  
  while (retries < maxRetries) {
    const response = await fetch(url, options)
    
    if (response.status === 429) {
      const waitTime = Math.pow(2, retries) * 1000 // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, waitTime))
      retries++
      continue
    }
    
    return response
  }
  
  throw new Error('Max retries exceeded')
}
```

## Support

For API issues:
1. Check this documentation
2. Review error message details
3. Check audit logs in Supabase
4. Check Sentry for backend errors
5. Contact support with error details

## Version History

### v1 (Current)
- Initial API release
- Quotes, Services, Finance endpoints
- JWT authentication
- Rate limiting
- Audit logging
