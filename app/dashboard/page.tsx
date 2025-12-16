import { createClient } from '@/utils/supabase/server'
import StatsCard from '@/components/ui/StatsCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import Chart from '@/components/ui/Chart'
import { DollarSign, TrendingUp, FileText, Calendar } from 'lucide-react'
import Link from 'next/link'
import Button from '@/components/ui/Button'
import { Plus } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return <div className="p-8 text-center text-red-600">Usuario no autenticado</div>
  }

  // Obtener estadísticas
  const [salesResult, quotesResult, recentQuotesResult] = await Promise.all([
    supabase
      .from('quotes')
      .select('total_price, created_at')
      .eq('vendor_id', user.id)
      .eq('status', 'confirmed'),
    supabase
      .from('quotes')
      .select('id, status')
      .eq('vendor_id', user.id),
    supabase
      .from('quotes')
      .select('id, client_name, total_price, status, created_at')
      .eq('vendor_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  const sales = salesResult.data || []
  const quotes = quotesResult.data || []
  const recentQuotes = recentQuotesResult.data || []

  const totalSales = sales.reduce((acc, sale) => acc + (sale.total_price || 0), 0)
  const commissionRate = 0.1
  const totalCommissions = totalSales * commissionRate
  
  const pendingQuotes = quotes.filter(q => q.status === 'pending').length
  const confirmedQuotes = quotes.filter(q => q.status === 'confirmed').length

  // Calcular ventas del mes actual
  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()
  const monthlySales = sales
    .filter(sale => {
      const saleDate = new Date(sale.created_at)
      return saleDate.getMonth() === currentMonth && saleDate.getFullYear() === currentYear
    })
    .reduce((acc, sale) => acc + (sale.total_price || 0), 0)

  // Datos para gráfico de ventas mensuales (últimos 6 meses)
  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const date = new Date(currentYear, currentMonth - i, 1)
    const monthName = date.toLocaleDateString('es-MX', { month: 'short' })
    const monthSales = sales
      .filter(sale => {
        const saleDate = new Date(sale.created_at)
        return saleDate.getMonth() === date.getMonth() && saleDate.getFullYear() === date.getFullYear()
      })
      .reduce((acc, sale) => acc + (sale.total_price || 0), 0)
    return { name: monthName, value: monthSales }
  }).reverse()

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Resumen de tus ventas y cotizaciones
          </p>
        </div>
        <Link href="/dashboard/quotes/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nueva Cotización
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
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
        />
        <StatsCard
          title="Ventas del Mes"
          value={monthlySales}
          icon={<Calendar className="h-6 w-6 text-purple-600" />}
          description="Mes actual"
        />
        <StatsCard
          title="Cotizaciones"
          value={quotes.length}
          icon={<FileText className="h-6 w-6 text-orange-600" />}
          description={`${pendingQuotes} pendientes, ${confirmedQuotes} confirmadas`}
        />
      </div>

      {/* Sales Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Ventas Mensuales</CardTitle>
        </CardHeader>
        <CardContent>
          <Chart data={monthlyData} type="bar" height={300} />
        </CardContent>
      </Card>

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
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {quote.client_name || 'Cliente sin nombre'}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {new Date(quote.created_at).toLocaleDateString('es-MX', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900 dark:text-white">
                        ${(quote.total_price || 0).toLocaleString('es-MX', {
                          minimumFractionDigits: 2,
                        })}
                      </p>
                      <span
                        className={`inline-block mt-1 px-2 py-1 text-xs rounded-full ${
                          quote.status === 'confirmed'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : quote.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                        }`}
                      >
                        {quote.status === 'confirmed' ? 'Confirmada' : 'Pendiente'}
                      </span>
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


