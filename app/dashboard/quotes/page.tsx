'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import SearchInput from '@/components/ui/SearchInput'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import DataTable, { Column } from '@/components/ui/DataTable'
import { Plus, FileText } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface Quote {
  id: string
  client_name: string
  total_price: number
  status: 'pending' | 'confirmed' | 'cancelled'
  created_at: string
  updated_at: string
}

export default function QuotesPage() {
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'confirmed' | 'cancelled'>('all')
  const supabase = createClient()

  useEffect(() => {
    loadQuotes()
  }, [])

  const loadQuotes = async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('quotes')
        .select('id, client_name, total_price, status, created_at, updated_at')
        .eq('vendor_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setQuotes(data || [])
    } catch (error) {
      console.error('Error loading quotes:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredQuotes = useMemo(() => {
    return quotes.filter((quote) => {
      const matchesSearch = quote.client_name?.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = statusFilter === 'all' || quote.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [quotes, searchTerm, statusFilter])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge variant="success">Confirmada</Badge>
      case 'pending':
        return <Badge variant="warning">Pendiente</Badge>
      case 'cancelled':
        return <Badge variant="error">Cancelada</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  const stats = useMemo(() => {
    const total = quotes.length
    const pending = quotes.filter(q => q.status === 'pending').length
    const confirmed = quotes.filter(q => q.status === 'confirmed').length
    const totalValue = quotes
      .filter(q => q.status === 'confirmed')
      .reduce((acc, q) => acc + (q.total_price || 0), 0)
    
    return { total, pending, confirmed, totalValue }
  }, [quotes])

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Cotizaciones</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Gestiona todas tus cotizaciones
          </p>
        </div>
        <Link href="/dashboard/quotes/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nueva Cotización
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Pendientes</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <FileText className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Confirmadas</p>
                <p className="text-2xl font-bold text-green-600">{stats.confirmed}</p>
              </div>
              <FileText className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Valor Total</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  ${stats.totalValue.toLocaleString('es-MX')}
                </p>
              </div>
              <FileText className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <SearchInput
                placeholder="Buscar por nombre de cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={statusFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('all')}
              >
                Todas
              </Button>
              <Button
                variant={statusFilter === 'pending' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('pending')}
              >
                Pendientes
              </Button>
              <Button
                variant={statusFilter === 'confirmed' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('confirmed')}
              >
                Confirmadas
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quotes Table */}
      <Card>
        <CardHeader>
          <CardTitle>Cotizaciones</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              Cargando cotizaciones...
            </div>
          ) : (
            <DataTable
              data={filteredQuotes}
              columns={[
                {
                  id: 'client_name',
                  header: 'Cliente',
                  accessorKey: 'client_name',
                  sortable: true,
                  cell: (row) => (
                    <Link
                      href={`/dashboard/quotes/${row.id}`}
                      className="font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      {row.client_name || 'Cliente sin nombre'}
                    </Link>
                  ),
                },
                {
                  id: 'status',
                  header: 'Estado',
                  accessorKey: 'status',
                  sortable: true,
                  cell: (row) => getStatusBadge(row.status),
                },
                {
                  id: 'total_price',
                  header: 'Total',
                  accessorKey: 'total_price',
                  sortable: true,
                  cell: (row) => (
                    <span className="font-semibold">
                      ${(row.total_price || 0).toLocaleString('es-MX', {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  ),
                },
                {
                  id: 'created_at',
                  header: 'Fecha',
                  accessorKey: 'created_at',
                  sortable: true,
                  cell: (row) =>
                    format(new Date(row.created_at), "d 'de' MMMM, yyyy", { locale: es }),
                },
              ]}
              searchKey="client_name"
              searchPlaceholder="Buscar por nombre de cliente..."
              emptyMessage={
                searchTerm || statusFilter !== 'all'
                  ? 'No se encontraron cotizaciones con los filtros aplicados'
                  : 'No hay cotizaciones aún'
              }
              actions={
                !searchTerm && statusFilter === 'all' && filteredQuotes.length === 0 ? (
                  <Link href="/dashboard/quotes/new">
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Crear Primera Cotización
                    </Button>
                  </Link>
                ) : undefined
              }
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}

