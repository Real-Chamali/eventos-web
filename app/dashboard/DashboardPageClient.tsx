'use client'

import { lazy, Suspense } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import Calendar from '@/components/ui/Calendar'
import { Calendar as CalendarIcon, Plus } from 'lucide-react'
import Link from 'next/link'
import Skeleton from '@/components/ui/Skeleton'
import { DashboardStats } from '@/components/dashboard/DashboardStats'
import { DashboardRecentQuotes } from '@/components/dashboard/DashboardRecentQuotes'
import { DashboardAdvancedMetrics } from '@/components/dashboard/DashboardAdvancedMetrics'

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
export default function DashboardPageClient() {
  return (
    <div className="space-y-8 p-6 lg:p-8">
      {/* Premium Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
            Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Bienvenido de vuelta. Aquí está tu resumen.
          </p>
        </div>
        <Link href="/dashboard/quotes/new">
          <button className="group relative inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all duration-200 hover:scale-105 hover:shadow-xl active:scale-95">
            <Plus className="h-5 w-5" />
            Nueva Cotización
          </button>
        </Link>
      </div>

      {/* Stats Cards */}
      <DashboardStats />

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Quotes */}
        <div className="lg:col-span-2">
          <DashboardRecentQuotes />
        </div>

        {/* Calendar */}
        <Card variant="elevated" className="overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              Calendario
            </CardTitle>
            <CardDescription>Próximos eventos y fechas importantes</CardDescription>
          </CardHeader>
          <CardContent>
            <Calendar />
          </CardContent>
        </Card>
      </div>

      {/* Advanced Metrics */}
      <DashboardAdvancedMetrics />

      {/* Revenue Trends - Lazy Loaded */}
      <Suspense
        fallback={
          <Card variant="elevated">
            <CardHeader>
              <CardTitle>Tendencias de Ingresos</CardTitle>
              <CardDescription>Análisis mensual de ventas</CardDescription>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
        }
      >
        <DashboardRevenueTrends />
      </Suspense>

      {/* Service Performance - Lazy Loaded */}
      <Suspense
        fallback={
          <Card variant="elevated">
            <CardHeader>
              <CardTitle>Rendimiento por Servicio</CardTitle>
              <CardDescription>Análisis de servicios más vendidos</CardDescription>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
        }
      >
        <DashboardServicePerformance />
      </Suspense>
    </div>
  )
}

