/**
 * Componente de cotizaciones recientes para el dashboard
 * Usa el hook optimizado useRecentQuotes
 */

'use client'

import { useMemo } from 'react'
import { useRecentQuotes } from '@/lib/hooks/useRecentQuotes'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Skeleton from '@/components/ui/Skeleton'
import Link from 'next/link'
import { Plus, ArrowRight, Sparkles, FileText } from 'lucide-react'

// Memoizar función de badge para evitar recreaciones
const getStatusBadge = (status: string) => {
  switch (status) {
    case 'confirmed':
      return <Badge variant="success" size="sm">Confirmada</Badge>
    case 'cancelled':
      return <Badge variant="error" size="sm">Cancelada</Badge>
    case 'draft':
    default:
      return <Badge variant="warning" size="sm">Borrador</Badge>
  }
}

export function DashboardRecentQuotes() {
  const { quotes, loading } = useRecentQuotes()
  
  // Memoizar formateo de fechas y precios para evitar recálculos
  const formattedQuotes = useMemo(() => {
    return quotes.map(quote => ({
      ...quote,
      formattedDate: new Date(quote.created_at).toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }),
      formattedPrice: new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(Number(quote.total_price || 0)),
    }))
  }, [quotes])
  
  if (loading) {
    return (
      <Card variant="elevated">
        <CardContent className="p-6">
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 w-full rounded-xl" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }
  
  return (
    <Card variant="elevated" className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100/50 dark:from-gray-900/50 dark:to-gray-800/30 border-b border-gray-200/60 dark:border-gray-800/60">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl">Cotizaciones Recientes</CardTitle>
            <CardDescription className="mt-1">Últimas 5 cotizaciones</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/dashboard/quotes/new">
              <Button variant="premium" size="sm" className="gap-2 shadow-lg hover:shadow-xl">
                <Plus className="h-4 w-4" />
                Nueva
              </Button>
            </Link>
            <Link href="/dashboard/quotes">
              <Button variant="ghost" size="sm" className="gap-2">
                Ver todas
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {quotes.length === 0 ? (
          <div className="text-center py-12">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 dark:bg-gray-800 mb-4">
              <FileText className="h-8 w-8 text-gray-400 dark:text-gray-500" />
            </div>
            <p className="text-gray-500 dark:text-gray-400 font-medium">No hay cotizaciones recientes</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Crea tu primera cotización para comenzar</p>
          </div>
        ) : (
          <div className="space-y-3">
            {quotes.map((quote) => (
              <Link
                key={quote.id}
                href={`/dashboard/quotes/${quote.id}`}
                className="group block p-5 rounded-xl border border-gray-200/60 dark:border-gray-800/60 hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-gradient-to-r hover:from-indigo-50/50 hover:to-violet-50/50 dark:hover:from-indigo-950/20 dark:hover:to-violet-950/20 transition-all duration-200 hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-200">
                        <Sparkles className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          {quote.client_name || 'Cliente sin nombre'}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          {getStatusBadge(quote.status)}
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {quote.formattedDate}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                      {quote.formattedPrice}
                    </p>
                    <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 ml-auto transition-colors" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

