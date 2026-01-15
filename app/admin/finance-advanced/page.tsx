'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { logger } from '@/lib/utils/logger'
import { useToast } from '@/lib/hooks'
import PageHeader from '@/components/ui/PageHeader'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs'
import Skeleton from '@/components/ui/Skeleton'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Chart from '@/components/ui/Chart'
import {
  DollarSign,
  TrendingUp,
  AlertTriangle,
  BarChart3,
  LineChart,
  Download,
  Calendar,
  Target,
  Users,
  Package,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  FileText,
} from 'lucide-react'
import {
  getExecutiveFinancialSummary,
  getFinancialAlerts,
  getMonthlyComparisonWithPercentages,
  getAdvancedCashFlowProjection,
  getServiceProfitability,
  getClientProfitability,
  getProfitabilityAnalysis,
  type ExecutiveFinancialSummary,
  type FinancialAlert,
  type MonthlyComparison,
  type CashFlowProjection,
  type ServiceProfitability,
  type ClientProfitability,
  type ProfitabilityAnalysis,
} from '@/lib/utils/advancedFinance'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { cn } from '@/lib/utils/cn'

type IdleRequestCallback = (deadline: { didTimeout: boolean; timeRemaining: () => number }) => void
type WindowWithIdleCallback = Window & {
  requestIdleCallback?: (callback: IdleRequestCallback, options?: { timeout: number }) => number
}

// Helper para ejecutar trabajo pesado sin bloquear la UI
const runInBackground = (callback: () => void | Promise<void>) => {
  if (typeof window !== 'undefined') {
    const windowWithIdle = window as WindowWithIdleCallback
    if (windowWithIdle.requestIdleCallback) {
      // Usar requestIdleCallback si está disponible (mejor rendimiento)
      windowWithIdle.requestIdleCallback(() => {
        void callback()
      }, { timeout: 1000 })
      return
    }
  }

  // Fallback a setTimeout para navegadores que no soportan requestIdleCallback
  setTimeout(callback, 0)
}

export default function AdvancedFinancePage() {
  const [loading, setLoading] = useState(true)
  const [executiveSummary, setExecutiveSummary] = useState<ExecutiveFinancialSummary | null>(null)
  const [alerts, setAlerts] = useState<FinancialAlert[]>([])
  const [monthlyComparison, setMonthlyComparison] = useState<MonthlyComparison[]>([])
  const [cashFlowProjection, setCashFlowProjection] = useState<CashFlowProjection[]>([])
  const [serviceProfitability, setServiceProfitability] = useState<ServiceProfitability[]>([])
  const [clientProfitability, setClientProfitability] = useState<ClientProfitability[]>([])
  const [profitabilityAnalysis, setProfitabilityAnalysis] = useState<ProfitabilityAnalysis | null>(null)
  const [selectedPeriod, setSelectedPeriod] = useState<'30' | '60' | '90'>('90')
  const [isExporting, setIsExporting] = useState(false)
  const { success: toastSuccess, error: toastError } = useToast()

  const loadAllData = useCallback(async () => {
    try {
      setLoading(true)
      
      const [
        summaryData,
        alertsData,
        monthlyData,
        cashFlowData,
        servicesData,
        clientsData,
        analysisData,
      ] = await Promise.all([
        getExecutiveFinancialSummary(),
        getFinancialAlerts(),
        getMonthlyComparisonWithPercentages(12),
        getAdvancedCashFlowProjection(Number(selectedPeriod)),
        getServiceProfitability(),
        getClientProfitability(),
        getProfitabilityAnalysis(),
      ])
      
      setExecutiveSummary(summaryData)
      setAlerts(alertsData)
      setMonthlyComparison(monthlyData)
      setCashFlowProjection(cashFlowData)
      setServiceProfitability(servicesData)
      setClientProfitability(clientsData)
      setProfitabilityAnalysis(analysisData)
    } catch (error) {
      logger.error('AdvancedFinancePage', 'Error loading financial data', error instanceof Error ? error : new Error(String(error)))
      toastError('Error al cargar los datos financieros')
    } finally {
      setLoading(false)
    }
  }, [selectedPeriod, toastError])

  useEffect(() => {
    loadAllData()
  }, [loadAllData])

  // Memoizar datos de exportación para evitar recálculos
  const exportData = useMemo(() => ({
    executiveSummary,
    monthlyComparison,
    serviceProfitability,
    clientProfitability,
    cashFlowProjection,
    profitabilityAnalysis,
  }), [executiveSummary, monthlyComparison, serviceProfitability, clientProfitability, cashFlowProjection, profitabilityAnalysis])

  // Optimizar handleExport: mover trabajo pesado fuera del event handler
  const handleExport = useCallback(async (exportFormat: 'pdf' | 'excel' | 'csv') => {
    if (isExporting) return // Prevenir múltiples exportaciones simultáneas
    
    setIsExporting(true)
    
    // Usar setTimeout para mover el trabajo pesado fuera del event handler
    // Esto permite que React actualice la UI antes de procesar
    setTimeout(async () => {
      try {
        const { exportToCSV, exportToExcel, exportToPDF, downloadCSV } = await import('@/lib/utils/exportFinancialReports')
        
        // Procesar exportación en el siguiente tick del event loop
        if (exportFormat === 'csv') {
          runInBackground(() => {
            const csvContent = exportToCSV(exportData)
            downloadCSV(csvContent, `reporte-financiero-${format(new Date(), 'yyyy-MM-dd')}.csv`)
            toastSuccess('Reporte CSV descargado exitosamente')
            setIsExporting(false)
          })
        } else if (exportFormat === 'excel') {
          runInBackground(() => {
            exportToExcel(exportData)
            toastSuccess('Reporte Excel descargado exitosamente')
            setIsExporting(false)
          })
        } else if (exportFormat === 'pdf') {
          runInBackground(async () => {
            await exportToPDF(exportData)
            toastSuccess('Reporte PDF descargado exitosamente')
            setIsExporting(false)
          })
        }
      } catch (error) {
        logger.error('AdvancedFinancePage', 'Error exporting report', error instanceof Error ? error : new Error(String(error)))
        toastError('Error al exportar el reporte')
        setIsExporting(false)
      }
    }, 0)
  }, [exportData, isExporting, toastSuccess, toastError])

  // Optimizar setSelectedPeriod para evitar re-renders innecesarios
  const handlePeriodChange = useCallback((period: '30' | '60' | '90') => {
    setSelectedPeriod(period)
  }, [])

  // Memoizar datos para gráficos para evitar recálculos innecesarios
  const monthlyChartData = useMemo(() => 
    monthlyComparison.slice(0, 6).reverse().map((m) => ({
      name: m.monthName,
      Ventas: m.totalSales,
      Utilidad: m.totalProfit,
      'Cambio %': m.salesChangePercent,
    })), [monthlyComparison]
  )

  const cashFlowChartData = useMemo(() => 
    cashFlowProjection.slice(0, 30).map((cf) => ({
      name: format(new Date(cf.date), 'dd MMM', { locale: es }),
      Entrada: cf.totalInflow,
      Salida: cf.totalOutflow,
      Neto: cf.netFlow,
      Balance: cf.cumulativeBalance,
    })), [cashFlowProjection]
  )

  const serviceProfitChartData = useMemo(() => 
    serviceProfitability.slice(0, 10).map((s) => ({
      name: s.serviceName.length > 20 ? s.serviceName.substring(0, 20) + '...' : s.serviceName,
      Utilidad: s.totalProfit,
      Ventas: s.totalRevenue,
      Margen: s.marginPercent,
    })), [serviceProfitability]
  )

  if (loading) {
    return (
      <div className="space-y-8 p-6 lg:p-8">
        <PageHeader
          title="Finanzas Avanzadas"
          description="Análisis financiero completo y proyecciones"
        />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    )
  }

  return (
    <div className="space-y-8 p-6 lg:p-8">
      <PageHeader
        title="Finanzas Avanzadas"
        description="Análisis financiero completo, proyecciones y rentabilidad"
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Finanzas Avanzadas' },
        ]}
      />

      {/* Alertas Financieras */}
      {alerts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {alerts.map((alert, idx) => (
            <Card
              key={idx}
              variant="elevated"
              className={cn(
                "border-2",
                alert.alertLevel === 'CRITICAL' ? "border-red-500 dark:border-red-700 bg-red-50 dark:bg-red-950/20" :
                alert.alertLevel === 'HIGH' ? "border-orange-500 dark:border-orange-700 bg-orange-50 dark:bg-orange-950/20" :
                alert.alertLevel === 'MEDIUM' ? "border-amber-500 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/20" :
                "border-yellow-500 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-950/20"
              )}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className={cn(
                    "h-5 w-5 mt-0.5 flex-shrink-0",
                    alert.alertLevel === 'CRITICAL' ? "text-red-600 dark:text-red-400" :
                    alert.alertLevel === 'HIGH' ? "text-orange-600 dark:text-orange-400" :
                    alert.alertLevel === 'MEDIUM' ? "text-amber-600 dark:text-amber-400" :
                    "text-yellow-600 dark:text-yellow-400"
                  )} />
                  <div className="flex-1">
                    <Badge
                      variant={
                        alert.alertLevel === 'CRITICAL' ? 'error' :
                        alert.alertLevel === 'HIGH' ? 'error' :
                        alert.alertLevel === 'MEDIUM' ? 'warning' : 'warning'
                      }
                      size="sm"
                      className="mb-2"
                    >
                      {alert.alertLevel}
                    </Badge>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                      {alert.alertMessage}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Valor: {new Intl.NumberFormat('es-MX', {
                        style: 'currency',
                        currency: 'MXN',
                      }).format(alert.alertValue)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Resumen Ejecutivo */}
      {executiveSummary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card variant="elevated" className="border-2 border-emerald-200 dark:border-emerald-800">
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
                    }).format(executiveSummary.monthlySales)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    {executiveSummary.monthlyQuotes} cotizaciones
                  </p>
                </div>
                <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg">
                  <DollarSign className="h-7 w-7 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card variant="elevated" className="border-2 border-blue-200 dark:border-blue-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Utilidad del Mes
                  </p>
                  <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                    {new Intl.NumberFormat('es-MX', {
                      style: 'currency',
                      currency: 'MXN',
                      minimumFractionDigits: 0,
                    }).format(executiveSummary.monthlyProfit)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Margen: {executiveSummary.monthlySales > 0 
                      ? ((executiveSummary.monthlyProfit / executiveSummary.monthlySales) * 100).toFixed(1)
                      : 0}%
                  </p>
                </div>
                <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shadow-lg">
                  <TrendingUp className="h-7 w-7 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card variant="elevated" className="border-2 border-amber-200 dark:border-amber-800">
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
                    }).format(executiveSummary.totalPending)}
                  </p>
                  <p className="text-xs text-red-600 dark:text-red-400 mt-2">
                    {executiveSummary.totalOverdue > 0 && (
                      <span>{new Intl.NumberFormat('es-MX', {
                        style: 'currency',
                        currency: 'MXN',
                        minimumFractionDigits: 0,
                      }).format(executiveSummary.totalOverdue)} vencidos</span>
                    )}
                  </p>
                </div>
                <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg">
                  <Clock className="h-7 w-7 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card variant="elevated" className="border-2 border-purple-200 dark:border-purple-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Clientes Activos
                  </p>
                  <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                    {executiveSummary.monthlyClients}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Ticket promedio: {new Intl.NumberFormat('es-MX', {
                      style: 'currency',
                      currency: 'MXN',
                      minimumFractionDigits: 0,
                    }).format(executiveSummary.averageQuoteValue)}
                  </p>
                </div>
                <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-purple-500 to-violet-500 flex items-center justify-center shadow-lg">
                  <Users className="h-7 w-7 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs con Análisis Avanzados */}
      <Tabs defaultValue="overview" className="space-y-6">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="overview">Resumen</TabsTrigger>
            <TabsTrigger value="cashflow">Flujo de Caja</TabsTrigger>
            <TabsTrigger value="profitability">Rentabilidad</TabsTrigger>
            <TabsTrigger value="comparison">Comparativas</TabsTrigger>
            <TabsTrigger value="reports">Reportes</TabsTrigger>
          </TabsList>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => handleExport('pdf')}
              disabled={isExporting}
            >
              <Download className="h-4 w-4 mr-2" />
              {isExporting ? 'Exportando...' : 'PDF'}
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => handleExport('excel')}
              disabled={isExporting}
            >
              <Download className="h-4 w-4 mr-2" />
              {isExporting ? 'Exportando...' : 'Excel'}
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => handleExport('csv')}
              disabled={isExporting}
            >
              <Download className="h-4 w-4 mr-2" />
              {isExporting ? 'Exportando...' : 'CSV'}
            </Button>
          </div>
        </div>

        {/* Tab: Resumen */}
        <TabsContent value="overview" className="space-y-6">
          {/* Análisis de Rentabilidad General */}
          {profitabilityAnalysis && (
            <Card variant="elevated">
              <CardHeader className="bg-gradient-to-r from-indigo-50 to-violet-50 dark:from-indigo-950/30 dark:to-violet-950/30">
                <CardTitle className="text-xl flex items-center gap-2">
                  <Target className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  Análisis de Rentabilidad
                </CardTitle>
                <CardDescription>
                  Métricas generales de rentabilidad del negocio
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Ingresos Totales
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {new Intl.NumberFormat('es-MX', {
                        style: 'currency',
                        currency: 'MXN',
                      }).format(profitabilityAnalysis.totalRevenue)}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Utilidad Total
                    </p>
                    <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                      {new Intl.NumberFormat('es-MX', {
                        style: 'currency',
                        currency: 'MXN',
                      }).format(profitabilityAnalysis.totalProfit)}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Margen: {profitabilityAnalysis.marginPercent.toFixed(1)}%
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Ticket Promedio
                    </p>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {new Intl.NumberFormat('es-MX', {
                        style: 'currency',
                        currency: 'MXN',
                      }).format(profitabilityAnalysis.averageQuoteValue)}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {profitabilityAnalysis.totalQuotes} cotizaciones
                    </p>
                  </div>
                </div>

                {(profitabilityAnalysis.topServiceName || profitabilityAnalysis.topClientName) && (
                  <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-800 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {profitabilityAnalysis.topServiceName && (
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                          Servicio Más Rentable
                        </p>
                        <div className="flex items-center gap-3">
                          <Package className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-white">
                              {profitabilityAnalysis.topServiceName}
                            </p>
                            <p className="text-sm text-emerald-600 dark:text-emerald-400">
                              {new Intl.NumberFormat('es-MX', {
                                style: 'currency',
                                currency: 'MXN',
                              }).format(profitabilityAnalysis.topServiceProfit)}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                    {profitabilityAnalysis.topClientName && (
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                          Cliente Más Valioso
                        </p>
                        <div className="flex items-center gap-3">
                          <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-white">
                              {profitabilityAnalysis.topClientName}
                            </p>
                            <p className="text-sm text-blue-600 dark:text-blue-400">
                              {new Intl.NumberFormat('es-MX', {
                                style: 'currency',
                                currency: 'MXN',
                              }).format(profitabilityAnalysis.topClientRevenue)}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Gráfico de Comparativa Mensual */}
          {monthlyChartData.length > 0 && (
            <Card variant="elevated">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30">
                <CardTitle className="text-xl flex items-center gap-2">
                  <LineChart className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  Tendencia Mensual (Últimos 6 Meses)
                </CardTitle>
                <CardDescription>
                  Ventas y utilidad con porcentajes de cambio
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <Chart
                  type="line"
                  data={monthlyChartData}
                  dataKeys={['Ventas', 'Utilidad']}
                  height={350}
                  showLegend
                />
                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                  {monthlyComparison.slice(0, 3).map((month, idx) => (
                    <div key={idx} className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                        {month.monthName}
                      </p>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">
                        {new Intl.NumberFormat('es-MX', {
                          style: 'currency',
                          currency: 'MXN',
                          minimumFractionDigits: 0,
                        }).format(month.totalSales)}
                      </p>
                      {month.salesChangePercent !== 0 && (
                        <div className="flex items-center gap-1 mt-1">
                          {month.salesChangePercent > 0 ? (
                            <ArrowUpRight className="h-3 w-3 text-emerald-600" />
                          ) : (
                            <ArrowDownRight className="h-3 w-3 text-red-600" />
                          )}
                          <span className={cn(
                            "text-xs font-medium",
                            month.salesChangePercent > 0 ? "text-emerald-600" : "text-red-600"
                          )}>
                            {Math.abs(month.salesChangePercent).toFixed(1)}%
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Tab: Flujo de Caja */}
        <TabsContent value="cashflow" className="space-y-6">
          <Card variant="elevated">
            <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    Proyección de Flujo de Efectivo
                  </CardTitle>
                  <CardDescription>
                    Proyección de entradas y salidas de efectivo
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={selectedPeriod === '30' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handlePeriodChange('30')}
                    disabled={isExporting}
                  >
                    30 días
                  </Button>
                  <Button
                    variant={selectedPeriod === '60' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handlePeriodChange('60')}
                    disabled={isExporting}
                  >
                    60 días
                  </Button>
                  <Button
                    variant={selectedPeriod === '90' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handlePeriodChange('90')}
                    disabled={isExporting}
                  >
                    90 días
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {cashFlowChartData.length > 0 ? (
                <>
                  <Chart
                    type="line"
                    data={cashFlowChartData}
                    dataKeys={['Entrada', 'Salida', 'Neto']}
                    height={400}
                    showLegend
                  />
                  <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/20">
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                        Total Entradas
                      </p>
                      <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                        {new Intl.NumberFormat('es-MX', {
                          style: 'currency',
                          currency: 'MXN',
                          minimumFractionDigits: 0,
                        }).format(
                          cashFlowProjection.reduce((sum, cf) => sum + cf.totalInflow, 0)
                        )}
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950/20">
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                        Total Salidas
                      </p>
                      <p className="text-xl font-bold text-red-600 dark:text-red-400">
                        {new Intl.NumberFormat('es-MX', {
                          style: 'currency',
                          currency: 'MXN',
                          minimumFractionDigits: 0,
                        }).format(
                          cashFlowProjection.reduce((sum, cf) => sum + cf.totalOutflow, 0)
                        )}
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20">
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                        Flujo Neto
                      </p>
                      <p className={cn(
                        "text-xl font-bold",
                        cashFlowProjection.reduce((sum, cf) => sum + cf.netFlow, 0) >= 0
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-red-600 dark:text-red-400"
                      )}>
                        {new Intl.NumberFormat('es-MX', {
                          style: 'currency',
                          currency: 'MXN',
                          minimumFractionDigits: 0,
                        }).format(
                          cashFlowProjection.reduce((sum, cf) => sum + cf.netFlow, 0)
                        )}
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-indigo-50 dark:bg-indigo-950/20">
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                        Balance Final
                      </p>
                      <p className={cn(
                        "text-xl font-bold",
                        cashFlowProjection.length > 0 && cashFlowProjection[cashFlowProjection.length - 1].cumulativeBalance >= 0
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-red-600 dark:text-red-400"
                      )}>
                        {cashFlowProjection.length > 0 && new Intl.NumberFormat('es-MX', {
                          style: 'currency',
                          currency: 'MXN',
                          minimumFractionDigits: 0,
                        }).format(
                          cashFlowProjection[cashFlowProjection.length - 1].cumulativeBalance
                        )}
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  No hay datos de proyección disponibles
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Rentabilidad */}
        <TabsContent value="profitability" className="space-y-6">
          {/* Rentabilidad por Servicio */}
          <Card variant="elevated">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-950/30 dark:to-violet-950/30">
              <CardTitle className="text-xl flex items-center gap-2">
                <Package className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                Rentabilidad por Servicio
              </CardTitle>
              <CardDescription>
                Análisis de rentabilidad de cada servicio
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {serviceProfitChartData.length > 0 ? (
                <>
                  <Chart
                    type="bar"
                    data={serviceProfitChartData}
                    dataKeys={['Utilidad', 'Ventas']}
                    height={400}
                    showLegend
                  />
                  <div className="mt-6 space-y-2">
                    {serviceProfitability.slice(0, 5).map((service) => (
                      <div
                        key={service.serviceId}
                        className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                      >
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {service.serviceName}
                          </p>
                          <div className="flex items-center gap-4 mt-2">
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              Vendido: {service.timesSold} veces
                            </span>
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              Margen: {service.marginPercent.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                            {new Intl.NumberFormat('es-MX', {
                              style: 'currency',
                              currency: 'MXN',
                              minimumFractionDigits: 0,
                            }).format(service.totalProfit)}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Utilidad total
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  No hay datos de rentabilidad por servicio
                </div>
              )}
            </CardContent>
          </Card>

          {/* Rentabilidad por Cliente */}
          <Card variant="elevated">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30">
              <CardTitle className="text-xl flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                Rentabilidad por Cliente (Top 10)
              </CardTitle>
              <CardDescription>
                Clientes más valiosos por ventas y utilidad
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {clientProfitability.length > 0 ? (
                <div className="space-y-3">
                  {clientProfitability.slice(0, 10).map((client, idx) => (
                    <div
                      key={client.clientId}
                      className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white font-bold">
                          {idx + 1}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {client.clientName}
                          </p>
                          <div className="flex items-center gap-4 mt-1">
                            <span className="text-xs text-gray-600 dark:text-gray-400">
                              {client.confirmedQuotes} cotizaciones
                            </span>
                            <span className="text-xs text-gray-600 dark:text-gray-400">
                              Ticket promedio: {new Intl.NumberFormat('es-MX', {
                                style: 'currency',
                                currency: 'MXN',
                                minimumFractionDigits: 0,
                              }).format(client.averageQuoteValue)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                          {new Intl.NumberFormat('es-MX', {
                            style: 'currency',
                            currency: 'MXN',
                            minimumFractionDigits: 0,
                          }).format(client.totalSales)}
                        </p>
                        <p className="text-xs text-emerald-600 dark:text-emerald-400">
                          Utilidad: {new Intl.NumberFormat('es-MX', {
                            style: 'currency',
                            currency: 'MXN',
                            minimumFractionDigits: 0,
                          }).format(client.totalProfit)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  No hay datos de rentabilidad por cliente
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Comparativas */}
        <TabsContent value="comparison" className="space-y-6">
          <Card variant="elevated">
            <CardHeader className="bg-gradient-to-r from-indigo-50 to-violet-50 dark:from-indigo-950/30 dark:to-violet-950/30">
              <CardTitle className="text-xl flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                Comparativa Mensual Detallada
              </CardTitle>
              <CardDescription>
                Comparación mes a mes con porcentajes de cambio
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {monthlyComparison.length > 0 ? (
                <div className="space-y-4">
                  {monthlyComparison.map((month, idx) => (
                    <div
                      key={idx}
                      className="p-5 rounded-xl bg-gradient-to-r from-gray-50 to-white dark:from-gray-800/50 dark:to-gray-900 border border-gray-200 dark:border-gray-700"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <p className="text-lg font-bold text-gray-900 dark:text-white">
                            {month.monthName}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {month.confirmedQuotes} cotizaciones • {month.uniqueClients} clientes
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                            {new Intl.NumberFormat('es-MX', {
                              style: 'currency',
                              currency: 'MXN',
                              minimumFractionDigits: 0,
                            }).format(month.totalSales)}
                          </p>
                          <p className="text-sm text-emerald-600 dark:text-emerald-400">
                            Utilidad: {new Intl.NumberFormat('es-MX', {
                              style: 'currency',
                              currency: 'MXN',
                              minimumFractionDigits: 0,
                            }).format(month.totalProfit)}
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                            Cambio Ventas
                          </p>
                          <div className="flex items-center gap-1">
                            {month.salesChangePercent > 0 ? (
                              <ArrowUpRight className="h-4 w-4 text-emerald-600" />
                            ) : month.salesChangePercent < 0 ? (
                              <ArrowDownRight className="h-4 w-4 text-red-600" />
                            ) : null}
                            <span className={cn(
                              "text-sm font-semibold",
                              month.salesChangePercent > 0 ? "text-emerald-600" :
                              month.salesChangePercent < 0 ? "text-red-600" :
                              "text-gray-600"
                            )}>
                              {month.salesChangePercent !== 0 ? `${Math.abs(month.salesChangePercent).toFixed(1)}%` : '0%'}
                            </span>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                            Cambio Utilidad
                          </p>
                          <div className="flex items-center gap-1">
                            {month.profitChangePercent > 0 ? (
                              <ArrowUpRight className="h-4 w-4 text-emerald-600" />
                            ) : month.profitChangePercent < 0 ? (
                              <ArrowDownRight className="h-4 w-4 text-red-600" />
                            ) : null}
                            <span className={cn(
                              "text-sm font-semibold",
                              month.profitChangePercent > 0 ? "text-emerald-600" :
                              month.profitChangePercent < 0 ? "text-red-600" :
                              "text-gray-600"
                            )}>
                              {month.profitChangePercent !== 0 ? `${Math.abs(month.profitChangePercent).toFixed(1)}%` : '0%'}
                            </span>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                            Margen
                          </p>
                          <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                            {month.marginPercent.toFixed(1)}%
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  No hay datos de comparativa disponibles
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Reportes */}
        <TabsContent value="reports" className="space-y-6">
          <Card variant="elevated">
            <CardHeader className="bg-gradient-to-r from-indigo-50 to-violet-50 dark:from-indigo-950/30 dark:to-violet-950/30">
              <CardTitle className="text-xl flex items-center gap-2">
                <Download className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                Exportar Reportes
              </CardTitle>
              <CardDescription>
                Genera reportes financieros en diferentes formatos
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button
                  variant="outline"
                  className="h-24 flex-col gap-2"
                  onClick={() => handleExport('pdf')}
                  disabled={isExporting}
                >
                  <FileText className="h-8 w-8 text-red-600" />
                  <span>Reporte PDF</span>
                  <span className="text-xs text-gray-500">Completo y detallado</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-24 flex-col gap-2"
                  onClick={() => handleExport('excel')}
                  disabled={isExporting}
                >
                  <BarChart3 className="h-8 w-8 text-green-600" />
                  <span>Reporte Excel</span>
                  <span className="text-xs text-gray-500">Para análisis</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-24 flex-col gap-2"
                  onClick={() => handleExport('csv')}
                  disabled={isExporting}
                >
                  <Download className="h-8 w-8 text-blue-600" />
                  <span>Reporte CSV</span>
                  <span className="text-xs text-gray-500">Datos puros</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

