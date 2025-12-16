'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { logger } from '@/lib/utils/logger'
import { useToast } from '@/lib/hooks'
import PageHeader from '@/components/ui/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import StatsCard from '@/components/ui/StatsCard'
import { DollarSign, TrendingUp, TrendingDown } from 'lucide-react'
import Skeleton from '@/components/ui/Skeleton'

interface FinanceEntry {
  id: string
  amount: number
  type: 'income' | 'expense'
  description: string
  created_at: string
}

export default function AdminFinancePage() {
  const [financeData, setFinanceData] = useState<FinanceEntry[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const { error: toastError } = useToast()

  useEffect(() => {
    loadFinanceData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadFinanceData = async () => {
    try {
      const { data, error } = await supabase
        .from('finance_ledger')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(30)

      if (error) {
        // Convertir error de Supabase a Error estándar
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

  const totalIncome = financeData
    .filter((entry) => entry.type === 'income')
    .reduce((sum, entry) => sum + entry.amount, 0)

  const totalExpense = financeData
    .filter((entry) => entry.type === 'expense')
    .reduce((sum, entry) => sum + entry.amount, 0)

  const maxAmount = Math.max(totalIncome, totalExpense, 1)

  const netBalance = totalIncome - totalExpense
  const balancePercentage = totalIncome > 0 ? (netBalance / totalIncome) * 100 : 0

  if (loading) {
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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatsCard
          title="Ingresos Totales"
          value={totalIncome}
          icon={<TrendingUp className="h-6 w-6 text-green-600" />}
          description="Todos los ingresos registrados"
        />
        <StatsCard
          title="Gastos Totales"
          value={totalExpense}
          icon={<TrendingDown className="h-6 w-6 text-red-600" />}
          description="Todos los gastos registrados"
        />
        <StatsCard
          title="Balance Neto"
          value={netBalance}
          icon={<DollarSign className="h-6 w-6 text-blue-600" />}
          description={balancePercentage >= 0 ? 'Positivo' : 'Negativo'}
          trend={balancePercentage >= 0 ? 'up' : 'down'}
        />
      </div>

      {/* Chart Card */}
      <Card>
        <CardHeader>
          <CardTitle>Análisis: Ingresos vs Gastos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Income Bar */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Ingresos</span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  ${totalIncome.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-10 overflow-hidden">
                <div
                  className="bg-green-600 h-10 rounded-full flex items-center justify-end pr-4 transition-all duration-500"
                  style={{ width: `${(totalIncome / maxAmount) * 100}%` }}
                >
                  {totalIncome > 0 && (
                    <span className="text-white text-sm font-medium">
                      {((totalIncome / maxAmount) * 100).toFixed(1)}%
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Expense Bar */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Gastos</span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  ${totalExpense.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-10 overflow-hidden">
                <div
                  className="bg-red-600 h-10 rounded-full flex items-center justify-end pr-4 transition-all duration-500"
                  style={{ width: `${(totalExpense / maxAmount) * 100}%` }}
                >
                  {totalExpense > 0 && (
                    <span className="text-white text-sm font-medium">
                      {((totalExpense / maxAmount) * 100).toFixed(1)}%
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Net Balance */}
            <div className="pt-6 border-t border-gray-200 dark:border-gray-800">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-gray-900 dark:text-white">Balance Neto:</span>
                <span
                  className={`text-2xl font-bold ${
                    netBalance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                  }`}
                >
                  ${netBalance.toLocaleString('es-MX', {
                    minimumFractionDigits: 2,
                  })}
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
    </div>
  )
}
