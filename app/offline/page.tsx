'use client'

import { WifiOff, RefreshCw, Home } from 'lucide-react'
import Button from '@/components/ui/Button'
import Link from 'next/link'
import { useEffect, useState } from 'react'

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(false)

  useEffect(() => {
    // Verificar estado de conexión
    const checkOnline = () => {
      setIsOnline(navigator.onLine)
    }

    checkOnline()
    window.addEventListener('online', checkOnline)
    window.addEventListener('offline', checkOnline)

    return () => {
      window.removeEventListener('online', checkOnline)
      window.removeEventListener('offline', checkOnline)
    }
  }, [])

  const handleRetry = () => {
    if (isOnline) {
      window.location.href = '/dashboard'
    } else {
      window.location.reload()
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 text-center">
        <div className="mb-6">
          <div className="mx-auto w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
            <WifiOff className="w-12 h-12 text-gray-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Sin conexión
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {isOnline ? (
              'Parece que hay conexión. Intenta recargar la página.'
            ) : (
              'No hay conexión a internet. Algunas funciones pueden no estar disponibles.'
            )}
          </p>
        </div>

        <div className="space-y-3">
          <Button
            onClick={handleRetry}
            className="w-full"
            variant="default"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            {isOnline ? 'Recargar página' : 'Reintentar'}
          </Button>

          <Link href="/dashboard">
            <Button
              className="w-full"
              variant="ghost"
            >
              <Home className="w-4 h-4 mr-2" />
              Ir al inicio
            </Button>
          </Link>
        </div>

        {!isOnline && (
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              La aplicación funciona offline para contenido previamente cargado.
              Algunas funciones requieren conexión a internet.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

