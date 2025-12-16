import { createClient } from '@/utils/supabase/server'
import StatsCard from '@/components/ui/StatsCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import Chart from '@/components/ui/Chart'
import Calendar from '@/components/ui/Calendar'
import PageHeader from '@/components/ui/PageHeader'
import { DollarSign, TrendingUp, FileText, Calendar as CalendarIcon, Target, Zap } from 'lucide-react'
import Link from 'next/link'
import Button from '@/components/ui/Button'
import { Plus } from 'lucide-react'
import Badge from '@/components/ui/Badge'

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return <div className="p-8 text-center text-red-600">Usuario no autenticado</div>
  }

  // Obtener estadísticas completas
  const [salesResult, quotesResult, recentQuotesResult, clientsResult] = await Promise.all([
    supabase
      .from('quotes')
      .select('total_price, created_at')
      .eq('vendor_id', user.id)
      .eq('status', 'confirmed'),
    supabase.from('quotes').select('id, status, created_at').eq('vendor_id', user.id),
    supabase
      .from('quotes')
      .select('id, total_price, status, created_at, client:clients(name)')
      .eq('vendor_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('clients')
      .select('id')
      .limit(1000), // Obtener todos los clientes disponibles
  ])

  const sales = salesResult.data || []
  const quotes = quotesResult.data || []
  const recentQuotes = recentQuotesResult.data || []
  const clients = clientsResult.data || []

  // Calcular métricas
  const totalSales = sales.reduce((acc, sale) => acc + (sale.total_price || 0), 0)
  const commissionRate = 0.1
  const totalCommissions = totalSales * commissionRate

  const pendingQuotes = quotes.filter((q) => q.status === 'draft').length
  const confirmedQuotes = quotes.filter((q) => q.status === 'confirmed').length
  const cancelledQuotes = quotes.filter((q) => q.status === 'cancelled').length

  // Calcular ventas del mes actual
  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()
  const monthlySales = sales
    .filter((sale) => {
      const saleDate = new Date(sale.created_at)
      return saleDate.getMonth() === currentMonth && saleDate.getFullYear() === currentYear
    })
    .reduce((acc, sale) => acc + (sale.total_price || 0), 0)

  // Calcular tasa de conversión
  const conversionRate =
    quotes.length > 0 ? ((confirmedQuotes / quotes.length) * 100).toFixed(1) : '0'

  // Calcular promedio de venta
  const averageSale = confirmedQuotes > 0 ? totalSales / confirmedQuotes : 0

  // Datos para gráfico de ventas mensuales (últimos 6 meses)
  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const date = new Date(currentYear, currentMonth - i, 1)
    const monthName = date.toLocaleDateString('es-MX', { month: 'short' })
    const monthSales = sales
      .filter((sale) => {
        const saleDate = new Date(sale.created_at)
        return (
          saleDate.getMonth() === date.getMonth() &&
          saleDate.getFullYear() === date.getFullYear()
        )
      })
      .reduce((acc, sale) => acc + (sale.total_price || 0), 0)
    return { name: monthName, value: monthSales }
  }).reverse()

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Resumen de tus ventas, cotizaciones y métricas clave"
      />

      {/* Quick Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/dashboard/quotes/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nueva Cotización
            </Button>
          </Link>
          <Link href="/dashboard/clients/new">
            <Button variant="outline">
              Nuevo Cliente
            </Button>
          </Link>
        </div>
        <Link href="/dashboard/analytics">
          <Button variant="outline">
            Ver Analytics Avanzado
          </Button>
        </Link>
      </div>

      {/* Stats Grid - KPIs Reales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Ventas Totales"
          value={totalSales}
          icon={<DollarSign className="h-6 w-6 text-blue-600" />}
          description="Todas las ventas confirmadas"
        />
        <StatsCard
          title="Comisiones"
          value={totalCommissions}
          icon={<TrendingUp className="h-6 w-6 text-green-600" />}
          description={`${(commissionRate * 100).toFixed(0)}% de comisión`}
          trend="up"
        />
        <StatsCard
          title="Tasa de Conversión"
          value={`${conversionRate}%`}
          icon={<Target className="h-6 w-6 text-purple-600" />}
          description={`${confirmedQuotes} de ${quotes.length} cotizaciones`}
        />
        <StatsCard
          title="Promedio de Venta"
          value={averageSale}
          icon={<Zap className="h-6 w-6 text-orange-600" />}
          description="Por cotización confirmada"
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Cotizaciones Pendientes
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                  {pendingQuotes}
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-yellow-50 dark:bg-yellow-900/20">
                <FileText className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Ventas del Mes
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                  {new Intl.NumberFormat('es-MX', {
                    style: 'currency',
                    currency: 'MXN',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  }).format(monthlySales)}
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/20">
                <CalendarIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Clientes
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                  {clients.length}
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-50 dark:bg-green-900/20">
                <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Calendar and Chart Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Calendar */}
        <Card>
          <CardHeader>
            <CardTitle>Calendario de Eventos</CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar />
          </CardContent>
        </Card>

        {/* Sales Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Ventas Mensuales</CardTitle>
          </CardHeader>
          <CardContent>
            <Chart data={monthlyData} type="bar" height={300} />
          </CardContent>
        </Card>
      </div>

      {/* Recent Quotes */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Cotizaciones Recientes</CardTitle>
            <Link href="/dashboard/quotes">
              <Button variant="ghost" size="sm">
                Ver todas
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {recentQuotes.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No hay cotizaciones recientes
            </div>
          ) : (
            <div className="space-y-4">
              {recentQuotes.map((quote) => (
                <Link
                  key={quote.id}
                  href={`/dashboard/quotes/${quote.id}`}
                  className="block p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 dark:border-gray-800 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <p className="font-medium text-gray-900 dark:text-white">
                          {(quote.client as { name?: string })?.name || 'Cliente sin nombre'}
                        </p>
                        {getStatusBadge(quote.status)}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {new Date(quote.created_at).toLocaleDateString('es-MX', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {new Intl.NumberFormat('es-MX', {
                          style: 'currency',
                          currency: 'MXN',
                          minimumFractionDigits: 2,
                        }).format(Number(quote.total_price || 0))}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'confirmed':
      return <Badge variant="success">Confirmada</Badge>
    case 'cancelled':
      return <Badge variant="error">Cancelada</Badge>
    case 'draft':
    default:
      return <Badge variant="warning">Borrador</Badge>
  }
}
