'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import confetti from 'canvas-confetti'
import { logger } from '@/lib/utils/logger'
import { useToast } from '@/lib/hooks'

interface Quote {
  id: string
  client_id: string
  total_price: number
  status: string
  client?: {
    name: string
    email: string
  }
  quote_services?: Array<{
    quantity: number
    final_price: number
    service: {
      name: string
    }
  }>
}

export default function QuoteDetailPage() {
  const params = useParams()
  const router = useRouter()
  const quoteId = params.id as string
  const [quote, setQuote] = useState<Quote | null>(null)
  const [loading, setLoading] = useState(true)
  const [closing, setClosing] = useState(false)
  const supabase = createClient()
  const { error: toastError } = useToast()

  useEffect(() => {
    loadQuote()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quoteId])

  const loadQuote = async () => {
    try {
      const { data, error } = await supabase
        .from('quotes')
        .select(`
          *,
          client:clients(*),
          quote_services(
            quantity,
            final_price,
            service:services(name)
          )
        `)
        .eq('id', quoteId)
        .single()

      if (error) {
        // Convertir error de Supabase a Error estándar
        const errorMessage = error?.message || 'Error loading quote'
        const errorForLogging = error instanceof Error 
          ? error 
          : new Error(errorMessage)
        logger.error('QuoteDetailPage', 'Error loading quote', errorForLogging, {
          supabaseError: errorMessage,
          supabaseCode: error?.code,
          quoteId: quoteId,
        })
        toastError('Error al cargar la cotización')
      } else {
        setQuote(data)
      }
    } catch (err) {
      logger.error('QuoteDetailPage', 'Unexpected error loading quote', err as Error)
      toastError('Error inesperado al cargar la cotización')
    } finally {
      setLoading(false)
    }
  }

  const handleCloseSale = async () => {
    if (!confirm('¿Estás seguro de cerrar esta venta?')) return

    setClosing(true)
    try {
      const { error } = await supabase.rpc('confirm_sale', {
        id: quoteId,
      })

      if (error) {
        const errorMessage = error?.message || 'Error closing sale'
        toastError('Error al cerrar la venta: ' + errorMessage)
        // Convertir error de Supabase a Error estándar
        const errorForLogging = error instanceof Error 
          ? error 
          : new Error(errorMessage)
        logger.error('QuoteDetailPage', 'Error closing sale', errorForLogging, {
          supabaseError: errorMessage,
          supabaseCode: error?.code,
          quoteId: quoteId,
        })
        setClosing(false)
        return
      }

      // Mostrar confeti
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      })

      // Redirigir después de un breve delay
      setTimeout(() => {
        router.push(`/dashboard/events/${quoteId}`)
      }, 1000)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      toastError('Error: ' + message)
      logger.error('QuoteDetailPage', 'Unexpected error closing sale', err as Error)
      setClosing(false)
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center">Cargando...</div>
      </div>
    )
  }

  if (!quote) {
    return (
      <div className="p-8">
        <div className="text-center text-red-600">Cotización no encontrada</div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Detalle de Cotización</h1>

      <div className="bg-white rounded-lg shadow p-6 border border-gray-200 space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Cliente</h2>
          <p className="text-gray-700">{quote.client?.name}</p>
          <p className="text-sm text-gray-600">{quote.client?.email}</p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Servicios</h2>
          <div className="space-y-2">
            {quote.quote_services?.map((qs, index) => (
              <div
                key={index}
                className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
              >
                <div>
                  <p className="font-medium text-gray-900">{qs.service?.name}</p>
                  <p className="text-sm text-gray-600">
                    Cantidad: {qs.quantity} × ${qs.final_price.toLocaleString()}
                  </p>
                </div>
                <p className="font-semibold text-gray-900">
                  ${(qs.quantity * qs.final_price).toLocaleString('es-MX', {
                    minimumFractionDigits: 2,
                  })}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-gray-200 pt-4">
          <div className="flex justify-between items-center">
            <span className="text-xl font-semibold text-gray-900">Total:</span>
            <span className="text-2xl font-bold text-blue-600">
              ${quote.total_price.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-4">
          <p className="text-sm text-gray-600 mb-2">Estado: {quote.status}</p>
        </div>

        {quote.status === 'draft' && (
          <div className="mt-8">
            <button
              onClick={handleCloseSale}
              disabled={closing}
              className="w-full py-6 bg-green-600 text-white text-xl font-bold rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg transform transition-all hover:scale-105"
            >
              {closing ? 'Cerrando venta...' : 'CERRAR VENTA'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
