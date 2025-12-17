'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import Chart from '@/components/ui/Chart'
import Calendar from '@/components/ui/Calendar'
import { Calendar as CalendarIcon, Plus, Sparkles, User } from 'lucide-react'
import Link from 'next/link'
import { DashboardStats } from '@/components/dashboard/DashboardStats'
import { DashboardRecentQuotes } from '@/components/dashboard/DashboardRecentQuotes'
import { useDashboardStats } from '@/lib/hooks/useDashboardStats'
import { useRecentQuotes } from '@/lib/hooks/useRecentQuotes'

/**
 * Dashboard principal optimizado con SWR
 * Usa hooks con caché para mejor rendimiento
 */
export default function DashboardPage() {
  const { stats, loading: statsLoading } = useDashboardStats()
  const { quotes: recentQuotes, loading: quotesLoading } = useRecentQuotes()
  
  // Calcular datos para gráfico de ventas mensuales (últimos 6 meses)
  const monthlyData = useMemo(() => {
    if (!stats) return []
    
    const currentMonth = new Date().getMonth()
    const currentYear = new Date().getFullYear()
    
    // TODO: Obtener datos mensuales reales desde la BD
    // Por ahora usamos datos estimados basados en stats
    return Array.from({ length: 6 }, (_, i) => {
      const date = new Date(currentYear, currentMonth - i, 1)
      const monthName = date.toLocaleDateString('es-MX', { month: 'short' })
      // Aproximación simple - en producción debería venir de la BD
      const monthSales = i === 0 ? stats.monthlySales : stats.monthlySales * (0.8 - i * 0.1)
      return { name: monthName, value: Math.max(0, monthSales) }
    }).reverse()
  }, [stats])
  
  if (statsLoading || quotesLoading) {
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
            <Chart data={monthlyData} type="bar" height={300} />
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions Section - Premium */}
      <Card variant="elevated" className="overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-indigo-50 to-violet-50 dark:from-indigo-950/30 dark:to-violet-950/30 border-b border-gray-200/60 dark:border-gray-800/60">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                Acciones Rápidas
              </CardTitle>
              <CardDescription className="mt-1">Accede rápidamente a las funciones más usadas</CardDescription>
            </div>
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shadow-lg">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link 
              href="/dashboard/quotes/new"
              className="inline-flex items-center justify-center rounded-xl font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 active:scale-[0.98] bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:from-indigo-700 hover:to-violet-700 focus:ring-indigo-500 shadow-md hover:shadow-lg hover:scale-[1.02] w-full h-auto flex-col gap-3 p-6"
            >
              <div className="h-12 w-12 rounded-xl bg-white/20 flex items-center justify-center">
                <Plus className="h-6 w-6 text-white" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-white">Nueva Cotización</p>
                <p className="text-xs text-white/80 mt-1">Crear cotización</p>
              </div>
            </Link>
            <Link 
              href="/dashboard/clients/new"
              className="inline-flex items-center justify-center rounded-xl font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 active:scale-[0.98] border-2 border-gray-200 bg-transparent text-gray-700 hover:bg-gray-50 hover:border-indigo-300 focus:ring-gray-400 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:border-indigo-700 w-full h-auto flex-col gap-3 p-6"
            >
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/30 flex items-center justify-center">
                <User className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-gray-900 dark:text-white">Nuevo Cliente</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Agregar cliente</p>
              </div>
            </Link>
            <Link 
              href="/dashboard/quotes"
              className="inline-flex items-center justify-center rounded-xl font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 active:scale-[0.98] border-2 border-gray-200 bg-transparent text-gray-700 hover:bg-gray-50 hover:border-indigo-300 focus:ring-gray-400 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:border-indigo-700 w-full h-auto flex-col gap-3 p-6"
            >
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 flex items-center justify-center">
                <CalendarIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-gray-900 dark:text-white">Ver Cotizaciones</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Todas las cotizaciones</p>
              </div>
            </Link>
            <Link 
              href="/dashboard/events"
              className="inline-flex items-center justify-center rounded-xl font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 active:scale-[0.98] border-2 border-gray-200 bg-transparent text-gray-700 hover:bg-gray-50 hover:border-indigo-300 focus:ring-gray-400 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:border-indigo-700 w-full h-auto flex-col gap-3 p-6"
            >
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30 flex items-center justify-center">
                <CalendarIcon className="h-6 w-6 text-violet-600 dark:text-violet-400" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-gray-900 dark:text-white">Ver Eventos</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Todos los eventos</p>
              </div>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Recent Quotes - Optimizado con hook */}
      <DashboardRecentQuotes />
    </div>
  )
}
