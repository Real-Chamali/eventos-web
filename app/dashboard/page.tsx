import { createClient } from '@/utils/supabase/server'
import StatsCard from '@/components/ui/StatsCard'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import Chart from '@/components/ui/Chart'
import Calendar from '@/components/ui/Calendar'
import { DollarSign, TrendingUp, FileText, Calendar as CalendarIcon, Target, Zap, Plus, ArrowRight, Sparkles } from 'lucide-react'
import Link from 'next/link'
import Button from '@/components/ui/Button'
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
      .limit(1000),
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
    <div className="space-y-8 p-6 lg:p-8">
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
          <Link href="/dashboard/quotes/new">
            <Button variant="premium" size="lg" className="shadow-lg hover:shadow-xl">
              <Plus className="mr-2 h-5 w-5" />
              Nueva Cotización
            </Button>
          </Link>
        </div>
      </div>

      {/* Premium Stats Grid - KPIs Principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Ventas Totales"
          value={totalSales}
          type="currency"
          icon={<DollarSign className="h-6 w-6" />}
          description="Todas las ventas confirmadas"
          variant="premium"
        />
        <StatsCard
          title="Comisiones"
          value={totalCommissions}
          type="currency"
          icon={<TrendingUp className="h-6 w-6" />}
          description={`${(commissionRate * 100).toFixed(0)}% de comisión`}
          trend="up"
        />
        <StatsCard
          title="Tasa de Conversión"
          value={Number(conversionRate)}
          type="percentage"
          icon={<Target className="h-6 w-6" />}
          description={`${confirmedQuotes} de ${quotes.length} cotizaciones`}
        />
        <StatsCard
          title="Promedio de Venta"
          value={averageSale}
          type="currency"
          icon={<Zap className="h-6 w-6" />}
          description="Por cotización confirmada"
        />
      </div>

      {/* Secondary Metrics - Cards Premium */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card variant="elevated" className="group hover:scale-[1.02] transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Cotizaciones Pendientes
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {pendingQuotes}
                </p>
              </div>
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 group-hover:scale-110 transition-transform duration-200">
                <FileText className="h-7 w-7 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="elevated" className="group hover:scale-[1.02] transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Ventas del Mes
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {new Intl.NumberFormat('es-MX', {
                    style: 'currency',
                    currency: 'MXN',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  }).format(monthlySales)}
                </p>
              </div>
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 group-hover:scale-110 transition-transform duration-200">
                <CalendarIcon className="h-7 w-7 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="elevated" className="group hover:scale-[1.02] transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Clientes
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {clients.length}
                </p>
              </div>
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 group-hover:scale-110 transition-transform duration-200">
                <TrendingUp className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

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
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <Chart data={monthlyData} type="bar" height={300} />
          </CardContent>
        </Card>
      </div>

      {/* Recent Quotes - Premium Table Card */}
      <Card variant="elevated" className="overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100/50 dark:from-gray-900/50 dark:to-gray-800/30 border-b border-gray-200/60 dark:border-gray-800/60">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">Cotizaciones Recientes</CardTitle>
              <CardDescription className="mt-1">Últimas 5 cotizaciones</CardDescription>
            </div>
            <Link href="/dashboard/quotes">
              <Button variant="ghost" size="sm" className="gap-2">
                Ver todas
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {recentQuotes.length === 0 ? (
            <div className="text-center py-12">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 dark:bg-gray-800 mb-4">
                <FileText className="h-8 w-8 text-gray-400 dark:text-gray-500" />
              </div>
              <p className="text-gray-500 dark:text-gray-400 font-medium">No hay cotizaciones recientes</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Crea tu primera cotización para comenzar</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentQuotes.map((quote) => (
                <Link
                  key={quote.id}
                  href={`/dashboard/quotes/${quote.id}`}
                  className="group block p-5 rounded-xl border border-gray-200/60 dark:border-gray-800/60 hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-gradient-to-r hover:from-indigo-50/50 hover:to-violet-50/50 dark:hover:from-indigo-950/20 dark:hover:to-violet-950/20 transition-all duration-200 hover:shadow-md"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-200">
                          <Sparkles className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                            {(quote.client as { name?: string })?.name || 'Cliente sin nombre'}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            {getStatusBadge(quote.status)}
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {new Date(quote.created_at).toLocaleDateString('es-MX', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <p className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                        {new Intl.NumberFormat('es-MX', {
                          style: 'currency',
                          currency: 'MXN',
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        }).format(Number(quote.total_price || 0))}
                      </p>
                      <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 ml-auto transition-colors" />
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
      return <Badge variant="success" size="sm">Confirmada</Badge>
    case 'cancelled':
      return <Badge variant="error" size="sm">Cancelada</Badge>
    case 'draft':
    default:
      return <Badge variant="warning" size="sm">Borrador</Badge>
  }
}
