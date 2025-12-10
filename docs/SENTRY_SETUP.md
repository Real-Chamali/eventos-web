# Sentry Integration Setup Guide

## Overview

Sentry is integrated into the Events Management System for production-grade error tracking and performance monitoring.

## What is Sentry?

Sentry is an error tracking platform that:
- **Captures unhandled exceptions** automatically
- **Monitors performance** with transaction tracing
- **Tracks user sessions** and interactions (opt-in)
- **Provides alerts** when errors occur
- **Groups similar errors** for easier debugging
- **Integrates with your workflow** (Slack, PagerDuty, etc.)

## Configuration

### 1. Get a Sentry Account and DSN

1. Sign up at [sentry.io](https://sentry.io)
2. Create a new project (select "Next.js" as the platform)
3. Copy the **DSN** (Data Source Name)
4. (Optional) Get authentication token for source map uploads

### 2. Set Environment Variables

Create or update `.env.local` with:

```bash
# Required - Copy from Sentry project settings
NEXT_PUBLIC_SENTRY_DSN=https://your-key@sentry.io/your-project-id

# Optional - For source map uploads in CI/CD
SENTRY_ORG=your-organization-slug
SENTRY_PROJECT=your-project-slug
SENTRY_AUTH_TOKEN=your-auth-token

# Application version for release tracking
NEXT_PUBLIC_APP_VERSION=1.0.0
```

### 3. Test the Integration

In development, test Sentry with this code:

```typescript
import { reportErrorToSentry } from '@/sentry.config'

// Test error tracking
const testError = new Error('Test Sentry integration')
reportErrorToSentry(testError, 'TestComponent', { timestamp: new Date() })
```

Check [sentry.io](https://sentry.io) to see the error appear in your project.

## How It Works

### Server-Side Error Tracking
- **Initialization**: `instrumentation.ts` initializes Sentry on server startup
- **Captured automatically**: Unhandled promise rejections, server errors
- **Configuration**: `sentry.config.ts` contains all settings

### Client-Side Error Tracking
- **Initialization**: `<SentryProvider>` in root layout initializes on client
- **Captured automatically**: JavaScript errors, API failures, console errors
- **User tracking**: Authenticated user info is automatically attached

### Integration Points

1. **ErrorBoundary Component**: Already integrated in root layout
2. **Logger Integration**: `logger.error()` calls can be extended to report to Sentry
3. **API Routes**: Errors in API handlers are captured
4. **Form Submissions**: Zod validation errors can be tracked

## Features

### Automatic Error Capture
```typescript
// These are captured automatically:
throw new Error('Something went wrong')  // Client & Server
await fetch('...')  // Network failures
JSON.parse(invalidJson)  // Parsing errors
```

### Manual Error Reporting
```typescript
import { reportErrorToSentry } from '@/sentry.config'

reportErrorToSentry(
  error,
  'MyComponent',  // context
  { userId: user.id }  // additional data
)
```

### User Context Tracking
```typescript
import { setSentryUser, clearSentryUser } from '@/sentry.config'

// After login
setSentryUser(user.id, user.email, user.name)

// On logout
clearSentryUser()
```

### Custom Context
```typescript
import { addSentryContext } from '@/sentry.config'

addSentryContext('order', {
  orderId: order.id,
  amount: order.total,
  items: order.items.length
})
```

## Configuration Details

### Sample Rates

By environment:
- **Development**: 100% of transactions (every request traced)
- **Production**: 10% of transactions (1 in 10 requests traced)

This balances performance with monitoring.

### Performance Monitoring

Sentry automatically tracks:
- Page load times
- API request latencies
- Database query times
- React component render times

View in Sentry's "Performance" tab.

### Session Replay (Production Only)

Automatically records:
- User interactions
- Network activity
- Console messages
- Errors and crashes

**Privacy**: Text inputs, passwords, and media are masked.

Sample rate: 10% in production to minimize overhead.

## Disabling Sentry

If `NEXT_PUBLIC_SENTRY_DSN` is not set:
- Sentry is completely disabled
- No error tracking occurs
- Zero performance impact

This is useful for:
- Local development
- Non-production environments
- Testing

## Troubleshooting

### Sentry shows "Not Configured"

**Solution**: Ensure `NEXT_PUBLIC_SENTRY_DSN` is set in `.env.local`

```bash
# Check your .env.local
cat .env.local | grep SENTRY_DSN
```

### Errors not appearing in Sentry

**Possible causes**:
1. DSN not configured → Set `NEXT_PUBLIC_SENTRY_DSN`
2. Error filtered out → Check `beforeSend` in `sentry.config.ts`
3. Domain not allowed → Add to `allowUrls` in config
4. Development mode → Some errors filtered in development

### Source maps not uploading

**Solution**: Ensure Sentry auth token is set for CI/CD

```bash
export SENTRY_AUTH_TOKEN=your_token
npm run build
```

## Best Practices

1. **Use user context** to identify affected users
2. **Add custom context** for business logic understanding
3. **Monitor release health** using version tags
4. **Set up alerts** for critical errors
5. **Review error patterns** weekly for improvements
6. **Keep dependencies updated** for security fixes

## Integration with Logger

The centralized logger in `lib/utils/logger.ts` can be extended to report critical errors to Sentry:

```typescript
// In logger.ts
export function error(context: string, message: string, error?: Error, data?: any) {
  // ... existing logging

  // Report critical errors to Sentry
  if (error) {
    reportErrorToSentry(error, context, data)
  }
}
```

## Environment Variables Reference

| Variable | Required | Purpose |
|----------|----------|---------|
| `NEXT_PUBLIC_SENTRY_DSN` | No | Enable error tracking |
| `SENTRY_ORG` | No* | Source map uploads |
| `SENTRY_PROJECT` | No* | Source map uploads |
| `SENTRY_AUTH_TOKEN` | No* | Source map uploads |
| `NEXT_PUBLIC_APP_VERSION` | No | Release tracking |

*Only required if uploading source maps in CI/CD pipeline

## Resources

- [Sentry Next.js Documentation](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Sentry Dashboard](https://sentry.io)
- [@sentry/nextjs Documentation](https://docs.sentry.io/platforms/javascript/guides/nextjs/)

## Support

For issues with Sentry integration:
1. Check the troubleshooting section above
2. Review Sentry's official documentation
3. Check your Sentry project's settings
4. Verify all environment variables are set correctly
