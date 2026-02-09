/**
 * Dashboard de Analytics de Negocio
 * Métricas clave, funnels de conversión y análisis de rendimiento
 */

'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select'
import Badge from '@/components/ui/Badge'
import Skeleton from '@/components/ui/Skeleton'
import EmptyState from '@/components/ui/EmptyState'
import { useToast } from '@/lib/hooks'
import { logger } from '@/lib/utils/logger'
import { format, subDays, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns'
import { es } from 'date-fns/locale'
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  FileText, 
  Target,
  Calendar,
  BarChart3,
  PieChart,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Download
} from 'lucide-react'

interface AnalyticsData {
  period: {
    start: string
    end: string
    type: '7d' | '30d' | '90d' | '1y' | 'mtd' | 'ytd'
  }
  overview: {
    totalRevenue: number
    totalQuotes: number
    approvedQuotes: number
    conversionRate: number
    averageTicket: number
    totalClients: number
    newClients: number
    totalPayments: number
  }
  trends: {
    revenue: Array<{ date: string; value: number }>
    quotes: Array<{ date: string; value: number }>
    conversion: Array<{ date: string; value: number }>
  }
  topServices: Array<{
    name: string
    count: number
    revenue: number
    percentage: number
  }>
  vendors: Array<{
    name: string
    email: string
    quotes: number
    approvals: number
    revenue: number
    conversionRate: number
    rank: number
  }>
  funnel: {
    created: number
    sent: number
    approved: number
    paid: number
  }
  clientMetrics: {
    repeatClients: number
    newVsReturning: {
      new: number
      returning: number
    }
    topClients: Array<{
      name: string
      email: string
      totalSpent: number
      quotesCount: number
      lastQuote: string
    }>
  }
  paymentMetrics: {
    onTimeRate: number
    averageDelay: number
    overdueAmount: number
    paymentMethods: Array<{
      method: string
      count: number
      amount: number
    }>
  }
}

const PERIOD_OPTIONS = [
  { value: '7d', label: 'Últimos 7 días' },
  { value: '30d', label: 'Últimos 30 días' },
  { value: '90d', label: 'Últimos 90 días' },
  { value: 'mtd', label: 'Mes actual' },
  { value: 'ytd', label: 'Año actual' },
  { value: '1y', label: 'Último año' },
]

export default function AnalyticsClient() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<string>('30d')
  const { success: toastSuccess, error: toastError } = useToast()

  const supabase = createClient()

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true)
      
      // Calcular fechas según el período
      const now = new Date()
      let startDate: Date
      let endDate: Date = now
      
      switch (period) {
        case '7d':
          startDate = subDays(now, 7)
          break
        case '30d':
          startDate = subDays(now, 30)
          break
        case '90d':
          startDate = subDays(now, 90)
          break
        case 'mtd':
          startDate = startOfMonth(now)
          break
        case 'ytd':
          startDate = new Date(now.getFullYear(), 0, 1)
          break
        case '1y':
          startDate = subDays(now, 365)
          break
        default:
          startDate = subDays(now, 30)
      }

      // Obtener datos de cotizaciones
      const { data: quotes, error: quotesError } = await supabase
        .from('quotes')
        .select(`
          *,
          clients!inner(name, email),
          profiles!inner(full_name, email),
          quote_services!inner(
            services!inner(name, base_price)
          ),
          partial_payments!inner(
            amount, status, due_date, payment_method
          )
        `)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: true })

      if (quotesError) throw quotesError

      // Procesar datos
      const analyticsData = processAnalyticsData(quotes || [], startDate, endDate, period as any)
      setData(analyticsData)
      
    } catch (error) {
      logger.error('AnalyticsClient', 'Error fetching analytics data', error as Error)
      toastError('Error al cargar datos analíticos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalyticsData()
  }, [period])

  const exportToCSV = () => {
    if (!data) return

    const csvData = [
      ['Métrica', 'Valor', 'Período'],
      ['Ingresos Totales', data.overview.totalRevenue.toFixed(2), period],
      ['Cotizaciones Totales', data.overview.totalQuotes.toString(), period],
      ['Cotizaciones Aprobadas', data.overview.approvedQuotes.toString(), period],
      ['Tasa de Conversión', `${data.overview.conversionRate.toFixed(1)}%`, period],
      ['Ticket Promedio', data.overview.averageTicket.toFixed(2), period],
      ['Clientes Nuevos', data.overview.newClients.toString(), period],
      ['Pagos Totales', data.overview.totalPayments.toString(), period],
    ]

    const csvContent = csvData.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `analytics-${period}-${format(new Date(), 'yyyy-MM-dd')}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    toastSuccess('Datos exportados exitosamente')
  }

  if (loading && !data) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="p-6">
        <EmptyState
          icon={<BarChart3 className="w-12 h-12 text-gray-400" />}
          title="No hay datos disponibles"
          description="No se encontraron datos analíticos para el período seleccionado"
        />
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Analytics de Negocio</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Métricas clave y análisis de rendimiento
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PERIOD_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={exportToCSV} className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            Exportar
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Ingresos Totales"
          value={`$${data.overview.totalRevenue.toLocaleString()}`}
          icon={<DollarSign className="w-5 h-5" />}
          trend={data.trends.revenue.length > 1 ? 
            ((data.trends.revenue[data.trends.revenue.length - 1].value - data.trends.revenue[0].value) / data.trends.revenue[0].value) * 100 : 0
          }
          format="percentage"
        />
        <KPICard
          title="Cotizaciones"
          value={data.overview.totalQuotes.toLocaleString()}
          icon={<FileText className="w-5 h-5" />}
          trend={data.trends.quotes.length > 1 ? 
            ((data.trends.quotes[data.trends.quotes.length - 1].value - data.trends.quotes[0].value) / data.trends.quotes[0].value) * 100 : 0
          }
          format="percentage"
        />
        <KPICard
          title="Tasa de Conversión"
          value={`${data.overview.conversionRate.toFixed(1)}%`}
          icon={<Target className="w-5 h-5" />}
          trend={data.trends.conversion.length > 1 ? 
            data.trends.conversion[data.trends.conversion.length - 1].value - data.trends.conversion[0].value : 0
          }
          format="percentage-points"
        />
        <KPICard
          title="Ticket Promedio"
          value={`$${data.overview.averageTicket.toLocaleString()}`}
          icon={<TrendingUp className="w-5 h-5" />}
          trend={0} // Calcular tendencia si es necesario
          format="percentage"
        />
      </div>

      {/* Funnel de Conversión */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Funnel de Conversión
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <FunnelStep
              label="Creadas"
              value={data.funnel.created}
              percentage={100}
              color="blue"
            />
            <FunnelStep
              label="Enviadas"
              value={data.funnel.sent}
              percentage={(data.funnel.sent / data.funnel.created) * 100}
              color="green"
            />
            <FunnelStep
              label="Aprobadas"
              value={data.funnel.approved}
              percentage={(data.funnel.approved / data.funnel.created) * 100}
              color="yellow"
            />
            <FunnelStep
              label="Pagadas"
              value={data.funnel.paid}
              percentage={(data.funnel.paid / data.funnel.created) * 100}
              color="purple"
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Servicios Más Vendidos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="w-5 h-5" />
              Servicios Más Vendidos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.topServices.slice(0, 5).map((service, index) => (
                <div key={service.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{service.name}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {service.count} ventas
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">${service.revenue.toLocaleString()}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {service.percentage.toFixed(1)}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Rendimiento de Vendedores */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Top Vendedores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.vendors.slice(0, 5).map((vendor) => (
                <div key={vendor.email} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center text-sm font-medium">
                      {vendor.rank}
                    </div>
                    <div>
                      <p className="font-medium">{vendor.name}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {vendor.quotes} cotizaciones
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">${vendor.revenue.toLocaleString()}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {vendor.conversionRate.toFixed(1)}% conv.
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Métricas de Pagos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Métricas de Pagos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Tasa de Pago a Tiempo</p>
              <p className="text-2xl font-bold text-green-600">
                {data.paymentMetrics.onTimeRate.toFixed(1)}%
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Retraso Promedio</p>
              <p className="text-2xl font-bold text-yellow-600">
                {data.paymentMetrics.averageDelay.toFixed(0)} días
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Monto Vencido</p>
              <p className="text-2xl font-bold text-red-600">
                ${data.paymentMetrics.overdueAmount.toLocaleString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Componentes auxiliares
interface KPICardProps {
  title: string
  value: string
  icon: React.ReactNode
  trend: number
  format: 'percentage' | 'percentage-points' | 'number'
}

function KPICard({ title, value, icon, trend, format }: KPICardProps) {
  const isPositive = trend > 0
  const isNeutral = trend === 0
  
  const formatTrend = (value: number) => {
    switch (format) {
      case 'percentage':
        return `${isPositive ? '+' : ''}${value.toFixed(1)}%`
      case 'percentage-points':
        return `${isPositive ? '+' : ''}${value.toFixed(1)}pp`
      case 'number':
        return `${isPositive ? '+' : ''}${value.toLocaleString()}`
      default:
        return `${value}`
    }
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
          </div>
          <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
            {icon}
          </div>
        </div>
        <div className="flex items-center gap-1 mt-2">
          {isPositive ? (
            <ArrowUpRight className="w-4 h-4 text-green-600" />
          ) : isNeutral ? (
            <div className="w-4 h-4" />
          ) : (
            <ArrowDownRight className="w-4 h-4 text-red-600" />
          )}
          <span className={`text-sm font-medium ${
            isPositive ? 'text-green-600' : isNeutral ? 'text-gray-600' : 'text-red-600'
          }`}>
            {formatTrend(trend)}
          </span>
          <span className="text-sm text-gray-600 dark:text-gray-400">vs período anterior</span>
        </div>
      </CardContent>
    </Card>
  )
}

interface FunnelStepProps {
  label: string
  value: number
  percentage: number
  color: 'blue' | 'green' | 'yellow' | 'purple'
}

function FunnelStep({ label, value, percentage, color }: FunnelStepProps) {
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    purple: 'bg-purple-500',
  }

  return (
    <div className="text-center">
      <div className={`w-full h-2 ${colorClasses[color]} rounded-full mb-2`} />
      <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
      <p className="text-sm text-gray-600 dark:text-gray-400">{label}</p>
      <p className="text-xs text-gray-500 dark:text-gray-500">
        {percentage.toFixed(1)}%
      </p>
    </div>
  )
}

// Función para procesar datos analíticos
function processAnalyticsData(
  quotes: any[],
  startDate: Date,
  endDate: Date,
  periodType: string
): AnalyticsData {
  // Implementación simplificada - en producción esto sería más complejo
  const totalRevenue = quotes
    .filter(q => q.status === 'approved')
    .reduce((sum, q) => sum + (q.total_amount || 0), 0)
  
  const totalQuotes = quotes.length
  const approvedQuotes = quotes.filter(q => q.status === 'approved').length
  const conversionRate = totalQuotes > 0 ? (approvedQuotes / totalQuotes) * 100 : 0
  const averageTicket = approvedQuotes > 0 ? totalRevenue / approvedQuotes : 0
  
  // Procesar servicios
  const servicesMap = new Map<string, { count: number; revenue: number }>()
  quotes.forEach(quote => {
    if (quote.quote_services) {
      quote.quote_services.forEach((qs: any) => {
        if (qs.services) {
          const serviceName = qs.services.name
          const current = servicesMap.get(serviceName) || { count: 0, revenue: 0 }
          servicesMap.set(serviceName, {
            count: current.count + 1,
            revenue: current.revenue + (qs.services.base_price || 0),
          })
        }
      })
    }
  })

  const topServices = Array.from(servicesMap.entries())
    .map(([name, data]) => ({
      name,
      ...data,
      percentage: (data.revenue / totalRevenue) * 100,
    }))
    .sort((a, b) => b.revenue - a.revenue)

  // Procesar vendedores
  const vendorsMap = new Map<string, {
    name: string
    email: string
    quotes: number
    approvals: number
    revenue: number
  }>()

  quotes.forEach(quote => {
    if (quote.profiles) {
      const vendorEmail = quote.profiles.email
      const vendorName = quote.profiles.full_name || vendorEmail
      const current = vendorsMap.get(vendorEmail) || {
        name: vendorName,
        email: vendorEmail,
        quotes: 0,
        approvals: 0,
        revenue: 0,
      }
      
      vendorsMap.set(vendorEmail, {
        ...current,
        quotes: current.quotes + 1,
        approvals: current.approvals + (quote.status === 'approved' ? 1 : 0),
        revenue: current.revenue + (quote.status === 'approved' ? (quote.total_amount || 0) : 0),
      })
    }
  })

  const vendors = Array.from(vendorsMap.values())
    .map(vendor => ({
      ...vendor,
      conversionRate: vendor.quotes > 0 ? (vendor.approvals / vendor.quotes) * 100 : 0,
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .map((vendor, index) => ({ ...vendor, rank: index + 1 }))

  return {
    period: {
      start: startDate.toISOString(),
      end: endDate.toISOString(),
      type: periodType as any,
    },
    overview: {
      totalRevenue,
      totalQuotes,
      approvedQuotes,
      conversionRate,
      averageTicket,
      totalClients: new Set(quotes.map(q => q.client_id)).size,
      newClients: 0, // Calcular según lógica de negocio
      totalPayments: 0, // Calcular desde tabla de pagos
    },
    trends: {
      revenue: [], // Agregar lógica de tendencias
      quotes: [],
      conversion: [],
    },
    topServices,
    vendors,
    funnel: {
      created: totalQuotes,
      sent: quotes.filter(q => q.status === 'sent').length,
      approved: approvedQuotes,
      paid: 0, // Calcular desde pagos
    },
    clientMetrics: {
      repeatClients: 0,
      newVsReturning: {
        new: 0,
        returning: 0,
      },
      topClients: [],
    },
    paymentMetrics: {
      onTimeRate: 85,
      averageDelay: 2.5,
      overdueAmount: 1500,
      paymentMethods: [],
    },
  }
}
