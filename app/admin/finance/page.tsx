'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { logger } from '@/lib/utils/logger'
import { useToast } from '@/lib/hooks'
import PageHeader from '@/components/ui/PageHeader'
import FinanceSummaryCards from '@/components/finance/FinanceSummaryCards'
import FinanceLedgerTable, { type FinanceEntry } from '@/components/finance/FinanceLedgerTable'
import AddFinanceEntryDialog from '@/components/finance/AddFinanceEntryDialog'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import Skeleton from '@/components/ui/Skeleton'
import { TrendingUp, TrendingDown, DollarSign, BarChart3 } from 'lucide-react'

export default function AdminFinancePage() {
  const [financeData, setFinanceData] = useState<FinanceEntry[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const { success: toastSuccess, error: toastError } = useToast()

  useEffect(() => {
    loadFinanceData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadFinanceData = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('finance_ledger')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        const errorMessage = error?.message || 'Error loading finance data'
        const errorForLogging = error instanceof Error 
          ? error 
          : new Error(errorMessage)
        logger.error('AdminFinancePage', 'Error loading finance data', errorForLogging, {
          supabaseError: errorMessage,
          supabaseCode: error?.code,
        })
        toastError('Error al cargar los datos financieros')
      } else {
        setFinanceData(data || [])
      }
    } catch (err) {
      logger.error('AdminFinancePage', 'Unexpected error', err as Error)
      toastError('Error inesperado al cargar los datos financieros')
    } finally {
      setLoading(false)
    }
  }

  const handleEntryAdded = () => {
    toastSuccess('Movimiento agregado correctamente')
    loadFinanceData()
  }

  const handleExport = () => {
    toastSuccess('Funcionalidad de exportación próximamente')
  }

  const totalIncome = financeData
    .filter((entry) => entry.type === 'income')
    .reduce((sum, entry) => sum + Number(entry.amount), 0)

  const totalExpense = financeData
    .filter((entry) => entry.type === 'expense')
    .reduce((sum, entry) => sum + Number(entry.amount), 0)

  const netBalance = totalIncome - totalExpense
  const balancePercentage = totalIncome > 0 ? (netBalance / totalIncome) * 100 : 0

  if (loading && financeData.length === 0) {
    return (
      <div className="space-y-8 p-6 lg:p-8">
        <PageHeader
          title="Finanzas"
          description="Resumen financiero y análisis de ingresos y gastos"
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40 w-full rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    )
  }

  return (
    <div className="space-y-8 p-6 lg:p-8">
      {/* Premium Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
            Finanzas
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Resumen financiero y análisis de ingresos y gastos
          </p>
        </div>
        <AddFinanceEntryDialog onSuccess={handleEntryAdded} />
      </div>

      {/* Premium Summary Cards */}
      <FinanceSummaryCards
        totalIncome={totalIncome}
        totalExpense={totalExpense}
        netBalance={netBalance}
        balancePercentage={balancePercentage}
        loading={loading}
      />

      {/* Premium Ledger Table */}
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
            loading={loading}
            onExport={handleExport}
          />
        </CardContent>
      </Card>

      {/* Premium Analysis Card */}
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
              {/* Income Bar - Premium */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      Ingresos
                    </span>
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

              {/* Expense Bar - Premium */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-2">
                    <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      Gastos
                    </span>
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

              {/* Net Balance - Premium */}
              <div className="pt-6 border-t border-gray-200 dark:border-gray-800">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-950/30 dark:to-violet-950/30 flex items-center justify-center">
                      <DollarSign className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                      <span className="text-lg font-semibold text-gray-900 dark:text-white">
                        Balance Neto:
                      </span>
                      {totalIncome > 0 && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Margen: {balancePercentage.toFixed(1)}%
                        </p>
                      )}
                    </div>
                  </div>
                  <span
                    className={`text-3xl font-bold ${
                      netBalance >= 0
                        ? 'bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent'
                        : 'bg-gradient-to-r from-red-600 to-rose-600 bg-clip-text text-transparent'
                    }`}
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
    </div>
  )
}
