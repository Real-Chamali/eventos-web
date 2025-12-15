'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { logger } from '@/lib/utils/logger'
import { useToast } from '@/lib/hooks'

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

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center">Cargando datos financieros...</div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Finanzas</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-700 mb-2">Ingresos</h2>
          <p className="text-3xl font-bold text-green-600">
            ${totalIncome.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-700 mb-2">Gastos</h2>
          <p className="text-3xl font-bold text-red-600">
            ${totalExpense.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Gráfico: Ingresos vs Gastos</h2>
        
        <div className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">Ingresos</span>
              <span className="text-sm text-gray-600">
                ${totalIncome.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-8">
              <div
                className="bg-green-600 h-8 rounded-full flex items-center justify-end pr-2"
                style={{ width: `${(totalIncome / maxAmount) * 100}%` }}
              >
                {totalIncome > 0 && (
                  <span className="text-white text-xs font-medium">
                    {((totalIncome / maxAmount) * 100).toFixed(1)}%
                  </span>
                )}
              </div>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">Gastos</span>
              <span className="text-sm text-gray-600">
                ${totalExpense.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-8">
              <div
                className="bg-red-600 h-8 rounded-full flex items-center justify-end pr-2"
                style={{ width: `${(totalExpense / maxAmount) * 100}%` }}
              >
                {totalExpense > 0 && (
                  <span className="text-white text-xs font-medium">
                    {((totalExpense / maxAmount) * 100).toFixed(1)}%
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold text-gray-900">Balance Neto:</span>
            <span
              className={`text-2xl font-bold ${
                totalIncome - totalExpense >= 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              ${(totalIncome - totalExpense).toLocaleString('es-MX', {
                minimumFractionDigits: 2,
              })}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
