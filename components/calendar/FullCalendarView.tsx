'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'
import { logger } from '@/lib/utils/logger'
import { useToast } from '@/lib/hooks'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import listPlugin from '@fullcalendar/list'
import type { DateClickArg, EventClickArg, EventContentArg } from '@fullcalendar/core'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import PaymentModal from '@/components/payments/PaymentModal'
import { DollarSign, CheckCircle2 } from 'lucide-react'

interface CalendarEvent {
  id: string
  title: string
  start: string
  end?: string
  backgroundColor?: string
  borderColor?: string
  textColor?: string
  extendedProps: {
    eventId: string
    quoteId: string
    clientName: string
    totalAmount: number
    totalPaid: number
    balanceDue: number
    financialStatus: 'PENDING' | 'PARTIAL' | 'PAID' | 'CANCELLED'
    eventStatus: string
  }
}

interface QuoteClient {
  id: string
  name: string
}

interface QuoteRow {
  id: string
  total_amount: number | null
  client_id?: string | null
  clients?: QuoteClient | QuoteClient[] | null
}

interface EventRow {
  id: string
  start_date: string
  end_date?: string | null
  status?: string | null
  quotes?: QuoteRow | QuoteRow[] | null
}

interface FullCalendarViewProps {
  onEventClick?: (eventId: string, quoteId: string) => void
}

export default function FullCalendarView({ onEventClick }: FullCalendarViewProps) {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [paymentModalOpen, setPaymentModalOpen] = useState(false)
  const [selectedQuoteId, setSelectedQuoteId] = useState<string | null>(null)
  const [selectedQuoteTotal, setSelectedQuoteTotal] = useState<number>(0)
  const supabase = createClient()
  const { success: toastSuccess, error: toastError } = useToast()

  const loadEvents = useCallback(async () => {
    try {
      setLoading(true)
      
      // Obtener eventos con información completa (solo eventos con quote_id y start_date)
      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select(`
          id,
          start_date,
          end_date,
          start_time,
          end_time,
          status,
          quote_id,
          quotes!inner (
            id,
            total_amount,
            status,
            client_id,
            clients!inner (
              id,
              name
            )
          )
        `)
        .not('start_date', 'is', null)
        .not('quote_id', 'is', null)
        .order('start_date', { ascending: true })

      if (eventsError) {
        const errorMessage = eventsError.message || String(eventsError)
        logger.error('FullCalendarView', 'Error loading events', new Error(errorMessage))
        toastError(`Error al cargar eventos: ${errorMessage || 'Error desconocido'}`)
        setEvents([])
        return
      }

      if (!eventsData || eventsData.length === 0) {
        setEvents([])
        return
      }

      // Obtener resumen financiero para cada cotización
      const quoteIds = ((eventsData || []) as EventRow[])
        .map((e) => {
          const quote = Array.isArray(e.quotes) ? e.quotes[0] : e.quotes
          return quote?.id
        })
        .filter(Boolean)

      // Obtener pagos para todas las cotizaciones
      const { data: paymentsData } = await supabase
        .from('partial_payments')
        .select('quote_id, amount')
        .in('quote_id', quoteIds)
        .eq('is_cancelled', false)

      // Calcular totales por cotización
      const paymentsByQuote = new Map<string, number>()
      ;(paymentsData || []).forEach((payment: { quote_id: string; amount: number }) => {
        const current = paymentsByQuote.get(payment.quote_id) || 0
        paymentsByQuote.set(payment.quote_id, current + payment.amount)
      })

      // Procesar eventos para FullCalendar
      const calendarEvents: CalendarEvent[] = ((eventsData || []) as EventRow[]).map((eventRaw) => {
        // El !inner garantiza que siempre hay quote y client
        const quote = Array.isArray(eventRaw.quotes) ? eventRaw.quotes[0] : eventRaw.quotes
        const client = quote?.clients 
          ? (Array.isArray(quote.clients) ? quote.clients[0] : quote.clients)
          : null

        const totalAmount = quote?.total_amount || 0
        const totalPaid = paymentsByQuote.get(quote?.id) || 0
        const balanceDue = Math.max(totalAmount - totalPaid, 0)
        
        // Determinar estado financiero
        let financialStatus: 'PENDING' | 'PARTIAL' | 'PAID' | 'CANCELLED' = 'PENDING'
        if (eventRaw.status === 'CANCELLED' || eventRaw.status === 'NO_SHOW') {
          financialStatus = 'CANCELLED'
        } else if (totalPaid === 0) {
          financialStatus = 'PENDING'
        } else if (balanceDue > 0) {
          financialStatus = 'PARTIAL'
        } else {
          financialStatus = 'PAID'
        }

        // Determinar colores según estado
        let backgroundColor = '#e5e7eb' // Gris claro - Disponible
        let borderColor = '#9ca3af'
        let textColor = '#374151'

        if (financialStatus === 'CANCELLED') {
          backgroundColor = '#fee2e2' // Rojo claro
          borderColor = '#ef4444'
          textColor = '#991b1b'
        } else if (financialStatus === 'PAID') {
          backgroundColor = '#d1fae5' // Verde claro - Liquidado
          borderColor = '#10b981'
          textColor = '#065f46'
        } else if (financialStatus === 'PARTIAL') {
          backgroundColor = '#dbeafe' // Azul claro - Confirmado (con anticipo)
          borderColor = '#3b82f6'
          textColor = '#1e40af'
        } else if (eventRaw.status === 'CONFIRMED') {
          backgroundColor = '#dbeafe' // Azul claro - Confirmado
          borderColor = '#3b82f6'
          textColor = '#1e40af'
        } else if (eventRaw.status === 'LOGISTICS' || eventRaw.status === 'IN_PROGRESS') {
          backgroundColor = '#fef3c7' // Amarillo claro - Reservado
          borderColor = '#f59e0b'
          textColor = '#92400e'
        }

        // Construir fecha/hora completa
        const startDateTime = eventRaw.start_time
          ? `${eventRaw.start_date}T${eventRaw.start_time}`
          : eventRaw.start_date
        const endDateTime = eventRaw.end_date
          ? (eventRaw.end_time
              ? `${eventRaw.end_date}T${eventRaw.end_time}`
              : eventRaw.end_date)
          : null

        return {
          id: eventRaw.id,
          title: `${client?.name || 'Sin cliente'} - ${new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN',
          }).format(totalAmount)}`,
          start: startDateTime,
          ...(endDateTime ? { end: endDateTime } : {}),
          backgroundColor,
          borderColor,
          textColor,
          extendedProps: {
            eventId: eventRaw.id,
            quoteId: quote.id,
            clientName: client?.name || 'Sin cliente',
            totalAmount,
            totalPaid,
            balanceDue,
            financialStatus,
            eventStatus: eventRaw.status,
          },
        }
      })

      setEvents(calendarEvents)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      logger.error('FullCalendarView', 'Error loading events', error instanceof Error ? error : new Error(String(error)))
      toastError(`Error al cargar eventos: ${errorMessage}`)
      setEvents([])
    } finally {
      setLoading(false)
    }
  }, [supabase, toastError])

  useEffect(() => {
    loadEvents()
    
    // Refrescar eventos cada 30 segundos
    const interval = setInterval(() => {
      loadEvents()
    }, 30000)
    
    return () => clearInterval(interval)
  }, [loadEvents])

  const handleEventClick = useCallback((clickInfo: EventClickArg) => {
    const event = clickInfo.event
    const props = event.extendedProps as CalendarEvent['extendedProps']
    
    if (onEventClick) {
      onEventClick(props.eventId, props.quoteId)
    } else {
      // Abrir modal de pagos por defecto
      setSelectedQuoteId(props.quoteId)
      setSelectedQuoteTotal(props.totalAmount)
      setPaymentModalOpen(true)
    }
  }, [onEventClick])

  const handleDateClick = useCallback((dateClickInfo: DateClickArg) => {
    // Permitir crear eventos desde el calendario
    // Por ahora solo mostrar información
    toastSuccess(`Fecha seleccionada: ${format(dateClickInfo.date, 'PPP', { locale: es })}`)
  }, [toastSuccess])

  const handleRegisterPayment = useCallback((quoteId: string, totalAmount: number, e?: React.MouseEvent) => {
    e?.stopPropagation() // Prevenir que se active el click del evento
    setSelectedQuoteId(quoteId)
    setSelectedQuoteTotal(totalAmount)
    setPaymentModalOpen(true)
  }, [])

  const eventContent = useCallback((eventInfo: EventContentArg) => {
    const props = eventInfo.event.extendedProps as CalendarEvent['extendedProps']
    const canRegisterPayment = props.balanceDue > 0 && props.financialStatus !== 'CANCELLED'
    
    return (
      <div className="p-1 text-xs">
        <div className="font-semibold truncate">{props.clientName}</div>
        <div className="text-xs opacity-90">
          {new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN',
            maximumFractionDigits: 0,
          }).format(props.totalAmount)}
        </div>
        {props.financialStatus === 'PARTIAL' && (
          <div className="text-xs opacity-75">
            Pagado: {new Intl.NumberFormat('es-MX', {
              style: 'currency',
              currency: 'MXN',
              maximumFractionDigits: 0,
            }).format(props.totalPaid)}
          </div>
        )}
        {props.financialStatus === 'PAID' && (
          <div className="flex items-center gap-1 text-xs">
            <CheckCircle2 className="h-3 w-3" />
            <span>Liquidado</span>
          </div>
        )}
        {canRegisterPayment && (
          <button
            onClick={(e) => handleRegisterPayment(props.quoteId, props.totalAmount, e)}
            className="mt-1.5 w-full flex items-center justify-center gap-1 px-2 py-1 text-[10px] font-medium text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 rounded-md transition-colors duration-200 shadow-sm hover:shadow-md active:scale-95 touch-manipulation"
            aria-label={`Registrar pago para ${props.clientName}`}
            title={`Registrar pago - Saldo: ${new Intl.NumberFormat('es-MX', {
              style: 'currency',
              currency: 'MXN',
            }).format(props.balanceDue)}`}
          >
            <DollarSign className="h-3 w-3" />
            <span>Registrar Pago</span>
          </button>
        )}
      </div>
    )
  }, [handleRegisterPayment])

  return (
    <div className="space-y-4">
      {/* Leyenda de Estados */}
      <div className="flex flex-wrap items-center gap-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded bg-gray-300 dark:bg-gray-600" />
          <span className="text-sm text-gray-700 dark:text-gray-300">Disponible</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded bg-yellow-300 dark:bg-yellow-600" />
          <span className="text-sm text-gray-700 dark:text-gray-300">Reservado</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded bg-blue-300 dark:bg-blue-600" />
          <span className="text-sm text-gray-700 dark:text-gray-300">Confirmado</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded bg-green-300 dark:bg-green-600" />
          <span className="text-sm text-gray-700 dark:text-gray-300">Liquidado</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded bg-red-300 dark:bg-red-600" />
          <span className="text-sm text-gray-700 dark:text-gray-300">Cancelado</span>
        </div>
      </div>

      {/* FullCalendar */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek',
          }}
          events={events}
          eventClick={handleEventClick}
          dateClick={handleDateClick}
          eventContent={eventContent}
          height="auto"
          locale="es"
          firstDay={1} // Lunes
          weekends={true}
          editable={false}
          selectable={false}
          dayMaxEvents={3}
          moreLinkClick="popover"
          eventDisplay="block"
          {...(loading ? {} : {})}
        />
      </div>

      {/* Modal de Pagos */}
      {selectedQuoteId && (
        <PaymentModal
          open={paymentModalOpen}
          onClose={() => {
            setPaymentModalOpen(false)
            setSelectedQuoteId(null)
            setSelectedQuoteTotal(0)
          }}
          quoteId={selectedQuoteId}
          totalPrice={selectedQuoteTotal}
          onSuccess={() => {
            loadEvents()
          }}
        />
      )}
    </div>
  )
}

