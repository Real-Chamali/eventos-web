/**
 * Componente de rendimiento de servicios
 * Top servicios por ingresos
 */

'use client'

import { useServicePerformance } from '@/lib/hooks/useServicePerformance'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import Chart from '@/components/ui/Chart'
import Skeleton from '@/components/ui/Skeleton'
import { Package } from 'lucide-react'

export function DashboardServicePerformance() {
  const { services, loading } = useServicePerformance()
  
  if (loading) {
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
  
  // Preparar datos para el gráfico
  const chartData = services.slice(0, 8).map((service) => ({
    name: service.serviceName.length > 20 
      ? service.serviceName.substring(0, 20) + '...' 
      : service.serviceName,
    value: Math.round(service.revenue),
    fullName: service.serviceName,
  }))
  
  return (
    <Card variant="elevated" className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border-b border-gray-200/60 dark:border-gray-800/60">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl">Top Servicios</CardTitle>
            <CardDescription className="mt-1">
              Servicios con más ingresos generados
            </CardDescription>
          </div>
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg">
            <Package className="h-5 w-5 text-white" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {chartData.length > 0 ? (
          <>
            {/* Gráfico */}
            <div className="mb-6">
              <Chart 
                data={chartData} 
                type="bar" 
                height={300}
              />
            </div>
            
            {/* Tabla de detalles */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                Detalles
              </h4>
              {services.slice(0, 5).map((service, index) => (
                <div
                  key={service.serviceId}
                  className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-900/50 hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white font-bold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {service.serviceName}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {service.count} ventas • Promedio: {new Intl.NumberFormat('es-MX', {
                          style: 'currency',
                          currency: 'MXN',
                        }).format(service.averagePrice)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      {new Intl.NumberFormat('es-MX', {
                        style: 'currency',
                        currency: 'MXN',
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      }).format(service.revenue)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-[300px] text-gray-500 dark:text-gray-400">
            <div className="text-center">
              <Package className="h-12 w-12 mx-auto mb-3 text-gray-400" />
              <p className="text-sm">No hay datos de servicios disponibles</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

