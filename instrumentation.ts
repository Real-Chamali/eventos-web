/**
 * Next.js Instrumentation Hook
 * 
 * This file is automatically loaded by Next.js before the app starts.
 * It initializes Sentry for both client and server-side error tracking.
 * 
 * Reference: https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

import { initSentry } from './sentry.config'

export async function register() {
  // Initialize Sentry on server startup
  initSentry()
}
