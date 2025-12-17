import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import StatsCard from '@/components/ui/StatsCard'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import PageHeader from '@/components/ui/PageHeader'
import Chart from '@/components/ui/Chart'
import Link from 'next/link'
import Button from '@/components/ui/Button'
import {
  DollarSign,
  TrendingUp,
  FileText,
  Calendar,
  Settings,
  ArrowRight,
  Shield,
  Sparkles,
} from 'lucide-react'
import Badge from '@/components/ui/Badge'

export default async function AdminPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Verificar que sea admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  if (profile?.role !== 'admin') {
    redirect('/dashboard')
  }

  // Obtener métricas
  const [
    quotesResult,
    eventsResult,
    financeResult,
    servicesResult,
    recentQuotesResult,
  ] = await Promise.all([
    supabase.from('quotes').select('id, total_price, status, created_at'),
    supabase.from('events').select('id, created_at'),
    supabase
      .from('finance_ledger')
      .select('amount, type')
      .order('created_at', { ascending: false })
      .limit(100),
    supabase.from('services').select('id'),
    supabase
      .from('quotes')
      .select('id, total_price, status, created_at, client:clients(name)')
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  const quotes = quotesResult.data || []
  const events = eventsResult.data || []
  const financeEntries = financeResult.data || []
  const services = servicesResult.data || []
  const recentQuotes = recentQuotesResult.data || []

  // Calcular métricas
  const confirmedQuotes = quotes.filter((q) => q.status === 'confirmed').length
  const totalEvents = events.length
  const totalServices = services.length

  const totalIncome = financeEntries
    .filter((e) => e.type === 'income')
    .reduce((sum, e) => sum + Number(e.amount || 0), 0)

  const totalExpense = financeEntries
    .filter((e) => e.type === 'expense')
    .reduce((sum, e) => sum + Number(e.amount || 0), 0)

  const netBalance = totalIncome - totalExpense

  // Ventas del mes actual
  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()

  // Datos para gráfico de ventas mensuales
  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const date = new Date(currentYear, currentMonth - 5 + i, 1)
    const monthSales = quotes
      .filter((q) => {
        if (q.status !== 'confirmed') return false
        const qDate = new Date(q.created_at)
        return qDate.getMonth() === date.getMonth() && qDate.getFullYear() === date.getFullYear()
      })
      .reduce((sum, q) => sum + Number(q.total_price || 0), 0)
    return {
      name: date.toLocaleDateString('es-MX', { month: 'short' }),
      value: monthSales,
    }
  })

  return (
    <div className="space-y-8 p-6 lg:p-8">
      {/* Premium Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
                Panel de Administración
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                Resumen general del sistema y métricas clave
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Premium Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Ingresos Totales"
          value={totalIncome}
          type="currency"
          icon={<DollarSign className="h-6 w-6" />}
          description="Todos los ingresos registrados"
          variant="premium"
        />
        <StatsCard
          title="Balance Neto"
          value={netBalance}
          type="currency"
          icon={<TrendingUp className="h-6 w-6" />}
          description={`${totalIncome > 0 ? ((netBalance / totalIncome) * 100).toFixed(1) : 0}% margen`}
          trend={netBalance >= 0 ? 'up' : 'down'}
        />
        <StatsCard
          title="Eventos Totales"
          value={totalEvents}
          icon={<Calendar className="h-6 w-6" />}
          description={`${confirmedQuotes} cotizaciones confirmadas`}
        />
        <StatsCard
          title="Servicios Activos"
          value={totalServices}
          icon={<Settings className="h-6 w-6" />}
          description="Servicios disponibles"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Premium Sales Chart */}
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
            <Chart
              data={monthlyData}
              dataKey="value"
              type="bar"
              height={300}
            />
          </CardContent>
        </Card>

        {/* Premium Quick Actions */}
        <Card variant="elevated" className="overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-indigo-50 to-violet-50 dark:from-indigo-950/30 dark:to-violet-950/30 border-b border-gray-200/60 dark:border-gray-800/60">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">Accesos Rápidos</CardTitle>
                <CardDescription className="mt-1">Navegación rápida a secciones principales</CardDescription>
              </div>
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shadow-lg">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-3">
            <Link href="/admin/services">
              <Button variant="outline" className="w-full justify-between group hover:scale-[1.02] transition-all duration-200">
                <div className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Gestionar Servicios
                </div>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
              </Button>
            </Link>
            <Link href="/admin/finance">
              <Button variant="outline" className="w-full justify-between group hover:scale-[1.02] transition-all duration-200">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Ver Finanzas
                </div>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
              </Button>
            </Link>
            <Link href="/dashboard/quotes">
              <Button variant="outline" className="w-full justify-between group hover:scale-[1.02] transition-all duration-200">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Ver Cotizaciones
                </div>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
              </Button>
            </Link>
            <Link href="/dashboard/calendar">
              <Button variant="outline" className="w-full justify-between group hover:scale-[1.02] transition-all duration-200">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Ver Calendario
                </div>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Premium Recent Quotes */}
      <Card variant="elevated" className="overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100/50 dark:from-gray-900/50 dark:to-gray-800/30 border-b border-gray-200/60 dark:border-gray-800/60">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">Cotizaciones Recientes</CardTitle>
              <CardDescription className="mt-1">Últimas 5 cotizaciones del sistema</CardDescription>
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
          {recentQuotes.length > 0 ? (
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
                          <FileText className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                            {(quote.client as { name?: string })?.name || 'Cliente no especificado'}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {new Date(quote.created_at).toLocaleDateString('es-MX', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="text-right space-y-2">
                      <p className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                        {new Intl.NumberFormat('es-MX', {
                          style: 'currency',
                          currency: 'MXN',
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        }).format(Number(quote.total_price || 0))}
                      </p>
                      <Badge
                        variant={
                          quote.status === 'confirmed'
                            ? 'success'
                            : quote.status === 'cancelled'
                            ? 'error'
                            : 'warning'
                        }
                        size="sm"
                      >
                        {quote.status === 'confirmed'
                          ? 'Confirmada'
                          : quote.status === 'cancelled'
                          ? 'Cancelada'
                          : 'Borrador'}
                      </Badge>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 dark:bg-gray-800 mb-4">
                <FileText className="h-8 w-8 text-gray-400 dark:text-gray-500" />
              </div>
              <p className="text-gray-500 dark:text-gray-400 font-medium">No hay cotizaciones recientes</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
