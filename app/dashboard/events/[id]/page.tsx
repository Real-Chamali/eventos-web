'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import confetti from 'canvas-confetti'
import { logger } from '@/lib/utils/logger'
import { useToast } from '@/lib/hooks'
import { usePaymentSummary } from '@/lib/hooks/usePartialPayments'
import PageHeader from '@/components/ui/PageHeader'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Skeleton from '@/components/ui/Skeleton'
import EventTimeline from '@/components/events/EventTimeline'
import EventChecklist from '@/components/events/EventChecklist'
import RegisterPaymentDialog from '@/components/payments/RegisterPaymentDialog'
import { CheckCircle2, Calendar, DollarSign, ArrowLeft, FileText, User, Sparkles, PartyPopper, CreditCard, TrendingUp } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import Link from 'next/link'

interface Event {
  id: string
  quote_id: string
  created_at: string
  quote?: {
    id: string
    total_amount: number
    status: string
    created_at: string
    client?: {
      name: string
      email: string
    }
    quote_services?: Array<{
      quantity: number
      final_price: number
      service: {
        name: string
      }
    }>
  }
}

export default function EventPage() {
  const params = useParams()
  const eventId = params.id as string
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const { error: toastError, success: toastSuccess } = useToast()
  
  // Obtener información de pagos si hay cotización
  const quoteId = event?.quote?.id || null
  const totalAmount = event?.quote?.total_amount || 0
  const { summary: paymentSummary, loading: paymentsLoading } = usePaymentSummary(quoteId, totalAmount)

  useEffect(() => {
    // Mostrar confeti al cargar la página
    const duration = 3000
    const animationEnd = Date.now() + duration
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 }

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min
    }

    const interval = setInterval(function () {
      const timeLeft = animationEnd - Date.now()

      if (timeLeft <= 0) {
        clearInterval(interval)
        return
      }

      const particleCount = 50 * (timeLeft / duration)
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
      })
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
      })
    }, 250)

    loadEvent()

    return () => {
      clearInterval(interval)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId])

  const loadEvent = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          quote:quotes(
            id,
            total_amount,
            status,
            created_at,
            client:clients(name, email),
            quote_services(
              quantity,
              final_price,
              service:services(name)
            )
          )
        `)
        .eq('id', eventId)
        .single()

      if (error) {
        const errorMessage = error?.message || 'Error loading event'
        const errorForLogging = error instanceof Error 
          ? error 
          : new Error(errorMessage)
        logger.error('EventPage', 'Error loading event', errorForLogging, {
          supabaseError: errorMessage,
          supabaseCode: error?.code,
          eventId: eventId,
        })
        toastError('Error al cargar el evento')
      } else {
        setEvent(data)
      }
    } catch (err) {
      logger.error('EventPage', 'Unexpected error loading event', err as Error)
      toastError('Error inesperado al cargar el evento')
    } finally {
      setLoading(false)
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

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd 'de' MMMM, yyyy 'a las' HH:mm", { locale: es })
    } catch {
      return dateString
    }
  }

  if (loading) {
    return (
      <div className="space-y-8 p-6 lg:p-8">
        <PageHeader title="Evento" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-32 w-full rounded-2xl" />
            <Skeleton className="h-96 w-full rounded-2xl" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-64 w-full rounded-2xl" />
            <Skeleton className="h-64 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="space-y-8 p-6 lg:p-8">
        <PageHeader title="Evento no encontrado" />
        <Card variant="elevated">
          <CardContent className="p-12 text-center">
            <div className="inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-red-50 dark:bg-red-950/30 mb-6">
              <FileText className="h-10 w-10 text-red-600 dark:text-red-400" />
            </div>
            <p className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Evento no encontrado
            </p>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              El evento solicitado no existe o no tienes acceso a él.
            </p>
            <Link href="/dashboard">
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver al Dashboard
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const servicesCount = event.quote?.quote_services?.length || 0
  const hasBalanceDue = paymentSummary.balance_due > 0
  const isFullyPaid = paymentSummary.balance_due === 0 && paymentSummary.total_paid > 0

  // Timeline items basados en el evento
  const timelineItems = [
    {
      id: '1',
      title: 'Cotización Creada',
      description: 'La cotización fue creada y enviada al cliente',
      date: event.quote?.created_at || event.created_at,
      status: 'completed' as const,
    },
    {
      id: '2',
      title: 'Venta Confirmada',
      description: 'El cliente confirmó la cotización y se creó el evento',
      date: event.created_at,
      status: 'completed' as const,
    },
    {
      id: '3',
      title: 'Evento Programado',
      description: 'El evento está programado y listo para ejecutarse',
      date: event.created_at,
      status: 'pending' as const,
    },
  ]

  // Checklist items (actualizado con estado de pagos)
  const checklistItems = [
    { id: '1', label: 'Cotización aprobada por el cliente', completed: true, required: true },
    { id: '2', label: isFullyPaid ? 'Pago completo recibido' : hasBalanceDue ? 'Pago parcial recibido' : 'Pago recibido', completed: isFullyPaid || paymentSummary.total_paid > 0, required: true },
    { id: '3', label: 'Servicios confirmados', completed: true, required: true },
    { id: '4', label: 'Fecha del evento confirmada', completed: false, required: true },
    { id: '5', label: 'Equipo asignado', completed: false, required: false },
    { id: '6', label: 'Materiales preparados', completed: false, required: false },
  ]

  const handlePaymentSuccess = () => {
    toastSuccess('Pago registrado exitosamente')
    // Recargar evento para actualizar información
    loadEvent()
  }

  return (
    <div className="space-y-8 p-6 lg:p-8">
      <PageHeader
        title={`Evento #${event.id.slice(0, 8)}`}
        description="Vista operativa completa del evento confirmado"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Eventos', href: '/dashboard' },
          { label: 'Detalle' },
        ]}
      />

      {/* Premium Status Banner */}
      <Card variant="elevated" className="overflow-hidden border-2 border-emerald-200 dark:border-emerald-800">
        <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border-b border-gray-200/60 dark:border-gray-800/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg">
                <PartyPopper className="h-7 w-7 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl">¡Evento Confirmado!</CardTitle>
                <CardDescription className="mt-1">
                  El evento está activo y listo para ejecutarse. Revisa el checklist para asegurar que todo esté listo.
                </CardDescription>
              </div>
            </div>
            <Badge variant="success" size="lg">Activo</Badge>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Premium Timeline */}
          <Card variant="elevated" className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b border-gray-200/60 dark:border-gray-800/60">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">Timeline del Evento</CardTitle>
                  <CardDescription className="mt-1">Progreso y etapas del evento</CardDescription>
                </div>
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shadow-lg">
                  <Calendar className="h-5 w-5 text-white" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <EventTimeline items={timelineItems} />
            </CardContent>
          </Card>

          {/* Premium Checklist */}
          <Card variant="elevated" className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border-b border-gray-200/60 dark:border-gray-800/60">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">Checklist de Preparación</CardTitle>
                  <CardDescription className="mt-1">Tareas pendientes y completadas</CardDescription>
                </div>
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg">
                  <CheckCircle2 className="h-5 w-5 text-white" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <EventChecklist items={checklistItems} />
            </CardContent>
          </Card>

          {/* Premium Event Details */}
          <Card variant="elevated" className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100/50 dark:from-gray-900/50 dark:to-gray-800/30 border-b border-gray-200/60 dark:border-gray-800/60">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">Información del Evento</CardTitle>
                  <CardDescription className="mt-1">Detalles operativos del evento</CardDescription>
                </div>
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-gray-500 to-gray-600 flex items-center justify-center shadow-lg">
                  <FileText className="h-5 w-5 text-white" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 dark:text-white">
                    Fecha de Creación
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {formatDate(event.created_at)}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30 flex items-center justify-center">
                  <Sparkles className="h-6 w-6 text-violet-600 dark:text-violet-400" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 dark:text-white">
                    ID del Evento
                  </p>
                  <p className="text-sm font-mono text-gray-600 dark:text-gray-400 mt-1">
                    {event.id.slice(0, 8)}...
                  </p>
                </div>
              </div>
              {event.quote_id && (
                <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
                  <Link href={`/dashboard/quotes/${event.quote_id}`}>
                    <Button variant="outline" className="w-full gap-2">
                      <FileText className="h-4 w-4" />
                      Ver Cotización Original
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Premium Sidebar */}
        <div className="space-y-6">
          {/* Quote Summary Card */}
          {event.quote && (
            <Card variant="elevated" className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-indigo-50 to-violet-50 dark:from-indigo-950/30 dark:to-violet-950/30 border-b border-gray-200/60 dark:border-gray-800/60">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl">Resumen de la Cotización</CardTitle>
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shadow-lg">
                    <FileText className="h-5 w-5 text-white" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                {event.quote.client && (
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-950/30 dark:to-violet-950/30 flex items-center justify-center">
                      <User className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {event.quote.client.name}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {event.quote.client.email}
                      </p>
                    </div>
                  </div>
                )}
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 flex items-center justify-center">
                    <DollarSign className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 dark:text-white">
                      Monto Total
                    </p>
                    <p className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mt-1">
                      {formatCurrency(event.quote.total_amount)}
                    </p>
                  </div>
                </div>
                
                {/* Información de Pagos */}
                {!paymentsLoading && (
                  <>
                    <div className="flex items-start gap-4">
                      <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 flex items-center justify-center">
                        <TrendingUp className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 dark:text-white">
                          Total Pagado
                        </p>
                        <p className="text-xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                          {formatCurrency(paymentSummary.total_paid)}
                        </p>
                        {paymentSummary.payments_count > 0 && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {paymentSummary.payments_count} {paymentSummary.payments_count === 1 ? 'pago' : 'pagos'}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    {hasBalanceDue && (
                      <div className="flex items-start gap-4">
                        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 flex items-center justify-center">
                          <CreditCard className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900 dark:text-white">
                            Saldo Pendiente
                          </p>
                          <p className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-1">
                            {formatCurrency(paymentSummary.balance_due)}
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {isFullyPaid && (
                      <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                        <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                        <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                          ✅ Pago completo recibido
                        </p>
                      </div>
                    )}
                  </>
                )}
                
                <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Servicios incluidos:
                    </span>
                    <Badge variant="info" size="sm">{servicesCount} servicios</Badge>
                  </div>
                  
                  {/* Botón para registrar pago - Mostrar siempre que haya cotización y no esté completamente pagado */}
                  {event.quote && !isFullyPaid && (
                    <RegisterPaymentDialog
                      quoteId={event.quote.id}
                      totalPrice={event.quote.total_amount}
                      currentPaid={paymentSummary.total_paid}
                      onSuccess={handlePaymentSuccess}
                      trigger={
                        <Button variant="premium" className="w-full gap-2">
                          <CreditCard className="h-4 w-4" />
                          Registrar Pago
                        </Button>
                      }
                    />
                  )}
                  
                  {isFullyPaid && (
                    <div className="text-center py-2">
                      <Badge variant="success" size="lg">
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Liquidado
                      </Badge>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions Card */}
          <Card variant="elevated" className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100/50 dark:from-gray-900/50 dark:to-gray-800/30 border-b border-gray-200/60 dark:border-gray-800/60">
              <CardTitle className="text-xl">Acciones</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-3">
              <Link href="/dashboard" className="block">
                <Button variant="outline" className="w-full gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Volver al Dashboard
                </Button>
              </Link>
              {event.quote_id && (
                <Link href={`/dashboard/quotes/${event.quote_id}`} className="block">
                  <Button variant="premium" className="w-full gap-2">
                    <FileText className="h-4 w-4" />
                    Ver Cotización
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
