'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from './Card'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, addMonths, subMonths } from 'date-fns'
import { es } from 'date-fns/locale'
import { cn } from '@/lib/utils/cn'
import Badge from './Badge'
import Skeleton from './Skeleton'

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
          quotes!inner (
            client_id,
            clients!inner (
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
          clients!inner (
            name
          )
        `)
        .eq('status', 'APPROVED')
        .not('event_date', 'is', null)

      if (eventsError && quotesError) {
        console.error('Error loading events:', eventsError, quotesError)
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
              client_name: event.quotes?.clients?.name || 'Sin cliente',
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
            client_name: quote.clients?.name || 'Sin cliente',
            status: quote.status
          })
        })
      }

      setEvents(Array.from(eventMap.values()))
    } catch (error) {
      console.error('Error loading events:', error)
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
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <CalendarIcon className="h-5 w-5" />
            <span>Calendario de Eventos</span>
          </CardTitle>
          <div className="flex items-center space-x-2">
            <button
              onClick={previousMonth}
              className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm font-medium min-w-[140px] text-center">
              {format(currentDate, 'MMMM yyyy', { locale: es })}
            </span>
            <button
              onClick={nextMonth}
              className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-4">
            <div className="h-64 w-full animate-pulse rounded-lg bg-gray-200 dark:bg-gray-800" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Días de la semana */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((day) => (
                <div
                  key={day}
                  className="text-center text-xs font-medium text-gray-500 dark:text-gray-400 py-2"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendario */}
            <div className="grid grid-cols-7 gap-1">
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
                      'relative h-12 rounded-lg text-sm transition-all duration-150',
                      'hover:bg-gray-50 dark:hover:bg-gray-800',
                      !isCurrentMonth && 'text-gray-300 dark:text-gray-600',
                      isCurrentDay && 'ring-2 ring-blue-500',
                      isSelected && 'bg-blue-50 dark:bg-blue-900/20',
                      dayEvents && dayEvents.count > 0 && 'bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30'
                    )}
                  >
                    <span className={cn(
                      'block',
                      isCurrentDay && 'font-bold text-blue-600 dark:text-blue-400',
                      !isCurrentMonth && 'opacity-50'
                    )}>
                      {format(day, 'd')}
                    </span>
                    {dayEvents && dayEvents.count > 0 && (
                      <span className="absolute bottom-1 left-1/2 -translate-x-1/2 h-1.5 w-1.5 rounded-full bg-green-500"></span>
                    )}
                    {dayEvents && dayEvents.count > 1 && (
                      <span className="absolute top-1 right-1 text-xs font-semibold text-green-600 dark:text-green-400">
                        {dayEvents.count}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>

            {/* Eventos del día seleccionado */}
            {selectedDate && selectedDateEvents && (
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-800">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                  Eventos del {format(selectedDate, "d 'de' MMMM, yyyy", { locale: es })}
                </h3>
                <div className="space-y-2">
                  {selectedDateEvents.events.map((event) => (
                    <div
                      key={event.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {event.client_name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
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
      </CardContent>
    </Card>
  )
}

