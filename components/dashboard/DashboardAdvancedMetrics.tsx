/**
 * Componente de métricas avanzadas del dashboard
 * Muestra tasa de conversión, crecimiento, mejores clientes, etc.
 */

'use client'

import { useAdvancedMetrics } from '@/lib/hooks/useAdvancedMetrics'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import Skeleton from '@/components/ui/Skeleton'
import { TrendingUp, TrendingDown, Award, Clock, DollarSign, Target } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

export function DashboardAdvancedMetrics() {
  const { metrics, loading } = useAdvancedMetrics()
  
  if (loading || !metrics) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-32 w-full rounded-xl" />
        ))}
      </div>
    )
  }
  
  return (
    <div className="space-y-6">
      {/* Métricas de Rendimiento */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Tasa de Conversión */}
        <Card variant="elevated" className="group hover:scale-[1.02] transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Tasa de Conversión
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {metrics.conversionRate}%
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Cotizaciones → Ventas
                </p>
              </div>
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950/30 dark:to-violet-950/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                <Target className="h-7 w-7 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Promedio de Venta */}
        <Card variant="elevated" className="group hover:scale-[1.02] transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Promedio de Venta
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {new Intl.NumberFormat('es-MX', {
                    style: 'currency',
                    currency: 'MXN',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  }).format(metrics.averageSaleAmount)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Por venta confirmada
                </p>
              </div>
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                <DollarSign className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Crecimiento de Ventas */}
        <Card variant="elevated" className="group hover:scale-[1.02] transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Crecimiento de Ventas
                </p>
                <div className="flex items-center gap-2">
                  <p className={cn(
                    "text-3xl font-bold",
                    metrics.salesGrowth >= 0
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-red-600 dark:text-red-400"
                  )}>
                    {metrics.salesGrowth >= 0 ? '+' : ''}{metrics.salesGrowth}%
                  </p>
                  {metrics.salesGrowth >= 0 ? (
                    <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />
                  )}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  vs mes anterior
                </p>
              </div>
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                <TrendingUp className="h-7 w-7 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Crecimiento de Cotizaciones */}
        <Card variant="elevated" className="group hover:scale-[1.02] transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Crecimiento de Cotizaciones
                </p>
                <div className="flex items-center gap-2">
                  <p className={cn(
                    "text-3xl font-bold",
                    metrics.quotesGrowth >= 0
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-red-600 dark:text-red-400"
                  )}>
                    {metrics.quotesGrowth >= 0 ? '+' : ''}{metrics.quotesGrowth}%
                  </p>
                  {metrics.quotesGrowth >= 0 ? (
                    <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />
                  )}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  vs mes anterior
                </p>
              </div>
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                <Target className="h-7 w-7 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Métricas Adicionales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Mejor Cliente */}
        <Card variant="elevated" className="group hover:scale-[1.02] transition-all duration-200">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-950/30 dark:to-violet-950/30 border-b border-gray-200/60 dark:border-gray-800/60">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Mejor Cliente</CardTitle>
                <CardDescription className="mt-1">Cliente con más ventas</CardDescription>
              </div>
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500 to-violet-500 flex items-center justify-center shadow-lg">
                <Award className="h-5 w-5 text-white" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {metrics.topClient ? (
              <div className="space-y-2">
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {metrics.topClient.name}
                </p>
                <p className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent">
                  {new Intl.NumberFormat('es-MX', {
                    style: 'currency',
                    currency: 'MXN',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  }).format(metrics.topClient.totalSales)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Total en ventas
                </p>
              </div>
            ) : (
              <div className="flex items-center justify-center h-24 text-gray-500 dark:text-gray-400">
                <p className="text-sm">No hay datos disponibles</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Mejor Mes */}
        <Card variant="elevated" className="group hover:scale-[1.02] transition-all duration-200">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b border-gray-200/60 dark:border-gray-800/60">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Mejor Mes</CardTitle>
                <CardDescription className="mt-1">Mes con más ventas</CardDescription>
              </div>
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shadow-lg">
                <Award className="h-5 w-5 text-white" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {metrics.bestMonth ? (
              <div className="space-y-2">
                <p className="text-xl font-bold text-gray-900 dark:text-white capitalize">
                  {metrics.bestMonth.month}
                </p>
                <p className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  {new Intl.NumberFormat('es-MX', {
                    style: 'currency',
                    currency: 'MXN',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  }).format(metrics.bestMonth.sales)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Ventas totales
                </p>
              </div>
            ) : (
              <div className="flex items-center justify-center h-24 text-gray-500 dark:text-gray-400">
                <p className="text-sm">No hay datos disponibles</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Métricas de Tiempo */}
        <Card variant="elevated" className="group hover:scale-[1.02] transition-all duration-200">
          <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border-b border-gray-200/60 dark:border-gray-800/60">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Tiempo Promedio</CardTitle>
                <CardDescription className="mt-1">Días para cerrar venta</CardDescription>
              </div>
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg">
                <Clock className="h-5 w-5 text-white" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {metrics.averageDaysToClose.toFixed(0)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  días promedio
                </p>
              </div>
              <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Cotizaciones Pendientes
                </p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {new Intl.NumberFormat('es-MX', {
                    style: 'currency',
                    currency: 'MXN',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  }).format(metrics.pendingQuotesValue)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}


