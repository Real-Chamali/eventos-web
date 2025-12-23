'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import confetti from 'canvas-confetti'
import { logger } from '@/lib/utils/logger'
import { useToast, useIsAdmin } from '@/lib/hooks'
import { exportQuoteToPDF } from '@/lib/utils/export'
import PageHeader from '@/components/ui/PageHeader'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import CommentThread from '@/components/comments/CommentThread'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/AlertDialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/Table'
import Skeleton from '@/components/ui/Skeleton'
import { Download, Edit, ArrowLeft, CheckCircle2, Mail, User, Sparkles, FileText, DollarSign, Trash2 } from 'lucide-react'
import Link from 'next/link'
import PaymentsList from '@/components/payments/PaymentsList'
import QuotePriceControl from '@/components/admin/QuotePriceControl'

interface Quote {
  id: string
  client_id: string
  total_price: number
  status: string
  created_at: string
  updated_at?: string
  event_date?: string | null
  client?: {
    name: string
    email: string
  }
  quote_services?: Array<{
    id: string
    quantity: number
    final_price: number
    service?: {
      name: string
    }
  }>
}

export default function QuoteDetailPage() {
  const params = useParams()
  const router = useRouter()
  const quoteId = params.id as string
  const [quote, setQuote] = useState<Quote | null>(null)
  const [loading, setLoading] = useState(true)
  const [closing, setClosing] = useState(false)
  const supabase = createClient()
  const { success: toastSuccess, error: toastError } = useToast()
  const { isAdmin } = useIsAdmin()

  useEffect(() => {
    loadQuote()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quoteId])

  const loadQuote = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('quotes')
        .select(`
          *,
          clients(name, email),
          quote_services(
            id,
            quantity,
            final_price,
            service:services(name)
          )
        `)
        .eq('id', quoteId)
        .single()

      if (error) {
        throw error
      }

      setQuote(data)
    } catch (err) {
      logger.error('QuoteDetailPage', 'Error loading quote', err as Error)
      toastError('Error al cargar la cotización')
    } finally {
      setLoading(false)
    }
  }

  const handleCloseSale = async () => {
    setClosing(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        toastError('Usuario no autenticado')
        return
      }

      // Actualizar estado de cotización
      const { error: updateError } = await supabase
        .from('quotes')
        .update({ status: 'confirmed' })
        .eq('id', quoteId)

      if (updateError) throw updateError

      // Crear evento con validación de duplicados
      const { createEventWithValidation } = await import('@/lib/utils/eventValidation')
      
      // Usar la fecha del evento de la cotización si existe, o la fecha actual
      const eventDate = quote?.event_date || new Date().toISOString()
      
      let event
      try {
        event = await createEventWithValidation({
          quote_id: quoteId,
          start_date: eventDate,
          end_date: null,
          status: 'confirmed',
        })
      } catch (validationError) {
        // Si es error de duplicado, mostrar mensaje específico
        const errorMessage = validationError instanceof Error 
          ? validationError.message 
          : 'Ya existe un evento para esta cotización en estas fechas'
        toastError(errorMessage)
        throw validationError
      }

      // Registrar ingreso en finance_ledger
      const { error: financeError } = await supabase.from('finance_ledger').insert({
        event_id: event.id,
        amount: quote?.total_price || 0,
        type: 'income',
        description: `Venta confirmada - Cotización #${quoteId.slice(0, 8)}`,
      })

      if (financeError) {
        logger.warn('QuoteDetailPage', 'Error creating finance entry', {
          supabaseError: financeError.message,
          supabaseCode: financeError.code,
        })
        // No fallar si hay error en finance_ledger
      }

      // Crear notificaciones
      try {
        const { createNotification } = await import('@/lib/utils/notifications')
        
        // Notificar al vendedor
        await createNotification({
          userId: user.id,
          type: 'quote',
          title: 'Cotización aprobada',
          message: `La cotización #${quoteId.slice(0, 8)} ha sido aprobada y el evento ha sido creado`,
          metadata: {
            quote_id: quoteId,
            event_id: event.id,
            link: `/dashboard/events/${event.id}`,
          },
        })

        // Notificar al cliente si existe
        if (quote?.client_id) {
          await createNotification({
            userId: quote.client_id,
            type: 'quote',
            title: 'Cotización aprobada',
            message: `Tu cotización #${quoteId.slice(0, 8)} ha sido aprobada`,
            metadata: {
              quote_id: quoteId,
              event_id: event.id,
              link: `/dashboard/quotes/${quoteId}`,
            },
          })
        }
      } catch (notificationError) {
        // No fallar si hay error en notificaciones
        logger.warn('QuoteDetailPage', 'Error creating notifications', {
          error: notificationError instanceof Error ? notificationError.message : String(notificationError),
          quoteId,
          eventId: event.id,
        })
      }

      // Mostrar confeti
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

      toastSuccess('¡Venta cerrada exitosamente!')
      router.push(`/dashboard/events/${event.id}`)
      router.refresh()
    } catch (err) {
      logger.error('QuoteDetailPage', 'Error closing sale', err as Error)
      toastError('Error al cerrar la venta')
    } finally {
      setClosing(false)
    }
  }

  const handleDeleteQuote = async () => {
    if (!isAdmin) {
      toastError('Solo los administradores pueden eliminar cotizaciones')
      return
    }

    try {
      const { error } = await supabase
        .from('quotes')
        .delete()
        .eq('id', quoteId)

      if (error) throw error

      toastSuccess('Cotización eliminada exitosamente')
      router.push('/dashboard/quotes')
      router.refresh()
    } catch (err) {
      logger.error('QuoteDetailPage', 'Error deleting quote', err as Error)
      toastError('Error al eliminar la cotización')
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

  const handleExportPDF = async () => {
    if (!quote) return
    try {
      await exportQuoteToPDF(quote)
      toastSuccess('PDF exportado correctamente')
    } catch (error) {
      logger.error('QuoteDetailPage', 'Error exporting PDF', error as Error)
      toastError('Error al exportar PDF')
    }
  }

  if (loading) {
    return (
      <div className="space-y-8 p-6 lg:p-8">
        <PageHeader title="Detalle de Cotización" />
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

  if (!quote) {
    return (
      <div className="space-y-8 p-6 lg:p-8">
        <PageHeader title="Cotización no encontrada" />
        <Card variant="elevated">
          <CardContent className="p-12 text-center">
            <div className="inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-red-50 dark:bg-red-950/30 mb-6">
              <FileText className="h-10 w-10 text-red-600 dark:text-red-400" />
            </div>
            <p className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Cotización no encontrada
            </p>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              La cotización solicitada no existe o no tienes acceso a ella.
            </p>
            <Link href="/dashboard/quotes">
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver a Cotizaciones
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const subtotal = quote.quote_services?.reduce(
    (sum, qs) => sum + qs.final_price * qs.quantity,
    0
  ) || 0

  const statusConfig = {
    confirmed: {
      variant: 'success' as const,
      label: 'Confirmada',
      description: 'Esta cotización ha sido confirmada y convertida en evento.',
      gradient: 'from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30',
      border: 'border-emerald-200 dark:border-emerald-800',
    },
    cancelled: {
      variant: 'error' as const,
      label: 'Cancelada',
      description: 'Esta cotización ha sido cancelada.',
      gradient: 'from-red-50 to-rose-50 dark:from-red-950/30 dark:to-rose-950/30',
      border: 'border-red-200 dark:border-red-800',
    },
    draft: {
      variant: 'warning' as const,
      label: 'Borrador',
      description: 'Esta cotización está en borrador y puede ser editada.',
      gradient: 'from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30',
      border: 'border-amber-200 dark:border-amber-800',
    },
  }

  const status = statusConfig[quote.status as keyof typeof statusConfig] || statusConfig.draft

  return (
    <div className="space-y-8 p-6 lg:p-8">
      <PageHeader
        title={`Cotización #${quote.id.slice(0, 8)}`}
        description="Detalle completo de la cotización"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Cotizaciones', href: '/dashboard/quotes' },
          { label: 'Detalle' },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Premium Status Banner */}
          <Card variant="elevated" className={`overflow-hidden border-2 ${status.border}`}>
            <CardHeader className={`bg-gradient-to-r ${status.gradient} border-b border-gray-200/60 dark:border-gray-800/60`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${
                    quote.status === 'confirmed' 
                      ? 'from-emerald-500 to-teal-500' 
                      : quote.status === 'cancelled'
                      ? 'from-red-500 to-rose-500'
                      : 'from-amber-500 to-orange-500'
                  } flex items-center justify-center shadow-lg`}>
                    <FileText className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Estado: {status.label}</CardTitle>
                    <CardDescription className="mt-1">{status.description}</CardDescription>
                  </div>
                </div>
                <Badge variant={status.variant} size="lg">
                  {status.label}
                </Badge>
              </div>
            </CardHeader>
          </Card>

          {/* Premium Services Table */}
          <Card variant="elevated" className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-indigo-50 to-violet-50 dark:from-indigo-950/30 dark:to-violet-950/30 border-b border-gray-200/60 dark:border-gray-800/60">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">Servicios Incluidos</CardTitle>
                  <CardDescription className="mt-1">
                    {quote.quote_services?.length || 0} {quote.quote_services?.length === 1 ? 'servicio' : 'servicios'} incluido{quote.quote_services?.length !== 1 ? 's' : ''}
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={handleExportPDF} className="gap-2">
                  <Download className="h-4 w-4" />
                  Exportar PDF
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {quote.quote_services && quote.quote_services.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Servicio</TableHead>
                      <TableHead className="text-right">Cantidad</TableHead>
                      <TableHead className="text-right">Precio Unitario</TableHead>
                      <TableHead className="text-right">Subtotal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {quote.quote_services.map((qs) => (
                      <TableRow key={qs.id} className="group">
                        <TableCell className="font-semibold text-gray-900 dark:text-white">
                          {qs.service?.name || 'Servicio no disponible'}
                        </TableCell>
                        <TableCell className="text-right text-gray-600 dark:text-gray-400">
                          {qs.quantity}
                        </TableCell>
                        <TableCell className="text-right font-medium text-gray-900 dark:text-white">
                          {formatCurrency(qs.final_price)}
                        </TableCell>
                        <TableCell className="text-right font-bold text-gray-900 dark:text-white">
                          {formatCurrency(qs.quantity * qs.final_price)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="p-12 text-center">
                  <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 dark:bg-gray-800 mb-4">
                    <FileText className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                  </div>
                  <p className="text-gray-500 dark:text-gray-400 font-medium">
                    No hay servicios agregados a esta cotización
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Premium Sidebar */}
        <div className="space-y-6">
          {/* Client Info Card */}
          <Card variant="elevated" className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b border-gray-200/60 dark:border-gray-800/60">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">Información del Cliente</CardTitle>
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shadow-lg">
                  <User className="h-5 w-5 text-white" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-950/30 dark:to-violet-950/30">
                  <User className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {quote.client?.name || 'Cliente no especificado'}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Cliente</p>
                </div>
              </div>
              {quote.client?.email && (
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
                    <Mail className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {quote.client.email}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Email</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Premium Summary Card */}
          <Card variant="elevated" className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border-b border-gray-200/60 dark:border-gray-800/60">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">Resumen Financiero</CardTitle>
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg">
                  <DollarSign className="h-5 w-5 text-white" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="flex justify-between items-center py-2">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Subtotal:</span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  {formatCurrency(subtotal)}
                </span>
              </div>
              <div className="border-t border-gray-200 dark:border-gray-800 pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-gray-900 dark:text-white">
                    Total:
                  </span>
                  <span className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                    {formatCurrency(quote.total_price)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Premium Actions Card - Admin puede editar/borrar cualquier cotización */}
          {isAdmin && (
            <Card variant="elevated" className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-indigo-50 to-violet-50 dark:from-indigo-950/30 dark:to-violet-950/30 border-b border-gray-200/60 dark:border-gray-800/60">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl">Acciones de Administrador</CardTitle>
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shadow-lg">
                    <Sparkles className="h-5 w-5 text-white" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-3">
                <Link href={`/dashboard/quotes/${quoteId}/edit`} className="block">
                  <Button variant="outline" className="w-full gap-2">
                    <Edit className="h-4 w-4" />
                    Editar Cotización
                  </Button>
                </Link>
                {quote.status === 'draft' && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="premium" className="w-full gap-2" size="lg">
                        <CheckCircle2 className="h-5 w-5" />
                        Cerrar Venta
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Confirmar cierre de venta?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta acción convertirá la cotización en un evento confirmado y registrará
                          el ingreso en el sistema financiero. Esta acción no se puede deshacer.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleCloseSale}
                          disabled={closing}
                          variant="destructive"
                        >
                          {closing ? 'Cerrando...' : 'Confirmar Cierre'}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" className="w-full gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20">
                      <Trash2 className="h-4 w-4" />
                      Eliminar Cotización
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Eliminar cotización?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta acción eliminará permanentemente la cotización. Esta acción no se puede deshacer.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDeleteQuote}
                        variant="destructive"
                      >
                        Eliminar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Pagos Parciales Premium */}
      <PaymentsList quoteId={quote.id} totalPrice={quote.total_price} />

      {/* Control de Precios (Solo Admin) */}
      {isAdmin && (
        <QuotePriceControl quoteId={quote.id} />
      )}

      {/* Comments Section */}
      <Card variant="elevated" className="overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100/50 dark:from-gray-900/50 dark:to-gray-800/30 border-b border-gray-200/60 dark:border-gray-800/60">
          <CardTitle className="text-xl">Comentarios y Notas</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <CommentThread entityType="quote" entityId={quoteId} />
        </CardContent>
      </Card>
    </div>
  )
}
