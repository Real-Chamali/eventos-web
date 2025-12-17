'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import Chart from '@/components/ui/Chart'
import { TrendingUp, TrendingDown, DollarSign, Users, Target } from 'lucide-react'
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns'
import { es } from 'date-fns/locale'

interface AnalyticsData {
  revenue: {
    current: number
    previous: number
    trend: number
  }
  conversions: {
    current: number
    previous: number
    trend: number
  }
  clients: {
    current: number
    previous: number
    trend: number
  }
  monthlyRevenue: Array<{ name: string; value: number }>
  conversionFunnel: Array<{ stage: string; count: number; percentage: number }>
  topServices: Array<{ name: string; revenue: number; count: number }>
}

export default function AdvancedAnalytics() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<'6m' | '12m' | 'ytd'>('12m')
  const supabase = createClient()

  useEffect(() => {
    loadAnalytics()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period])

  const loadAnalytics = async () => {
    try {
      setLoading(true)
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      const now = new Date()
      const monthsToShow = period === '6m' ? 6 : period === '12m' ? 12 : now.getMonth() + 1
      const startDate = subMonths(now, monthsToShow)

      // Obtener cotizaciones confirmadas
      const { data: quotes } = await supabase
        .from('quotes')
        .select('id, total_price, status, created_at, vendor_id')
        .eq('vendor_id', user.id)
        .gte('created_at', startDate.toISOString())

      if (!quotes) return

      const confirmed = quotes.filter((q) => q.status === 'confirmed')
      const currentMonth = confirmed.filter((q) => {
        const date = new Date(q.created_at)
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
      })

      const previousMonth = confirmed.filter((q) => {
        const date = new Date(q.created_at)
        const prevMonth = subMonths(now, 1)
        return date.getMonth() === prevMonth.getMonth() && date.getFullYear() === prevMonth.getFullYear()
      })

      const currentRevenue = currentMonth.reduce((sum, q) => sum + (q.total_price || 0), 0)
      const previousRevenue = previousMonth.reduce((sum, q) => sum + (q.total_price || 0), 0)
      const revenueTrend = previousRevenue > 0 ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 : 0

      // Funnel de conversión
      const totalQuotes = quotes.length
      const draftQuotes = quotes.filter((q) => q.status === 'draft').length
      const pendingQuotes = quotes.filter((q) => q.status === 'pending').length
      const confirmedQuotes = confirmed.length
      const cancelledQuotes = quotes.filter((q) => q.status === 'cancelled').length

      const funnel = [
        { stage: 'Borradores', count: draftQuotes, percentage: 100 },
        { stage: 'Enviadas', count: pendingQuotes, percentage: totalQuotes > 0 ? (pendingQuotes / totalQuotes) * 100 : 0 },
        { stage: 'Confirmadas', count: confirmedQuotes, percentage: totalQuotes > 0 ? (confirmedQuotes / totalQuotes) * 100 : 0 },
        { stage: 'Canceladas', count: cancelledQuotes, percentage: totalQuotes > 0 ? (cancelledQuotes / totalQuotes) * 100 : 0 },
      ]

      // Revenue mensual
      const monthlyRevenue = Array.from({ length: monthsToShow }, (_, i) => {
        const date = subMonths(now, monthsToShow - i - 1)
        const monthStart = startOfMonth(date)
        const monthEnd = endOfMonth(date)
        const monthQuotes = confirmed.filter((q) => {
          const qDate = new Date(q.created_at)
          return qDate >= monthStart && qDate <= monthEnd
        })
        return {
          name: format(date, 'MMM yyyy', { locale: es }),
          value: monthQuotes.reduce((sum, q) => sum + (q.total_price || 0), 0),
        }
      })

      // Top servicios
      const { data: quoteServices } = await supabase
        .from('quote_services')
        .select('final_price, service:services(name)')
        .in(
          'quote_id',
          confirmed.map((q) => q.id)
        )

      const serviceMap = new Map<string, { revenue: number; count: number }>()
      quoteServices?.forEach((qs: { service?: { name?: string } | { name?: string }[]; final_price?: number }) => {
        const service = Array.isArray(qs.service) ? qs.service[0] : qs.service
        const serviceName = (service as { name?: string })?.name || 'Desconocido'
        const existing = serviceMap.get(serviceName) || { revenue: 0, count: 0 }
        serviceMap.set(serviceName, {
          revenue: existing.revenue + (qs.final_price || 0),
          count: existing.count + 1,
        })
      })

      const topServices = Array.from(serviceMap.entries())
        .map(([name, data]) => ({ name, ...data }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5)

      // Clientes
      const { data: clients } = await supabase
        .from('clients')
        .select('id, created_at')
        .gte('created_at', startDate.toISOString())

      const currentMonthClients = clients?.filter((c) => {
        const date = new Date(c.created_at)
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
      }).length || 0

      const previousMonthClients = clients?.filter((c) => {
        const date = new Date(c.created_at)
        const prevMonth = subMonths(now, 1)
        return date.getMonth() === prevMonth.getMonth() && date.getFullYear() === prevMonth.getFullYear()
      }).length || 0

      const clientsTrend = previousMonthClients > 0 ? ((currentMonthClients - previousMonthClients) / previousMonthClients) * 100 : 0

      setData({
        revenue: {
          current: currentRevenue,
          previous: previousRevenue,
          trend: revenueTrend,
        },
        conversions: {
          current: confirmedQuotes,
          previous: previousMonth.length,
          trend: previousMonth.length > 0 ? ((confirmedQuotes - previousMonth.length) / previousMonth.length) * 100 : 0,
        },
        clients: {
          current: currentMonthClients,
          previous: previousMonthClients,
          trend: clientsTrend,
        },
        monthlyRevenue,
        conversionFunnel: funnel,
        topServices,
      })
    } catch (error) {
      console.error('Error loading analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="text-center py-8">Cargando analytics...</div>
  }

  if (!data) {
    return <div className="text-center py-8">No hay datos disponibles</div>
  }

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics Avanzado</h2>
        <div className="flex gap-2">
          {(['6m', '12m', 'ytd'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                period === p
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
              }`}
            >
              {p === '6m' ? '6 Meses' : p === '12m' ? '12 Meses' : 'Año Actual'}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Ingresos del Mes</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                  ${data.revenue.current.toLocaleString('es-MX')}
                </p>
                <div className="flex items-center mt-2">
                  {data.revenue.trend >= 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-600 mr-1" />
                  )}
                  <span
                    className={`text-sm font-medium ${
                      data.revenue.trend >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {Math.abs(data.revenue.trend).toFixed(1)}% vs mes anterior
                  </span>
                </div>
              </div>
              <DollarSign className="h-12 w-12 text-blue-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Conversiones</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                  {data.conversions.current}
                </p>
                <div className="flex items-center mt-2">
                  {data.conversions.trend >= 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-600 mr-1" />
                  )}
                  <span
                    className={`text-sm font-medium ${
                      data.conversions.trend >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {Math.abs(data.conversions.trend).toFixed(1)}% vs mes anterior
                  </span>
                </div>
              </div>
              <Target className="h-12 w-12 text-green-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Nuevos Clientes</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                  {data.clients.current}
                </p>
                <div className="flex items-center mt-2">
                  {data.clients.trend >= 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-600 mr-1" />
                  )}
                  <span
                    className={`text-sm font-medium ${
                      data.clients.trend >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {Math.abs(data.clients.trend).toFixed(1)}% vs mes anterior
                  </span>
                </div>
              </div>
              <Users className="h-12 w-12 text-purple-600 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Tendencia de Ingresos</CardTitle>
          </CardHeader>
          <CardContent>
            <Chart data={data.monthlyRevenue} type="line" height={300} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Funnel de Conversión</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.conversionFunnel.map((stage) => (
                <div key={stage.stage}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {stage.stage}
                    </span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {stage.count} ({stage.percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 transition-all duration-500"
                      style={{ width: `${stage.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Services */}
      <Card>
        <CardHeader>
          <CardTitle>Top Servicios por Ingresos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.topServices.map((service, index) => (
              <div key={service.name} className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
                <div className="flex items-center space-x-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/20">
                    <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                      #{index + 1}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{service.name}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {service.count} cotizaciones
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900 dark:text-white">
                    ${service.revenue.toLocaleString('es-MX')}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

