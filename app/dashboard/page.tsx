'use client'

import { useMemo, lazy, Suspense } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import Chart from '@/components/ui/Chart'
import Calendar from '@/components/ui/Calendar'
import { Calendar as CalendarIcon, Plus } from 'lucide-react'
import Link from 'next/link'
import Skeleton from '@/components/ui/Skeleton'
import { DashboardStats } from '@/components/dashboard/DashboardStats'
import { DashboardRecentQuotes } from '@/components/dashboard/DashboardRecentQuotes'
import { DashboardAdvancedMetrics } from '@/components/dashboard/DashboardAdvancedMetrics'
import { useDashboardStats } from '@/lib/hooks/useDashboardStats'
import { useRecentQuotes } from '@/lib/hooks/useRecentQuotes'
import { useMonthlyData } from '@/lib/hooks/useMonthlyData'

// Lazy load componentes pesados para mejor performance inicial
const DashboardRevenueTrends = lazy(() => 
  import('@/components/dashboard/DashboardRevenueTrends').then(m => ({ default: m.DashboardRevenueTrends }))
)
const DashboardServicePerformance = lazy(() => 
  import('@/components/dashboard/DashboardServicePerformance').then(m => ({ default: m.DashboardServicePerformance }))
)

/**
 * Dashboard principal optimizado con SWR
 * Usa hooks con caché para mejor rendimiento
 */
export default function DashboardPage() {
  const { stats, loading: statsLoading } = useDashboardStats()
  const { loading: quotesLoading } = useRecentQuotes()
  const { monthlyData, loading: monthlyLoading } = useMonthlyData()
  
  // Preparar datos para el gráfico
  const chartData = useMemo(() => {
    if (monthlyData.length === 0) return []
    return monthlyData.map((item) => ({
      name: item.name,
      value: item.value,
    }))
  }, [monthlyData])
  
  if (statsLoading || quotesLoading || monthlyLoading) {
    return (
      <div className="space-y-8 p-6 lg:p-8">
        <div className="h-8 w-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }
  
  return (
    <div className="space-y-8 p-6 lg:p-8" role="region" aria-label="Dashboard principal">
      {/* Premium Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
            Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Resumen de tus ventas, cotizaciones y métricas clave
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link 
            href="/dashboard/quotes/new"
            className="inline-flex items-center justify-center rounded-xl font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 active:scale-[0.98] bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:from-indigo-700 hover:to-violet-700 focus:ring-indigo-500 shadow-md hover:shadow-lg hover:scale-[1.02] px-6 py-3 text-base gap-2 shadow-lg"
          >
            <Plus className="h-5 w-5" />
            Nueva Cotización
          </Link>
        </div>
      </div>

      {/* Stats Cards - Optimizadas con hook */}
      <DashboardStats />

      {/* Advanced Metrics - Métricas Avanzadas */}
      <DashboardAdvancedMetrics />

      {/* Calendar and Chart Grid - Premium Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Calendar - Premium Card */}
        <Card variant="elevated" className="overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-indigo-50 to-violet-50 dark:from-indigo-950/30 dark:to-violet-950/30 border-b border-gray-200/60 dark:border-gray-800/60">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">Calendario de Eventos</CardTitle>
                <CardDescription className="mt-1">Próximos eventos programados</CardDescription>
              </div>
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shadow-lg">
                <CalendarIcon className="h-5 w-5 text-white" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <Calendar />
          </CardContent>
        </Card>

        {/* Sales Chart - Premium Card */}
        <Card variant="elevated" className="overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b border-gray-200/60 dark:border-gray-800/60">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">Ventas Mensuales</CardTitle>
                <CardDescription className="mt-1">Últimos 6 meses</CardDescription>
              </div>
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shadow-lg">
                <CalendarIcon className="h-5 w-5 text-white" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {chartData.length > 0 ? (
              <Chart data={chartData} type="bar" height={300} />
            ) : (
              <div className="flex items-center justify-center h-[300px] text-gray-500 dark:text-gray-400">
                No hay datos disponibles para mostrar
              </div>
            )}
          </CardContent>
        </Card>
      </div>


      {/* Recent Quotes - Optimizado con hook */}
      <DashboardRecentQuotes />

      {/* Revenue Trends - Comparación año anterior (Lazy loaded) */}
      <Suspense fallback={
        <Card variant="elevated" className="overflow-hidden">
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      }>
        <DashboardRevenueTrends />
      </Suspense>

      {/* Service Performance - Top servicios (Lazy loaded) */}
      <Suspense fallback={
        <Card variant="elevated" className="overflow-hidden">
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      }>
        <DashboardServicePerformance />
      </Suspense>
    </div>
  )
}
