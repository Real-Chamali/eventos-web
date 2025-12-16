'use client'

import { Card, CardContent } from '@/components/ui/Card'
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface FinanceSummaryCardsProps {
  totalIncome: number
  totalExpense: number
  netBalance: number
  balancePercentage: number
  loading?: boolean
}

export default function FinanceSummaryCards({
  totalIncome,
  totalExpense,
  netBalance,
  balancePercentage,
  loading = false,
}: FinanceSummaryCardsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4" />
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Ingresos Totales */}
      <Card className="border-l-4 border-l-green-600 dark:border-l-green-500">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                Ingresos Totales
              </p>
              <p className="mt-3 text-3xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(totalIncome)}
              </p>
              <div className="mt-4 flex items-center space-x-2">
                <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Entradas registradas
                </span>
              </div>
            </div>
            <div className="ml-4 flex h-12 w-12 items-center justify-center rounded-lg bg-green-50 dark:bg-green-900/20">
              <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Egresos Totales */}
      <Card className="border-l-4 border-l-red-600 dark:border-l-red-500">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                Egresos Totales
              </p>
              <p className="mt-3 text-3xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(totalExpense)}
              </p>
              <div className="mt-4 flex items-center space-x-2">
                <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Salidas registradas
                </span>
              </div>
            </div>
            <div className="ml-4 flex h-12 w-12 items-center justify-center rounded-lg bg-red-50 dark:bg-red-900/20">
              <TrendingDown className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Balance Neto */}
      <Card
        className={cn(
          'border-l-4',
          netBalance >= 0
            ? 'border-l-blue-600 dark:border-l-blue-500'
            : 'border-l-orange-600 dark:border-l-orange-500'
        )}
      >
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                Balance Neto
              </p>
              <p
                className={cn(
                  'mt-3 text-3xl font-bold',
                  netBalance >= 0
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-600 dark:text-red-400'
                )}
              >
                {formatCurrency(netBalance)}
              </p>
              <div className="mt-4 flex items-center space-x-2">
                <DollarSign className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {balancePercentage >= 0 ? 'Positivo' : 'Negativo'} •{' '}
                  {Math.abs(balancePercentage).toFixed(1)}% margen
                </span>
              </div>
            </div>
            <div
              className={cn(
                'ml-4 flex h-12 w-12 items-center justify-center rounded-lg',
                netBalance >= 0
                  ? 'bg-blue-50 dark:bg-blue-900/20'
                  : 'bg-orange-50 dark:bg-orange-900/20'
              )}
            >
              <DollarSign
                className={cn(
                  'h-6 w-6',
                  netBalance >= 0
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-orange-600 dark:text-orange-400'
                )}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

