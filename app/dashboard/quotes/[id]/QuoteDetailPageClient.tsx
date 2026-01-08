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
import AdminQuoteControls from '@/components/admin/AdminQuoteControls'
import EditableServicePrice from '@/components/quotes/EditableServicePrice'
import StructuredData from '@/components/seo/StructuredData'
import { generateQuoteStructuredData, generateOrganizationStructuredData } from '@/lib/utils/seo'

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

interface QuoteDetailPageClientProps {
  initialQuote?: Quote | null
}

export default function QuoteDetailPageClient({ initialQuote }: QuoteDetailPageClientProps) {
  const params = useParams()
  const router = useRouter()
  const quoteId = params.id as string
  const [quote, setQuote] = useState<Quote | null>(initialQuote || null)
  const [loading, setLoading] = useState(!initialQuote)
  const [closing, setClosing] = useState(false)
  const supabase = createClient()
  const { success: toastSuccess, error: toastError } = useToast()
  const { isAdmin, loading: adminLoading } = useIsAdmin()

  useEffect(() => {
    if (!initialQuote) {
      loadQuote()
    }
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

      // Mapear status del frontend a la base de datos
      const { mapQuoteStatusToDB } = await import('@/lib/utils/statusMapper')
      const dbStatus = mapQuoteStatusToDB('confirmed') // 'confirmed' -> 'APPROVED'
      
      const { error } = await supabase
        .from('quotes')
        .update({ status: dbStatus })
        .eq('id', quoteId)

      if (error) throw error

      toastSuccess('Venta cerrada exitosamente')
      
      // Confetti celebration
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      })

      // Recargar cotización
      loadQuote()
    } catch (err) {
      logger.error('QuoteDetailPage', 'Error closing sale', err as Error)
      toastError('Error al cerrar la venta')
    } finally {
      setClosing(false)
    }
  }

  const handleDelete = async () => {
    try {
      // Usar la API route que maneja la eliminación en cascada
      const response = await fetch(`/api/admin/quotes/${quoteId}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al eliminar la cotización')
      }

      toastSuccess(data.message || 'Cotización eliminada exitosamente')
      router.push('/dashboard/quotes')
    } catch (err) {
      logger.error('QuoteDetailPage', 'Error deleting quote', err as Error)
      const errorMessage = err instanceof Error ? err.message : 'Error al eliminar la cotización'
      
      // Mensaje más descriptivo
      if (errorMessage.includes('foreign key constraint') || errorMessage.includes('eventos')) {
        toastError('No se puede eliminar: La cotización tiene eventos asociados. Por favor, elimina primero los eventos relacionados.')
      } else {
        toastError(errorMessage)
      }
    }
  }

  if (loading || adminLoading) {
    return (
      <div className="space-y-8 p-6 lg:p-8">
        <PageHeader
          title="Cargando..."
          description="Cargando información de la cotización"
        />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    )
  }

  if (!quote) {
    return (
      <div className="space-y-8 p-6 lg:p-8">
        <PageHeader
          title="Cotización no encontrada"
          description="La cotización que buscas no existe o no tienes permisos para verla"
        />
        <Link href="/dashboard/quotes">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a Cotizaciones
          </Button>
        </Link>
      </div>
    )
  }

  const clientName = quote.client?.name || 'Cliente sin nombre'
  const clientEmail = quote.client?.email || ''
  const quoteStructuredData = generateQuoteStructuredData({
    id: quote.id,
    clientName,
    totalPrice: quote.total_price,
    status: quote.status,
    createdAt: quote.created_at,
    eventDate: quote.event_date || undefined,
    updatedAt: quote.updated_at || undefined,
    services: quote.quote_services?.map(qs => ({
      name: qs.service?.name || 'Servicio',
      quantity: qs.quantity,
      price: qs.final_price,
    })),
  })

  const organizationStructuredData = generateOrganizationStructuredData()

  return (
    <div className="space-y-8 p-6 lg:p-8">
      <StructuredData type="quote" data={quoteStructuredData} />
      <StructuredData type="organization" data={organizationStructuredData} />
      
      <PageHeader
        title={`Cotización #${quote.id.slice(0, 8)}`}
        description={`Cliente: ${clientName}`}
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Cotizaciones', href: '/dashboard/quotes' },
          { label: `Cotización #${quote.id.slice(0, 8)}` },
        ]}
      />

      {/* Action Buttons */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/quotes">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
        </Link>
        
        {(quote.status === 'draft' || isAdmin) && (
          <Link href={`/dashboard/quotes/${quoteId}/edit`}>
            <Button variant="default">
              <Edit className="h-4 w-4 mr-2" />
              {isAdmin ? 'Editar (Admin)' : 'Editar'}
            </Button>
          </Link>
        )}

        {isAdmin && quote.status !== 'confirmed' && (
          <Button
            onClick={handleCloseSale}
            disabled={closing}
            className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white"
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            {closing ? 'Cerrando...' : 'Cerrar Venta'}
          </Button>
        )}

        <Button
          onClick={async () => {
            try {
              await exportQuoteToPDF(quote)
            } catch (error) {
              toastError('Error al exportar PDF')
              logger.error('QuoteDetailPageClient', 'Error exporting PDF', error as Error)
            }
          }}
          variant="outline"
        >
          <Download className="h-4 w-4 mr-2" />
          Exportar PDF
        </Button>

        {isAdmin && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Eliminar
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Eliminar cotización?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta acción no se puede deshacer. La cotización será eliminada permanentemente.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                  Eliminar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      {/* Quote Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Quote Info */}
          <Card variant="elevated">
            <CardHeader>
              <CardTitle>Información de la Cotización</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Estado</span>
                <Badge
                  variant={
                    quote.status === 'confirmed' ? 'success' :
                    quote.status === 'pending' ? 'warning' :
                    quote.status === 'cancelled' ? 'error' : 'default'
                  }
                >
                  {quote.status === 'confirmed' ? 'Confirmada' :
                   quote.status === 'pending' ? 'Pendiente' :
                   quote.status === 'cancelled' ? 'Cancelada' : 'Borrador'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Total</span>
                <span className="text-2xl font-bold text-gray-900 dark:text-white">
                  {new Intl.NumberFormat('es-MX', {
                    style: 'currency',
                    currency: 'MXN',
                  }).format(quote.total_price)}
                </span>
              </div>
              {quote.event_date && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Fecha del Evento</span>
                  <span className="text-sm text-gray-900 dark:text-white">
                    {new Date(quote.event_date).toLocaleDateString('es-MX')}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Services */}
          <Card variant="elevated">
            <CardHeader>
              <CardTitle>Servicios</CardTitle>
              <CardDescription>
                {quote.status === 'draft' || quote.status === 'pending'
                  ? 'Puedes editar los precios durante la negociación'
                  : quote.status === 'confirmed' || quote.status === 'cancelled'
                  ? isAdmin
                    ? 'Solo administradores pueden modificar precios'
                    : 'Los precios están bloqueados'
                  : null}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {quote.quote_services && quote.quote_services.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Servicio</TableHead>
                      <TableHead>Cantidad</TableHead>
                      <TableHead className="text-right">Precio Unitario</TableHead>
                      <TableHead className="text-right">Subtotal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {quote.quote_services.map((qs) => (
                      <TableRow key={qs.id} className="group">
                        <TableCell className="font-medium">
                          {qs.service?.name || 'Servicio'}
                        </TableCell>
                        <TableCell>{qs.quantity}</TableCell>
                        <TableCell>
                          <EditableServicePrice
                            quoteServiceId={qs.id}
                            quoteId={quote.id}
                            serviceName={qs.service?.name || 'Servicio'}
                            currentPrice={qs.final_price}
                            quantity={qs.quantity}
                            quoteStatus={quote.status}
                            onPriceUpdate={loadQuote}
                          />
                        </TableCell>
                        <TableCell className="text-right font-semibold text-gray-900 dark:text-white">
                          {new Intl.NumberFormat('es-MX', {
                            style: 'currency',
                            currency: 'MXN',
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          }).format(qs.final_price * qs.quantity)}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="border-t-2 border-gray-300 dark:border-gray-700 font-bold">
                      <TableCell colSpan={3} className="text-right">
                        Total:
                      </TableCell>
                      <TableCell className="text-right text-lg">
                        {new Intl.NumberFormat('es-MX', {
                          style: 'currency',
                          currency: 'MXN',
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        }).format(
                          quote.quote_services.reduce(
                            (sum, qs) => sum + (qs.final_price * qs.quantity),
                            0
                          )
                        )}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">No hay servicios en esta cotización</p>
              )}
            </CardContent>
          </Card>

          {/* Comments */}
          <CommentThread entityId={quoteId} entityType="quote" />
        </div>

        <div className="space-y-6">
          {/* Client Info */}
          <Card variant="elevated">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Nombre</p>
                <p className="text-base font-semibold text-gray-900 dark:text-white">{clientName}</p>
              </div>
              {clientEmail && (
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Email</p>
                  <a
                    href={`mailto:${clientEmail}`}
                    className="text-base text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-2"
                  >
                    <Mail className="h-4 w-4" />
                    {clientEmail}
                  </a>
                </div>
              )}
              <Link href={`/dashboard/clients/${quote.client_id}`}>
                <Button variant="outline" size="sm" className="w-full">
                  Ver Cliente
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Admin Controls */}
          {isAdmin && (
            <>
              <AdminQuoteControls
                quoteId={quoteId}
                currentStatus={quote.status}
                onStatusChange={loadQuote}
                onDelete={() => router.push('/dashboard/quotes')}
                allowEdit={true}
                allowDelete={true}
              />
              <QuotePriceControl quoteId={quoteId} />
            </>
          )}

          {/* Payments */}
          <PaymentsList quoteId={quoteId} totalPrice={quote.total_price} />
        </div>
      </div>
    </div>
  )
}

