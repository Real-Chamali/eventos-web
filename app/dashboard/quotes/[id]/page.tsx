'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import confetti from 'canvas-confetti'
import { logger } from '@/lib/utils/logger'
import { useToast } from '@/lib/hooks'
import { exportQuoteToPDF } from '@/lib/utils/export'
import PageHeader from '@/components/ui/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
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
import { Download, Edit, ArrowLeft, CheckCircle2, Calendar, Mail, User } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import Link from 'next/link'

interface Quote {
  id: string
  client_id: string
  total_price: number
  status: string
  created_at: string
  updated_at?: string
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
          client:clients(name, email),
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

      // Crear evento
      const { data: event, error: eventError } = await supabase
        .from('events')
        .insert({
          quote_id: quoteId,
        })
        .select()
        .single()

      if (eventError) throw eventError

      // Registrar ingreso en finance_ledger
      const { error: financeError } = await supabase.from('finance_ledger').insert({
        event_id: event.id,
        amount: quote?.total_price || 0,
        type: 'income',
        description: `Venta confirmada - Cotización #${quoteId.slice(0, 8)}`,
      })

      if (financeError) {
        logger.warn('QuoteDetailPage', 'Error creating finance entry', financeError)
        // No fallar si hay error en finance_ledger
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
      await exportQuoteToPDF(quote as any)
      toastSuccess('PDF exportado correctamente')
    } catch (error) {
      logger.error('QuoteDetailPage', 'Error exporting PDF', error as Error)
      toastError('Error al exportar PDF')
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Detalle de Cotización" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Skeleton className="h-96" />
          </div>
          <div>
            <Skeleton className="h-96" />
          </div>
        </div>
      </div>
    )
  }

  if (!quote) {
    return (
      <div className="space-y-6">
        <PageHeader title="Cotización no encontrada" />
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-red-600 dark:text-red-400 mb-4">
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

  return (
    <div className="space-y-6">
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
          {/* Status Banner */}
          <Card
            className={
              quote.status === 'confirmed'
                ? 'border-l-4 border-l-green-600 dark:border-l-green-500'
                : quote.status === 'cancelled'
                ? 'border-l-4 border-l-red-600 dark:border-l-red-500'
                : 'border-l-4 border-l-yellow-600 dark:border-l-yellow-500'
            }
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    Estado: {quote.status === 'confirmed' ? 'Confirmada' : quote.status === 'cancelled' ? 'Cancelada' : 'Borrador'}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    {quote.status === 'confirmed'
                      ? 'Esta cotización ha sido confirmada y convertida en evento.'
                      : quote.status === 'cancelled'
                      ? 'Esta cotización ha sido cancelada.'
                      : 'Esta cotización está en borrador y puede ser editada.'}
                  </p>
                </div>
                <Badge
                  variant={
                    quote.status === 'confirmed'
                      ? 'success'
                      : quote.status === 'cancelled'
                      ? 'error'
                      : 'warning'
                  }
                >
                  {quote.status === 'confirmed' ? 'Confirmada' : quote.status === 'cancelled' ? 'Cancelada' : 'Borrador'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Services Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Servicios Incluidos</CardTitle>
                <Button variant="outline" size="sm" onClick={handleExportPDF}>
                  <Download className="mr-2 h-4 w-4" />
                  Exportar PDF
                </Button>
              </div>
            </CardHeader>
            <CardContent>
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
                      <TableRow key={qs.id}>
                        <TableCell className="font-medium">
                          {qs.service?.name || 'Servicio no disponible'}
                        </TableCell>
                        <TableCell className="text-right">{qs.quantity}</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(qs.final_price)}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatCurrency(qs.quantity * qs.final_price)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                  No hay servicios agregados a esta cotización
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Client Info */}
          <Card>
            <CardHeader>
              <CardTitle>Información del Cliente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/20">
                  <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {quote.client?.name || 'Cliente no especificado'}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Cliente</p>
                </div>
              </div>
              {quote.client?.email && (
                <div className="flex items-start space-x-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-50 dark:bg-gray-800">
                    <Mail className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {quote.client.email}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Resumen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Subtotal:</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {formatCurrency(subtotal)}
                </span>
              </div>
              <div className="border-t border-gray-200 dark:border-gray-800 pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-900 dark:text-white">
                    Total:
                  </span>
                  <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {formatCurrency(quote.total_price)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          {quote.status === 'draft' && (
            <Card>
              <CardHeader>
                <CardTitle>Acciones</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Link href={`/dashboard/quotes/${quoteId}/edit`} className="block">
                    <Button variant="outline" className="w-full">
                      <Edit className="mr-2 h-4 w-4" />
                      Editar Cotización
                    </Button>
                  </Link>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button className="w-full" size="lg">
                        <CheckCircle2 className="mr-2 h-5 w-5" />
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
                          className="bg-green-600 hover:bg-green-700"
                        >
                          {closing ? 'Cerrando...' : 'Confirmar Cierre'}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Comments Section */}
      <CommentThread entityType="quote" entityId={quoteId} />
    </div>
  )
}
