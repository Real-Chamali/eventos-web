'use client'

import { useState, useMemo } from 'react'
import { useQuotes } from '@/lib/hooks/useQuotes'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import SearchInput from '@/components/ui/SearchInput'
import Button from '@/components/ui/Button'
import { Plus, FileText, Sparkles, Filter, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { QuotesList } from '@/components/quotes/QuotesList'

/**
 * Página de cotizaciones con paginación infinita
 * Usa hooks optimizados con SWR para mejor rendimiento
 */
export default function QuotesPageClient() {
  const { quotes } = useQuotes()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'confirmed' | 'cancelled' | 'draft'>('all')

  const stats = useMemo(() => {
    const total = quotes.length
    const pending = quotes.filter(q => q.status === 'pending' || q.status === 'draft').length
    const confirmed = quotes.filter(q => q.status === 'confirmed').length
    const totalValue = quotes
      .filter(q => q.status === 'confirmed')
      .reduce((acc, q) => acc + (q.total_price || 0), 0)
    
    return { total, pending, confirmed, totalValue }
  }, [quotes])

  const statusFilters = [
    { value: 'all' as const, label: 'Todas' },
    { value: 'draft' as const, label: 'Borrador' },
    { value: 'pending' as const, label: 'Pendientes' },
    { value: 'confirmed' as const, label: 'Confirmadas' },
    { value: 'cancelled' as const, label: 'Canceladas' },
  ]

  return (
    <div className="space-y-6 sm:space-y-8 p-4 sm:p-6 lg:p-8">
      {/* Premium Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
            Cotizaciones
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-base sm:text-lg">
            Gestiona todas tus cotizaciones
          </p>
        </div>
        <Link href="/dashboard/quotes/new" className="w-full sm:w-auto">
          <Button variant="premium" size="lg" className="w-full sm:w-auto shadow-lg hover:shadow-xl min-h-[48px] sm:min-h-[44px]">
            <Plus className="mr-2 h-5 w-5" />
            Nueva Cotización
          </Button>
        </Link>
      </div>

      {/* Premium Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <Card variant="elevated" className="group hover:scale-[1.02] transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
              </div>
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-950/30 dark:to-violet-950/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                <FileText className="h-7 w-7 text-indigo-600 dark:text-indigo-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card variant="elevated" className="group hover:scale-[1.02] transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pendientes</p>
                <p className="text-3xl font-bold text-amber-600 dark:text-amber-400">{stats.pending}</p>
              </div>
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                <FileText className="h-7 w-7 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card variant="elevated" className="group hover:scale-[1.02] transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Confirmadas</p>
                <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{stats.confirmed}</p>
              </div>
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                <TrendingUp className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card variant="elevated" className="group hover:scale-[1.02] transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Valor Total</p>
                <p className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                  {new Intl.NumberFormat('es-MX', {
                    style: 'currency',
                    currency: 'MXN',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  }).format(stats.totalValue)}
                </p>
              </div>
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                <Sparkles className="h-7 w-7 text-violet-600 dark:text-violet-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Premium Filters */}
      <Card variant="elevated" className="overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100/50 dark:from-gray-900/50 dark:to-gray-800/30 border-b border-gray-200/60 dark:border-gray-800/60">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">Filtros y Búsqueda</CardTitle>
              <CardDescription className="mt-1">Encuentra cotizaciones rápidamente</CardDescription>
            </div>
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shadow-lg">
              <Filter className="h-5 w-5 text-white" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <SearchInput
                placeholder="Buscar por nombre de cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onClear={() => setSearchTerm('')}
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {statusFilters.map((filter) => (
                <Button
                  key={filter.value}
                  variant={statusFilter === filter.value ? 'premium' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter(filter.value)}
                  className="transition-all duration-200"
                >
                  {filter.label}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quotes List con paginación infinita */}
      <QuotesList searchTerm={searchTerm} statusFilter={statusFilter} />
    </div>
  )
}

