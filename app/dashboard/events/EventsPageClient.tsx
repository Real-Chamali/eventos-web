'use client'

import { useState, useEffect, useMemo, useRef, memo, useCallback } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { useWindowSize } from '@/lib/hooks'
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
import { useToast, useIsAdmin } from '@/lib/hooks'
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

// Componente de fila memoizado para evitar re-renders innecesarios
const EventRow = memo(function EventRow({
  event,
  isAdmin,
  onEdit,
  onDeleteClick,
  getStatusBadge,
  formatCurrency,
  formatDateTime,
}: {
  event: Event
  isAdmin: boolean
  onEdit: (event: Event) => void
  onDeleteClick: (id: string) => void
  getStatusBadge: (status: string) => React.ReactNode
  formatCurrency: (amount: number) => string
  formatDateTime: (dateString: string) => string
}) {
  const quote = Array.isArray(event.quote) ? event.quote[0] : event.quote
  const client = quote?.client 
    ? (Array.isArray(quote.client) ? quote.client[0] : quote.client)
    : null
  const clientName = client?.name || 'Sin cliente'
  const clientEmail = client?.email || ''

  return (
    <div className="group border-b border-gray-200 dark:border-gray-800 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 transition-colors">
      <div className="grid grid-cols-12 gap-4 px-6 py-4 items-center">
        <div className="col-span-3">
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
        </div>
        <div className="col-span-2">
          <div className="flex items-center space-x-2">
            <CalendarIcon className="h-4 w-4 text-gray-400 dark:text-gray-500" />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              {event.start_date ? formatDateTime(event.start_date) : 'Sin fecha'}
            </span>
          </div>
        </div>
        <div className="col-span-2">
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
        </div>
        <div className="col-span-2">
          {getStatusBadge(event.status)}
        </div>
        <div className="col-span-1">
          <span className="font-semibold text-gray-900 dark:text-white">
            {quote?.total_amount ? formatCurrency(quote.total_amount) : '—'}
          </span>
        </div>
        <div className="col-span-2 text-right">
          <div className="flex items-center justify-end gap-2">
            {isAdmin && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(event)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                  title="Editar evento"
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDeleteClick(event.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                  title="Eliminar evento"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </>
            )}
            <Link href={`/dashboard/events/${event.id}`}>
              <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                Ver detalles
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
})

export default function EventsPageClient() {
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
  const { isAdmin } = useIsAdmin()
  const tableContainerRef = useRef<HTMLDivElement>(null)
  const { height: windowHeight } = useWindowSize()

  // Calcular altura dinámica del contenedor (responsive)
  const containerHeight = useMemo(() => {
    const baseHeight = windowHeight > 768 ? windowHeight - 400 : windowHeight - 300
    return Math.max(400, Math.min(800, baseHeight))
  }, [windowHeight])

  useEffect(() => {
    loadEvents()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadEvents = async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Verificar si es admin para determinar qué eventos mostrar
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle()
      
      const isAdmin = profile?.role === 'admin'
      
      // RLS maneja automáticamente el filtrado por rol
      // Los vendors solo ven sus eventos, los admins ven todos
      const { data, error } = await supabase
        .from('events')
        .select(`
          id,
          quote_id,
          status,
          start_date,
          end_date,
          start_time,
          end_time,
          location,
          guest_count,
          event_type,
          emergency_contact,
          emergency_phone,
          special_requirements,
          additional_notes,
          created_at,
          quote:quotes(
            id,
            total_amount,
            status,
            vendor_id,
            client:clients(
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
      // Normalizar estructura de datos de Supabase
      const processedEvents = (data || []).map((event: any) => {
        // Normalizar quote (puede venir como array o objeto)
        let quote = event.quote
        if (Array.isArray(quote)) {
          quote = quote[0] || null
        }
        
        // Normalizar client dentro de quote
        if (quote && quote.client) {
          if (Array.isArray(quote.client)) {
            quote.client = quote.client[0] || { name: 'Sin cliente', email: '' }
          }
          // Asegurar que client tenga estructura correcta
          if (!quote.client.name) {
            quote.client = { name: 'Sin cliente', email: quote.client.email || '' }
          }
        } else if (quote) {
          quote.client = { name: 'Sin cliente', email: '' }
        }
        
        return {
          ...event,
          quote: quote || null,
        } as Event
      })

      setEvents(processedEvents)
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

  // Virtual scrolling para la lista de eventos
  const virtualizer = useVirtualizer({
    count: filteredEvents.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => 100,
    overscan: 5,
    measureElement: (element) => element?.getBoundingClientRect().height ?? 100,
    scrollMargin: 20,
  })
  
  // Scroll suave a un elemento específico
  const scrollToIndex = useCallback((index: number) => {
    virtualizer.scrollToIndex(index, {
      align: 'start',
      behavior: 'smooth',
    })
  }, [virtualizer])

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

  const handleEdit = useCallback((event: Event) => {
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
  }, [toastError])

  const handleDeleteClick = useCallback((eventId: string) => {
    setEventToDelete(eventId)
    setDeleteConfirmOpen(true)
  }, [])

  const handleDeleteConfirm = useCallback(async () => {
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
  }, [eventToDelete, supabase, toastSuccess, toastError, loadEvents])

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
    <div className="space-y-6 sm:space-y-8 p-4 sm:p-6 lg:p-8">
      {/* Premium Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
            Eventos
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-base sm:text-lg">
            Gestiona todos tus eventos programados
          </p>
        </div>
        <Button
          onClick={() => setCreateDialogOpen(true)}
          className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white shadow-lg hover:shadow-xl min-h-[48px] sm:min-h-[44px]"
        >
          <Plus className="h-5 w-5 mr-2" />
          Crear Evento
        </Button>
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
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex items-center space-x-2 flex-1 sm:flex-initial">
                <Filter className="h-4 w-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                <select
                  id="events-status-filter"
                  name="statusFilter"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
                  className="flex-1 sm:flex-initial px-4 py-2.5 min-h-[44px] rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-sm font-medium text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition-all touch-manipulation"
                >
                  {statusFilters.map((filter) => (
                    <option key={filter.value} value={filter.value}>
                      {filter.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center space-x-2 flex-1 sm:flex-initial">
                <CalendarIcon className="h-4 w-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                <select
                  id="events-date-filter"
                  name="dateFilter"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value as typeof dateFilter)}
                  className="flex-1 sm:flex-initial px-4 py-2.5 min-h-[44px] rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-sm font-medium text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition-all touch-manipulation"
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
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl">Lista de Eventos</CardTitle>
                    <CardDescription className="mt-1">
                      {filteredEvents.length} {filteredEvents.length === 1 ? 'evento encontrado' : 'eventos encontrados'}
                    </CardDescription>
                  </div>
                  {/* Indicador de posición */}
                  {virtualizer.getVirtualItems().length > 0 && (
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Mostrando {virtualizer.getVirtualItems()[0]?.index + 1 || 0} - {virtualizer.getVirtualItems()[virtualizer.getVirtualItems().length - 1]?.index + 1 || 0} de {filteredEvents.length}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-hidden">
              {/* Header fijo */}
              <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
                <div className="grid grid-cols-12 gap-4 px-6 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
                  <div className="col-span-3">Cliente</div>
                  <div className="col-span-2">Fecha de Inicio</div>
                  <div className="col-span-2">Fecha de Fin</div>
                  <div className="col-span-2">Estado</div>
                  <div className="col-span-1">Valor</div>
                  <div className="col-span-2 text-right">Acciones</div>
                </div>
              </div>
              
              {/* Lista virtualizada con altura dinámica */}
              <div 
                ref={tableContainerRef} 
                className="overflow-auto transition-all duration-300"
                style={{ height: `${containerHeight}px` }}
              >
                <div
                  style={{
                    height: `${virtualizer.getTotalSize()}px`,
                    width: '100%',
                    position: 'relative',
                  }}
                  className="transition-opacity duration-300"
                >
                  {virtualizer.getVirtualItems().map((virtualRow) => {
                    const event = filteredEvents[virtualRow.index]
                    return (
                      <div
                        key={virtualRow.key}
                        data-index={virtualRow.index}
                        ref={virtualizer.measureElement}
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: `${virtualRow.size}px`,
                          transform: `translateY(${virtualRow.start}px)`,
                        }}
                        className="transition-opacity duration-200"
                      >
                        <EventRow
                          event={event}
                          isAdmin={isAdmin}
                          onEdit={handleEdit}
                          onDeleteClick={handleDeleteClick}
                          getStatusBadge={getStatusBadge}
                          formatCurrency={formatCurrency}
                          formatDateTime={formatDateTime}
                        />
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
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

      {/* Diálogo de Editar Evento - Solo para admin */}
      {isAdmin && (
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
      )}

      {/* Diálogo de Confirmación para Borrar - Solo para admin */}
      {isAdmin && (
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
      )}
    </div>
  )
}

