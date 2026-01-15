/**
 * Calendario Estratégico para Dueño
 * Muestra valor por fecha, rentabilidad, temporadas y análisis
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table'
import Badge from '@/components/ui/Badge'
import { Calendar, TrendingUp, TrendingDown } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { format, isValid } from 'date-fns'
import { es } from 'date-fns/locale'
import Skeleton from '@/components/ui/Skeleton'
import { cn } from '@/lib/utils/cn'
import { logger } from '@/lib/utils/logger'

interface DateProfitability {
  eventDate: string
  eventsCount: number
  confirmedCount: number
  reservedCount: number
  totalRevenue: number
  totalProfit: number
  averageRevenuePerEvent: number
  averageProfitPerEvent: number
}

interface ProfitabilityRow {
  event_date: string | null
  events_count?: number | string | null
  confirmed_count?: number | string | null
  reserved_count?: number | string | null
  total_revenue?: number | string | null
  total_profit?: number | string | null
  average_revenue_per_event?: number | string | null
  average_profit_per_event?: number | string | null
}

// Función helper para formatear fechas de manera segura
function safeFormatDate(dateString: string, formatString: string): string {
  if (!dateString) return 'Fecha inválida'
  const date = new Date(dateString)
  if (!isValid(date)) {
    logger.warn('StrategicCalendar', 'Invalid date string', { dateString })
    return 'Fecha inválida'
  }
  try {
    return format(date, formatString, { locale: es })
  } catch (error) {
    logger.error('StrategicCalendar', 'Error formatting date', error instanceof Error ? error : new Error(String(error)))
    return 'Fecha inválida'
  }
}

export default function StrategicCalendar() {
  const [profitabilityData, setProfitabilityData] = useState<DateProfitability[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'quarter' | 'year'>('month')
  const supabase = createClient()

  const loadProfitabilityData = useCallback(async () => {
    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from('date_profitability_analysis')
        .select('*')
        .order('event_date', { ascending: false })
        .limit(selectedPeriod === 'week' ? 7 : selectedPeriod === 'month' ? 30 : selectedPeriod === 'quarter' ? 90 : 365)
      
      if (error) {
        logger.error('StrategicCalendar', 'Error loading profitability data', error as Error)
        return
      }
      
      // Filtrar y validar datos, asegurando que las fechas sean válidas
      setProfitabilityData(((data || []) as ProfitabilityRow[])
        .filter((item) => {
          // Validar que event_date existe y es válido
          if (!item.event_date) return false
          const date = new Date(item.event_date)
          return isValid(date)
        })
        .map((item) => ({
          eventDate: item.event_date,
          eventsCount: Number(item.events_count || 0),
          confirmedCount: Number(item.confirmed_count || 0),
          reservedCount: Number(item.reserved_count || 0),
          totalRevenue: Number(item.total_revenue || 0),
          totalProfit: Number(item.total_profit || 0),
          averageRevenuePerEvent: Number(item.average_revenue_per_event || 0),
          averageProfitPerEvent: Number(item.average_profit_per_event || 0),
        })))
    } catch (error) {
      logger.error('StrategicCalendar', 'Error loading profitability data', error instanceof Error ? error : new Error(String(error)))
    } finally {
      setLoading(false)
    }
  }, [selectedPeriod, supabase])

  useEffect(() => {
    loadProfitabilityData()
  }, [loadProfitabilityData])

  // Calcular estadísticas
  const stats = profitabilityData.reduce((acc, item) => {
    acc.totalRevenue += item.totalRevenue
    acc.totalProfit += item.totalProfit
    acc.totalEvents += item.eventsCount
    acc.confirmedEvents += item.confirmedCount
    if (item.averageRevenuePerEvent > acc.highestRevenue) {
      acc.highestRevenue = item.averageRevenuePerEvent
      acc.highestRevenueDate = item.eventDate
    }
    if (item.averageProfitPerEvent > acc.highestProfit) {
      acc.highestProfit = item.averageProfitPerEvent
      acc.highestProfitDate = item.eventDate
    }
    return acc
  }, {
    totalRevenue: 0,
    totalProfit: 0,
    totalEvents: 0,
    confirmedEvents: 0,
    highestRevenue: 0,
    highestRevenueDate: '',
    highestProfit: 0,
    highestProfitDate: '',
  })

  const averageRevenue = stats.totalEvents > 0 ? stats.totalRevenue / stats.totalEvents : 0
  const averageProfit = stats.totalEvents > 0 ? stats.totalProfit / stats.totalEvents : 0

  if (loading) {
    return (
      <Card variant="elevated">
        <CardHeader>
          <CardTitle>Calendario Estratégico</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full rounded-xl" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card variant="elevated">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Calendario Estratégico
        </CardTitle>
        <CardDescription>
          Análisis de rentabilidad por fecha, temporadas altas y bajas
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Selector de período */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Período:</span>
          <div className="flex gap-1 rounded-lg border border-gray-200 dark:border-gray-800 p-1">
            {(['week', 'month', 'quarter', 'year'] as const).map((period) => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={cn(
                  "px-3 py-1 text-xs font-medium rounded-md transition-colors",
                  selectedPeriod === period
                    ? "bg-indigo-600 text-white"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                )}
              >
                {period === 'week' ? 'Semana' : period === 'month' ? 'Mes' : period === 'quarter' ? 'Trimestre' : 'Año'}
              </button>
            ))}
          </div>
        </div>

        {/* Estadísticas Resumidas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
            <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Ingresos Totales</p>
            <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
              {new Intl.NumberFormat('es-MX', {
                style: 'currency',
                currency: 'MXN',
                minimumFractionDigits: 0,
              }).format(stats.totalRevenue)}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
            <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Utilidad Total</p>
            <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
              {new Intl.NumberFormat('es-MX', {
                style: 'currency',
                currency: 'MXN',
                minimumFractionDigits: 0,
              }).format(stats.totalProfit)}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800">
            <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Promedio Ingreso</p>
            <p className="text-xl font-bold text-purple-600 dark:text-purple-400">
              {new Intl.NumberFormat('es-MX', {
                style: 'currency',
                currency: 'MXN',
                minimumFractionDigits: 0,
              }).format(averageRevenue)}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
            <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Promedio Utilidad</p>
            <p className="text-xl font-bold text-amber-600 dark:text-amber-400">
              {new Intl.NumberFormat('es-MX', {
                style: 'currency',
                currency: 'MXN',
                minimumFractionDigits: 0,
              }).format(averageProfit)}
            </p>
          </div>
        </div>

        {/* Fechas Más Rentables */}
        {stats.highestRevenueDate && isValid(new Date(stats.highestRevenueDate)) && (
          <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border border-emerald-200 dark:border-emerald-800">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">
                Fecha Más Rentable
              </p>
            </div>
            <p className="text-sm text-emerald-700 dark:text-emerald-300">
              {safeFormatDate(stats.highestRevenueDate, "EEEE, d 'de' MMMM yyyy")} - 
              Ingreso promedio: {new Intl.NumberFormat('es-MX', {
                style: 'currency',
                currency: 'MXN',
              }).format(stats.highestRevenue)}
            </p>
          </div>
        )}

        {/* Tabla de Análisis */}
        {profitabilityData.length > 0 ? (
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
              Análisis por Fecha
            </h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Eventos</TableHead>
                  <TableHead>Confirmados</TableHead>
                  <TableHead>Ingresos</TableHead>
                  <TableHead>Utilidad</TableHead>
                  <TableHead>Promedio/Evento</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {profitabilityData.map((item) => {
                  const isHighValue = item.averageRevenuePerEvent > averageRevenue * 1.2
                  const isLowValue = item.averageRevenuePerEvent < averageRevenue * 0.8
                  
                  return (
                    <TableRow key={item.eventDate}>
                      <TableCell className="font-medium">
                        {safeFormatDate(item.eventDate, "dd MMM yyyy")}
                      </TableCell>
                      <TableCell>{item.eventsCount}</TableCell>
                      <TableCell>
                        <Badge variant={item.confirmedCount > 0 ? 'success' : 'warning'} size="sm">
                          {item.confirmedCount}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Intl.NumberFormat('es-MX', {
                          style: 'currency',
                          currency: 'MXN',
                        }).format(item.totalRevenue)}
                      </TableCell>
                      <TableCell>
                        {new Intl.NumberFormat('es-MX', {
                          style: 'currency',
                          currency: 'MXN',
                        }).format(item.totalProfit)}
                      </TableCell>
                      <TableCell>
                        {new Intl.NumberFormat('es-MX', {
                          style: 'currency',
                          currency: 'MXN',
                        }).format(item.averageRevenuePerEvent)}
                      </TableCell>
                      <TableCell>
                        {isHighValue ? (
                          <Badge variant="success" size="sm">
                            <TrendingUp className="h-3 w-3 mr-1" />
                            Alta
                          </Badge>
                        ) : isLowValue ? (
                          <Badge variant="error" size="sm">
                            <TrendingDown className="h-3 w-3 mr-1" />
                            Baja
                          </Badge>
                        ) : (
                          <Badge variant="info" size="sm">Normal</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center p-8 text-gray-500 dark:text-gray-400">
            <Calendar className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p>No hay datos de rentabilidad disponibles</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

