'use client'

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import { logger } from '@/lib/utils/logger'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, addMonths, subMonths, startOfWeek, endOfWeek, addDays, addWeeks, subWeeks, isValid } from 'date-fns'
import { es } from 'date-fns/locale'
import { cn } from '@/lib/utils/cn'
import { safeCreateDate } from '@/lib/utils/premiumHelpers'
import Badge from './Badge'
import Skeleton from './Skeleton'
import Button from './Button'
import { getAvailabilityColor, getAvailabilityLabel, type AvailabilityStatus } from '@/lib/utils/calendarIntelligence'

interface EventDate {
  date: string
  count: number
  events: Array<{
    id: string
    client_name: string
    status: string
  }>
  availability_status?: 'AVAILABLE' | 'RESERVED' | 'CONFIRMED' | 'CANCELLED'
}

type CalendarView = 'month' | 'week' | 'day'

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [events, setEvents] = useState<EventDate[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [view, setView] = useState<CalendarView>('month')
  const supabase = createClient()

  const loadEvents = useCallback(async () => {
    try {
      setLoading(true)
      
      // Obtener eventos reales con relaciones correctas desde la tabla events
      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select(`
          id,
          start_date,
          end_date,
          status,
          quote_id,
          quote:quotes!inner (
            id,
            client_id,
            status,
            clients!inner (
              id,
              name
            )
          )
        `)
        .not('start_date', 'is', null)
        .order('start_date', { ascending: true })

      if (eventsError) {
        logger.error('Calendar', 'Error loading events', eventsError instanceof Error ? eventsError : new Error(String(eventsError)))
        // Continuar aunque haya error para mostrar lo que se pueda
      }

      // Combinar y procesar eventos con disponibilidad real
      const eventMap = new Map<string, EventDate>()

      // Tipos para datos de Supabase con relaciones correctas (pueden venir como array o objeto)
      type SupabaseClient = {
        id: string
        name: string
      }
      
      type SupabaseQuote = {
        id: string
        client_id: string
        status: string
        clients: SupabaseClient | SupabaseClient[] | null
      }
      
      type SupabaseEvent = {
        id: string
        start_date: string
        end_date?: string | null
        status: string
        quote_id: string
        quote: SupabaseQuote | SupabaseQuote[] | null
      }

      // Procesar eventos de la tabla events (datos reales con relaciones)
      if (eventsData && eventsData.length > 0) {
        // Obtener disponibilidad para cada fecha usando la función SQL
        const dateAvailabilityMap = new Map<string, AvailabilityStatus>()
        
        for (const eventRaw of eventsData) {
          // Manejar relaciones que pueden venir como array o objeto
          const event = eventRaw as SupabaseEvent
          const quote = Array.isArray(event.quote) ? event.quote[0] : event.quote
          const client = quote?.clients 
            ? (Array.isArray(quote.clients) ? quote.clients[0] : quote.clients)
            : null
          
          const startDate = event.start_date.split('T')[0] // Solo la fecha sin hora
          const endDate = event.end_date ? event.end_date.split('T')[0] : startDate
          
          // Obtener disponibilidad real usando la función SQL
          try {
            const { getDateAvailability } = await import('@/lib/utils/calendarIntelligence')
            const availability = await getDateAvailability(startDate, endDate)
            
            // Agregar todas las fechas del rango con disponibilidad real
            const start = safeCreateDate(startDate)
            const end = safeCreateDate(endDate)
            if (!start || !end) {
              logger.warn('Calendar', 'Invalid dates in event', { eventId: event.id, startDate, endDate })
              continue
            }
            const days = eachDayOfInterval({ start, end })
            
            days.forEach(day => {
              const dateKey = format(day, 'yyyy-MM-dd')
              if (!dateAvailabilityMap.has(dateKey)) {
                dateAvailabilityMap.set(dateKey, availability)
              }
              
              if (!eventMap.has(dateKey)) {
                eventMap.set(dateKey, {
                  date: dateKey,
                  count: 0,
                  events: [],
                  availability_status: availability
                })
              }
              const eventDate = eventMap.get(dateKey)!
              eventDate.count++
              eventDate.events.push({
                id: event.id,
                client_name: client?.name || 'Sin cliente',
                status: event.status
              })
              // Actualizar estado de disponibilidad basado en eventos confirmados
              if (event.status === 'CONFIRMED') {
                eventDate.availability_status = 'CONFIRMED'
              } else if (event.status === 'LOGISTICS' && eventDate.availability_status !== 'CONFIRMED') {
                eventDate.availability_status = 'RESERVED'
              }
            })
          } catch (availError) {
            logger.error('Calendar', 'Error getting availability', availError instanceof Error ? availError : new Error(String(availError)))
            // Fallback: procesar sin disponibilidad pero con relaciones correctas
            const start = safeCreateDate(startDate)
            const end = safeCreateDate(endDate)
            if (!start || !end) {
              logger.warn('Calendar', 'Invalid dates in event (fallback)', { eventId: event.id, startDate, endDate })
              continue
            }
            const days = eachDayOfInterval({ start, end })
            
            days.forEach(day => {
              const dateKey = format(day, 'yyyy-MM-dd')
              if (!eventMap.has(dateKey)) {
                eventMap.set(dateKey, {
                  date: dateKey,
                  count: 0,
                  events: []
                })
              }
              const eventDate = eventMap.get(dateKey)!
              eventDate.count++
              eventDate.events.push({
                id: event.id,
                client_name: client?.name || 'Sin cliente',
                status: event.status
              })
              // Determinar disponibilidad basado en estado del evento
              if (event.status === 'CONFIRMED') {
                eventDate.availability_status = 'CONFIRMED'
              } else if (event.status === 'LOGISTICS' || event.status === 'IN_PROGRESS') {
                eventDate.availability_status = 'RESERVED'
              } else if (event.status === 'CANCELLED' || event.status === 'NO_SHOW') {
                eventDate.availability_status = 'CANCELLED'
              }
            })
          }
        }
      }

      setEvents(Array.from(eventMap.values()))
    } catch (error) {
      logger.error('Calendar', 'Error loading events', error instanceof Error ? error : new Error(String(error)))
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    loadEvents()
  }, [loadEvents])

  // Recargar cuando cambia el mes para mostrar eventos del mes actual
  useEffect(() => {
    loadEvents()
  }, [currentDate, loadEvents])

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd })

  // Agregar días del mes anterior y siguiente para completar la semana
  const firstDayOfWeek = monthStart.getDay()
  const lastDayOfWeek = monthEnd.getDay()
  const daysBefore = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1
  const daysAfter = lastDayOfWeek === 0 ? 0 : 7 - lastDayOfWeek

  const calendarDays = useMemo(() => {
    const days: Date[] = []
    
    // Días del mes anterior
    for (let i = daysBefore - 1; i >= 0; i--) {
      days.push(new Date(monthStart.getFullYear(), monthStart.getMonth(), -i))
    }
    
    // Días del mes actual
    days.push(...daysInMonth)
    
    // Días del mes siguiente
    for (let i = 1; i <= daysAfter; i++) {
      days.push(new Date(monthEnd.getFullYear(), monthEnd.getMonth() + 1, i))
    }
    
    return days
  }, [monthStart, monthEnd, daysInMonth, daysBefore, daysAfter])

  const getEventsForDate = (date: Date): EventDate | undefined => {
    const dateKey = format(date, 'yyyy-MM-dd')
    return events.find(e => e.date === dateKey)
  }

  const previousMonth = () => {
    setCurrentDate(subMonths(currentDate, 1))
  }

  const nextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1))
  }

  const selectedDateEvents = selectedDate ? getEventsForDate(selectedDate) : null

  return (
    <div className="space-y-4">
      {/* Header con navegación premium */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-sm">
            <CalendarIcon className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {view === 'month' && format(currentDate, 'MMMM yyyy', { locale: es })}
              {view === 'week' && `Semana del ${format(startOfWeek(currentDate, { weekStartsOn: 1 }), 'd MMM', { locale: es })}`}
              {view === 'day' && format(currentDate, 'EEEE, d MMMM yyyy', { locale: es })}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">Calendario de eventos</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {/* Selector de vista */}
          <div className="flex items-center gap-1 rounded-lg border border-gray-200 dark:border-gray-800 p-1">
            <Button
              variant={view === 'month' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setView('month')}
              className="h-8 px-3 text-xs"
            >
              Mes
            </Button>
            <Button
              variant={view === 'week' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setView('week')}
              className="h-8 px-3 text-xs"
            >
              Semana
            </Button>
            <Button
              variant={view === 'day' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setView('day')}
              className="h-8 px-3 text-xs"
            >
              Día
            </Button>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={previousMonth}
            className="h-9 w-9 p-0 rounded-lg"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={nextMonth}
            className="h-9 w-9 p-0 rounded-lg"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      ) : (
        <div className="space-y-4">
          {view === 'month' && (
            <>
              {/* Días de la semana - Premium styling */}
              <div className="grid grid-cols-7 gap-2 mb-2">
            {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((day) => (
              <div
                key={day}
                className="text-center text-xs font-semibold text-gray-600 dark:text-gray-400 py-2.5 uppercase tracking-wider"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendario - Premium grid */}
          <div className="grid grid-cols-7 gap-2">
            {calendarDays.map((day, index) => {
              const isCurrentMonth = isSameMonth(day, currentDate)
              const isCurrentDay = isToday(day)
              const dayEvents = getEventsForDate(day)
              const isSelected = selectedDate && isSameDay(day, selectedDate)

              // Determinar estado de disponibilidad real
              const availabilityStatus: AvailabilityStatus = dayEvents?.availability_status || 
                (dayEvents?.events.some(e => e.status === 'CONFIRMED') ? 'CONFIRMED' : 
                 dayEvents?.events.some(e => e.status === 'LOGISTICS' || e.status === 'IN_PROGRESS') ? 'RESERVED' : 
                 dayEvents?.events.some(e => e.status === 'CANCELLED' || e.status === 'NO_SHOW') ? 'CANCELLED' : 
                 'AVAILABLE')
              
              // Determinar si está bloqueado (confirmado o reservado)
              const isBlocked = availabilityStatus === 'CONFIRMED' || availabilityStatus === 'RESERVED'
              const isConfirmed = availabilityStatus === 'CONFIRMED'
              const isReserved = availabilityStatus === 'RESERVED'
              const isCancelled = availabilityStatus === 'CANCELLED'
              
              // Colores según estado real
              const getBlockedColor = () => {
                if (isConfirmed) return 'bg-blue-100 dark:bg-blue-950/40 border-2 border-blue-300 dark:border-blue-700'
                if (isReserved) return 'bg-yellow-100 dark:bg-yellow-950/40 border-2 border-yellow-300 dark:border-yellow-700'
                if (isCancelled) return 'bg-gray-100 dark:bg-gray-800/40 border border-gray-300 dark:border-gray-700 opacity-50'
                return ''
              }

              return (
                <button
                  key={index}
                  onClick={() => setSelectedDate(day)}
                  disabled={isBlocked && !isCurrentMonth}
                  className={cn(
                    'group relative h-20 rounded-xl text-sm font-medium transition-all duration-200',
                    'hover:bg-gray-50 dark:hover:bg-gray-800/50',
                    'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2',
                    !isCurrentMonth && 'text-gray-300 dark:text-gray-600 opacity-50',
                    isCurrentDay && 'ring-2 ring-indigo-500 ring-offset-2 bg-indigo-50 dark:bg-indigo-950/20',
                    isSelected && !isCurrentDay && 'bg-indigo-50 dark:bg-indigo-950/20',
                    // Bloqueo visual basado en estado real
                    isBlocked && isCurrentMonth && getBlockedColor(),
                    isBlocked && !isCurrentMonth && 'opacity-30 cursor-not-allowed',
                    isCancelled && 'line-through'
                  )}
                  title={
                    dayEvents && dayEvents.count > 0
                      ? `${dayEvents.count} evento(s) - ${getAvailabilityLabel(availabilityStatus)}`
                      : 'Disponible'
                  }
                >
                  <span className={cn(
                    'block pt-2 pb-1 px-2',
                    isCurrentDay && 'font-bold text-indigo-600 dark:text-indigo-400',
                    !isCurrentMonth && 'opacity-50',
                    isBlocked && isCurrentMonth && (isConfirmed ? 'text-blue-700 dark:text-blue-300' : 'text-yellow-700 dark:text-yellow-300')
                  )}>
                    {format(day, 'd')}
                  </span>
                  {dayEvents && dayEvents.count > 0 && (
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center space-x-1">
                      {(() => {
                        const colorClass = getAvailabilityColor(availabilityStatus)
                        return (
                          <>
                            <span className={cn(
                              "h-2 w-2 rounded-full",
                              isConfirmed ? "bg-blue-600 dark:bg-blue-400" :
                              isReserved ? "bg-yellow-600 dark:bg-yellow-400" :
                              isCancelled ? "bg-gray-400 dark:bg-gray-600" :
                              "bg-green-600 dark:bg-green-400"
                            )}></span>
                            {dayEvents.count > 1 && (
                              <span className={cn(
                                "text-xs font-semibold px-1 rounded",
                                isConfirmed ? "text-blue-700 dark:text-blue-300" :
                                isReserved ? "text-yellow-700 dark:text-yellow-300" :
                                "text-gray-700 dark:text-gray-300"
                              )}>
                                {dayEvents.count}
                              </span>
                            )}
                            {isConfirmed && (
                              <span className="text-xs" title="Bloqueado - Confirmado">🔒</span>
                            )}
                            {isReserved && !isConfirmed && (
                              <span className="text-xs" title="Reservado">⚠️</span>
                            )}
                          </>
                        )
                      })()}
                    </div>
                  )}
                  {!dayEvents && isCurrentMonth && (
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2">
                      <span className="h-1 w-1 rounded-full bg-green-400 dark:bg-green-500 opacity-50"></span>
                    </div>
                  )}
                </button>
              )
            })}
          </div>
            </>
          )}

          {view === 'week' && (
            <div className="space-y-2">
              {/* Header de días de la semana */}
              <div className="grid grid-cols-7 gap-2 mb-2">
                {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((day, idx) => {
                  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 })
                  const dayDate = addDays(weekStart, idx)
                  const dayEvents = getEventsForDate(dayDate)
                  const availabilityStatus: AvailabilityStatus = dayEvents?.availability_status || 
                    (dayEvents?.events.some(e => e.status === 'CONFIRMED') ? 'CONFIRMED' : 
                     dayEvents?.events.some(e => e.status === 'LOGISTICS' || e.status === 'IN_PROGRESS') ? 'RESERVED' : 
                     dayEvents?.events.some(e => e.status === 'CANCELLED' || e.status === 'NO_SHOW') ? 'CANCELLED' : 
                     'AVAILABLE')
                  const isBlocked = availabilityStatus === 'CONFIRMED' || availabilityStatus === 'RESERVED'
                  const isConfirmed = availabilityStatus === 'CONFIRMED'
                  
                  return (
                    <div 
                      key={day} 
                      className={cn(
                        "text-center p-3 rounded-xl border-2 transition-all",
                        isBlocked && isConfirmed ? "bg-blue-50 dark:bg-blue-950/30 border-blue-300 dark:border-blue-700" :
                        isBlocked ? "bg-yellow-50 dark:bg-yellow-950/30 border-yellow-300 dark:border-yellow-700" :
                        "bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700"
                      )}
                    >
                      <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2">
                        {day}
                      </div>
                      <div className={cn(
                        "text-sm font-bold mb-2",
                        isConfirmed ? "text-blue-700 dark:text-blue-300" :
                        isBlocked ? "text-yellow-700 dark:text-yellow-300" :
                        "text-gray-900 dark:text-white"
                      )}>
                        {format(dayDate, 'd')}
                        {isConfirmed && <span className="ml-1 text-xs">🔒</span>}
                        {isBlocked && !isConfirmed && <span className="ml-1 text-xs">⚠️</span>}
                      </div>
                      {dayEvents && dayEvents.count > 0 ? (
                        <div className="mt-2 space-y-1">
                          {dayEvents.events.slice(0, 3).map((event) => (
                            <div
                              key={event.id}
                              className={cn(
                                "text-xs p-1.5 rounded truncate font-medium",
                                event.status === 'CONFIRMED' ? "bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800" :
                                event.status === 'LOGISTICS' || event.status === 'IN_PROGRESS' ? "bg-yellow-100 dark:bg-yellow-950/40 text-yellow-700 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-800" :
                                "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                              )}
                            >
                              {event.client_name}
                            </div>
                          ))}
                          {dayEvents.count > 3 && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                              +{dayEvents.count - 3} más
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-xs text-green-600 dark:text-green-400 mt-2 font-medium">
                          Disponible
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {view === 'day' && (
            <div className="space-y-4">
              {(() => {
                const dayEvents = getEventsForDate(currentDate)
                const availabilityStatus: AvailabilityStatus = dayEvents?.availability_status || 
                  (dayEvents?.events.some(e => e.status === 'CONFIRMED') ? 'CONFIRMED' : 
                   dayEvents?.events.some(e => e.status === 'LOGISTICS' || e.status === 'IN_PROGRESS') ? 'RESERVED' : 
                   dayEvents?.events.some(e => e.status === 'CANCELLED' || e.status === 'NO_SHOW') ? 'CANCELLED' : 
                   'AVAILABLE')
                const isBlocked = availabilityStatus === 'CONFIRMED' || availabilityStatus === 'RESERVED'
                const isConfirmed = availabilityStatus === 'CONFIRMED'
                
                return (
                  <>
                    <div className={cn(
                      "text-center p-6 rounded-xl border-2",
                      isConfirmed ? "bg-blue-50 dark:bg-blue-950/30 border-blue-300 dark:border-blue-700" :
                      isBlocked ? "bg-yellow-50 dark:bg-yellow-950/30 border-yellow-300 dark:border-yellow-700" :
                      "bg-gradient-to-r from-indigo-50 to-violet-50 dark:from-indigo-950/30 dark:to-violet-950/30 border border-indigo-200 dark:border-indigo-800"
                    )}>
                      <h3 className="text-2xl font-bold mb-2 flex items-center justify-center gap-2">
                        <span className={isConfirmed ? "text-blue-700 dark:text-blue-300" : isBlocked ? "text-yellow-700 dark:text-yellow-300" : "text-gray-900 dark:text-white"}>
                          {format(currentDate, 'EEEE, d', { locale: es })}
                        </span>
                        {isConfirmed && <span>🔒</span>}
                        {isBlocked && !isConfirmed && <span>⚠️</span>}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {format(currentDate, 'MMMM yyyy', { locale: es })}
                      </p>
                      <Badge variant={isConfirmed ? 'error' : isBlocked ? 'warning' : 'success'} size="sm">
                        {getAvailabilityLabel(availabilityStatus)}
                      </Badge>
                    </div>
                    {dayEvents && dayEvents.count > 0 ? (
                      <div className="space-y-2">
                        {dayEvents.events.map((event) => (
                          <div
                            key={event.id}
                            className={cn(
                              "p-4 rounded-xl border-2",
                              event.status === 'CONFIRMED' ? "bg-blue-50 dark:bg-blue-950/30 border-blue-300 dark:border-blue-700" :
                              event.status === 'LOGISTICS' || event.status === 'IN_PROGRESS' ? "bg-yellow-50 dark:bg-yellow-950/30 border-yellow-300 dark:border-yellow-700" :
                              "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                            )}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-semibold text-gray-900 dark:text-white">{event.client_name}</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">{event.status}</p>
                              </div>
                              <Badge variant={
                                event.status === 'CONFIRMED' ? 'error' :
                                event.status === 'LOGISTICS' || event.status === 'IN_PROGRESS' ? 'warning' : 'info'
                              }>
                                {getAvailabilityLabel(event.status as AvailabilityStatus)}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center p-8 rounded-xl bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
                        <p className="text-green-700 dark:text-green-300 font-medium">
                          ✅ Día disponible - No hay eventos programados
                        </p>
                      </div>
                    )}
                  </>
                )
              })()}
            </div>
          )}

          {/* Eventos del día seleccionado - Premium card (solo para vista mensual) */}
          {view === 'month' && selectedDate && selectedDateEvents && (
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-800">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
                <CalendarIcon className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                <span>Eventos del {format(selectedDate, "d 'de' MMMM, yyyy", { locale: es })}</span>
              </h3>
              <div className="space-y-2">
                {selectedDateEvents.events.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-gray-50 to-white dark:from-gray-800/50 dark:to-gray-900 border border-gray-200 dark:border-gray-800 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all duration-200"
                  >
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {event.client_name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {event.status}
                      </p>
                    </div>
                    <Badge variant={
                      event.status === 'CONFIRMED' ? 'success' :
                      event.status === 'LOGISTICS' ? 'warning' :
                      event.status === 'CANCELLED' ? 'error' : 'info'
                    }>
                      {event.status === 'CONFIRMED' ? 'Confirmado' :
                       event.status === 'LOGISTICS' ? 'Apartado' :
                       event.status === 'CANCELLED' ? 'Cancelado' : event.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {selectedDate && !selectedDateEvents && (
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-800 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No hay eventos programados para esta fecha
              </p>
            </div>
          )}

          {view === 'month' && selectedDate && !selectedDateEvents && (
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-800 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No hay eventos programados para esta fecha
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
