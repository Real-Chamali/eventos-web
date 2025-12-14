/**
 * Next.js Instrumentation Hook
 * 
 * This file is automatically loaded by Next.js before the app starts.
 * It initializes error tracking if configured.
 * 
 * Reference: https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export async function register() {
  // Solo inicializar Sentry si está configurado
  if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
    try {
      const { initSentry } = await import('./sentry.config')
      initSentry()
    } catch {
      // Silenciar errores de Sentry - usar logger interno en su lugar
      console.warn('Sentry no disponible, usando logger interno')
    }
  }
}
