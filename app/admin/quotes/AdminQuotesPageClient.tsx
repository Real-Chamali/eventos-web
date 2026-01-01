'use client'

import { useState, useMemo } from 'react'
import { useQuotes } from '@/lib/hooks/useQuotes'
import { useIsAdmin } from '@/lib/hooks'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import SearchInput from '@/components/ui/SearchInput'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table'
import { Plus, FileText, Sparkles, Filter, TrendingUp, Shield, Edit, Trash2, Eye } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import EmptyState from '@/components/ui/EmptyState'
import Skeleton from '@/components/ui/Skeleton'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { useToast } from '@/lib/hooks'
import { logger } from '@/lib/utils/logger'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/AlertDialog'

function getStatusBadge(status: string) {
  switch (status) {
    case 'confirmed':
      return <Badge variant="success" size="sm">Confirmada</Badge>
    case 'pending':
      return <Badge variant="warning" size="sm">Pendiente</Badge>
    case 'draft':
      return <Badge variant="default" size="sm">Borrador</Badge>
    case 'cancelled':
      return <Badge variant="error" size="sm">Cancelada</Badge>
    default:
      return <Badge size="sm">{status}</Badge>
  }
}

export default function AdminQuotesPageClient() {
  const { quotes, loading: isLoading, refresh } = useQuotes()
  const { isAdmin, loading: adminLoading } = useIsAdmin()
  const router = useRouter()
  const supabase = createClient()
  const { success: toastSuccess, error: toastError } = useToast()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'confirmed' | 'cancelled' | 'draft'>('all')

  // Si no es admin, redirigir
  if (!adminLoading && !isAdmin) {
    router.push('/dashboard/quotes')
    return null
  }

  const handleDeleteQuote = async (quoteId: string) => {
    try {
      const response = await fetch(`/api/admin/quotes/${quoteId}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al eliminar la cotización')
      }

      toastSuccess('Cotización eliminada exitosamente')
      refresh()
    } catch (err) {
      logger.error('AdminQuotesPage', 'Error deleting quote', err as Error)
      toastError(err instanceof Error ? err.message : 'Error al eliminar la cotización')
    }
  }

  const filteredQuotes = useMemo(() => {
    return quotes.filter((quote) => {
      const matchesSearch = quote.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            quote.id.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = statusFilter === 'all' || quote.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [quotes, searchTerm, statusFilter])

  const stats = useMemo(() => {
    const total = quotes.length
    const pending = quotes.filter(q => q.status === 'pending' || q.status === 'draft').length
    const confirmed = quotes.filter(q => q.status === 'confirmed').length
    const cancelled = quotes.filter(q => q.status === 'cancelled').length
    const totalValue = quotes
      .filter(q => q.status === 'confirmed')
      .reduce((acc, q) => acc + (q.total_price || 0), 0)
    
    return { total, pending, confirmed, cancelled, totalValue }
  }, [quotes])

  const statusFilters = [
    { value: 'all' as const, label: 'Todas' },
    { value: 'draft' as const, label: 'Borrador' },
    { value: 'pending' as const, label: 'Pendientes' },
    { value: 'confirmed' as const, label: 'Confirmadas' },
    { value: 'cancelled' as const, label: 'Canceladas' },
  ]

  if (adminLoading || isLoading) {
    return (
      <div className="space-y-8 p-6 lg:p-8">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    )
  }

  return (
    <div className="space-y-8 p-6 lg:p-8">
      {/* Premium Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg">
              <Shield className="h-6 w-6 text-white" />
            </div>
            Gestión de Cotizaciones
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Administra todas las cotizaciones del sistema
          </p>
        </div>
        <Link href="/dashboard/quotes/new">
          <Button variant="premium" size="lg" className="shadow-lg hover:shadow-xl gap-2">
            <Plus className="h-5 w-5" />
            Nueva Cotización
          </Button>
        </Link>
      </div>

      {/* Premium Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
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
                <Filter className="h-7 w-7 text-amber-600 dark:text-amber-400" />
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
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                <Sparkles className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card variant="elevated" className="group hover:scale-[1.02] transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Canceladas</p>
                <p className="text-3xl font-bold text-red-600 dark:text-red-400">{stats.cancelled}</p>
              </div>
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/30 dark:to-rose-950/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                <FileText className="h-7 w-7 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card variant="elevated" className="group hover:scale-[1.02] transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Valor Total</p>
                <p className="text-3xl font-bold text-violet-600 dark:text-violet-400">
                  {new Intl.NumberFormat('es-MX', {
                    style: 'currency',
                    currency: 'MXN',
                    minimumFractionDigits: 0,
                  }).format(stats.totalValue)}
                </p>
              </div>
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                <TrendingUp className="h-7 w-7 text-violet-600 dark:text-violet-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Premium Filters and Search */}
      <Card variant="elevated">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <SearchInput
                placeholder="Buscar por cliente o ID de cotización..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
                className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-sm font-medium text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-400 transition-all"
              >
                {statusFilters.map((filter) => (
                  <option key={filter.value} value={filter.value}>
                    {filter.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Premium Quotes Table */}
      {filteredQuotes.length === 0 ? (
        <Card variant="elevated">
          <CardContent className="p-12">
            <EmptyState
              icon={<FileText className="h-10 w-10" />}
              title="No hay cotizaciones"
              description={
                searchTerm || statusFilter !== 'all'
                  ? 'No se encontraron cotizaciones con los filtros aplicados'
                  : 'Aún no hay cotizaciones en el sistema'
              }
            />
          </CardContent>
        </Card>
      ) : (
        <Card variant="elevated" className="overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border-b border-gray-200/60 dark:border-gray-800/60">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">Todas las Cotizaciones</CardTitle>
                <CardDescription className="mt-1">
                  {filteredQuotes.length} {filteredQuotes.length === 1 ? 'cotización encontrada' : 'cotizaciones encontradas'}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredQuotes.map((quote) => (
                  <TableRow key={quote.id} className="group hover:bg-amber-50/50 dark:hover:bg-amber-950/20 transition-colors">
                    <TableCell>
                      <code className="text-xs font-mono text-gray-600 dark:text-gray-400">
                        {quote.id.slice(0, 8)}...
                      </code>
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {quote.client_name || 'Sin cliente'}
                      </span>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(quote.status)}
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {new Intl.NumberFormat('es-MX', {
                          style: 'currency',
                          currency: 'MXN',
                          minimumFractionDigits: 0,
                        }).format(quote.total_price || 0)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {format(new Date(quote.created_at), "dd MMM yyyy", { locale: es })}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/dashboard/quotes/${quote.id}`}>
                          <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Link href={`/dashboard/quotes/${quote.id}/edit`}>
                          <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Eliminar cotización?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta acción no se puede deshacer. La cotización será eliminada permanentemente.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteQuote(quote.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Eliminar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

