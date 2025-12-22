'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import SearchInput from '@/components/ui/SearchInput'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table'
import { PartyPopper, Filter, Calendar as CalendarIcon, User, DollarSign, ArrowRight, Plus, Edit, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import EmptyState from '@/components/ui/EmptyState'
import Skeleton from '@/components/ui/Skeleton'
import { logger } from '@/lib/utils/logger'
import { useToast } from '@/lib/hooks'
import CreateEventDialog from '@/components/events/CreateEventDialog'
import EditEventDialog from '@/components/events/EditEventDialog'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/Dialog'

interface Event {
  id: string
  start_date: string
  end_date: string | null
  status: string
  created_at: string
  quote?: {
    id: string
    total_amount: number
    status: string
    vendor_id?: string
    client?: {
      name: string
      email: string
    } | {
      name: string
      email: string
    }[]
  } | {
    id: string
    total_amount: number
    status: string
    vendor_id?: string
    client?: {
      name: string
      email: string
    } | {
      name: string
      email: string
    }[]
  }[]
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'confirmed' | 'pending' | 'completed' | 'cancelled'>('all')
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month' | 'upcoming'>('all')
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<{
    id: string
    quote_id: string
    start_date: string
    end_date: string | null
    status: string
  } | null>(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [eventToDelete, setEventToDelete] = useState<string | null>(null)
  const supabase = createClient()
  const { success: toastSuccess, error: toastError } = useToast()

  useEffect(() => {
    loadEvents()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadEvents = async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // RLS maneja automáticamente el filtrado por rol
      // Los vendors solo ven sus eventos, los admins ven todos
      const { data, error } = await supabase
        .from('events')
        .select(`
          id,
          start_date,
          end_date,
          status,
          created_at,
          quote:quotes(
            id,
            total_amount,
            status,
            vendor_id,
            clients(
              name,
              email
            )
          )
        `)
        .order('start_date', { ascending: false })

      if (error) {
        logger.error('EventsPage', 'Error loading events', error as Error)
        toastError('Error al cargar los eventos')
        return
      }

      // Procesar datos para manejar arrays de quotes y clientes
      interface QuoteClient {
        name?: string
        email?: string
      }
      
      interface QuoteData {
        client?: QuoteClient | QuoteClient[]
        [key: string]: unknown
      }
      
      interface EventWithQuote {
        id: string
        quote?: QuoteData | QuoteData[]
        [key: string]: unknown
      }
      
      const processedEvents = (data || []).map((event: EventWithQuote) => {
        // Supabase puede devolver quote como array o objeto
        const quote = Array.isArray(event.quote) ? event.quote[0] : event.quote
        
        if (quote && typeof quote === 'object') {
          const quoteData = quote as QuoteData
          const client = Array.isArray(quoteData.client) 
            ? quoteData.client[0] 
            : quoteData.client
          return {
            ...event,
            quote: {
              ...quoteData,
              client: client || { name: 'Sin cliente', email: '' }
            }
          }
        }
        return event
      })

      setEvents(processedEvents as Event[])
    } catch (error) {
      logger.error('EventsPage', 'Unexpected error loading events', error as Error)
      toastError('Error inesperado al cargar los eventos')
    } finally {
      setLoading(false)
    }
  }

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      // Filtro de búsqueda
      // Procesar quote que puede ser array o objeto
      const quote = Array.isArray(event.quote) ? event.quote[0] : event.quote
      const client = quote?.client 
        ? (Array.isArray(quote.client) ? quote.client[0] : quote.client)
        : null
      const clientName = client?.name || ''
      
      const matchesSearch = 
        clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.id.toLowerCase().includes(searchTerm.toLowerCase())

      // Filtro de estado
      const matchesStatus = statusFilter === 'all' || event.status === statusFilter

      // Filtro de fecha
      let matchesDate = true
      if (dateFilter !== 'all' && event.start_date) {
        const eventDate = new Date(event.start_date)
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        switch (dateFilter) {
          case 'today':
            matchesDate = eventDate.toDateString() === today.toDateString()
            break
          case 'week':
            const weekFromNow = new Date(today)
            weekFromNow.setDate(today.getDate() + 7)
            matchesDate = eventDate >= today && eventDate <= weekFromNow
            break
          case 'month':
            const monthFromNow = new Date(today)
            monthFromNow.setMonth(today.getMonth() + 1)
            matchesDate = eventDate >= today && eventDate <= monthFromNow
            break
          case 'upcoming':
            matchesDate = eventDate >= today
            break
        }
      }

      return matchesSearch && matchesStatus && matchesDate
    })
  }, [events, searchTerm, statusFilter, dateFilter])

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'confirmed':
      case 'active':
        return <Badge variant="success" size="sm">Confirmado</Badge>
      case 'pending':
        return <Badge variant="warning" size="sm">Pendiente</Badge>
      case 'completed':
      case 'done':
        return <Badge variant="info" size="sm">Completado</Badge>
      case 'cancelled':
      case 'canceled':
        return <Badge variant="error" size="sm">Cancelado</Badge>
      default:
        return <Badge size="sm">{status || 'Sin estado'}</Badge>
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  }

  const formatDateTime = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd 'de' MMMM, yyyy 'a las' HH:mm", { locale: es })
    } catch {
      return dateString
    }
  }

  const handleEdit = (event: Event) => {
    // Obtener quote_id del evento si está disponible
    const quote = Array.isArray(event.quote) ? event.quote[0] : event.quote
    const quoteId = quote?.id
    if (!quoteId) {
      toastError('No se puede editar el evento: falta información de la cotización')
      return
    }
    setSelectedEvent({
      id: event.id,
      quote_id: quoteId,
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
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventToDelete)

      if (error) throw error

      toastSuccess('Evento eliminado exitosamente')
      loadEvents()
      setDeleteConfirmOpen(false)
      setEventToDelete(null)
    } catch (error) {
      logger.error('EventsPage', 'Error deleting event', error as Error)
      toastError('Error al eliminar el evento: ' + (error instanceof Error ? error.message : String(error)))
    }
  }

  const stats = useMemo(() => {
    const total = events.length
    const confirmed = events.filter(e => e.status?.toLowerCase() === 'confirmed' || e.status?.toLowerCase() === 'active').length
    const pending = events.filter(e => e.status?.toLowerCase() === 'pending').length
    const totalValue = events
      .filter(e => e.status?.toLowerCase() === 'confirmed' || e.status?.toLowerCase() === 'active')
      .reduce((acc, e) => {
        const quote = Array.isArray(e.quote) ? e.quote[0] : e.quote
        return acc + (quote?.total_amount || 0)
      }, 0)
    
    return { total, confirmed, pending, totalValue }
  }, [events])

  const statusFilters = [
    { value: 'all' as const, label: 'Todos' },
    { value: 'confirmed' as const, label: 'Confirmados' },
    { value: 'pending' as const, label: 'Pendientes' },
    { value: 'completed' as const, label: 'Completados' },
    { value: 'cancelled' as const, label: 'Cancelados' },
  ]

  const dateFilters = [
    { value: 'all' as const, label: 'Todas las fechas' },
    { value: 'today' as const, label: 'Hoy' },
    { value: 'week' as const, label: 'Esta semana' },
    { value: 'month' as const, label: 'Este mes' },
    { value: 'upcoming' as const, label: 'Próximos' },
  ]

  return (
    <div className="space-y-8 p-6 lg:p-8">
      {/* Premium Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
            Eventos
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Gestiona todos tus eventos programados
          </p>
        </div>
        <Button
          onClick={() => setCreateDialogOpen(true)}
          className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white shadow-lg hover:shadow-xl"
        >
          <Plus className="h-5 w-5 mr-2" />
          Crear Evento
        </Button>
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
                <PartyPopper className="h-7 w-7 text-indigo-600 dark:text-indigo-400" />
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
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                <CalendarIcon className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
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
                <CalendarIcon className="h-7 w-7 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card variant="elevated" className="group hover:scale-[1.02] transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Valor Total</p>
                <p className="text-3xl font-bold text-violet-600 dark:text-violet-400">{formatCurrency(stats.totalValue)}</p>
              </div>
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                <DollarSign className="h-7 w-7 text-violet-600 dark:text-violet-400" />
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
                placeholder="Buscar por cliente o ID de evento..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-3">
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
                  className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-sm font-medium text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition-all"
                >
                  {statusFilters.map((filter) => (
                    <option key={filter.value} value={filter.value}>
                      {filter.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center space-x-2">
                <CalendarIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value as typeof dateFilter)}
                  className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-sm font-medium text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition-all"
                >
                  {dateFilters.map((filter) => (
                    <option key={filter.value} value={filter.value}>
                      {filter.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Premium Events Table */}
      {loading ? (
        <Card variant="elevated">
          <CardContent className="p-6">
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      ) : filteredEvents.length === 0 ? (
        <Card variant="elevated">
          <CardContent className="p-12">
            <EmptyState
              icon={<PartyPopper className="h-10 w-10" />}
              title="No hay eventos"
              description={
                searchTerm || statusFilter !== 'all' || dateFilter !== 'all'
                  ? 'No se encontraron eventos con los filtros aplicados'
                  : 'Aún no tienes eventos programados'
              }
            />
          </CardContent>
        </Card>
      ) : (
        <Card variant="elevated" className="overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-indigo-50 to-violet-50 dark:from-indigo-950/30 dark:to-violet-950/30 border-b border-gray-200/60 dark:border-gray-800/60">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">Lista de Eventos</CardTitle>
                <CardDescription className="mt-1">
                  {filteredEvents.length} {filteredEvents.length === 1 ? 'evento encontrado' : 'eventos encontrados'}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Fecha de Inicio</TableHead>
                  <TableHead>Fecha de Fin</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEvents.map((event) => {
                  // Procesar quote que puede ser array o objeto
                  const quote = Array.isArray(event.quote) ? event.quote[0] : event.quote
                  const client = quote?.client 
                    ? (Array.isArray(quote.client) ? quote.client[0] : quote.client)
                    : null
                  const clientName = client?.name || 'Sin cliente'
                  const clientEmail = client?.email || ''

                  return (
                    <TableRow key={event.id} className="group hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 transition-colors">
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-100 to-violet-100 dark:from-indigo-900/30 dark:to-violet-900/30 flex items-center justify-center">
                            <User className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-white">{clientName}</p>
                            {clientEmail && (
                              <p className="text-xs text-gray-500 dark:text-gray-400">{clientEmail}</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <CalendarIcon className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {event.start_date ? formatDateTime(event.start_date) : 'Sin fecha'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {event.end_date ? (
                          <div className="flex items-center space-x-2">
                            <CalendarIcon className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              {formatDateTime(event.end_date)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400 dark:text-gray-500">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(event.status)}
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {quote?.total_amount ? formatCurrency(quote.total_amount) : '—'}
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
                          <Link href={`/dashboard/events/${event.id}`}>
                            <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                              Ver detalles
                              <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Diálogo de Crear Evento */}
      <CreateEventDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onSuccess={() => {
          loadEvents()
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
          loadEvents()
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

