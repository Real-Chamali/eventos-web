import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import StatsCard from '@/components/ui/StatsCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
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
} from 'lucide-react'

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
    <div className="space-y-6">
      <PageHeader
        title="Panel de Administración"
        description="Resumen general del sistema y métricas clave"
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Ingresos Totales"
          value={totalIncome}
          icon={<DollarSign className="h-6 w-6 text-green-600" />}
          description="Todos los ingresos registrados"
        />
        <StatsCard
          title="Balance Neto"
          value={netBalance}
          icon={<TrendingUp className="h-6 w-6 text-blue-600" />}
          description={`${totalIncome > 0 ? ((netBalance / totalIncome) * 100).toFixed(1) : 0}% margen`}
          trend={netBalance >= 0 ? 'up' : 'down'}
        />
        <StatsCard
          title="Eventos Totales"
          value={totalEvents}
          icon={<Calendar className="h-6 w-6 text-purple-600" />}
          description={`${confirmedQuotes} cotizaciones confirmadas`}
        />
        <StatsCard
          title="Servicios Activos"
          value={totalServices}
          icon={<Settings className="h-6 w-6 text-orange-600" />}
          description="Servicios disponibles"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Ventas Mensuales (Últimos 6 meses)</CardTitle>
          </CardHeader>
          <CardContent>
            <Chart
              data={monthlyData}
              dataKey="value"
              type="bar"
              height={300}
            />
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Accesos Rápidos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/admin/services">
              <Button variant="outline" className="w-full justify-between">
                <div className="flex items-center">
                  <Settings className="mr-2 h-4 w-4" />
                  Gestionar Servicios
                </div>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/admin/finance">
              <Button variant="outline" className="w-full justify-between">
                <div className="flex items-center">
                  <DollarSign className="mr-2 h-4 w-4" />
                  Ver Finanzas
                </div>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/dashboard/quotes">
              <Button variant="outline" className="w-full justify-between">
                <div className="flex items-center">
                  <FileText className="mr-2 h-4 w-4" />
                  Ver Cotizaciones
                </div>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/dashboard/calendar">
              <Button variant="outline" className="w-full justify-between">
                <div className="flex items-center">
                  <Calendar className="mr-2 h-4 w-4" />
                  Ver Calendario
                </div>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
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
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {recentQuotes.length > 0 ? (
            <div className="space-y-3">
              {recentQuotes.map((quote) => (
                <Link
                  key={quote.id}
                  href={`/dashboard/quotes/${quote.id}`}
                  className="block p-4 rounded-lg border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-white">
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
                    <div className="text-right">
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {new Intl.NumberFormat('es-MX', {
                          style: 'currency',
                          currency: 'MXN',
                          minimumFractionDigits: 2,
                        }).format(Number(quote.total_price || 0))}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                        {quote.status}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">
              No hay cotizaciones recientes
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
