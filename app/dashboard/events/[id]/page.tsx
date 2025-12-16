'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import confetti from 'canvas-confetti'
import { logger } from '@/lib/utils/logger'
import { useToast } from '@/lib/hooks'
import PageHeader from '@/components/ui/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Skeleton from '@/components/ui/Skeleton'
import EventTimeline from '@/components/events/EventTimeline'
import EventChecklist from '@/components/events/EventChecklist'
import CommentThread from '@/components/comments/CommentThread'
import CalendarIntegration from '@/components/integrations/CalendarIntegration'
import { CheckCircle2, Calendar, DollarSign, ArrowLeft, FileText, User } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import Link from 'next/link'

interface Event {
  id: string
  quote_id: string
  created_at: string
  quote?: {
    id: string
    total_price: number
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
  const router = useRouter()
  const eventId = params.id as string
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const { error: toastError } = useToast()

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
            total_price,
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
      <div className="space-y-6">
        <PageHeader title="Evento" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="space-y-6">
        <PageHeader title="Evento no encontrado" />
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-red-600 dark:text-red-400 mb-4">
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

  // Checklist items
  const checklistItems = [
    { id: '1', label: 'Cotización aprobada por el cliente', completed: true, required: true },
    { id: '2', label: 'Pago recibido', completed: false, required: true },
    { id: '3', label: 'Servicios confirmados', completed: true, required: true },
    { id: '4', label: 'Fecha del evento confirmada', completed: false, required: true },
    { id: '5', label: 'Equipo asignado', completed: false, required: false },
    { id: '6', label: 'Materiales preparados', completed: false, required: false },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Evento #${event.id.slice(0, 8)}`}
        description="Vista operativa completa del evento"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Eventos', href: '/dashboard' },
          { label: 'Detalle' },
        ]}
      />

      {/* Status Banner */}
      <Card className="border-l-4 border-l-green-600 dark:border-l-green-500">
        <CardContent className="p-6">
          <div className="flex items-start space-x-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
              <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Evento Confirmado
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                El evento está activo y listo para ejecutarse. Revisa el checklist para asegurar que
                todo esté listo.
              </p>
            </div>
            <Badge variant="success">Activo</Badge>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Timeline del Evento</CardTitle>
            </CardHeader>
            <CardContent>
              <EventTimeline items={timelineItems} />
            </CardContent>
          </Card>

          {/* Checklist */}
          <EventChecklist items={checklistItems} />

          {/* Event Details */}
          <Card>
          <CardHeader>
            <CardTitle>Información del Evento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/20">
                <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Fecha de Creación
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {formatDate(event.created_at)}
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50 dark:bg-purple-900/20">
                <FileText className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  ID del Evento
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-mono">
                  {event.id.slice(0, 8)}...
                </p>
              </div>
            </div>
            {event.quote_id && (
              <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
                <Link href={`/dashboard/quotes/${event.quote_id}`}>
                  <Button variant="outline" className="w-full">
                    <FileText className="mr-2 h-4 w-4" />
                    Ver Cotización Original
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quote Summary */}
        {event.quote && (
          <Card>
            <CardHeader>
              <CardTitle>Resumen de la Cotización</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {event.quote.client && (
                <div className="flex items-start space-x-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-50 dark:bg-gray-800">
                    <User className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {event.quote.client.name}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {event.quote.client.email}
                    </p>
                  </div>
                </div>
              )}
              <div className="flex items-start space-x-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50 dark:bg-green-900/20">
                  <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Monto Total
                  </p>
                  <p className="text-lg font-bold text-green-600 dark:text-green-400">
                    {formatCurrency(event.quote.total_price)}
                  </p>
                </div>
              </div>
              <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Servicios incluidos:
                  </span>
                  <Badge variant="info">{servicesCount} servicios</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quote Summary */}
          {event.quote && (
            <Card>
              <CardHeader>
                <CardTitle>Resumen de la Cotización</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {event.quote.client && (
                  <div className="flex items-start space-x-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-50 dark:bg-gray-800">
                      <User className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {event.quote.client.name}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {event.quote.client.email}
                      </p>
                    </div>
                  </div>
                )}
                <div className="flex items-start space-x-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50 dark:bg-green-900/20">
                    <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      Monto Total
                    </p>
                    <p className="text-lg font-bold text-green-600 dark:text-green-400">
                      {formatCurrency(event.quote.total_price)}
                    </p>
                  </div>
                </div>
                <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Servicios incluidos:
                    </span>
                    <Badge variant="info">{servicesCount} servicios</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-4">
        <Link href="/dashboard">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al Dashboard
          </Button>
        </Link>
        {event.quote_id && (
          <Link href={`/dashboard/quotes/${event.quote_id}`}>
            <Button>
              <FileText className="mr-2 h-4 w-4" />
              Ver Detalles de la Cotización
            </Button>
          </Link>
        )}
      </div>
    </div>
  )
}
