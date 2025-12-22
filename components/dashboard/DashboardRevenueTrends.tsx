/**
 * Componente de tendencias de ingresos
 * Compara año actual vs año anterior
 */

'use client'

import { useRevenueTrends } from '@/lib/hooks/useRevenueTrends'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import Chart from '@/components/ui/Chart'
import Skeleton from '@/components/ui/Skeleton'
import { TrendingUp, TrendingDown, BarChart3 } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

export function DashboardRevenueTrends() {
  const { trends, loading } = useRevenueTrends()
  
  if (loading || !trends) {
    return (
      <Card variant="elevated" className="overflow-hidden">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    )
  }
  
  // Preparar datos para el gráfico de comparación
  const chartData = trends.trends.map((trend) => ({
    name: trend.month,
    'Año Actual': Math.round(trend.currentYear),
    'Año Anterior': Math.round(trend.previousYear),
  }))
  
  return (
    <Card variant="elevated" className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 border-b border-gray-200/60 dark:border-gray-800/60">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl">Tendencias de Ingresos</CardTitle>
            <CardDescription className="mt-1">
              Comparación año actual vs año anterior
            </CardDescription>
          </div>
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg">
            <BarChart3 className="h-5 w-5 text-white" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {/* Resumen */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-900/50">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              Total Año Actual
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {new Intl.NumberFormat('es-MX', {
                style: 'currency',
                currency: 'MXN',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              }).format(trends.totalCurrentYear)}
            </p>
          </div>
          
          <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-900/50">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              Total Año Anterior
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {new Intl.NumberFormat('es-MX', {
                style: 'currency',
                currency: 'MXN',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              }).format(trends.totalPreviousYear)}
            </p>
          </div>
          
          <div className={cn(
            "p-4 rounded-lg",
            trends.overallGrowth >= 0
              ? "bg-emerald-50 dark:bg-emerald-950/30"
              : "bg-red-50 dark:bg-red-950/30"
          )}>
            <div className="flex items-center gap-2 mb-1">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Crecimiento Total
              </p>
              {trends.overallGrowth >= 0 ? (
                <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
              )}
            </div>
            <p className={cn(
              "text-2xl font-bold",
              trends.overallGrowth >= 0
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-red-600 dark:text-red-400"
            )}>
              {trends.overallGrowth >= 0 ? '+' : ''}{trends.overallGrowth}%
            </p>
          </div>
        </div>
        
        {/* Gráfico de comparación */}
        {chartData.length > 0 ? (
          <div className="mt-6">
            <Chart 
              data={chartData} 
              type="line" 
              height={300}
              showLegend={true}
              dataKeys={['Año Actual', 'Año Anterior']}
            />
          </div>
        ) : (
          <div className="flex items-center justify-center h-[300px] text-gray-500 dark:text-gray-400">
            No hay datos suficientes para mostrar tendencias
          </div>
        )}
      </CardContent>
    </Card>
  )
}

