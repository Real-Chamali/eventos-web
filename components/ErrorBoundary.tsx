'use client'

import React, { ReactNode } from 'react'
import { logger } from '@/lib/utils/logger'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.error('ErrorBoundary', 'Caught error', error, {
      componentStack: errorInfo.componentStack,
    })
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-red-50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg">
            <div className="text-6xl mb-4 text-center">❌</div>
            <h1 className="text-2xl font-bold text-red-700 mb-4 text-center">
              Algo salió mal
            </h1>
            <p className="text-gray-600 mb-6 text-center">
              Hemos encontrado un error inesperado. Por favor, intenta recargar la página o contacta al soporte.
            </p>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mb-4 rounded bg-red-100 p-3">
                <p className="font-mono text-sm text-red-900">
                  {this.state.error.message}
                </p>
              </div>
            )}
            <div className="flex gap-3">
              <button
                onClick={this.handleReset}
                className="flex-1 rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 transition-colors"
              >
                Reintentar
              </button>
              <button
                onClick={() => window.location.assign('/dashboard')}
                className="flex-1 rounded bg-gray-300 px-4 py-2 text-gray-900 hover:bg-gray-400 transition-colors"
              >
                Ir al Dashboard
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
