'use client'

import { useEffect, useMemo, useState } from 'react'
import { useClients, useIsAdmin } from '@/lib/hooks'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import SearchInput from '@/components/ui/SearchInput'
import Button from '@/components/ui/Button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table'
import { Plus, Users, Mail, Phone, Edit2, Trash2, Shield, Eye } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import EmptyState from '@/components/ui/EmptyState'
import Skeleton from '@/components/ui/Skeleton'
import { useToast } from '@/lib/hooks'
import { logger } from '@/lib/utils/logger'
import EditClientDialog from '@/components/clients/EditClientDialog'
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

interface Client {
  id: string
  name: string
  email: string | null
  phone: string | null
  created_at: string
  _quotes_count?: number
}

export default function AdminClientsPageClient() {
  const { clients, loading: isLoading, refresh } = useClients()
  const { isAdmin, loading: adminLoading } = useIsAdmin()
  const router = useRouter()
  const { success: toastSuccess, error: toastError } = useToast()
  const [searchTerm, setSearchTerm] = useState('')
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)

  const shouldRedirect = !adminLoading && !isAdmin

  useEffect(() => {
    if (shouldRedirect) {
      router.push('/dashboard/clients')
    }
  }, [shouldRedirect, router])

  const handleDeleteClient = async (clientId: string) => {
    try {
      const response = await fetch(`/api/admin/clients/${clientId}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al eliminar el cliente')
      }

      toastSuccess('Cliente eliminado exitosamente')
      refresh()
    } catch (err) {
      logger.error('AdminClientsPage', 'Error deleting client', err as Error)
      toastError(err instanceof Error ? err.message : 'Error al eliminar el cliente')
    }
  }

  const handleEdit = (client: Client) => {
    setSelectedClient(client)
    setEditDialogOpen(true)
  }

  const filteredClients = useMemo(() => {
    return clients.filter((client) => {
      const matchesSearch = client.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            client.phone?.toLowerCase().includes(searchTerm.toLowerCase())
      return matchesSearch
    })
  }, [clients, searchTerm])

  const stats = useMemo(() => {
    const total = clients.length
    const withEmail = clients.filter(c => c.email).length
    const withPhone = clients.filter(c => c.phone).length
    return { total, withEmail, withPhone }
  }, [clients])

  if (adminLoading || isLoading) {
    return (
      <div className="space-y-8 p-6 lg:p-8">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    )
  }

  if (shouldRedirect) {
    return null
  }

  return (
    <div className="space-y-8 p-6 lg:p-8">
      {/* Premium Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shadow-lg">
              <Shield className="h-6 w-6 text-white" />
            </div>
            Gestión de Clientes
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Administra todos los clientes del sistema
          </p>
        </div>
        <Link href="/dashboard/clients/new">
          <Button variant="premium" size="lg" className="shadow-lg hover:shadow-xl gap-2">
            <Plus className="h-5 w-5" />
            Nuevo Cliente
          </Button>
        </Link>
      </div>

      {/* Premium Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card variant="elevated" className="group hover:scale-[1.02] transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Clientes</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
              </div>
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                <Users className="h-7 w-7 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card variant="elevated" className="group hover:scale-[1.02] transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Con Email</p>
                <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{stats.withEmail}</p>
              </div>
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                <Mail className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card variant="elevated" className="group hover:scale-[1.02] transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Con Teléfono</p>
                <p className="text-3xl font-bold text-violet-600 dark:text-violet-400">{stats.withPhone}</p>
              </div>
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                <Phone className="h-7 w-7 text-violet-600 dark:text-violet-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Premium Filters and Search */}
      <Card variant="elevated">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <SearchInput
                placeholder="Buscar por nombre, email o teléfono..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Premium Clients Table */}
      {filteredClients.length === 0 ? (
        <Card variant="elevated">
          <CardContent className="p-12">
            <EmptyState
              icon={<Users className="h-10 w-10" />}
              title="No hay clientes"
              description={
                searchTerm
                  ? 'No se encontraron clientes con los filtros aplicados'
                  : 'Aún no hay clientes en el sistema'
              }
            />
          </CardContent>
        </Card>
      ) : (
        <Card variant="elevated" className="overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b border-gray-200/60 dark:border-gray-800/60">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">Todos los Clientes</CardTitle>
                <CardDescription className="mt-1">
                  {filteredClients.length} {filteredClients.length === 1 ? 'cliente encontrado' : 'clientes encontrados'}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead>Fecha de Registro</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients.map((client) => (
                  <TableRow key={client.id} className="group hover:bg-blue-50/50 dark:hover:bg-blue-950/20 transition-colors">
                    <TableCell>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {client.name}
                      </span>
                    </TableCell>
                    <TableCell>
                      {client.email ? (
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-600 dark:text-gray-400">{client.email}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400 dark:text-gray-500">Sin email</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {client.phone ? (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-600 dark:text-gray-400">{client.phone}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400 dark:text-gray-500">Sin teléfono</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {format(new Date(client.created_at), "dd MMM yyyy", { locale: es })}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/dashboard/clients/${client.id}`}>
                          <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(client)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Eliminar cliente?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta acción no se puede deshacer. El cliente será eliminado permanentemente.
                                {client._quotes_count && client._quotes_count > 0 && (
                                  <span className="block mt-2 text-amber-600 dark:text-amber-400">
                                    ⚠️ Este cliente tiene {client._quotes_count} cotización(es) asociada(s). No se podrá eliminar si tiene cotizaciones.
                                  </span>
                                )}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteClient(client.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Eliminar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Edit Dialog */}
      <EditClientDialog
        open={editDialogOpen}
        onClose={() => {
          setEditDialogOpen(false)
          setSelectedClient(null)
        }}
        onSuccess={() => {
          refresh()
          setEditDialogOpen(false)
          setSelectedClient(null)
        }}
        client={selectedClient ? {
          id: selectedClient.id,
          name: selectedClient.name,
          email: selectedClient.email || '',
          phone: selectedClient.phone || '',
        } : null}
      />
    </div>
  )
}

