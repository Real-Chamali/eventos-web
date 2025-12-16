'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { logger } from '@/lib/utils/logger'
import { useToast } from '@/lib/hooks'
import PageHeader from '@/components/ui/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Skeleton from '@/components/ui/Skeleton'
import DataTable, { type Column } from '@/components/ui/DataTable'
import { Users, Mail, Phone, FileText, Calendar, ArrowLeft, Edit } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import Link from 'next/link'

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
  const supabase = createClient()
  const { error: toastError } = useToast()

  useEffect(() => {
    loadClientData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId])

  const loadClientData = async () => {
    try {
      setLoading(true)
      
      // Cargar cliente
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('*')
        .eq('id', clientId)
        .single()

      if (clientError) {
        throw clientError
      }

      setClient(clientData)

      // Cargar cotizaciones del cliente
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
        return <Badge variant="success">Confirmada</Badge>
      case 'cancelled':
        return <Badge variant="error">Cancelada</Badge>
      case 'draft':
      default:
        return <Badge variant="warning">Borrador</Badge>
    }
  }

  const quoteColumns: Column<Quote>[] = [
    {
      id: 'id',
      header: 'Cotización',
      cell: (row) => (
        <Link
          href={`/dashboard/quotes/${row.id}`}
          className="font-medium text-blue-600 dark:text-blue-400 hover:underline"
        >
          #{row.id.slice(0, 8)}
        </Link>
      ),
    },
    {
      id: 'total_price',
      header: 'Monto',
      accessorKey: 'total_price',
      cell: (row) => (
        <span className="font-semibold">{formatCurrency(row.total_price)}</span>
      ),
      sortable: true,
    },
    {
      id: 'status',
      header: 'Estado',
      accessorKey: 'status',
      cell: (row) => getStatusBadge(row.status),
      sortable: true,
    },
    {
      id: 'created_at',
      header: 'Fecha',
      accessorKey: 'created_at',
      cell: (row) => (
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {format(new Date(row.created_at), "dd MMM yyyy", { locale: es })}
        </span>
      ),
      sortable: true,
    },
  ]

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Cliente" />
        <Skeleton className="h-96" />
      </div>
    )
  }

  if (!client) {
    return (
      <div className="space-y-6">
        <PageHeader title="Cliente no encontrado" />
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-red-600 dark:text-red-400 mb-4">
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

  const totalQuotes = quotes.length
  const totalValue = quotes.reduce((sum, q) => sum + q.total_price, 0)
  const confirmedQuotes = quotes.filter((q) => q.status === 'confirmed').length

  return (
    <div className="space-y-6">
      <PageHeader
        title={client.name}
        description="Perfil completo del cliente"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Clientes', href: '/dashboard/clients' },
          { label: client.name },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Client Info */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Información del Cliente</CardTitle>
                <Link href={`/dashboard/clients/${clientId}/edit`}>
                  <Button variant="outline" size="sm">
                    <Edit className="mr-2 h-4 w-4" />
                    Editar
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-900/20">
                  <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Nombre</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">
                    {client.name}
                  </p>
                </div>
              </div>
              {client.email && (
                <div className="flex items-start space-x-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-50 dark:bg-gray-800">
                    <Mail className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Email</p>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">{client.email}</p>
                  </div>
                </div>
              )}
              {client.phone && (
                <div className="flex items-start space-x-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-50 dark:bg-gray-800">
                    <Phone className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Teléfono</p>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">{client.phone}</p>
                  </div>
                </div>
              )}
              <div className="flex items-start space-x-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-50 dark:bg-gray-800">
                  <Calendar className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Cliente desde
                  </p>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    {format(new Date(client.created_at), "dd 'de' MMMM, yyyy", { locale: es })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quotes History */}
          <Card>
            <CardHeader>
              <CardTitle>Historial de Cotizaciones</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                data={quotes}
                columns={quoteColumns}
                emptyMessage="Este cliente no tiene cotizaciones aún"
              />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Estadísticas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Total Cotizaciones
                </span>
                <span className="text-lg font-semibold text-gray-900 dark:text-white">
                  {totalQuotes}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Cotizaciones Confirmadas
                </span>
                <span className="text-lg font-semibold text-green-600 dark:text-green-400">
                  {confirmedQuotes}
                </span>
              </div>
              <div className="border-t border-gray-200 dark:border-gray-800 pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    Valor Total
                  </span>
                  <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
                    {formatCurrency(totalValue)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Acciones Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href={`/dashboard/quotes/new?client_id=${clientId}`} className="block">
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="mr-2 h-4 w-4" />
                  Nueva Cotización
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

