import * as Sentry from '@sentry/nextjs'

/**
 * Initialize Sentry for error tracking and monitoring
 * 
 * Configuration:
 * - DSN: NEXT_PUBLIC_SENTRY_DSN (from environment)
 * - Environment: NODE_ENV (development, staging, production)
 * - Sample Rate: 1.0 (100% of transactions in development, 0.1 in production)
 * - Tracing: Enabled for performance monitoring
 * - Debug: Enabled in development for troubleshooting
 */

const ENVIRONMENT = process.env.NODE_ENV || 'development'
const IS_PRODUCTION = ENVIRONMENT === 'production'

// Transaction sample rate varies by environment
const TRANSACTION_SAMPLE_RATE = IS_PRODUCTION ? 0.1 : 1.0

export function initSentry() {
  const sentryDSN = process.env.NEXT_PUBLIC_SENTRY_DSN

  // Only initialize Sentry if DSN is provided
  if (!sentryDSN) {
    if (!IS_PRODUCTION) {
      console.warn(
        '[Sentry] NEXT_PUBLIC_SENTRY_DSN not configured. Error tracking disabled.'
      )
    }
    return
  }

  Sentry.init({
    dsn: sentryDSN,
    environment: ENVIRONMENT,
    
    // Performance Monitoring
    tracesSampleRate: TRANSACTION_SAMPLE_RATE,
    profilesSampleRate: IS_PRODUCTION ? 0.1 : 1.0,
    
    // Debug mode in development
    debug: !IS_PRODUCTION,
    
    // Automatically capture unhandled promise rejections
    attachStacktrace: true,
    
    // Capture breadcrumbs for better context
    maxBreadcrumbs: 50,
    
    // Release tracking
    release: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
    
    // Integrations
    integrations: [
      // Automatic error capture for unhandled exceptions
      Sentry.captureConsoleIntegration({
        levels: ['error', 'warn'],
      }),
    ],

    // Before sending to Sentry
    beforeSend(event, hint) {
      // Filter out known non-critical errors
      const error = hint?.originalException

      // Ignore network errors in development
      if (!IS_PRODUCTION && error instanceof TypeError && (error as Error).message.includes('fetch')) {
        return null
      }

      return event
    },

    // Configure which URLs to include/exclude
    allowUrls: [
      /https?:\/\/(?:www\.)?eventos-web\.local/,
      /https?:\/\/(?:www\.)?[^/]+\.vercel\.app/,
    ],
    
    denyUrls: [
      // Browser extensions
      /extensions\//i,
      /^chrome:\/\//i,
      // Third-party scripts
      /graph\.instagram\.com/i,
      /connect\.facebook\.net/i,
    ],
  })
}

/**
 * Set Sentry user context for error tracking
 * Call this after user authentication
 */
export function setSentryUser(userId: string, email?: string, username?: string) {
  Sentry.setUser({
    id: userId,
    email,
    username,
  })
}

/**
 * Clear Sentry user context on logout
 */
export function clearSentryUser() {
  Sentry.setUser(null)
}

/**
 * Add custom context to Sentry for debugging
 */
export function addSentryContext(name: string, data: Record<string, unknown>) {
  Sentry.setContext(name, data)
}

/**
 * Manually capture exception to Sentry
 */
export function reportErrorToSentry(error: Error, context?: string, additionalData?: Record<string, unknown>) {
  Sentry.captureException(error, {
    tags: { context },
    extra: additionalData,
  })
}
