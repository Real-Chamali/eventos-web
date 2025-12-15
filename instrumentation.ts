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
    } catch (error) {
      // Silenciar errores de Sentry - usar logger interno en su lugar
      // No podemos usar logger aquí porque instrumentation.ts se ejecuta antes de que el logger esté disponible
      // Solo mostrar warning en desarrollo para evitar ruido en producción
      if (process.env.NODE_ENV === 'development') {
        // Usar console.warn es apropiado aquí ya que es el único mecanismo disponible en este punto
        console.warn('Sentry no disponible, usando logger interno', error)
      }
    }
  }
}
