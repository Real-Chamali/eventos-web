/**
 * Componente de KPIs para Dashboard del Dueño
 * Muestra indicadores clave en una sola pantalla
 */

'use client'

import { Card, CardContent } from '@/components/ui/Card'
import { DollarSign, Clock, Calendar, AlertTriangle, TrendingUp, Users } from 'lucide-react'
import type { OwnerKPIs } from '@/lib/utils/ownerDashboard'
import Skeleton from '@/components/ui/Skeleton'

interface OwnerDashboardKPIsProps {
  kpis: OwnerKPIs | null
  loading: boolean
}

export default function OwnerDashboardKPIs({ kpis, loading }: OwnerDashboardKPIsProps) {
  if (loading || !kpis) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-32 w-full rounded-xl" />
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Ventas del Mes */}
      <Card variant="elevated" className="border-emerald-200 dark:border-emerald-800">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                Ventas del Mes
              </p>
              <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                {new Intl.NumberFormat('es-MX', {
                  style: 'currency',
                  currency: 'MXN',
                  minimumFractionDigits: 0,
                }).format(kpis.monthlySales)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Confirmadas
              </p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-emerald-100 dark:bg-emerald-950/30 flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dinero por Cobrar */}
      <Card variant="elevated" className="border-amber-200 dark:border-amber-800">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                Por Cobrar
              </p>
              <p className="text-3xl font-bold text-amber-600 dark:text-amber-400">
                {new Intl.NumberFormat('es-MX', {
                  style: 'currency',
                  currency: 'MXN',
                  minimumFractionDigits: 0,
                }).format(kpis.moneyToCollect)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Pendiente
              </p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-amber-100 dark:bg-amber-950/30 flex items-center justify-center">
              <Clock className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Eventos Próximos */}
      <Card variant="elevated" className="border-blue-200 dark:border-blue-800">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                Eventos Próximos
              </p>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {kpis.eventsNext7Days}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Próximos 7 días
              </p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-blue-100 dark:bg-blue-950/30 flex items-center justify-center">
              <Calendar className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Eventos en Riesgo */}
      <Card variant="elevated" className="border-red-200 dark:border-red-800">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                Eventos en Riesgo
              </p>
              <p className="text-3xl font-bold text-red-600 dark:text-red-400">
                {kpis.eventsAtRisk}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Pagos atrasados
              </p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-red-100 dark:bg-red-950/30 flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

