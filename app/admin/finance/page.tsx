'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { logger } from '@/lib/utils/logger'
import { useToast } from '@/lib/hooks'
import PageHeader from '@/components/ui/PageHeader'
import FinanceSummaryCards from '@/components/finance/FinanceSummaryCards'
import FinanceLedgerTable, { type FinanceEntry } from '@/components/finance/FinanceLedgerTable'
import AddFinanceEntryDialog from '@/components/finance/AddFinanceEntryDialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import Skeleton from '@/components/ui/Skeleton'

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
    // Implementar exportación a CSV/Excel
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
      <div className="space-y-6">
        <PageHeader
          title="Finanzas"
          description="Resumen financiero y análisis de ingresos y gastos"
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Finanzas"
        description="Resumen financiero y análisis de ingresos y gastos"
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Finanzas' },
        ]}
      />

      {/* Summary Cards */}
      <FinanceSummaryCards
        totalIncome={totalIncome}
        totalExpense={totalExpense}
        netBalance={netBalance}
        balancePercentage={balancePercentage}
        loading={loading}
      />

      {/* Ledger Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Registro de Movimientos
          </h2>
          <AddFinanceEntryDialog onSuccess={handleEntryAdded} />
        </div>
        <FinanceLedgerTable
          data={financeData}
          loading={loading}
          onExport={handleExport}
        />
      </div>

      {/* Analysis Card - Solo si hay datos */}
      {financeData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Análisis: Ingresos vs Gastos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Income Bar */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Ingresos
                  </span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {new Intl.NumberFormat('es-MX', {
                      style: 'currency',
                      currency: 'MXN',
                      minimumFractionDigits: 2,
                    }).format(totalIncome)}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-10 overflow-hidden">
                  <div
                    className="bg-green-600 h-10 rounded-full flex items-center justify-end pr-4 transition-all duration-500"
                    style={{
                      width: `${totalIncome > 0 ? Math.min((totalIncome / (totalIncome + totalExpense || 1)) * 100, 100) : 0}%`,
                    }}
                  >
                    {totalIncome > 0 && (
                      <span className="text-white text-sm font-medium">
                        {totalIncome + totalExpense > 0
                          ? ((totalIncome / (totalIncome + totalExpense)) * 100).toFixed(1)
                          : 0}%
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Expense Bar */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Gastos
                  </span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {new Intl.NumberFormat('es-MX', {
                      style: 'currency',
                      currency: 'MXN',
                      minimumFractionDigits: 2,
                    }).format(totalExpense)}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-10 overflow-hidden">
                  <div
                    className="bg-red-600 h-10 rounded-full flex items-center justify-end pr-4 transition-all duration-500"
                    style={{
                      width: `${totalExpense > 0 ? Math.min((totalExpense / (totalIncome + totalExpense || 1)) * 100, 100) : 0}%`,
                    }}
                  >
                    {totalExpense > 0 && (
                      <span className="text-white text-sm font-medium">
                        {totalIncome + totalExpense > 0
                          ? ((totalExpense / (totalIncome + totalExpense)) * 100).toFixed(1)
                          : 0}%
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Net Balance */}
              <div className="pt-6 border-t border-gray-200 dark:border-gray-800">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-900 dark:text-white">
                    Balance Neto:
                  </span>
                  <span
                    className={`text-2xl font-bold ${
                      netBalance >= 0
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}
                  >
                    {new Intl.NumberFormat('es-MX', {
                      style: 'currency',
                      currency: 'MXN',
                      minimumFractionDigits: 2,
                    }).format(netBalance)}
                  </span>
                </div>
                {totalIncome > 0 && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    Margen: {balancePercentage.toFixed(1)}%
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
