/**
 * Componente de estadísticas del dashboard
 * Usa el hook optimizado useDashboardStats
 */

'use client'

import { memo } from 'react'
import { useDashboardStats } from '@/lib/hooks/useDashboardStats'
import StatsCard from '@/components/ui/StatsCard'
import { Card, CardContent } from '@/components/ui/Card'
import Skeleton from '@/components/ui/Skeleton'
import { DollarSign, TrendingUp, FileText, Calendar as CalendarIcon, Target, Zap } from 'lucide-react'

export const DashboardStats = memo(function DashboardStats() {
  const { stats, loading } = useDashboardStats()
  
  if (loading || !stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-32 w-full rounded-xl" />
        ))}
      </div>
    )
  }
  
  return (
    <>
      {/* Premium Stats Grid - KPIs Principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Ventas Totales"
          value={stats.totalSales}
          type="currency"
          icon={<DollarSign className="h-6 w-6" />}
          description="Todas las ventas confirmadas"
          variant="premium"
        />
        <StatsCard
          title="Comisiones"
          value={stats.totalCommissions}
          type="currency"
          icon={<TrendingUp className="h-6 w-6" />}
          description="10% de comisión"
          trend="up"
        />
        <StatsCard
          title="Tasa de Conversión"
          value={stats.conversionRate}
          type="percentage"
          icon={<Target className="h-6 w-6" />}
          description={`${stats.confirmedQuotes} de ${stats.confirmedQuotes + stats.pendingQuotes} cotizaciones`}
        />
        <StatsCard
          title="Promedio de Venta"
          value={stats.averageSale}
          type="currency"
          icon={<Zap className="h-6 w-6" />}
          description="Por cotización confirmada"
        />
      </div>

      {/* Secondary Metrics - Cards Premium */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card variant="elevated" className="group hover:scale-[1.02] transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Cotizaciones Pendientes
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {stats.pendingQuotes}
                </p>
              </div>
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 group-hover:scale-110 transition-transform duration-200">
                <FileText className="h-7 w-7 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="elevated" className="group hover:scale-[1.02] transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Ventas del Mes
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {new Intl.NumberFormat('es-MX', {
                    style: 'currency',
                    currency: 'MXN',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  }).format(stats.monthlySales)}
                </p>
              </div>
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 group-hover:scale-110 transition-transform duration-200">
                <CalendarIcon className="h-7 w-7 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="elevated" className="group hover:scale-[1.02] transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Clientes
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {stats.totalClients}
                </p>
              </div>
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 group-hover:scale-110 transition-transform duration-200">
                <TrendingUp className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
})

