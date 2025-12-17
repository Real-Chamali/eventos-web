'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import SearchInput from '@/components/ui/SearchInput'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table'
import { Plus, FileText, Sparkles, Filter, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import EmptyState from '@/components/ui/EmptyState'
import Skeleton from '@/components/ui/Skeleton'

interface Quote {
  id: string
  client_name: string
  total_price: number
  status: 'pending' | 'confirmed' | 'cancelled' | 'draft'
  created_at: string
  updated_at: string
}

export default function QuotesPage() {
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'confirmed' | 'cancelled' | 'draft'>('all')
  const supabase = createClient()

  useEffect(() => {
    loadQuotes()
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        return <Badge variant="success" size="sm">Confirmada</Badge>
      case 'pending':
      case 'draft':
        return <Badge variant="warning" size="sm">Pendiente</Badge>
      case 'cancelled':
        return <Badge variant="error" size="sm">Cancelada</Badge>
      default:
        return <Badge size="sm">{status}</Badge>
    }
  }

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
    <div className="space-y-8 p-6 lg:p-8">
      {/* Premium Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
            Cotizaciones
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Gestiona todas tus cotizaciones
          </p>
        </div>
        <Link href="/dashboard/quotes/new">
          <Button variant="premium" size="lg" className="shadow-lg hover:shadow-xl">
            <Plus className="mr-2 h-5 w-5" />
            Nueva Cotización
          </Button>
        </Link>
      </div>

      {/* Premium Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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

      {/* Premium Quotes Table */}
      <Card variant="elevated" className="overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-indigo-50 to-violet-50 dark:from-indigo-950/30 dark:to-violet-950/30 border-b border-gray-200/60 dark:border-gray-800/60">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">Lista de Cotizaciones</CardTitle>
              <CardDescription className="mt-1">
                {filteredQuotes.length} {filteredQuotes.length === 1 ? 'cotización' : 'cotizaciones'} encontrada{filteredQuotes.length !== 1 ? 's' : ''}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full rounded-xl" />
              ))}
            </div>
          ) : filteredQuotes.length === 0 ? (
            <EmptyState
              icon={<FileText className="h-10 w-10" />}
              title={searchTerm || statusFilter !== 'all' ? 'No se encontraron cotizaciones' : 'No hay cotizaciones aún'}
              description={
                searchTerm || statusFilter !== 'all'
                  ? 'Intenta ajustar los filtros de búsqueda'
                  : 'Crea tu primera cotización para comenzar'
              }
              action={
                !searchTerm && statusFilter === 'all'
                  ? {
                      label: 'Crear Primera Cotización',
                      onClick: () => window.location.href = '/dashboard/quotes/new',
                    }
                  : undefined
              }
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredQuotes.map((quote) => (
                  <TableRow key={quote.id} className="group">
                    <TableCell>
                      <Link
                        href={`/dashboard/quotes/${quote.id}`}
                        className="font-semibold text-gray-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors duration-200"
                      >
                        {quote.client_name || 'Cliente sin nombre'}
                      </Link>
                    </TableCell>
                    <TableCell>{getStatusBadge(quote.status)}</TableCell>
                    <TableCell className="text-right">
                      <span className="font-bold text-gray-900 dark:text-white">
                        {new Intl.NumberFormat('es-MX', {
                          style: 'currency',
                          currency: 'MXN',
                          minimumFractionDigits: 2,
                        }).format(quote.total_price || 0)}
                      </span>
                    </TableCell>
                    <TableCell className="text-gray-600 dark:text-gray-400">
                      {format(new Date(quote.created_at), "d 'de' MMMM, yyyy", { locale: es })}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/dashboard/quotes/${quote.id}`}>
                        <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          Ver detalles
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
