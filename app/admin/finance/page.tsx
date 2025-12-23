'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/utils/supabase/client'
import { logger } from '@/lib/utils/logger'
import { useToast } from '@/lib/hooks'
import PageHeader from '@/components/ui/PageHeader'
import FinanceSummaryCards from '@/components/finance/FinanceSummaryCards'
import FinanceLedgerTable, { type FinanceEntry } from '@/components/finance/FinanceLedgerTable'
import AddFinanceEntryDialog from '@/components/finance/AddFinanceEntryDialog'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs'
import Skeleton from '@/components/ui/Skeleton'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Chart from '@/components/ui/Chart'
import { TrendingUp, TrendingDown, DollarSign, BarChart3, Download, Calendar, Target, Users, Package, ArrowUpRight, ArrowDownRight, Clock, FileText, AlertTriangle } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { cn } from '@/lib/utils/cn'
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

// Helper para ejecutar trabajo pesado sin bloquear la UI
const runInBackground = (callback: () => void | Promise<void>) => {
  if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
    ;(window as any).requestIdleCallback(callback, { timeout: 1000 })
  } else {
    setTimeout(callback, 0)
  }
}

export default function AdminFinancePage() {
  // Estados para ledger básico
  const [financeData, setFinanceData] = useState<FinanceEntry[]>([])
  const [loadingLedger, setLoadingLedger] = useState(true)
  const supabase = createClient()
  const { success: toastSuccess, error: toastError } = useToast()

  // Estados para análisis avanzado
  const [executiveSummary, setExecutiveSummary] = useState<ExecutiveFinancialSummary | null>(null)
  const [alerts, setAlerts] = useState<FinancialAlert[]>([])
  const [monthlyComparison, setMonthlyComparison] = useState<MonthlyComparison[]>([])
  const [cashFlowProjection, setCashFlowProjection] = useState<CashFlowProjection[]>([])
  const [serviceProfitability, setServiceProfitability] = useState<ServiceProfitability[]>([])
  const [clientProfitability, setClientProfitability] = useState<ClientProfitability[]>([])
  const [profitabilityAnalysis, setProfitabilityAnalysis] = useState<ProfitabilityAnalysis | null>(null)
  const [selectedPeriod, setSelectedPeriod] = useState<'30' | '60' | '90'>('90')
  const [isExporting, setIsExporting] = useState(false)
  const [loadingAdvanced, setLoadingAdvanced] = useState(false)

  useEffect(() => {
    loadFinanceData()
  }, [])

  useEffect(() => {
    loadAdvancedData()
  }, [selectedPeriod])

  const loadFinanceData = async () => {
    try {
      setLoadingLedger(true)
      const { data, error } = await supabase
        .from('finance_ledger')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        logger.error('AdminFinancePage', 'Error loading finance data', error as Error)
        toastError('Error al cargar los datos financieros')
      } else {
        setFinanceData(data || [])
      }
    } catch (err) {
      logger.error('AdminFinancePage', 'Unexpected error', err as Error)
      toastError('Error inesperado al cargar los datos financieros')
    } finally {
      setLoadingLedger(false)
    }
  }

  const loadAdvancedData = useCallback(async () => {
    try {
      setLoadingAdvanced(true)
      
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
      logger.error('AdminFinancePage', 'Error loading advanced financial data', error instanceof Error ? error : new Error(String(error)))
      toastError('Error al cargar los datos financieros avanzados')
    } finally {
      setLoadingAdvanced(false)
    }
  }, [selectedPeriod, toastError])

  const handleEntryAdded = () => {
    toastSuccess('Movimiento agregado correctamente')
    loadFinanceData()
  }

  const totalIncome = financeData
    .filter((entry) => entry.type === 'income')
    .reduce((sum, entry) => sum + Number(entry.amount), 0)

  const totalExpense = financeData
    .filter((entry) => entry.type === 'expense')
    .reduce((sum, entry) => sum + Number(entry.amount), 0)

  const netBalance = totalIncome - totalExpense
  const balancePercentage = totalIncome > 0 ? (netBalance / totalIncome) * 100 : 0

  // Memoizar datos de exportación
  const exportData = useMemo(() => ({
    executiveSummary,
    monthlyComparison,
    serviceProfitability,
    clientProfitability,
    cashFlowProjection,
    profitabilityAnalysis,
  }), [executiveSummary, monthlyComparison, serviceProfitability, clientProfitability, cashFlowProjection, profitabilityAnalysis])

  // Optimizar handleExport
  const handleExport = useCallback(async (exportFormat: 'pdf' | 'excel' | 'csv') => {
    if (isExporting) return
    
    setIsExporting(true)
    
    setTimeout(async () => {
      try {
        const { exportToCSV, exportToExcel, exportToPDF, downloadCSV } = await import('@/lib/utils/exportFinancialReports')
        
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
        logger.error('AdminFinancePage', 'Error exporting report', error instanceof Error ? error : new Error(String(error)))
        toastError('Error al exportar el reporte')
        setIsExporting(false)
      }
    }, 0)
  }, [exportData, isExporting, toastSuccess, toastError])

  const handlePeriodChange = useCallback((period: '30' | '60' | '90') => {
    setSelectedPeriod(period)
  }, [])

  // Preparar datos para gráficos
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

  return (
    <div className="space-y-8 p-6 lg:p-8">
      <PageHeader
        title="Finanzas"
        description="Resumen financiero, análisis avanzado y registro de movimientos"
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

      {/* Tabs con ambas funcionalidades */}
      <Tabs defaultValue="basic" className="space-y-6">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="basic">Registro Básico</TabsTrigger>
            <TabsTrigger value="advanced">Análisis Avanzado</TabsTrigger>
          </TabsList>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => handleExport('pdf')} disabled={isExporting}>
              <Download className="h-4 w-4 mr-2" />
              {isExporting ? 'Exportando...' : 'PDF'}
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleExport('excel')} disabled={isExporting}>
              <Download className="h-4 w-4 mr-2" />
              {isExporting ? 'Exportando...' : 'Excel'}
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleExport('csv')} disabled={isExporting}>
              <Download className="h-4 w-4 mr-2" />
              {isExporting ? 'Exportando...' : 'CSV'}
            </Button>
          </div>
        </div>

        {/* Tab: Registro Básico */}
        <TabsContent value="basic" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Registro de Movimientos</h2>
              <p className="text-gray-600 dark:text-gray-400">Ingresos y gastos básicos</p>
            </div>
            <AddFinanceEntryDialog onSuccess={handleEntryAdded} />
          </div>

          <FinanceSummaryCards
            totalIncome={totalIncome}
            totalExpense={totalExpense}
            netBalance={netBalance}
            balancePercentage={balancePercentage}
            loading={loadingLedger}
          />

          <Card variant="elevated" className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-indigo-50 to-violet-50 dark:from-indigo-950/30 dark:to-violet-950/30 border-b border-gray-200/60 dark:border-gray-800/60">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">Registro de Movimientos</CardTitle>
                  <CardDescription className="mt-1">
                    Historial completo de ingresos y gastos
                  </CardDescription>
                </div>
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shadow-lg">
                  <BarChart3 className="h-5 w-5 text-white" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <FinanceLedgerTable
                data={financeData}
                loading={loadingLedger}
                onExport={() => handleExport('csv')}
              />
            </CardContent>
          </Card>

          {financeData.length > 0 && (
            <Card variant="elevated" className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b border-gray-200/60 dark:border-gray-800/60">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl">Análisis: Ingresos vs Gastos</CardTitle>
                    <CardDescription className="mt-1">Comparativa visual de movimientos financieros</CardDescription>
                  </div>
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shadow-lg">
                    <BarChart3 className="h-5 w-5 text-white" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-8">
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">Ingresos</span>
                      </div>
                      <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                        {new Intl.NumberFormat('es-MX', {
                          style: 'currency',
                          currency: 'MXN',
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        }).format(totalIncome)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-xl h-12 overflow-hidden shadow-inner">
                      <div
                        className="bg-gradient-to-r from-emerald-500 to-teal-500 h-12 rounded-xl flex items-center justify-end pr-4 transition-all duration-500 shadow-md"
                        style={{
                          width: `${totalIncome > 0 ? Math.min((totalIncome / (totalIncome + totalExpense || 1)) * 100, 100) : 0}%`,
                        }}
                      >
                        {totalIncome > 0 && (
                          <span className="text-white text-sm font-bold">
                            {totalIncome + totalExpense > 0
                              ? ((totalIncome / (totalIncome + totalExpense)) * 100).toFixed(1)
                              : 0}%
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center gap-2">
                        <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">Gastos</span>
                      </div>
                      <span className="text-lg font-bold text-red-600 dark:text-red-400">
                        {new Intl.NumberFormat('es-MX', {
                          style: 'currency',
                          currency: 'MXN',
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        }).format(totalExpense)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-xl h-12 overflow-hidden shadow-inner">
                      <div
                        className="bg-gradient-to-r from-red-500 to-rose-500 h-12 rounded-xl flex items-center justify-end pr-4 transition-all duration-500 shadow-md"
                        style={{
                          width: `${totalExpense > 0 ? Math.min((totalExpense / (totalIncome + totalExpense || 1)) * 100, 100) : 0}%`,
                        }}
                      >
                        {totalExpense > 0 && (
                          <span className="text-white text-sm font-bold">
                            {totalIncome + totalExpense > 0
                              ? ((totalExpense / (totalIncome + totalExpense)) * 100).toFixed(1)
                              : 0}%
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="pt-6 border-t border-gray-200 dark:border-gray-800">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-950/30 dark:to-violet-950/30 flex items-center justify-center">
                          <DollarSign className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div>
                          <span className="text-lg font-semibold text-gray-900 dark:text-white">Balance Neto:</span>
                          {totalIncome > 0 && (
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Margen: {balancePercentage.toFixed(1)}%
                            </p>
                          )}
                        </div>
                      </div>
                      <span
                        className={cn(
                          "text-3xl font-bold",
                          netBalance >= 0
                            ? 'bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent'
                            : 'bg-gradient-to-r from-red-600 to-rose-600 bg-clip-text text-transparent'
                        )}
                      >
                        {new Intl.NumberFormat('es-MX', {
                          style: 'currency',
                          currency: 'MXN',
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        }).format(netBalance)}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Tab: Análisis Avanzado - Copiar contenido de finance-advanced */}
        <TabsContent value="advanced" className="space-y-6">
          {loadingAdvanced ? (
            <div className="space-y-6">
              <Skeleton className="h-32 w-full rounded-xl" />
              <Skeleton className="h-64 w-full rounded-xl" />
            </div>
          ) : (
            <>
              {/* Resumen Ejecutivo */}
              {executiveSummary && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Card variant="elevated" className="border-2 border-emerald-200 dark:border-emerald-800">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Ventas del Mes</p>
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
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Utilidad del Mes</p>
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
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Por Cobrar</p>
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
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Clientes Activos</p>
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

              {/* Análisis de Rentabilidad */}
              {profitabilityAnalysis && (
                <Card variant="elevated">
                  <CardHeader className="bg-gradient-to-r from-indigo-50 to-violet-50 dark:from-indigo-950/30 dark:to-violet-950/30">
                    <CardTitle className="text-xl flex items-center gap-2">
                      <Target className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                      Análisis de Rentabilidad
                    </CardTitle>
                    <CardDescription>Métricas generales de rentabilidad del negocio</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Ingresos Totales</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                          {new Intl.NumberFormat('es-MX', {
                            style: 'currency',
                            currency: 'MXN',
                          }).format(profitabilityAnalysis.totalRevenue)}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Utilidad Total</p>
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
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Ticket Promedio</p>
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
                  </CardContent>
                </Card>
              )}

              {/* Gráfico de Comparativa Mensual */}
              {monthlyChartData.length > 0 && (
                <Card variant="elevated">
                  <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30">
                    <CardTitle className="text-xl flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      Tendencia Mensual (Últimos 6 Meses)
                    </CardTitle>
                    <CardDescription>Ventas y utilidad con porcentajes de cambio</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <Chart
                      type="line"
                      data={monthlyChartData}
                      dataKeys={['Ventas', 'Utilidad']}
                      height={350}
                      showLegend
                    />
                  </CardContent>
                </Card>
              )}

              {/* Proyección de Flujo de Caja */}
              <Card variant="elevated">
                <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                        Proyección de Flujo de Efectivo
                      </CardTitle>
                      <CardDescription>Proyección de entradas y salidas de efectivo</CardDescription>
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
                    </>
                  ) : (
                    <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                      No hay datos de proyección disponibles
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
