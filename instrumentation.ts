/**
 * Next.js Instrumentation Hook
 * 
 * This file is automatically loaded by Next.js before the app starts.
 * It initializes error tracking if configured.
 * 
 * Reference: https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export async function register() {
  // Sentry desactivado - la aplicación usa logger interno para tracking de errores
  // Si necesitas reactivar Sentry en el futuro, descomenta el código siguiente:
  /*
  if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
    try {
      const { initSentry } = await import('./sentry.config')
      initSentry()
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('Sentry no disponible, usando logger interno', error)
      }
    }
  }
  */
}
