'use client'

/**
 * Sentry Client Initialization Component
 * 
 * This component initializes Sentry on the client side and sets up
 * user tracking after authentication.
 * 
 * Should be placed near the root of your app to catch all client-side errors.
 */

import { useEffect } from 'react'
import { initSentry, setSentryUser, clearSentryUser } from '@/sentry.config'
import { createClient } from '@/utils/supabase/client'

export function SentryProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Initialize Sentry on client startup
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
        // Silently fail - Sentry will still work even if user tracking fails
        console.debug('Failed to setup Sentry user tracking:', error)
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
  }, [])

  return <>{children}</>
}
