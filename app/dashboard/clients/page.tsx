import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import PageHeader from '@/components/ui/PageHeader'
import { Card, CardContent } from '@/components/ui/Card'
import DataTable, { type Column } from '@/components/ui/DataTable'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Link from 'next/link'
import { Plus, Users, Mail, Phone } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface Client {
  id: string
  name: string
  email: string | null
  phone: string | null
  created_at: string
  _quotes_count?: number
}

export default async function ClientsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Obtener clientes con conteo de cotizaciones
  const { data: clients, error } = await supabase
    .from('clients')
    .select(`
      *,
      _quotes_count:quotes(count)
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error loading clients:', error)
  }

  const clientsData: Client[] = (clients || []).map((client: any) => ({
    ...client,
    _quotes_count: Array.isArray(client._quotes_count) 
      ? client._quotes_count.length 
      : client._quotes_count?.[0]?.count || 0,
  }))

  const columns: Column<Client>[] = [
    {
      id: 'name',
      header: 'Cliente',
      accessorKey: 'name',
      cell: (row) => (
        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/20">
            <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <Link
              href={`/dashboard/clients/${row.id}`}
              className="font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400"
            >
              {row.name}
            </Link>
            {row.email && (
              <p className="text-sm text-gray-500 dark:text-gray-400">{row.email}</p>
            )}
          </div>
        </div>
      ),
      sortable: true,
    },
    {
      id: 'quotes',
      header: 'Cotizaciones',
      cell: (row) => (
        <Badge variant="info">{row._quotes_count || 0}</Badge>
      ),
    },
    {
      id: 'created_at',
      header: 'Fecha de Registro',
      accessorKey: 'created_at',
      cell: (row) => (
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {format(new Date(row.created_at), "dd MMM yyyy", { locale: es })}
        </span>
      ),
      sortable: true,
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clientes"
        description="Gestiona tu base de clientes y su historial"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Clientes' },
        ]}
      />

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-900/20">
            <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {clientsData.length} Clientes
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Total de clientes registrados
            </p>
          </div>
        </div>
        <Link href="/dashboard/clients/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Cliente
          </Button>
        </Link>
      </div>

      <Card>
        <CardContent className="p-6">
          <DataTable
            data={clientsData}
            columns={columns}
            searchKey="name"
            searchPlaceholder="Buscar por nombre o email..."
            emptyMessage="No hay clientes registrados"
          />
        </CardContent>
      </Card>
    </div>
  )
}

