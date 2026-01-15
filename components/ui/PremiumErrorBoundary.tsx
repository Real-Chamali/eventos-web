'use client'

import React, { ReactNode, Component, ErrorInfo } from 'react'
import { AlertTriangle, RefreshCw, Home, Mail, X } from 'lucide-react'
import { logger } from '@/lib/utils/logger'
import Button from './Button'
import { motion } from 'framer-motion'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  errorId: string | null
}

export class PremiumErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    const errorId = `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    // Log inmediatamente en getDerivedStateFromError
    try {
      console.error('[PremiumErrorBoundary] Error caught:', {
        message: error.message,
        name: error.name,
        stack: error.stack?.substring(0, 500),
        errorId,
      })
    } catch {
      // Si el logging falla, no hacer nada
    }
    return {
      hasError: true,
      error,
      errorId,
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const errorId = this.state.errorId || `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    this.setState({ 
      errorInfo,
      errorId, // Asegurar que errorId esté en el state
    })
    
    // Log con más contexto
    try {
      logger.error('PremiumErrorBoundary', 'Caught error in componentDidCatch', error, {
        componentStack: errorInfo.componentStack?.substring(0, 1000), // Limitar tamaño
        errorId,
        url: typeof window !== 'undefined' ? window.location.href : 'unknown',
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      })
    } catch (e) {
      // Si el logger falla, usar console.error como fallback
      console.error('[PremiumErrorBoundary] Logger failed, using console.error:', e)
      console.error('[PremiumErrorBoundary] Original error:', error)
      console.error('[PremiumErrorBoundary] Error info:', errorInfo)
    }

    if (this.props.onError) {
      try {
        this.props.onError(error, errorInfo)
      } catch (e) {
        console.error('[PremiumErrorBoundary] onError callback failed:', e)
      }
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    })
  }

  handleReload = () => {
    window.location.reload()
  }

  handleGoHome = () => {
    window.location.href = '/dashboard'
  }

  handleReportError = () => {
    const { error, errorInfo, errorId } = this.state
    if (!error) return

    const errorReport = {
      errorId,
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo?.componentStack,
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: new Date().toISOString(),
    }

    // Enviar a servicio de reportes (Sentry, etc.)
    logger.error('PremiumErrorBoundary', 'User reported error', error, errorReport)

    // Mostrar confirmación
    alert('Error reportado. Gracias por tu ayuda.')
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      const { error, errorId } = this.state
      const isDevelopment = process.env.NODE_ENV === 'development'

      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-50 p-4 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="w-full max-w-2xl rounded-2xl bg-white/95 backdrop-blur-xl p-8 shadow-2xl dark:bg-gray-900/95 border border-gray-200/60 dark:border-gray-800/60"
          >
            {/* Header con icono animado */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 15 }}
              className="mb-6 flex items-center justify-center"
            >
              <div className="relative">
                <div className="absolute inset-0 animate-ping rounded-full bg-red-400 opacity-20" />
                <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-red-100 to-red-200 dark:from-red-900/30 dark:to-red-800/30">
                  <AlertTriangle className="h-10 w-10 text-red-600 dark:text-red-400" />
                </div>
              </div>
            </motion.div>

            {/* Título */}
            <motion.h1
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mb-3 text-center text-3xl font-bold text-gray-900 dark:text-white"
            >
              Oops, algo salió mal
            </motion.h1>

            {/* Descripción */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mb-6 text-center text-gray-600 dark:text-gray-400"
            >
              Hemos encontrado un error inesperado. No te preocupes, tu información está segura.
              {errorId && (
                <span className="mt-2 block text-xs text-gray-500 dark:text-gray-500">
                  ID de error: {errorId}
                </span>
              )}
            </motion.p>

            {/* Detalles del error (solo en desarrollo) */}
            {isDevelopment && error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                transition={{ delay: 0.5 }}
                className="mb-6 rounded-xl bg-red-50 p-4 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50"
              >
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-red-900 dark:text-red-200">
                    Detalles del error (solo en desarrollo)
                  </h3>
                  <button
                    onClick={() => {
                      const details = document.getElementById('error-details')
                      if (details) {
                        details.classList.toggle('hidden')
                      }
                    }}
                    className="text-red-600 hover:text-red-700 dark:text-red-400"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div id="error-details" className="space-y-2">
                  <p className="font-mono text-xs text-red-800 dark:text-red-300">
                    <strong>Mensaje:</strong> {error.message}
                  </p>
                  {error.stack && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-xs font-semibold text-red-700 dark:text-red-300">
                        Stack trace
                      </summary>
                      <pre className="mt-2 max-h-40 overflow-auto rounded bg-red-100 p-2 text-xs text-red-900 dark:bg-red-950/30 dark:text-red-200">
                        {error.stack}
                      </pre>
                    </details>
                  )}
                </div>
              </motion.div>
            )}

            {/* Acciones */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="flex flex-col gap-3 sm:flex-row"
            >
              <Button
                variant="premium"
                onClick={this.handleReset}
                className="flex-1"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Reintentar
              </Button>
              <Button
                variant="outline"
                onClick={this.handleGoHome}
                className="flex-1"
              >
                <Home className="mr-2 h-4 w-4" />
                Ir al Dashboard
              </Button>
              <Button
                variant="ghost"
                onClick={this.handleReload}
                className="flex-1"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Recargar Página
              </Button>
            </motion.div>

            {/* Reportar error */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="mt-6 text-center"
            >
              <button
                onClick={this.handleReportError}
                className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
              >
                <Mail className="mr-2 h-4 w-4" />
                Reportar este error
              </button>
            </motion.div>
          </motion.div>
        </div>
      )
    }

    return this.props.children
  }
}

// Hook para usar el error boundary programáticamente
export function useErrorHandler() {
  return (error: Error, errorInfo?: ErrorInfo) => {
    logger.error('useErrorHandler', 'Manual error trigger', error, {
      componentStack: errorInfo?.componentStack,
    })
    throw error
  }
}

