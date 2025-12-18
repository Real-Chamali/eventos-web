'use client'

import { useState, useMemo } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './Table'
import SearchInput from './SearchInput'
import Button from './Button'
import { ArrowUpDown, Download } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

export interface Column<T> {
  id: string
  header: string
  accessorKey?: keyof T
  cell?: (row: T) => React.ReactNode
  sortable?: boolean
  filterable?: boolean
}

interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  searchKey?: keyof T
  searchPlaceholder?: string
  onExport?: () => void
  emptyMessage?: string
  actions?: React.ReactNode
}

export default function DataTable<T extends Record<string, unknown>>({
  data,
  columns,
  searchKey,
  searchPlaceholder = 'Buscar...',
  onExport,
  emptyMessage = 'No hay datos disponibles',
  actions,
}: DataTableProps<T>) {
  const [search, setSearch] = useState('')
  const [sortConfig, setSortConfig] = useState<{
    key: string
    direction: 'asc' | 'desc'
  } | null>(null)

  const filteredData = useMemo(() => {
    let result = [...data]

    // Search filter
    if (search && searchKey) {
      result = result.filter((item) => {
        const value = item[searchKey]
        return value?.toString().toLowerCase().includes(search.toLowerCase())
      })
    }

    // Sort
    if (sortConfig) {
      result.sort((a, b) => {
        const column = columns.find((col) => col.id === sortConfig.key)
        if (!column) return 0

        const aValue = column.accessorKey ? a[column.accessorKey] : ''
        const bValue = column.accessorKey ? b[column.accessorKey] : ''

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1
        }
        return 0
      })
    }

    return result
  }, [data, search, searchKey, sortConfig, columns])

  const handleSort = (columnId: string) => {
    setSortConfig((current) => {
      if (current?.key === columnId) {
        return {
          key: columnId,
          direction: current.direction === 'asc' ? 'desc' : 'asc',
        }
      }
      return { key: columnId, direction: 'asc' }
    })
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex-1 w-full sm:max-w-md">
          {searchKey && (
            <SearchInput
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          )}
        </div>
        <div className="flex gap-2">
          {actions}
          {onExport && (
            <Button variant="outline" size="sm" onClick={onExport}>
              <Download className="mr-2 h-4 w-4" />
              Exportar
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead
                  key={column.id}
                  className={cn(
                    column.sortable && 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800'
                  )}
                  onClick={() => column.sortable && handleSort(column.id)}
                >
                  <div className="flex items-center space-x-2">
                    <span>{column.header}</span>
                    {column.sortable && (
                      <ArrowUpDown className="h-4 w-4 text-gray-400" />
                    )}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center py-12">
                  <div className="flex flex-col items-center justify-center py-8">
                    <p className="text-gray-500 dark:text-gray-400">{emptyMessage}</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((row, index) => (
                <TableRow key={index}>
                  {columns.map((column) => (
                    <TableCell key={column.id}>
                      {column.cell
                        ? column.cell(row)
                        : column.accessorKey
                        ? row[column.accessorKey]?.toString() || '-'
                        : '-'}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Footer */}
      {filteredData.length > 0 && (
        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
          <span>
            Mostrando {filteredData.length} de {data.length} resultados
          </span>
        </div>
      )}
    </div>
  )
}

