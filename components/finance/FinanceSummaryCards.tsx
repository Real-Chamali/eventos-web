'use client'

import StatsCard from '@/components/ui/StatsCard'
import { TrendingUp, TrendingDown, DollarSign, Sparkles } from 'lucide-react'
import Skeleton from '@/components/ui/Skeleton'

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
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-40 w-full rounded-2xl" />
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Ingresos Totales - Premium */}
      <StatsCard
        title="Ingresos Totales"
        value={totalIncome}
        type="currency"
        icon={<TrendingUp className="h-6 w-6" />}
        description="Total de entradas registradas"
        variant="premium"
      />

      {/* Egresos Totales */}
      <StatsCard
        title="Egresos Totales"
        value={totalExpense}
        type="currency"
        icon={<TrendingDown className="h-6 w-6" />}
        description="Total de salidas registradas"
      />

      {/* Balance Neto - Premium */}
      <StatsCard
        title="Balance Neto"
        value={netBalance}
        type="currency"
        icon={<DollarSign className="h-6 w-6" />}
        description={`Margen: ${balancePercentage.toFixed(1)}%`}
        variant={netBalance >= 0 ? 'premium' : 'default'}
        trend={netBalance >= 0 ? 'up' : 'down'}
      />
    </div>
  )
}
