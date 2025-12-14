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
    // Solo inicializar Sentry si está configurado
    if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
      try {
        const { initSentry, setSentryUser, clearSentryUser } = require('@/sentry.config')
        initSentry()

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

        setupUserTracking()

        // Subscribe to auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
          if (event === 'SIGNED_IN' && session?.user) {
            setSentryUser(session.user.id, session.user.email, session.user.user_metadata?.name)
          } else if (event === 'SIGNED_OUT') {
            clearSentryUser()
          }
        })

        return () => {
          subscription?.unsubscribe()
        }
      } catch (error) {
        // Si Sentry falla, usar solo logger interno
        logger.warn('SentryProvider', 'Sentry no disponible, usando logger interno', { error })
      }
    } else {
      // Sin Sentry configurado - solo usar logger interno
      logger.info('SentryProvider', 'Sentry no configurado, usando logger interno')
    }
  }, [])

  return <>{children}</>
}
