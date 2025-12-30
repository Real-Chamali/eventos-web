'use client'

import { useState, useRef, useMemo, memo, useCallback } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { useClients, useToast, useIsAdmin, useDebounce, useWindowSize } from '@/lib/hooks'
import { createClient } from '@/utils/supabase/client'
import { logger } from '@/lib/utils/logger'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Link from 'next/link'
import { Plus, Users, Mail, Calendar, Edit2, Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import EmptyState from '@/components/ui/EmptyState'
import Skeleton from '@/components/ui/Skeleton'
import EditClientDialog from '@/components/clients/EditClientDialog'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/Dialog'

interface Client {
  id: string
  name: string
  email: string | null
  phone: string | null
  created_at: string
  _quotes_count?: number
}

// Componente de fila memoizado para evitar re-renders innecesarios
const ClientRow = memo(function ClientRow({
  client,
  isAdmin,
  onEdit,
  onDeleteClick,
}: {
  client: Client
  isAdmin: boolean
  onEdit: (client: Client) => void
  onDeleteClick: (id: string) => void
}) {
  return (
    <div className="group border-b border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
      <div className="grid grid-cols-12 gap-4 px-6 py-4 items-center">
        <div className="col-span-3">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-950/30 dark:to-violet-950/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
              <Users className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <Link
                href={`/dashboard/clients/${client.id}`}
                className="font-semibold text-gray-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors duration-200"
              >
                {client.name}
              </Link>
            </div>
          </div>
        </div>
        <div className="col-span-3">
          {client.email ? (
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-gray-400 dark:text-gray-500" />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {client.email}
              </span>
            </div>
          ) : (
            <span className="text-sm text-gray-400 dark:text-gray-500">Sin email</span>
          )}
        </div>
        <div className="col-span-2">
          <Badge variant="info" size="sm">
            {client._quotes_count || 0} {client._quotes_count === 1 ? 'cotización' : 'cotizaciones'}
          </Badge>
        </div>
        <div className="col-span-2">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-400 dark:text-gray-500" />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {format(new Date(client.created_at), "dd MMM yyyy", { locale: es })}
            </span>
          </div>
        </div>
        <div className="col-span-2 text-right">
          <div className="flex items-center justify-end gap-2">
            <Link href={`/dashboard/clients/${client.id}`}>
              <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                Ver detalles
              </Button>
            </Link>
            {isAdmin && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(client)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDeleteClick(client.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
})

export default function ClientsPageClient() {
  const { clients: clientsData, loading, error, refresh } = useClients()
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [clientToDelete, setClientToDelete] = useState<string | null>(null)
  const supabase = createClient()
  const { success: toastSuccess, error: toastError } = useToast()
  const { isAdmin } = useIsAdmin()
  const tableContainerRef = useRef<HTMLDivElement>(null)
  const { height: windowHeight } = useWindowSize()

  // Calcular altura dinámica del contenedor (responsive)
  const containerHeight = useMemo(() => {
    const baseHeight = windowHeight > 768 ? windowHeight - 400 : windowHeight - 300
    return Math.max(400, Math.min(800, baseHeight))
  }, [windowHeight])

  // Virtual scrolling para la lista de clientes
  const virtualizer = useVirtualizer({
    count: clientsData.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => 80,
    overscan: 5,
    measureElement: (element) => element?.getBoundingClientRect().height ?? 80,
    scrollMargin: 20,
  })
  
  // Scroll suave a un elemento específico
  const scrollToIndex = useCallback((index: number) => {
    virtualizer.scrollToIndex(index, {
      align: 'start',
      behavior: 'smooth',
    })
  }, [virtualizer])

  if (loading) {
    return (
      <div className="space-y-8 p-6 lg:p-8">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-6 w-64" />
          </div>
          <Skeleton className="h-12 w-40" />
        </div>
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-8 p-6 lg:p-8">
        <EmptyState
          icon={<Users className="h-10 w-10" />}
          title="Error al cargar clientes"
          description={error.message || 'Ocurrió un error al cargar los clientes. Por favor, intenta de nuevo.'}
        />
      </div>
    )
  }

  const handleEdit = useCallback((client: Client) => {
    setSelectedClient(client)
    setEditDialogOpen(true)
  }, [])

  const handleDeleteClick = useCallback((clientId: string) => {
    setClientToDelete(clientId)
    setDeleteConfirmOpen(true)
  }, [])

  const handleDeleteConfirm = useCallback(async () => {
    if (!clientToDelete) return

    try {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', clientToDelete)

      if (error) throw error

      toastSuccess('Cliente eliminado exitosamente')
      refresh() // Recargar lista de clientes
      setDeleteConfirmOpen(false)
      setClientToDelete(null)
    } catch (error) {
      logger.error('ClientsPage', 'Error deleting client', error as Error)
      toastError('Error al eliminar el cliente: ' + (error instanceof Error ? error.message : String(error)))
    }
  }, [clientToDelete, supabase, toastSuccess, toastError, refresh])

  return (
    <div className="space-y-8 p-6 lg:p-8">
      {/* Premium Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
            Clientes
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Gestiona tu base de clientes y su historial
          </p>
        </div>
        <Link href="/dashboard/clients/new">
          <Button variant="premium" size="lg" className="shadow-lg hover:shadow-xl gap-2">
            <Plus className="h-5 w-5" />
            Nuevo Cliente
          </Button>
        </Link>
      </div>

      {/* Premium Stats Card */}
      <Card variant="elevated" className="overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b border-gray-200/60 dark:border-gray-800/60">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">Resumen de Clientes</CardTitle>
              <CardDescription className="mt-1">Estadísticas de tu base de clientes</CardDescription>
            </div>
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shadow-lg">
              <Users className="h-7 w-7 text-white" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-950/30 dark:to-violet-950/30 flex items-center justify-center">
                <Users className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {clientsData.length}
                </p>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Clientes Registrados
                </p>
              </div>
            </div>
            <div className="h-12 w-px bg-gray-200 dark:bg-gray-800" />
            <div>
              <p className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                {clientsData.reduce((acc, c) => acc + (c._quotes_count || 0), 0)}
              </p>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Cotizaciones
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Premium Clients Table */}
      <Card variant="elevated" className="overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100/50 dark:from-gray-900/50 dark:to-gray-800/30 border-b border-gray-200/60 dark:border-gray-800/60">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">Lista de Clientes</CardTitle>
                  <CardDescription className="mt-1">
                    {clientsData.length} {clientsData.length === 1 ? 'cliente' : 'clientes'} registrado{clientsData.length !== 1 ? 's' : ''}
                  </CardDescription>
                </div>
                {/* Indicador de posición */}
                {virtualizer.getVirtualItems().length > 0 && (
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Mostrando {virtualizer.getVirtualItems()[0]?.index + 1 || 0} - {virtualizer.getVirtualItems()[virtualizer.getVirtualItems().length - 1]?.index + 1 || 0} de {clientsData.length}
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {clientsData.length === 0 ? (
            <EmptyState
              icon={<Users className="h-10 w-10" />}
              title="No hay clientes registrados"
              description="Comienza agregando tu primer cliente para gestionar cotizaciones y eventos"
              action={{
                label: 'Agregar Primer Cliente',
                onClick: () => window.location.href = '/dashboard/clients/new',
              }}
            />
          ) : (
            <div className="overflow-hidden">
              {/* Header fijo */}
              <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
                <div className="grid grid-cols-12 gap-4 px-6 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
                  <div className="col-span-3">Cliente</div>
                  <div className="col-span-3">Contacto</div>
                  <div className="col-span-2">Cotizaciones</div>
                  <div className="col-span-2">Fecha de Registro</div>
                  <div className="col-span-2 text-right">Acciones</div>
                </div>
              </div>
              
              {/* Lista virtualizada con altura dinámica */}
              <div 
                ref={tableContainerRef} 
                className="overflow-auto transition-all duration-300"
                style={{ height: `${containerHeight}px` }}
              >
                <div
                  style={{
                    height: `${virtualizer.getTotalSize()}px`,
                    width: '100%',
                    position: 'relative',
                  }}
                  className="transition-opacity duration-300"
                >
                  {virtualizer.getVirtualItems().map((virtualRow) => {
                    const client = clientsData[virtualRow.index]
                    return (
                      <div
                        key={virtualRow.key}
                        data-index={virtualRow.index}
                        ref={virtualizer.measureElement}
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: `${virtualRow.size}px`,
                          transform: `translateY(${virtualRow.start}px)`,
                        }}
                        className="transition-opacity duration-200"
                      >
                        <ClientRow
                          client={client}
                          isAdmin={isAdmin}
                          onEdit={handleEdit}
                          onDeleteClick={handleDeleteClick}
                        />
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Client Dialog - Solo para admin */}
      {isAdmin && (
        <EditClientDialog
          open={editDialogOpen}
          onClose={() => {
            setEditDialogOpen(false)
            setSelectedClient(null)
          }}
          onSuccess={() => {
            refresh() // Recargar lista de clientes
          }}
          client={selectedClient}
        />
      )}

      {/* Delete Confirmation Dialog - Solo para admin */}
      {isAdmin && (
        <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Eliminar cliente?</DialogTitle>
            <DialogDescription>
              Esta acción no se puede deshacer. El cliente será eliminado permanentemente.
              Si tiene cotizaciones asociadas, estas no se eliminarán pero el cliente ya no aparecerá en la lista.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="ghost" onClick={() => setDeleteConfirmOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
            >
              Eliminar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      )}
    </div>
  )
}

