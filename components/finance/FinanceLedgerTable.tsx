'use client'

import { useState, useMemo } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/Table'
import SearchInput from '@/components/ui/SearchInput'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { ArrowUpDown, Filter, X, Download } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import EmptyState from '@/components/ui/EmptyState'

export interface FinanceEntry {
  id: string
  amount: number
  type: 'income' | 'expense'
  description: string
  created_at: string
  event_id?: string | null
}

interface FinanceLedgerTableProps {
  data: FinanceEntry[]
  loading?: boolean
  onExport?: () => void
}

export default function FinanceLedgerTable({
  data,
  loading = false,
  onExport,
}: FinanceLedgerTableProps) {
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [sortConfig, setSortConfig] = useState<{
    key: keyof FinanceEntry
    direction: 'asc' | 'desc'
  } | null>({ key: 'created_at', direction: 'desc' })

  const filteredData = useMemo(() => {
    let result = [...data]

    // Search filter
    if (search) {
      result = result.filter((entry) =>
        entry.description?.toLowerCase().includes(search.toLowerCase())
      )
    }

    // Type filter
    if (typeFilter !== 'all') {
      result = result.filter((entry) => entry.type === typeFilter)
    }

    // Date range filter
    if (startDate) {
      result = result.filter(
        (entry) => new Date(entry.created_at) >= new Date(startDate)
      )
    }
    if (endDate) {
      result = result.filter(
        (entry) => new Date(entry.created_at) <= new Date(endDate)
      )
    }

    // Sort
    if (sortConfig) {
      result.sort((a, b) => {
        const aValue = a[sortConfig.key]
        const bValue = b[sortConfig.key]

        if (aValue === null || aValue === undefined) return 1
        if (bValue === null || bValue === undefined) return -1

        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return sortConfig.direction === 'asc'
            ? aValue - bValue
            : bValue - aValue
        }

        const aStr = String(aValue)
        const bStr = String(bValue)

        if (sortConfig.direction === 'asc') {
          return aStr.localeCompare(bStr)
        }
        return bStr.localeCompare(aStr)
      })
    }

    return result
  }, [data, search, typeFilter, startDate, endDate, sortConfig])

  const handleSort = (key: keyof FinanceEntry) => {
    setSortConfig((current) => {
      if (current?.key === key) {
        return {
          key,
          direction: current.direction === 'asc' ? 'desc' : 'asc',
        }
      }
      return { key, direction: 'desc' }
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd MMM yyyy, HH:mm', { locale: es })
    } catch {
      return dateString
    }
  }

  const clearFilters = () => {
    setSearch('')
    setTypeFilter('all')
    setStartDate('')
    setEndDate('')
  }

  const hasActiveFilters =
    search || typeFilter !== 'all' || startDate || endDate

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Registro de Movimientos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Registro de Movimientos</CardTitle>
          {onExport && (
            <Button variant="outline" size="sm" onClick={onExport}>
              <Download className="mr-2 h-4 w-4" />
              Exportar
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="space-y-4 mb-6">
          {/* Search and Type Filter */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <SearchInput
                placeholder="Buscar por descripción..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los tipos</SelectItem>
                  <SelectItem value="income">Ingresos</SelectItem>
                  <SelectItem value="expense">Egresos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Date Range Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Input
                type="date"
                label="Fecha inicial"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <Input
                type="date"
                label="Fecha final"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearFilters}
                  className="w-full"
                >
                  <X className="mr-2 h-4 w-4" />
                  Limpiar filtros
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead
                  className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                  onClick={() => handleSort('created_at')}
                >
                  <div className="flex items-center space-x-2">
                    <span>Fecha</span>
                    <ArrowUpDown className="h-4 w-4 text-gray-400" />
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                  onClick={() => handleSort('type')}
                >
                  <div className="flex items-center space-x-2">
                    <span>Tipo</span>
                    <ArrowUpDown className="h-4 w-4 text-gray-400" />
                  </div>
                </TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead
                  className="text-right cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                  onClick={() => handleSort('amount')}
                >
                  <div className="flex items-center justify-end space-x-2">
                    <span>Monto</span>
                    <ArrowUpDown className="h-4 w-4 text-gray-400" />
                  </div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-12">
                    <EmptyState
                      title="No hay movimientos"
                      description={
                        hasActiveFilters
                          ? 'No se encontraron movimientos con los filtros aplicados'
                          : 'Aún no hay movimientos registrados'
                      }
                    />
                  </TableCell>
                </TableRow>
              ) : (
                filteredData.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="font-mono text-sm text-gray-600 dark:text-gray-400">
                      {formatDate(entry.created_at)}
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                          entry.type === 'income'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                        )}
                      >
                        {entry.type === 'income' ? 'Ingreso' : 'Egreso'}
                      </span>
                    </TableCell>
                    <TableCell className="max-w-md">
                      <p className="text-sm text-gray-900 dark:text-white truncate">
                        {entry.description || '-'}
                      </p>
                    </TableCell>
                    <TableCell
                      className={cn(
                        'text-right font-semibold',
                        entry.type === 'income'
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-red-600 dark:text-red-400'
                      )}
                    >
                      {entry.type === 'income' ? '+' : '-'}
                      {formatCurrency(Math.abs(entry.amount))}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Footer */}
        {filteredData.length > 0 && (
          <div className="mt-4 flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
            <span>
              Mostrando {filteredData.length} de {data.length} movimientos
            </span>
            {hasActiveFilters && (
              <span className="text-xs">
                Filtros activos: {typeFilter !== 'all' && 'Tipo'} {search && 'Búsqueda'}{' '}
                {(startDate || endDate) && 'Rango de fechas'}
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

