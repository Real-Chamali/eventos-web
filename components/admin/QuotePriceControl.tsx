/**
 * Componente de Control de Precios para Cotizaciones
 * Muestra precio real vs ideal, descuentos aplicados y margen
 */

'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table'
import Badge from '@/components/ui/Badge'
import { DollarSign, TrendingDown, AlertCircle, User, Calendar } from 'lucide-react'
import { getQuoteDiscountSummary } from '@/lib/utils/ownerDashboard'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { createClient } from '@/utils/supabase/client'
import Skeleton from '@/components/ui/Skeleton'
import { logger } from '@/lib/utils/logger'

interface QuotePriceControlProps {
  quoteId: string
}

interface PriceChangeLog {
  id: string
  old_price: number
  new_price: number
  discount_percent: number
  discount_amount: number
  reason: string | null
  authorized_by_name: string | null
  changed_by_name: string | null
  created_at: string
}

export default function QuotePriceControl({ quoteId }: QuotePriceControlProps) {
  const [discountSummary, setDiscountSummary] = useState<{
    originalTotal: number
    totalDiscounts: number
    finalTotal: number
    discountCount: number
    lastDiscountDate: string | null
    authorizedByNames: string | null
    discountReasons: string | null
  } | null>(null)
  const [priceChanges, setPriceChanges] = useState<PriceChangeLog[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadPriceControlData()
  }, [quoteId])

  const loadPriceControlData = async () => {
    try {
      setLoading(true)
      
      // Obtener resumen de descuentos
      const summary = await getQuoteDiscountSummary(quoteId)
      setDiscountSummary(summary)
      
      // Obtener historial de cambios de precio
      const { data, error } = await supabase
        .from('price_change_log')
        .select(`
          id,
          old_price,
          new_price,
          discount_percent,
          discount_amount,
          reason,
          created_at,
          authorized_by:profiles!price_change_log_authorized_by_fkey(full_name),
          changed_by:profiles!price_change_log_changed_by_fkey(full_name)
        `)
        .eq('quote_id', quoteId)
        .order('created_at', { ascending: false })
      
      if (!error && data) {
        setPriceChanges(data.map((item: any) => ({
          id: item.id,
          old_price: Number(item.old_price),
          new_price: Number(item.new_price),
          discount_percent: Number(item.discount_percent),
          discount_amount: Number(item.discount_amount),
          reason: item.reason,
          authorized_by_name: item.authorized_by?.full_name || 'Sistema',
          changed_by_name: item.changed_by?.full_name || 'Sistema',
          created_at: item.created_at,
        })))
      }
    } catch (error) {
      logger.error('QuotePriceControl', 'Error loading price control data', error instanceof Error ? error : new Error(String(error)))
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card variant="elevated">
        <CardHeader>
          <CardTitle>Control de Precios</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full rounded-xl" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card variant="elevated" className="border-amber-200 dark:border-amber-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          Control de Precios y Descuentos
        </CardTitle>
        <CardDescription>
          Precio real vs ideal, descuentos aplicados y quién los autorizó
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Resumen de Descuentos */}
        {discountSummary && (
          <div className="grid grid-cols-3 gap-4 p-4 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-200 dark:border-amber-800">
            <div className="text-center">
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                Precio Original
              </p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {new Intl.NumberFormat('es-MX', {
                  style: 'currency',
                  currency: 'MXN',
                }).format(discountSummary.originalTotal)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                Descuentos Totales
              </p>
              <p className="text-lg font-bold text-red-600 dark:text-red-400">
                -{new Intl.NumberFormat('es-MX', {
                  style: 'currency',
                  currency: 'MXN',
                }).format(discountSummary.totalDiscounts)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                Precio Final
              </p>
              <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                {new Intl.NumberFormat('es-MX', {
                  style: 'currency',
                  currency: 'MXN',
                }).format(discountSummary.finalTotal)}
              </p>
            </div>
          </div>
        )}

        {/* Historial de Cambios */}
        {priceChanges.length > 0 ? (
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              Historial de Cambios de Precio ({priceChanges.length})
            </h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Precio Anterior</TableHead>
                  <TableHead>Precio Nuevo</TableHead>
                  <TableHead>Descuento</TableHead>
                  <TableHead>Autorizado Por</TableHead>
                  <TableHead>Razón</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {priceChanges.map((change) => (
                  <TableRow key={change.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="text-sm">
                          {format(new Date(change.created_at), "dd MMM yyyy HH:mm", { locale: es })}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Intl.NumberFormat('es-MX', {
                        style: 'currency',
                        currency: 'MXN',
                      }).format(change.old_price)}
                    </TableCell>
                    <TableCell>
                      {new Intl.NumberFormat('es-MX', {
                        style: 'currency',
                        currency: 'MXN',
                      }).format(change.new_price)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="error" size="sm">
                        -{change.discount_percent.toFixed(1)}% ({new Intl.NumberFormat('es-MX', {
                          style: 'currency',
                          currency: 'MXN',
                        }).format(change.discount_amount)})
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <span className="text-sm">{change.authorized_by_name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {change.reason || 'Sin razón especificada'}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center p-8 text-gray-500 dark:text-gray-400">
            <TrendingDown className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p>No se han registrado cambios de precio</p>
          </div>
        )}

        {/* Advertencia */}
        {discountSummary && discountSummary.totalDiscounts > 0 && (
          <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-800 dark:text-red-200">
                  ⚠️ Regla de Oro: Nadie puede bajar precios sin dejar rastro
                </p>
                <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                  Todos los descuentos han sido registrados y autorizados. Historial completo disponible arriba.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

