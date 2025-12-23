/**
 * Componente de Reportes Financieros
 * Muestra ventas reales, pendientes, utilidad y comisiones
 */

'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table'
import Badge from '@/components/ui/Badge'
import Skeleton from '@/components/ui/Skeleton'
import { DollarSign, TrendingUp, AlertTriangle, Clock, FileText } from 'lucide-react'
import { getFinancialReport, calculateFinancialSummary, getOverduePayments, getUpcomingPayments } from '@/lib/utils/paymentIntelligence'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import type { FinancialReport, OverduePayment, UpcomingPayment } from '@/lib/utils/paymentIntelligence'
import { useAuth } from '@/lib/hooks'
import EmptyState from '@/components/ui/EmptyState'

export default function FinancialReports() {
  const [reports, setReports] = useState<FinancialReport[]>([])
  const [summary, setSummary] = useState<Awaited<ReturnType<typeof calculateFinancialSummary>> | null>(null)
  const [overdue, setOverdue] = useState<OverduePayment[]>([])
  const [upcoming, setUpcoming] = useState<UpcomingPayment[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    loadData()
  }, [user])

  const loadData = async () => {
    try {
      setLoading(true)
      const userId = user?.id
      
      const [reportsData, summaryData, overdueData, upcomingData] = await Promise.all([
        getFinancialReport(userId),
        calculateFinancialSummary(userId),
        getOverduePayments(userId),
        getUpcomingPayments(7, userId),
      ])
      
      setReports(reportsData)
      setSummary(summaryData)
      setOverdue(overdueData)
      setUpcoming(upcomingData)
    } catch (error) {
      console.error('Error loading financial data', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Resumen Ejecutivo */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card variant="elevated">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Ventas Reales</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {new Intl.NumberFormat('es-MX', {
                      style: 'currency',
                      currency: 'MXN',
                    }).format(summary.totalSales)}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
              </div>
            </CardContent>
          </Card>

          <Card variant="elevated">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pendientes</p>
                  <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                    {new Intl.NumberFormat('es-MX', {
                      style: 'currency',
                      currency: 'MXN',
                    }).format(summary.totalPending)}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-amber-600 dark:text-amber-400" />
              </div>
            </CardContent>
          </Card>

          <Card variant="elevated">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Utilidad</p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {new Intl.NumberFormat('es-MX', {
                      style: 'currency',
                      currency: 'MXN',
                    }).format(summary.totalProfit)}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card variant="elevated">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Comisiones</p>
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {new Intl.NumberFormat('es-MX', {
                      style: 'currency',
                      currency: 'MXN',
                    }).format(summary.totalCommissions)}
                  </p>
                </div>
                <FileText className="h-8 w-8 text-purple-600 dark:text-purple-400" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Pagos Vencidos */}
      {overdue.length > 0 && (
        <Card variant="elevated" className="border-red-200 dark:border-red-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <AlertTriangle className="h-5 w-5" />
              Pagos Vencidos ({overdue.length})
            </CardTitle>
            <CardDescription>
              Pagos que han pasado su fecha límite
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Vencido</TableHead>
                  <TableHead>Días</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {overdue.map((payment) => (
                  <TableRow key={payment.paymentId}>
                    <TableCell>{payment.clientName}</TableCell>
                    <TableCell>
                      {new Intl.NumberFormat('es-MX', {
                        style: 'currency',
                        currency: 'MXN',
                      }).format(payment.amount)}
                    </TableCell>
                    <TableCell>
                      {format(new Date(payment.dueDate), "dd MMM yyyy", { locale: es })}
                    </TableCell>
                    <TableCell>
                      <Badge variant="error" size="sm">
                        {payment.daysOverdue} días
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Pagos Próximos */}
      {upcoming.length > 0 && (
        <Card variant="elevated" className="border-amber-200 dark:border-amber-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
              <Clock className="h-5 w-5" />
              Pagos Próximos ({upcoming.length})
            </CardTitle>
            <CardDescription>
              Pagos que vencen en los próximos 7 días
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Vence</TableHead>
                  <TableHead>Días</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {upcoming.map((payment) => (
                  <TableRow key={payment.paymentId}>
                    <TableCell>{payment.clientName}</TableCell>
                    <TableCell>
                      {new Intl.NumberFormat('es-MX', {
                        style: 'currency',
                        currency: 'MXN',
                      }).format(payment.amount)}
                    </TableCell>
                    <TableCell>
                      {format(new Date(payment.dueDate), "dd MMM yyyy", { locale: es })}
                    </TableCell>
                    <TableCell>
                      <Badge variant={payment.daysUntilDue <= 3 ? 'error' : 'warning'} size="sm">
                        {payment.daysUntilDue} días
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Reporte Detallado */}
      <Card variant="elevated">
        <CardHeader>
          <CardTitle>Reporte Detallado</CardTitle>
          <CardDescription>
            Ventas, pagos, utilidad y comisiones por cotización
          </CardDescription>
        </CardHeader>
        <CardContent>
          {reports.length === 0 ? (
            <EmptyState
              icon={<FileText className="h-10 w-10" />}
              title="No hay datos financieros"
              description="Los reportes aparecerán cuando tengas cotizaciones confirmadas"
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Estado</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Pagado</TableHead>
                  <TableHead>Pendiente</TableHead>
                  <TableHead>Utilidad</TableHead>
                  <TableHead>Comisión</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((report) => (
                  <TableRow key={report.quoteId}>
                    <TableCell>
                      <Badge variant={
                        report.status === 'APPROVED' || report.status === 'confirmed' ? 'success' : 'warning'
                      }>
                        {report.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Intl.NumberFormat('es-MX', {
                        style: 'currency',
                        currency: 'MXN',
                      }).format(Number(report.totalAmount || 0))}
                    </TableCell>
                    <TableCell>
                      {new Intl.NumberFormat('es-MX', {
                        style: 'currency',
                        currency: 'MXN',
                      }).format(Number(report.totalPaid || 0))}
                    </TableCell>
                    <TableCell>
                      {new Intl.NumberFormat('es-MX', {
                        style: 'currency',
                        currency: 'MXN',
                      }).format(Number(report.balanceDue || 0))}
                    </TableCell>
                    <TableCell>
                      {new Intl.NumberFormat('es-MX', {
                        style: 'currency',
                        currency: 'MXN',
                      }).format(Number(report.estimatedProfit || 0))}
                    </TableCell>
                    <TableCell>
                      {new Intl.NumberFormat('es-MX', {
                        style: 'currency',
                        currency: 'MXN',
                      }).format(Number(report.estimatedCommission || 0))}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

