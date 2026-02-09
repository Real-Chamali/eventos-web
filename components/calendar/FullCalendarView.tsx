'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'
import { logger } from '@/lib/utils/logger'
import { useRouter } from 'next/navigation' // <--- AÑADIDO: Importar el router
import { useToast } from '@/lib/hooks'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import listPlugin from '@fullcalendar/list'
import { es } from 'date-fns/locale'
import PaymentModal from '@/components/payments/PaymentModal'
import { DollarSign, CheckCircle2 } from 'lucide-react'

// --- Interfaces (sin cambios) ---
interface CalendarEvent {
  id: string; title: string; start: string; end?: string; backgroundColor?: string; borderColor?: string; textColor?: string; extendedProps: { eventId: string; quoteId: string; clientName: string; totalAmount: number; totalPaid: number; balanceDue: number; financialStatus: 'PENDING' | 'PARTIAL' | 'PAID' | 'CANCELLED' | 'DRAFT'; eventStatus: string | null; };
}
interface QuoteClient { id: string; name: string; }
interface QuoteRow { id: string; total_amount: number | null; client_id?: string | null; clients?: QuoteClient | QuoteClient[] | null; status?: string | null; }
interface EventRow { id: string; start_date: string; end_date?: string | null; start_time?: string | null; end_time?: string | null; status?: string | null; quote_id?: string | null; quotes?: QuoteRow | QuoteRow[] | null;}
interface FullCalendarViewProps { onEventClick?: (eventId: string, quoteId: string) => void; }
// --- Fin de Interfaces ---

export default function FullCalendarView({ onEventClick }: FullCalendarViewProps) {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [paymentModalOpen, setPaymentModalOpen] = useState(false)
  const [selectedQuoteId, setSelectedQuoteId] = useState<string | null>(null)
  const [selectedQuoteTotal, setSelectedQuoteTotal] = useState<number>(0)
  const supabase = createClient()
  const router = useRouter() // <--- AÑADIDO: Instanciar el router
  const { success: toastSuccess, error: toastError } = useToast()

  const loadEvents = useCallback(async () => {
    // ... (Lógica de carga de eventos sin cambios) ...
    try {
      setLoading(true)
      const { data: eventsData, error: eventsError } = await supabase.from('events').select(`id,start_date,end_date,start_time,end_time,status,quote_id,quotes!inner(id,total_amount,status,client_id,clients!inner(id,name))`).not('start_date', 'is', null).not('quote_id', 'is', null).order('start_date', { ascending: true })
      if (eventsError) { throw eventsError }
      if (!eventsData) { setEvents([]); return; }
      const quoteIds = eventsData.map(e => (Array.isArray(e.quotes) ? e.quotes[0] : e.quotes)?.id).filter(Boolean)
      const { data: paymentsData } = await supabase.from('partial_payments').select('quote_id, amount').in('quote_id', quoteIds).eq('is_cancelled', false)
      const paymentsByQuote = new Map<string, number>();
      (paymentsData || []).forEach(p => paymentsByQuote.set(p.quote_id, (paymentsByQuote.get(p.quote_id) || 0) + p.amount));
      
      const calendarEvents: CalendarEvent[] = eventsData.map((eventRaw: any) => {
        const quote = Array.isArray(eventRaw.quotes) ? eventRaw.quotes[0] : eventRaw.quotes
        const client = quote?.clients ? (Array.isArray(quote.clients) ? quote.clients[0] : quote.clients) : null
        const quoteId = quote?.id || eventRaw.quote_id || ''
        const totalAmount = quote?.total_amount || 0
        const totalPaid = paymentsByQuote.get(quoteId) || 0
        const balanceDue = Math.max(totalAmount - totalPaid, 0)
        const quoteStatus = quote?.status

        let financialStatus: 'PENDING' | 'PARTIAL' | 'PAID' | 'CANCELLED' | 'DRAFT' = 'PENDING'
        // AJUSTADO: Se añade el estado DRAFT
        if (quoteStatus === 'draft') {
          financialStatus = 'DRAFT'
        } else if (eventRaw.status === 'CANCELLED' || quoteStatus === 'cancelled') {
          financialStatus = 'CANCELLED'
        } else if (totalPaid === 0 && quoteStatus === 'confirmed') {
          financialStatus = 'PENDING'
        } else if (balanceDue > 0 && quoteStatus === 'confirmed') {
          financialStatus = 'PARTIAL'
        } else if (quoteStatus === 'confirmed') {
          financialStatus = 'PAID'
        }

        let backgroundColor = '#e5e7eb', borderColor = '#9ca3af', textColor = '#374151'
        // AJUSTADO: Se añade color para DRAFT
        if (financialStatus === 'DRAFT') {
          backgroundColor = '#fef3c7'; borderColor = '#f59e0b'; textColor = '#92400e' // Amarillo
        } else if (financialStatus === 'CANCELLED') {
          backgroundColor = '#fee2e2'; borderColor = '#ef4444'; textColor = '#991b1b' // Rojo
        } else if (financialStatus === 'PAID') {
          backgroundColor = '#d1fae5'; borderColor = '#10b981'; textColor = '#065f46' // Verde
        } else if (financialStatus === 'PARTIAL' || financialStatus === 'PENDING') {
          backgroundColor = '#dbeafe'; borderColor = '#3b82f6'; textColor = '#1e40af' // Azul
        }

        const startDateTime = eventRaw.start_time ? `${eventRaw.start_date}T${eventRaw.start_time}` : eventRaw.start_date
        const endDateTime = eventRaw.end_date ? (eventRaw.end_time ? `${eventRaw.end_date}T${eventRaw.end_time}` : eventRaw.end_date) : null

        return {
          id: eventRaw.id, title: `${client?.name || 'Sin cliente'} - ${new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(totalAmount)}`,
          start: startDateTime, ...(endDateTime ? { end: endDateTime } : {}), backgroundColor, borderColor, textColor,
          extendedProps: { eventId: eventRaw.id, quoteId, clientName: client?.name || 'Sin cliente', totalAmount, totalPaid, balanceDue, financialStatus, eventStatus: eventRaw.status ?? null }
        }
      })
      setEvents(calendarEvents)
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error)
      logger.error('FullCalendarView', 'Error loading events', new Error(msg))
      toastError(`Error al cargar: ${msg}`)
    } finally { setLoading(false) }
  }, [supabase, toastError])

  useEffect(() => {
    loadEvents()
    const interval = setInterval(loadEvents, 30000)
    return () => clearInterval(interval)
  }, [loadEvents])

  const handleEventClick = useCallback((clickInfo: any) => {
    const props = clickInfo.event.extendedProps
    if (onEventClick) { onEventClick(props.eventId, props.quoteId) }
    else { setSelectedQuoteId(props.quoteId); setSelectedQuoteTotal(props.totalAmount); setPaymentModalOpen(true) }
  }, [onEventClick])

  // MEJORADO: Redirigir a la página de nueva cotización con la fecha seleccionada.
  const handleDateClick = useCallback((dateClickInfo: any) => {
    const date = dateClickInfo.date
    const आईएसओDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().split('T')[0]
    router.push(`/dashboard/quotes/new?date=${ आईएसओDate}`)
  }, [router])

  const handleRegisterPayment = useCallback((quoteId: string, totalAmount: number, e?: React.MouseEvent) => {
    e?.stopPropagation()
    setSelectedQuoteId(quoteId)
    setSelectedQuoteTotal(totalAmount)
    setPaymentModalOpen(true)
  }, [])
  
  const eventContent = useCallback((eventInfo: any) => {
    // ... (Contenido del evento sin cambios) ...
    const props = eventInfo.event.extendedProps
    const canRegisterPayment = props.balanceDue > 0 && props.financialStatus !== 'CANCELLED' && props.financialStatus !== 'DRAFT'
    return (
      <div className="p-1 text-xs">
        <div className="font-semibold truncate">{props.clientName}</div>
        <div className="text-xs opacity-90">{new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(props.totalAmount)}</div>
        {props.financialStatus === 'PARTIAL' && <div className="text-xs opacity-75">Pagado: {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(props.totalPaid)}</div>}
        {props.financialStatus === 'PAID' && <div className="flex items-center gap-1 text-xs"><CheckCircle2 className="h-3 w-3" /><span>Liquidado</span></div>}
        {canRegisterPayment && <button onClick={(e) => handleRegisterPayment(props.quoteId, props.totalAmount, e)} className="mt-1.5 w-full flex items-center justify-center gap-1 px-2 py-1 text-[10px] font-medium text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 rounded-md transition-colors duration-200 shadow-sm hover:shadow-md active:scale-95 touch-manipulation"> <DollarSign className="h-3 w-3" /><span>Registrar Pago</span></button>}
      </div>
    )
  }, [handleRegisterPayment])

  return (
    <div className="space-y-4">
       {/* Leyenda de Estados (AJUSTADA) */}
      <div className="flex flex-wrap items-center gap-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2"><div className="h-4 w-4 rounded bg-yellow-300 dark:bg-yellow-600" /> <span className="text-sm text-gray-700 dark:text-gray-300">Reservado (Draft)</span></div>
        <div className="flex items-center gap-2"><div className="h-4 w-4 rounded bg-blue-300 dark:bg-blue-600" /> <span className="text-sm text-gray-700 dark:text-gray-300">Confirmado</span></div>
        <div className="flex items-center gap-2"><div className="h-4 w-4 rounded bg-green-300 dark:bg-green-600" /> <span className="text-sm text-gray-700 dark:text-gray-300">Liquidado</span></div>
        <div className="flex items-center gap-2"><div className="h-4 w-4 rounded bg-red-300 dark:bg-red-600" /> <span className="text-sm text-gray-700 dark:text-gray-300">Cancelado</span></div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{ left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek' }}
          events={events} eventClick={handleEventClick} dateClick={handleDateClick} eventContent={eventContent}
          height="auto" locale="es" firstDay={1} weekends={true} editable={false} selectable={true} dayMaxEvents={3} moreLinkClick="popover" eventDisplay="block"
        />
      </div>

      {selectedQuoteId && (
        <PaymentModal open={paymentModalOpen} onClose={() => { setPaymentModalOpen(false); setSelectedQuoteId(null); setSelectedQuoteTotal(0); }} quoteId={selectedQuoteId} totalPrice={selectedQuoteTotal} onSuccess={loadEvents} />
      )}
    </div>
  )
}
