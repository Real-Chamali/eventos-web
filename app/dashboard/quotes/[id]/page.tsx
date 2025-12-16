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
    service: {
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
          client:clients(*),
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
        const errorMessage = error?.message || 'Error loading quote'
        const errorForLogging = error instanceof Error 
          ? error 
          : new Error(errorMessage)
        logger.error('QuoteDetailPage', 'Error loading quote', errorForLogging, {
          supabaseError: errorMessage,
          supabaseCode: error?.code,
          quoteId: quoteId,
        })
        toastError('Error al cargar la cotización')
      } else {
        setQuote(data)
      }
    } catch (err) {
      logger.error('QuoteDetailPage', 'Unexpected error loading quote', err as Error)
      toastError('Error inesperado al cargar la cotización')
    } finally {
      setLoading(false)
    }
  }

  const handleCloseSale = async () => {
    setClosing(true)
    try {
      const { error } = await supabase.rpc('confirm_sale', {
        id: quoteId,
      })

      if (error) {
        const errorMessage = error?.message || 'Error closing sale'
        toastError('Error al cerrar la venta: ' + errorMessage)
        const errorForLogging = error instanceof Error 
          ? error 
          : new Error(errorMessage)
        logger.error('QuoteDetailPage', 'Error closing sale', errorForLogging, {
          supabaseError: errorMessage,
          supabaseCode: error?.code,
          quoteId: quoteId,
        })
        setClosing(false)
        return
      }

      // Mostrar confeti
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      })

      toastSuccess('¡Venta cerrada exitosamente!')
      
      // Redirigir después de un breve delay
      setTimeout(() => {
        router.push(`/dashboard/events/${quoteId}`)
        router.refresh()
      }, 1000)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      toastError('Error: ' + message)
      logger.error('QuoteDetailPage', 'Unexpected error closing sale', err as Error)
      setClosing(false)
    }
  }

  const handleExportPDF = () => {
    if (!quote) return
    try {
      exportQuoteToPDF(quote)
      toastSuccess('PDF exportado correctamente')
    } catch (error) {
      toastError('Error al exportar PDF')
      logger.error('QuoteDetailPage', 'Error exporting PDF', error as Error)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge variant="success">Confirmada</Badge>
      case 'cancelled':
        return <Badge variant="error">Cancelada</Badge>
      case 'draft':
      default:
        return <Badge variant="warning">Borrador</Badge>
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
        <PageHeader title="Detalle de Cotización" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Skeleton className="h-96" />
          </div>
          <div>
            <Skeleton className="h-64" />
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
    (sum, qs) => sum + qs.quantity * qs.final_price,
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

      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-4">
          {getStatusBadge(quote.status)}
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Creada: {formatDate(quote.created_at)}
          </span>
        </div>
        <div className="flex gap-2">
          {quote.status === 'draft' && (
            <Link href={`/dashboard/quotes/${quoteId}/edit`}>
              <Button variant="outline">
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </Button>
            </Link>
          )}
          <Button variant="outline" onClick={handleExportPDF}>
            <Download className="mr-2 h-4 w-4" />
            Exportar PDF
          </Button>
          <Link href="/dashboard/quotes">
            <Button variant="ghost">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Services Table */}
          <Card>
            <CardHeader>
              <CardTitle>Servicios Incluidos</CardTitle>
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
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
