'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'
import { logger } from '@/lib/utils/logger'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Skeleton from '@/components/ui/Skeleton'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, addMonths, subMonths, startOfWeek, endOfWeek, isValid } from 'date-fns'
import { es } from 'date-fns/locale'
import { cn } from '@/lib/utils/cn'
import Link from 'next/link'
import { safeCreateDate } from '@/lib/utils/premiumHelpers'

interface EventDate {
  date: string
  count: number
  events: Array<{
    id: string
    client_name: string
    status: string
  }>
}

interface CalendarEventRow {
  id: string
  start_date: string | null
  end_date: string | null
  status?: string | null
  quote?: {
    client?: { name?: string | null } | { name?: string | null }[] | null
  } | null
}

export default function EventsCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [events, setEvents] = useState<EventDate[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const loadEvents = useCallback(async () => {
    try {
      setLoading(true)
      
      const startOfCurrentMonth = startOfMonth(currentDate)
      const endOfCurrentMonth = endOfMonth(currentDate)
      
      // Obtener eventos del mes actual y adyacentes para mostrar correctamente
      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select(`
          id,
          start_date,
          end_date,
          status,
          quote:quotes(
            id,
            client:clients(
              name
            )
          )
        `)
        .not('start_date', 'is', null)
        .gte('start_date', format(subMonths(startOfCurrentMonth, 1), 'yyyy-MM-dd'))
        .lte('start_date', format(addMonths(endOfCurrentMonth, 1), 'yyyy-MM-dd'))
        .order('start_date', { ascending: true })

      if (eventsError) {
        logger.error('EventsCalendar', 'Error loading events', eventsError as Error)
        setEvents([])
        return
      }

      // Procesar eventos por fecha
      const eventMap = new Map<string, EventDate>()

      ;(eventsData as CalendarEventRow[] | null | undefined)?.forEach((event) => {
        if (!event.start_date) return

        // Validar fecha de inicio
        const startDate = safeCreateDate(event.start_date)
        if (!startDate) {
          logger.warn('EventsCalendar', 'Invalid start_date', { eventId: event.id, start_date: event.start_date })
          return
        }

        // Obtener nombre del cliente
        const client = event.quote?.client
        const clientName = Array.isArray(client) 
          ? client[0]?.name || 'Sin cliente'
          : client?.name || 'Sin cliente'

        // Procesar rango de fechas si hay end_date
        const endDate = event.end_date ? safeCreateDate(event.end_date) : startDate
        if (!endDate) {
          logger.warn('EventsCalendar', 'Invalid end_date', { eventId: event.id, end_date: event.end_date })
          return
        }
        
        // Agregar evento para cada día del rango
        const currentDate = new Date(startDate)
        const endDateObj = new Date(endDate)
        
        while (currentDate <= endDateObj) {
          // Validar que la fecha actual sea válida antes de formatear
          if (!isValid(currentDate)) {
            logger.warn('EventsCalendar', 'Invalid date in range', { eventId: event.id, currentDate })
            break
          }
          
          const dateKey = format(currentDate, 'yyyy-MM-dd')
          
          if (!eventMap.has(dateKey)) {
            eventMap.set(dateKey, {
              date: dateKey,
              count: 0,
              events: []
            })
          }

          const eventDate = eventMap.get(dateKey)!
          eventDate.count += 1
          eventDate.events.push({
            id: event.id,
            client_name: clientName,
            status: event.status || 'CONFIRMED'
          })

          currentDate.setDate(currentDate.getDate() + 1)
        }
      })

      setEvents(Array.from(eventMap.values()))
    } catch (error) {
      logger.error('EventsCalendar', 'Unexpected error loading events', error as Error)
      setEvents([])
    } finally {
      setLoading(false)
    }
  }, [currentDate, supabase])

  useEffect(() => {
    loadEvents()
  }, [loadEvents])

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

  const getEventsForDate = (date: Date): EventDate | null => {
    const dateKey = format(date, 'yyyy-MM-dd')
    return events.find(e => e.date === dateKey) || null
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return 'bg-blue-500'
      case 'IN_PROGRESS':
        return 'bg-purple-500'
      case 'FINISHED':
        return 'bg-green-500'
      case 'CANCELLED':
        return 'bg-red-500'
      case 'LOGISTICS':
        return 'bg-orange-500'
      default:
        return 'bg-gray-500'
    }
  }

  const previousMonth = () => setCurrentDate(subMonths(currentDate, 1))
  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1))

  const weekDays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

  if (loading) {
    return (
      <Card variant="elevated">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Calendario de Eventos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-96 w-full rounded-xl" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card variant="elevated">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Calendario de Eventos
            </CardTitle>
            <CardDescription className="mt-1">
              Días ocupados por eventos confirmados
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={previousMonth}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium min-w-[140px] text-center">
              {format(currentDate, 'MMMM yyyy', { locale: es })}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={nextMonth}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Días de la semana */}
          <div className="grid grid-cols-7 gap-1">
            {weekDays.map((day) => (
              <div
                key={day}
                className="text-center text-xs font-semibold text-gray-600 dark:text-gray-400 py-2"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendario */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((day) => {
              const isCurrentMonth = isSameMonth(day, currentDate)
              const isCurrentDay = isToday(day)
              const dayEvents = getEventsForDate(day)

              return (
                <div
                  key={day.toString()}
                  className={cn(
                    'min-h-[60px] p-1 rounded-lg border transition-colors',
                    !isCurrentMonth && 'opacity-40',
                    isCurrentDay && 'ring-2 ring-indigo-500 ring-offset-2',
                    dayEvents && dayEvents.count > 0
                      ? 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800'
                      : 'bg-gray-50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-800'
                  )}
                >
                  <div className="flex flex-col h-full">
                    <span
                      className={cn(
                        'text-xs font-medium mb-1',
                        isCurrentDay
                          ? 'text-indigo-600 dark:text-indigo-400'
                          : isCurrentMonth
                          ? 'text-gray-900 dark:text-white'
                          : 'text-gray-400 dark:text-gray-600'
                      )}
                    >
                      {format(day, 'd')}
                    </span>
                    {dayEvents && dayEvents.count > 0 && (
                      <div className="flex-1 space-y-0.5">
                        {dayEvents.events.slice(0, 2).map((event) => (
                          <Link
                            key={event.id}
                            href={`/dashboard/events/${event.id}`}
                            className="block"
                          >
                            <div
                              className={cn(
                                'w-full h-4 rounded text-[10px] px-1 flex items-center text-white truncate',
                                getStatusColor(event.status)
                              )}
                              title={`${event.client_name} - ${event.status}`}
                            >
                              <span className="truncate">{event.client_name}</span>
                            </div>
                          </Link>
                        ))}
                        {dayEvents.count > 2 && (
                          <div className="text-[10px] text-gray-600 dark:text-gray-400 px-1">
                            +{dayEvents.count - 2} más
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Leyenda */}
          <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800" />
              <span className="text-xs text-gray-600 dark:text-gray-400">Día con eventos</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-blue-500" />
              <span className="text-xs text-gray-600 dark:text-gray-400">Confirmado</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-purple-500" />
              <span className="text-xs text-gray-600 dark:text-gray-400">En Progreso</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-green-500" />
              <span className="text-xs text-gray-600 dark:text-gray-400">Finalizado</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

