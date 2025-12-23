'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { logger } from '@/lib/utils/logger'
import { useToast, useIsAdmin } from '@/lib/hooks'
import PageHeader from '@/components/ui/PageHeader'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Skeleton from '@/components/ui/Skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table'
import { Users, Mail, Phone, FileText, Calendar, ArrowLeft, Sparkles, DollarSign, Edit2 } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import Link from 'next/link'
import CommentThread from '@/components/comments/CommentThread'
import EmptyState from '@/components/ui/EmptyState'
import EditClientDialog from '@/components/clients/EditClientDialog'

interface Client {
  id: string
  name: string
  email: string | null
  phone: string | null
  created_at: string
}

interface Quote {
  id: string
  total_price: number
  status: string
  created_at: string
}

export default function ClientDetailPage() {
  const params = useParams()
  const router = useRouter()
  const clientId = params.id as string
  const [client, setClient] = useState<Client | null>(null)
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [loading, setLoading] = useState(true)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const supabase = createClient()
  const { error: toastError, success: toastSuccess } = useToast()
  const { isAdmin } = useIsAdmin()

  useEffect(() => {
    loadClientData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId])

  const loadClientData = async () => {
    try {
      setLoading(true)
      
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('*')
        .eq('id', clientId)
        .single()

      if (clientError) {
        throw clientError
      }

      setClient(clientData)

      const { data: quotesData, error: quotesError } = await supabase
        .from('quotes')
        .select('id, total_price, status, created_at')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })

      if (quotesError) {
        logger.error('ClientDetailPage', 'Error loading quotes', new Error(quotesError.message))
      } else {
        setQuotes(quotesData || [])
      }
    } catch (err) {
      logger.error('ClientDetailPage', 'Error loading client', err as Error)
      toastError('Error al cargar el cliente')
      router.push('/dashboard/clients')
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge variant="success" size="sm">Confirmada</Badge>
      case 'cancelled':
        return <Badge variant="error" size="sm">Cancelada</Badge>
      case 'draft':
      default:
        return <Badge variant="warning" size="sm">Borrador</Badge>
    }
  }

  if (loading) {
    return (
      <div className="space-y-8 p-6 lg:p-8">
        <PageHeader title="Cliente" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Skeleton className="h-96 w-full rounded-2xl" />
          </div>
          <div>
            <Skeleton className="h-64 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    )
  }

  if (!client) {
    return (
      <div className="space-y-8 p-6 lg:p-8">
        <PageHeader title="Cliente no encontrado" />
        <Card variant="elevated">
          <CardContent className="p-12 text-center">
            <div className="inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-red-50 dark:bg-red-950/30 mb-6">
              <Users className="h-10 w-10 text-red-600 dark:text-red-400" />
            </div>
            <p className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Cliente no encontrado
            </p>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              El cliente solicitado no existe o no tienes acceso a él.
            </p>
            <Link href="/dashboard/clients">
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver a Clientes
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const totalQuotesValue = quotes
    .filter((q) => q.status === 'confirmed')
    .reduce((sum, q) => sum + (q.total_price || 0), 0)

  return (
    <div className="space-y-8 p-6 lg:p-8">
      <PageHeader
        title={client.name}
        description="Perfil completo del cliente y su historial"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Clientes', href: '/dashboard/clients' },
          { label: client.name },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Premium Client Info Card */}
          <Card variant="elevated" className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b border-gray-200/60 dark:border-gray-800/60">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">Información del Cliente</CardTitle>
                  <CardDescription className="mt-1">Datos de contacto y registro</CardDescription>
                </div>
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shadow-lg">
                  <Users className="h-5 w-5 text-white" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-950/30 dark:to-violet-950/30 flex items-center justify-center">
                  <Users className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Nombre</p>
                  <p className="font-semibold text-gray-900 dark:text-white mt-1">{client.name}</p>
                </div>
              </div>
              {client.email && (
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center">
                    <Mail className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Email</p>
                    <p className="font-medium text-gray-900 dark:text-white mt-1">{client.email}</p>
                  </div>
                </div>
              )}
              {client.phone && (
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center">
                    <Phone className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Teléfono</p>
                    <p className="font-medium text-gray-900 dark:text-white mt-1">{client.phone}</p>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-4 pt-4 border-t border-gray-200 dark:border-gray-800">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Fecha de Registro</p>
                  <p className="font-medium text-gray-900 dark:text-white mt-1">
                    {format(new Date(client.created_at), "dd 'de' MMMM, yyyy", { locale: es })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Premium Quotes History */}
          <Card variant="elevated" className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-indigo-50 to-violet-50 dark:from-indigo-950/30 dark:to-violet-950/30 border-b border-gray-200/60 dark:border-gray-800/60">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">Historial de Cotizaciones</CardTitle>
                  <CardDescription className="mt-1">
                    {quotes.length} {quotes.length === 1 ? 'cotización' : 'cotizaciones'} registrada{quotes.length !== 1 ? 's' : ''}
                  </CardDescription>
                </div>
                <Link href={`/dashboard/quotes/new?client_id=${clientId}`}>
                  <Button variant="premium" size="sm" className="gap-2">
                    <Sparkles className="h-4 w-4" />
                    Nueva Cotización
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {quotes.length === 0 ? (
                <EmptyState
                  icon={<FileText className="h-10 w-10" />}
                  title="No hay cotizaciones"
                  description="Este cliente aún no tiene cotizaciones registradas"
                  action={{
                    label: 'Crear Primera Cotización',
                    onClick: () => router.push(`/dashboard/quotes/new?client_id=${clientId}`),
                  }}
                />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {quotes.map((quote) => (
                      <TableRow key={quote.id} className="group">
                        <TableCell className="font-mono text-sm text-gray-600 dark:text-gray-400">
                          {quote.id.slice(0, 8)}...
                        </TableCell>
                        <TableCell>{getStatusBadge(quote.status)}</TableCell>
                        <TableCell className="text-right">
                          <span className="font-bold text-gray-900 dark:text-white">
                            {formatCurrency(quote.total_price)}
                          </span>
                        </TableCell>
                        <TableCell className="text-gray-600 dark:text-gray-400">
                          {format(new Date(quote.created_at), "dd MMM yyyy", { locale: es })}
                        </TableCell>
                        <TableCell className="text-right">
                          <Link href={`/dashboard/quotes/${quote.id}`}>
                            <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                              Ver detalles
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Comments Section */}
          <Card variant="elevated" className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100/50 dark:from-gray-900/50 dark:to-gray-800/30 border-b border-gray-200/60 dark:border-gray-800/60">
              <CardTitle className="text-xl">Comentarios y Notas</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <CommentThread entityType="client" entityId={clientId} />
            </CardContent>
          </Card>
        </div>

        {/* Premium Sidebar */}
        <div className="space-y-6">
          {/* Stats Card */}
          <Card variant="elevated" className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border-b border-gray-200/60 dark:border-gray-800/60">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">Estadísticas</CardTitle>
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg">
                  <DollarSign className="h-5 w-5 text-white" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Cotizaciones:</span>
                <span className="text-2xl font-bold text-gray-900 dark:text-white">{quotes.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Valor Total:</span>
                <span className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  {formatCurrency(totalQuotesValue)}
                </span>
              </div>
              <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Confirmadas:</span>
                  <Badge variant="success" size="sm">
                    {quotes.filter((q) => q.status === 'confirmed').length}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions Card */}
          <Card variant="elevated" className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-indigo-50 to-violet-50 dark:from-indigo-950/30 dark:to-violet-950/30 border-b border-gray-200/60 dark:border-gray-800/60">
              <CardTitle className="text-xl">Acciones</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-3">
              {isAdmin && (
                <Button
                  variant="premium"
                  className="w-full gap-2"
                  onClick={() => setEditDialogOpen(true)}
                >
                  <Edit2 className="h-4 w-4" />
                  Editar Cliente
                </Button>
              )}
              <Link href={`/dashboard/quotes/new?client_id=${clientId}`} className="block">
                <Button variant="premium" className="w-full gap-2">
                  <Sparkles className="h-4 w-4" />
                  Nueva Cotización
                </Button>
              </Link>
              <Link href="/dashboard/clients" className="block">
                <Button variant="outline" className="w-full gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Volver a Clientes
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Client Dialog - Solo para admin */}
      {isAdmin && (
        <EditClientDialog
          open={editDialogOpen}
          onClose={() => setEditDialogOpen(false)}
          onSuccess={() => {
            loadClientData() // Recargar datos del cliente
            toastSuccess('Cliente actualizado exitosamente')
          }}
          client={client}
        />
      )}
    </div>
  )
}
