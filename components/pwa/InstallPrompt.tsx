'use client'

import { useState, useEffect } from 'react'
import { Download, X } from 'lucide-react'
import Button from '@/components/ui/Button'
import { cn } from '@/lib/utils/cn'
import { logger } from '@/lib/utils/logger'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    // Verificar si ya está instalado
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
      return
    }

    // Verificar si está en iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    const isInStandaloneMode = ('standalone' in window.navigator) && (window.navigator as any).standalone

    if (isIOS && !isInStandaloneMode) {
      // Mostrar instrucciones para iOS
      setShowPrompt(true)
      return
    }

    // Escuchar evento beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevenir el banner automático del navegador
      // Guardamos el evento para mostrarlo cuando el usuario lo solicite
      e.preventDefault()
      const promptEvent = e as BeforeInstallPromptEvent
      setDeferredPrompt(promptEvent)
      
      // Mostrar nuestro prompt personalizado después de un pequeño delay
      // Esto evita el warning del navegador sobre preventDefault sin prompt inmediato
      setTimeout(() => {
        setShowPrompt(true)
      }, 100)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    // Verificar si ya está instalado después de un delay
    const checkInstalled = setTimeout(() => {
      if (window.matchMedia('(display-mode: standalone)').matches) {
        setIsInstalled(true)
        setShowPrompt(false)
      }
    }, 1000)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      clearTimeout(checkInstalled)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      // iOS - mostrar instrucciones
      return
    }

    // Mostrar el prompt de instalación
    await deferredPrompt.prompt()

    // Esperar a que el usuario responda
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === 'accepted') {
      logger.info('InstallPrompt', 'Usuario aceptó instalar la PWA')
      setShowPrompt(false)
      setIsInstalled(true)
    } else {
      logger.info('InstallPrompt', 'Usuario rechazó instalar la PWA')
    }

    // Limpiar el prompt
    setDeferredPrompt(null)
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    // Guardar en localStorage para no mostrar de nuevo hoy
    localStorage.setItem('pwa-install-dismissed', new Date().toDateString())
  }

  // No mostrar si ya está instalado o si el usuario lo descartó hoy
  if (isInstalled || !showPrompt) {
    return null
  }

  const dismissedToday = localStorage.getItem('pwa-install-dismissed') === new Date().toDateString()
  if (dismissedToday && !deferredPrompt) {
    return null
  }

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)

  return (
    <div
      className={cn(
        'fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md',
        'bg-white dark:bg-gray-900',
        'border border-gray-200 dark:border-gray-800',
        'rounded-lg shadow-lg',
        'p-4',
        'animate-in slide-in-from-bottom-4'
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
            <Download className="h-5 w-5 text-white" />
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            Instalar Eventos CRM
          </h3>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            {isIOS ? (
              <>
                Toca el botón <span className="font-semibold">Compartir</span> y luego{' '}
                <span className="font-semibold">Agregar a pantalla de inicio</span>
              </>
            ) : (
              'Instala la app para acceso rápido y funcionamiento offline'
            )}
          </p>
        </div>

        <button
          onClick={handleDismiss}
          className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          aria-label="Cerrar"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {!isIOS && deferredPrompt && (
        <div className="mt-4 flex gap-2">
          <Button
            onClick={handleInstallClick}
            className="flex-1"
            variant="default"
          >
            <Download className="h-4 w-4 mr-2" />
            Instalar Ahora
          </Button>
          <Button
            onClick={handleDismiss}
            variant="ghost"
            className="px-4"
          >
            Más tarde
          </Button>
        </div>
      )}

      {isIOS && (
        <div className="mt-4">
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <span>1. Toca</span>
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
            </svg>
            <span>2. Selecciona "Agregar a pantalla de inicio"</span>
          </div>
        </div>
      )}
    </div>
  )
}

