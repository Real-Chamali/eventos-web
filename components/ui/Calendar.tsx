'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/utils/supabase/client'
import { logger } from '@/lib/utils/logger'
import { Card, CardContent, CardHeader, CardTitle } from './Card'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, addMonths, subMonths } from 'date-fns'
import { es } from 'date-fns/locale'
import { cn } from '@/lib/utils/cn'
import Badge from './Badge'
import Skeleton from './Skeleton'
import Button from './Button'

interface EventDate {
  date: string
  count: number
  events: Array<{
    id: string
    client_name: string
    status: string
  }>
}

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [events, setEvents] = useState<EventDate[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const supabase = createClient()

  useEffect(() => {
    loadEvents()
    
    // Refrescar eventos cada 30 segundos
    const interval = setInterval(() => {
      loadEvents()
    }, 30000)
    
    return () => clearInterval(interval)
  }, [])

  const loadEvents = async () => {
    try {
      setLoading(true)
      
      // Obtener eventos con fechas desde la tabla events
      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select(`
          id,
          start_date,
          end_date,
          status,
          quote_id,
          quote:quotes (
            client_id,
            client:clients (
              name
            )
          )
        `)
        .order('start_date', { ascending: true })

      // También obtener cotizaciones confirmadas con event_date
      const { data: quotesData, error: quotesError } = await supabase
        .from('quotes')
        .select(`
          id,
          event_date,
          status,
          client_id,
          client:clients (
            name
          )
        `)
        .eq('status', 'confirmed')
        .not('event_date', 'is', null)

      if (eventsError && quotesError) {
        logger.error('Calendar', 'Error loading events', eventsError instanceof Error ? eventsError : new Error(String(eventsError)), {
          quotesError: quotesError instanceof Error ? quotesError.message : String(quotesError)
        })
        return
      }

      // Combinar y procesar eventos
      const eventMap = new Map<string, EventDate>()

      // Procesar eventos de la tabla events
      if (eventsData) {
        eventsData.forEach((event: any) => {
          const startDate = event.start_date
          const endDate = event.end_date || event.start_date
          
          // Agregar todas las fechas del rango
          const start = new Date(startDate)
          const end = new Date(endDate)
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
              client_name: event.quote?.client?.name || 'Sin cliente',
              status: event.status
            })
          })
        })
      }

      // Procesar cotizaciones con event_date
      if (quotesData) {
        quotesData.forEach((quote: any) => {
          const dateKey = quote.event_date
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
            id: quote.id,
            client_name: quote.client?.name || 'Sin cliente',
            status: quote.status
          })
        })
      }

      setEvents(Array.from(eventMap.values()))
    } catch (error) {
      logger.error('Calendar', 'Error loading events', error instanceof Error ? error : new Error(String(error)))
    } finally {
      setLoading(false)
    }
  }

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
  }, [currentDate, monthStart, monthEnd, daysInMonth, daysBefore, daysAfter])

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
              {format(currentDate, 'MMMM yyyy', { locale: es })}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">Calendario de eventos</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
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

              return (
                <button
                  key={index}
                  onClick={() => setSelectedDate(day)}
                  className={cn(
                    'group relative h-20 rounded-xl text-sm font-medium transition-all duration-200',
                    'hover:bg-gray-50 dark:hover:bg-gray-800/50',
                    'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2',
                    !isCurrentMonth && 'text-gray-300 dark:text-gray-600 opacity-50',
                    isCurrentDay && 'ring-2 ring-indigo-500 ring-offset-2 bg-indigo-50 dark:bg-indigo-950/20',
                    isSelected && !isCurrentDay && 'bg-indigo-50 dark:bg-indigo-950/20',
                    dayEvents && dayEvents.count > 0 && 'bg-emerald-50 dark:bg-emerald-950/20 hover:bg-emerald-100 dark:hover:bg-emerald-950/30'
                  )}
                >
                  <span className={cn(
                    'block pt-2 pb-1 px-2',
                    isCurrentDay && 'font-bold text-indigo-600 dark:text-indigo-400',
                    !isCurrentMonth && 'opacity-50'
                  )}>
                    {format(day, 'd')}
                  </span>
                  {dayEvents && dayEvents.count > 0 && (
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center space-x-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400"></span>
                      {dayEvents.count > 1 && (
                        <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                          {dayEvents.count}
                        </span>
                      )}
                    </div>
                  )}
                </button>
              )
            })}
          </div>

          {/* Eventos del día seleccionado - Premium card */}
          {selectedDate && selectedDateEvents && (
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
                    <Badge variant="success">Confirmado</Badge>
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
        </div>
      )}
    </div>
  )
}
