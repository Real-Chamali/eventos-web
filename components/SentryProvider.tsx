'use client'

/**
 * Error Tracking Provider
 * 
 * Inicializa error tracking (Sentry si está configurado, o logger interno)
 * y configura tracking de usuario autenticado.
 * 
 * Si NEXT_PUBLIC_SENTRY_DSN no está configurado, solo usa el logger interno.
 */

import { useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { logger } from '@/lib/utils/logger'

export function SentryProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Declarar subscription en el scope del useEffect para que esté disponible en el cleanup
    let subscription: { unsubscribe: () => void } | null = null
    
    // Solo inicializar Sentry si está configurado
    if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
      const initializeSentry = async () => {
        try {
          // Dynamic import para evitar errores si Sentry no está disponible
          // Usar try-catch para manejar bloqueos de ad blockers silenciosamente
          let sentryModule
          try {
            sentryModule = await import('@/sentry.config')
          } catch (importError) {
            // Si el import falla (por ejemplo, bloqueado por ad blocker), usar logger interno
            const errorMessage = importError instanceof Error ? importError.message : String(importError)
            if (errorMessage.includes('ERR_BLOCKED_BY_CLIENT') || errorMessage.includes('net::ERR_BLOCKED_BY_CLIENT')) {
              // Silenciar errores de bloqueo - es esperado con ad blockers
              return
            }
            throw importError
          }
          
          const { initSentry, setSentryUser, clearSentryUser } = sentryModule
          
          try {
            initSentry()
          } catch (initError) {
            // Si la inicialización falla (por ejemplo, bloqueado), usar logger interno
            const errorMessage = initError instanceof Error ? initError.message : String(initError)
            if (errorMessage.includes('ERR_BLOCKED_BY_CLIENT') || errorMessage.includes('net::ERR_BLOCKED_BY_CLIENT')) {
              // Silenciar errores de bloqueo - es esperado con ad blockers
              return
            }
            throw initError
          }

          // Track authenticated user in Sentry
          const supabase = createClient()
          
          const setupUserTracking = async () => {
            try {
              const { data: { user } } = await supabase.auth.getUser()
              
              if (user) {
                setSentryUser(user.id, user.email, user.user_metadata?.name)
              } else {
                clearSentryUser()
              }
            } catch (error) {
              logger.warn('SentryProvider', 'Failed to setup user tracking', { error })
            }
          }

          await setupUserTracking()

          // Subscribe to auth changes
          const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_IN' && session?.user) {
              setSentryUser(session.user.id, session.user.email, session.user.user_metadata?.name)
            } else if (event === 'SIGNED_OUT') {
              clearSentryUser()
            }
          })
          
          subscription = authSubscription
        } catch (error) {
          // Silenciar errores de Sentry bloqueado por ad blockers
          const errorMessage = error instanceof Error ? error.message : String(error)
          if (!errorMessage.includes('ERR_BLOCKED_BY_CLIENT') && !errorMessage.includes('net::ERR_BLOCKED_BY_CLIENT')) {
            // Solo loguear errores que no sean de bloqueo
            logger.warn('SentryProvider', 'Sentry no disponible, usando logger interno', { error })
          }
        }
      }
      
      void initializeSentry()
    } else {
      // Sin Sentry configurado - solo usar logger interno
      logger.info('SentryProvider', 'Sentry no configurado, usando logger interno')
    }
    
    // Cleanup function siempre retornada, independientemente de si Sentry está configurado
    return () => {
      subscription?.unsubscribe()
    }
  }, [])

  return <>{children}</>
}

