'use client'

import { useState, useMemo } from 'react'
import { useAdminEvents, useToast } from '@/lib/hooks'
import PageHeader from '@/components/ui/PageHeader'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Skeleton from '@/components/ui/Skeleton'
import SearchInput from '@/components/ui/SearchInput'
import { Calendar, Filter, Eye, Plus, Edit, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import EmptyState from '@/components/ui/EmptyState'
import CreateEventDialog from '@/components/events/CreateEventDialog'
import EditEventDialog from '@/components/events/EditEventDialog'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/Dialog'

export default function AdminEventsPage() {
  const { events, loading, error, refetch } = useAdminEvents()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'confirmed' | 'cancelled'>('all')
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<{
    id: string
    quote_id: string
    start_date: string
    end_date: string | null
    status: string
  } | null>(null)
  const [eventToDelete, setEventToDelete] = useState<string | null>(null)
  const { error: toastError, success: toastSuccess } = useToast()

  // Mostrar error si hay
  if (error) {
    toastError('Error al cargar los eventos')
  }

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const clientName = event.quote?.client?.name?.toLowerCase() || ''
      const matchesSearch = clientName.includes(searchTerm.toLowerCase())
      const matchesStatus = statusFilter === 'all' || event.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [events, searchTerm, statusFilter])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge variant="success" size="sm">Confirmado</Badge>
      case 'pending':
        return <Badge variant="warning" size="sm">Pendiente</Badge>
      case 'cancelled':
        return <Badge variant="error" size="sm">Cancelado</Badge>
      default:
        return <Badge size="sm">{status}</Badge>
    }
  }

  const getQuoteTotal = (quote: unknown) => {
    if (!quote || typeof quote !== 'object') return 0
    const record = quote as { total_amount?: number | null; total_price?: number | null }
    const value = record.total_amount ?? record.total_price
    return typeof value === 'number' ? value : Number(value) || 0
  }

  const stats = useMemo(() => ({
    total: events.length,
    confirmed: events.filter(e => e.status === 'confirmed').length,
    pending: events.filter(e => e.status === 'pending').length,
    cancelled: events.filter(e => e.status === 'cancelled').length,
  }), [events])

  const statusFilters = [
    { value: 'all' as const, label: 'Todos' },
    { value: 'pending' as const, label: 'Pendientes' },
    { value: 'confirmed' as const, label: 'Confirmados' },
    { value: 'cancelled' as const, label: 'Cancelados' },
  ]

  const handleEdit = (event: typeof events[0]) => {
    setSelectedEvent({
      id: event.id,
      quote_id: event.quote_id,
      start_date: event.start_date,
      end_date: event.end_date,
      status: event.status,
    })
    setEditDialogOpen(true)
  }

  const handleDeleteClick = (eventId: string) => {
    setEventToDelete(eventId)
    setDeleteConfirmOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!eventToDelete) return

    try {
      const response = await fetch(`/api/admin/events/${eventToDelete}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al eliminar el evento')
      }

      toastSuccess('Evento eliminado exitosamente')
      refetch?.()
      setDeleteConfirmOpen(false)
      setEventToDelete(null)
    } catch (error) {
      toastError('Error al eliminar el evento: ' + (error instanceof Error ? error.message : String(error)))
    }
  }

  return (
    <div className="space-y-8 p-6 lg:p-8">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Eventos"
          description="Gestiona todos los eventos del sistema"
        />
        <Button
          onClick={() => setCreateDialogOpen(true)}
          className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white shadow-lg hover:shadow-xl"
        >
          <Plus className="h-5 w-5 mr-2" />
          Crear Evento
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card variant="elevated" className="group hover:scale-[1.02] transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
              </div>
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950/30 dark:to-violet-950/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                <Calendar className="h-7 w-7 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card variant="elevated" className="group hover:scale-[1.02] transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Confirmados</p>
                <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{stats.confirmed}</p>
              </div>
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                <Calendar className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
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
                <Calendar className="h-7 w-7 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card variant="elevated" className="group hover:scale-[1.02] transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Cancelados</p>
                <p className="text-3xl font-bold text-red-600 dark:text-red-400">{stats.cancelled}</p>
              </div>
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/30 dark:to-rose-950/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                <Calendar className="h-7 w-7 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card variant="elevated" className="overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100/50 dark:from-gray-900/50 dark:to-gray-800/30 border-b border-gray-200/60 dark:border-gray-800/60">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">Filtros y Búsqueda</CardTitle>
              <CardDescription className="mt-1">Encuentra eventos rápidamente</CardDescription>
            </div>
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500 to-violet-500 flex items-center justify-center shadow-lg">
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

      {/* Events Table */}
      <Card variant="elevated" className="overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-950/30 dark:to-violet-950/30 border-b border-gray-200/60 dark:border-gray-800/60">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">Lista de Eventos</CardTitle>
              <CardDescription className="mt-1">
                {filteredEvents.length} {filteredEvents.length === 1 ? 'evento' : 'eventos'} encontrado{filteredEvents.length !== 1 ? 's' : ''}
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
          ) : filteredEvents.length === 0 ? (
            <EmptyState
              icon={<Calendar className="h-10 w-10" />}
              title={searchTerm || statusFilter !== 'all' ? 'No se encontraron eventos' : 'No hay eventos aún'}
              description={
                searchTerm || statusFilter !== 'all'
                  ? 'Intenta ajustar los filtros de búsqueda'
                  : 'Los eventos aparecerán aquí cuando se creen cotizaciones confirmadas'
              }
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Fecha Inicio</TableHead>
                  <TableHead>Fecha Fin</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEvents.map((event) => (
                  <TableRow key={event.id} className="group">
                    <TableCell>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {event.quote?.client?.name || 'Cliente sin nombre'}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {event.quote?.client?.email || ''}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {format(new Date(event.start_date), "d 'de' MMMM, yyyy", { locale: es })}
                    </TableCell>
                    <TableCell>
                      {event.end_date
                        ? format(new Date(event.end_date), "d 'de' MMMM, yyyy", { locale: es })
                        : '-'}
                    </TableCell>
                    <TableCell>{getStatusBadge(event.status)}</TableCell>
                    <TableCell className="text-right">
                      <span className="font-bold text-gray-900 dark:text-white">
                        {new Intl.NumberFormat('es-MX', {
                          style: 'currency',
                          currency: 'MXN',
                          minimumFractionDigits: 2,
                        }).format(getQuoteTotal(event.quote))}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(event)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                          title="Editar evento"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClick(event.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                          title="Eliminar evento"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        {event.quote_id && (
                          <Link href={`/dashboard/quotes/${event.quote_id}`}>
                            <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                              <Eye className="h-4 w-4 mr-2" />
                              Ver
                            </Button>
                          </Link>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Diálogo de Crear Evento */}
      <CreateEventDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onSuccess={() => {
          refetch?.()
        }}
      />

      {/* Diálogo de Editar Evento */}
      <EditEventDialog
        open={editDialogOpen}
        onClose={() => {
          setEditDialogOpen(false)
          setSelectedEvent(null)
        }}
        onSuccess={() => {
          refetch?.()
          setSelectedEvent(null)
        }}
        event={selectedEvent}
      />

      {/* Diálogo de Confirmación para Borrar */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-red-600 dark:text-red-400">
              Confirmar Eliminación
            </DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar este evento? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="ghost" onClick={() => {
              setDeleteConfirmOpen(false)
              setEventToDelete(null)
            }}>
              Cancelar
            </Button>
            <Button
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Eliminar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

