'use client'

import { useEffect } from 'react'
import { logger } from '@/lib/utils/logger'

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return
    }

    // Registrar Service Worker
    const registerSW = async () => {
      try {
        // Usar ruta API para evitar problemas de redirect
        const swUrl = '/sw.js'
        const registration = await navigator.serviceWorker.register(swUrl, {
          scope: '/',
        })

        logger.info('PWA', 'Service Worker registrado', {
          scope: registration.scope,
          updateViaCache: registration.updateViaCache,
        })

        // Verificar actualizaciones periódicamente
        setInterval(() => {
          registration.update()
        }, 60 * 60 * 1000) // Cada hora

        // Escuchar actualizaciones del Service Worker
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing
          if (!newWorker) return

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // Nueva versión disponible
              logger.info('PWA', 'Nueva versión del Service Worker disponible')
              
              // Notificar al usuario (opcional)
              if ('Notification' in window && Notification.permission === 'granted') {
                new Notification('Nueva versión disponible', {
                  body: 'Hay una actualización disponible. Recarga la página para obtenerla.',
                  icon: '/icon-192.png',
                  tag: 'sw-update',
                })
              }
            }
          })
        })

        // Escuchar mensajes del Service Worker
        navigator.serviceWorker.addEventListener('message', (event) => {
          if (event.data?.type === 'SW_UPDATED') {
            logger.info('PWA', 'Service Worker actualizado', {
              version: event.data.version,
            })
          }
        })

        // Manejar cambios de estado del Service Worker
        let refreshing = false
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          if (refreshing) return
          refreshing = true
          logger.info('PWA', 'Nuevo Service Worker activo, recargando página...')
          window.location.reload()
        })
      } catch (error) {
        logger.error('PWA', 'Error registrando Service Worker', error instanceof Error ? error : new Error(String(error)))
      }
    }

    // Registrar cuando la página esté completamente cargada
    if (document.readyState === 'complete') {
      registerSW()
    } else {
      window.addEventListener('load', registerSW)
    }
  }, [])

  return null
}

