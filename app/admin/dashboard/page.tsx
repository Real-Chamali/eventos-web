/**
 * Dashboard del Dueño/Gerente
 * Control total con KPIs clave y análisis estratégico
 */

'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table'
import Badge from '@/components/ui/Badge'
import Skeleton from '@/components/ui/Skeleton'
import Button from '@/components/ui/Button'
import PageHeader from '@/components/ui/PageHeader'
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calendar,
  AlertTriangle,
  Users,
  BarChart3,
  FileText,
  Download,
  Eye,
  Clock,
  Target,
} from 'lucide-react'
import {
  getOwnerKPIs,
  getVendorPerformance,
  getMonthlyComparison,
  getEventsAtRisk,
  getCashFlowSummary,
  type OwnerKPIs,
  type VendorPerformance,
  type MonthlyComparison,
  type EventAtRisk,
  type CashFlowSummary,
} from '@/lib/utils/ownerDashboard'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/utils/cn'
import { logger } from '@/lib/utils/logger'

export default function OwnerDashboardPage() {
  const [kpis, setKpis] = useState<OwnerKPIs | null>(null)
  const [vendors, setVendors] = useState<VendorPerformance[]>([])
  const [monthlyComparison, setMonthlyComparison] = useState<MonthlyComparison[]>([])
  const [eventsAtRisk, setEventsAtRisk] = useState<EventAtRisk[]>([])
  const [cashFlow, setCashFlow] = useState<CashFlowSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      // Usar Promise.allSettled para que un error no bloquee los demás datos
      const results = await Promise.allSettled([
        getOwnerKPIs(),
        getVendorPerformance(),
        getMonthlyComparison(),
        getEventsAtRisk(),
        getCashFlowSummary(),
      ])
      
      // Procesar resultados, usando valores por defecto si alguna promesa falla
      setKpis(results[0].status === 'fulfilled' ? results[0].value : {
        monthlySales: 0,
        moneyToCollect: 0,
        eventsNext7Days: 0,
        eventsNext30Days: 0,
        eventsNext90Days: 0,
        eventsAtRisk: 0,
        confirmedEventsCount: 0,
        eventsAtRiskCount: 0,
      })
      setVendors(results[1].status === 'fulfilled' ? results[1].value : [])
      setMonthlyComparison(results[2].status === 'fulfilled' ? results[2].value : [])
      setEventsAtRisk(results[3].status === 'fulfilled' ? results[3].value : [])
      setCashFlow(results[4].status === 'fulfilled' ? results[4].value : null)
      
      // Log errores individuales sin bloquear la carga
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          const names = ['KPIs', 'Vendor Performance', 'Monthly Comparison', 'Events At Risk', 'Cash Flow']
          const error = result.reason instanceof Error ? result.reason : new Error(String(result.reason))
          logger.warn('OwnerDashboard', `Error loading ${names[index]}`, {
            error: error.message,
            stack: error.stack,
          })
        }
      })
    } catch (error) {
      logger.error('OwnerDashboard', 'Error loading dashboard data', error instanceof Error ? error : new Error(String(error)))
    } finally {
      setLoading(false)
    }
  }

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'CRITICAL':
        return 'bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-300 border-red-300 dark:border-red-800'
      case 'HIGH':
        return 'bg-orange-100 dark:bg-orange-950/30 text-orange-700 dark:text-orange-300 border-orange-300 dark:border-orange-800'
      case 'MEDIUM':
        return 'bg-yellow-100 dark:bg-yellow-950/30 text-yellow-700 dark:text-yellow-300 border-yellow-300 dark:border-yellow-800'
      default:
        return 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700'
    }
  }

  if (loading) {
    return (
      <div className="space-y-8 p-6 lg:p-8">
        <PageHeader
          title="Dashboard del Dueño"
          description="Control total del negocio"
        />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 p-6 lg:p-8">
      <PageHeader
        title="Dashboard del Dueño"
        description="Control total del negocio - Toma decisiones con datos, no con intuición"
      />

      {/* KPIs Principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card variant="elevated" className="border-emerald-200 dark:border-emerald-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Ventas del Mes
                </p>
                <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                  {new Intl.NumberFormat('es-MX', {
                    style: 'currency',
                    currency: 'MXN',
                    minimumFractionDigits: 0,
                  }).format(kpis?.monthlySales || 0)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Confirmadas
                </p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-emerald-100 dark:bg-emerald-950/30 flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="elevated" className="border-amber-200 dark:border-amber-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Por Cobrar
                </p>
                <p className="text-3xl font-bold text-amber-600 dark:text-amber-400">
                  {new Intl.NumberFormat('es-MX', {
                    style: 'currency',
                    currency: 'MXN',
                    minimumFractionDigits: 0,
                  }).format(kpis?.moneyToCollect || 0)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Pendiente
                </p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-amber-100 dark:bg-amber-950/30 flex items-center justify-center">
                <Clock className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="elevated" className="border-blue-200 dark:border-blue-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Eventos Próximos
                </p>
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                  {kpis?.eventsNext7Days || 0}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Próximos 7 días
                </p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-blue-100 dark:bg-blue-950/30 flex items-center justify-center">
                <Calendar className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="elevated" className="border-red-200 dark:border-red-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Eventos en Riesgo
                </p>
                <p className="text-3xl font-bold text-red-600 dark:text-red-400">
                  {kpis?.eventsAtRisk || 0}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Pagos atrasados
                </p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-red-100 dark:bg-red-950/30 flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Eventos en Riesgo */}
      {eventsAtRisk.length > 0 && (
        <Card variant="elevated" className="border-red-200 dark:border-red-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <AlertTriangle className="h-5 w-5" />
              Eventos en Riesgo ({eventsAtRisk.length})
            </CardTitle>
            <CardDescription>
              Eventos con pagos atrasados que requieren atención inmediata
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Pagado</TableHead>
                  <TableHead>Pendiente</TableHead>
                  <TableHead>Días Vencidos</TableHead>
                  <TableHead>Nivel de Riesgo</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {eventsAtRisk.map((event) => (
                  <TableRow key={event.eventId}>
                    <TableCell className="font-medium">{event.clientName}</TableCell>
                    <TableCell>
                      {new Intl.NumberFormat('es-MX', {
                        style: 'currency',
                        currency: 'MXN',
                      }).format(event.totalAmount)}
                    </TableCell>
                    <TableCell>
                      {new Intl.NumberFormat('es-MX', {
                        style: 'currency',
                        currency: 'MXN',
                      }).format(event.paidAmount)}
                    </TableCell>
                    <TableCell>
                      {new Intl.NumberFormat('es-MX', {
                        style: 'currency',
                        currency: 'MXN',
                      }).format(event.balanceDue)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={event.daysOverdue > 30 ? 'error' : 'warning'} size="sm">
                        {event.daysOverdue} días
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          event.riskLevel === 'CRITICAL' ? 'error' :
                          event.riskLevel === 'HIGH' ? 'error' : 'warning'
                        }
                        size="sm"
                      >
                        {event.riskLevel}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Link href={`/dashboard/quotes/${event.quoteId}`}>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Rendimiento de Vendedores */}
      <Card variant="elevated">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Rendimiento de Vendedores
          </CardTitle>
          <CardDescription>
            Métricas clave por vendedor para identificar a los más efectivos
          </CardDescription>
        </CardHeader>
        <CardContent>
          {vendors.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">
              No hay datos de vendedores disponibles
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vendedor</TableHead>
                  <TableHead>Cotizaciones Confirmadas</TableHead>
                  <TableHead>Ventas Totales</TableHead>
                  <TableHead>Ventas del Mes</TableHead>
                  <TableHead>Promedio</TableHead>
                  <TableHead>Tasa Conversión</TableHead>
                  <TableHead>Comisiones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vendors.map((vendor) => (
                  <TableRow key={vendor.vendorId}>
                    <TableCell className="font-medium">{vendor.vendorName}</TableCell>
                    <TableCell>{vendor.confirmedQuotes}</TableCell>
                    <TableCell>
                      {new Intl.NumberFormat('es-MX', {
                        style: 'currency',
                        currency: 'MXN',
                      }).format(vendor.totalSales)}
                    </TableCell>
                    <TableCell>
                      {new Intl.NumberFormat('es-MX', {
                        style: 'currency',
                        currency: 'MXN',
                      }).format(vendor.monthlySales)}
                    </TableCell>
                    <TableCell>
                      {new Intl.NumberFormat('es-MX', {
                        style: 'currency',
                        currency: 'MXN',
                      }).format(vendor.averageSale)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={vendor.conversionRate >= 50 ? 'success' : 'warning'} size="sm">
                        {vendor.conversionRate.toFixed(1)}%
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Intl.NumberFormat('es-MX', {
                        style: 'currency',
                        currency: 'MXN',
                      }).format(vendor.totalCommissions)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Comparación Mensual */}
      {monthlyComparison.length > 0 && (
        <Card variant="elevated">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Comparación Mensual
            </CardTitle>
            <CardDescription>
              Análisis de ventas y métricas de los últimos 12 meses
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mes</TableHead>
                  <TableHead>Cotizaciones</TableHead>
                  <TableHead>Ventas</TableHead>
                  <TableHead>Utilidad</TableHead>
                  <TableHead>Clientes Únicos</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {monthlyComparison.map((month) => (
                  <TableRow key={month.month}>
                    <TableCell className="font-medium">
                      {format(new Date(month.month), 'MMMM yyyy', { locale: es })}
                    </TableCell>
                    <TableCell>{month.confirmedQuotes}</TableCell>
                    <TableCell>
                      {new Intl.NumberFormat('es-MX', {
                        style: 'currency',
                        currency: 'MXN',
                      }).format(month.totalSales)}
                    </TableCell>
                    <TableCell>
                      {new Intl.NumberFormat('es-MX', {
                        style: 'currency',
                        currency: 'MXN',
                      }).format(month.totalProfit)}
                    </TableCell>
                    <TableCell>{month.uniqueClients}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Flujo de Efectivo */}
      {cashFlow && (
        <Card variant="elevated">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Flujo de Efectivo
            </CardTitle>
            <CardDescription>
              Proyección de ingresos y pagos pendientes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Total Recibido
                </p>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  {new Intl.NumberFormat('es-MX', {
                    style: 'currency',
                    currency: 'MXN',
                  }).format(cashFlow.totalReceived)}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Pendiente (30 días)
                </p>
                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                  {new Intl.NumberFormat('es-MX', {
                    style: 'currency',
                    currency: 'MXN',
                  }).format(cashFlow.paymentsDue30Days)}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Pendiente (90 días)
                </p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {new Intl.NumberFormat('es-MX', {
                    style: 'currency',
                    currency: 'MXN',
                  }).format(cashFlow.paymentsDue90Days)}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Vencidos
                </p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {new Intl.NumberFormat('es-MX', {
                    style: 'currency',
                    currency: 'MXN',
                  }).format(cashFlow.paymentsOverdue)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

