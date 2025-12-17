'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { z } from 'zod'
import { useToast } from '@/lib/hooks'
import { logger } from '@/lib/utils/logger'
import { createAuditLog } from '@/lib/utils/audit'
import PageHeader from '@/components/ui/PageHeader'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import Skeleton from '@/components/ui/Skeleton'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/Dialog'
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
import { Settings, TrendingUp, Plus, Edit2, Trash2, Sparkles, DollarSign } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import EmptyState from '@/components/ui/EmptyState'

interface Service {
  id: string
  name: string
  base_price: number
  cost_price: number
  created_at?: string
}

// Zod schema para validación de precios
const PriceUpdateSchema = z.object({
  price: z.number().nonnegative('El precio no puede ser negativo').finite('El precio debe ser un número válido'),
  field: z.enum(['base_price', 'cost_price']),
})

// Zod schema para crear/editar servicio
const ServiceSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(100, 'El nombre es demasiado largo'),
  base_price: z.number().positive('El precio base debe ser positivo').finite('El precio debe ser un número válido'),
  cost_price: z.number().nonnegative('El costo no puede ser negativo').finite('El costo debe ser un número válido'),
})

export default function AdminServicesPage() {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState<string | null>(null)
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [newService, setNewService] = useState({ name: '', base_price: 0, cost_price: 0 })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const supabase = createClient()
  const { success: toastSuccess, error: toastError } = useToast()

  useEffect(() => {
    loadServices()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadServices = async () => {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('name')

      if (error) {
        throw error
      } else {
        setServices(data)
        logger.info('AdminServicesPage', 'Services loaded successfully', { count: data?.length || 0 })
      }
    } catch (error) {
      const err = error as Error
      logger.error('AdminServicesPage', 'Error loading services', err)
      toastError('Error al cargar los servicios')
    } finally {
      setLoading(false)
    }
  }

  const updateService = async (id: string, field: 'base_price' | 'cost_price' | 'name', value: number | string) => {
    // Validate with Zod para precios
    if (field !== 'name') {
      const validationResult = PriceUpdateSchema.safeParse({
        price: value as number,
        field: field as 'base_price' | 'cost_price',
      })
      
      if (!validationResult.success) {
        const errorMessage = validationResult.error.issues[0]?.message || 'Error de validación'
        toastError(errorMessage)
        return
      }
    } else {
      // Validar nombre
      if (typeof value !== 'string' || value.trim().length === 0) {
        toastError('El nombre no puede estar vacío')
        return
      }
      if (value.length > 100) {
        toastError('El nombre es demasiado largo (máximo 100 caracteres)')
        return
      }
    }

    setSaving(id)
    try {
      const oldService = services.find((s) => s.id === id)
      if (!oldService) return

      const updateData: Partial<Service> = { [field]: value }
      
      const { error } = await supabase
        .from('services')
        .update(updateData)
        .eq('id', id)

      if (error) {
        throw error
      }

      // Obtener usuario para auditoría
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await createAuditLog({
          user_id: user.id,
          action: 'UPDATE',
          table_name: 'services',
          old_values: oldService as unknown as Record<string, unknown>,
          new_values: { ...oldService, [field]: value } as unknown as Record<string, unknown>,
          metadata: { service_name: oldService.name, field },
        })
      }

      setServices(
        services.map((s) => (s.id === id ? { ...s, [field]: value } : s)).sort((a, b) => a.name.localeCompare(b.name))
      )
      toastSuccess('Precio actualizado correctamente')
      logger.info('AdminServicesPage', 'Service price updated', { id, field, value })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err)
      toastError('Error al actualizar precio: ' + errorMessage)
      logger.error('AdminServicesPage', 'Error updating service price', err instanceof Error ? err : new Error(String(err)), { id, field })
    } finally {
      setSaving(null)
    }
  }

  const handleCreateService = async () => {
    setErrors({})
    
    // Validar con Zod
    const validationResult = ServiceSchema.safeParse(newService)
    
    if (!validationResult.success) {
      const fieldErrors: Record<string, string> = {}
      validationResult.error.issues.forEach((issue) => {
        const path = issue.path[0] as string
        fieldErrors[path] = issue.message
      })
      setErrors(fieldErrors)
      return
    }

    setSaving('create')
    try {
      const { data, error } = await supabase
        .from('services')
        .insert({
          name: newService.name.trim(),
          base_price: newService.base_price,
          cost_price: newService.cost_price,
        })
        .select()
        .single()

      if (error) {
        throw error
      }

      // Obtener usuario para auditoría
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await createAuditLog({
          user_id: user.id,
          action: 'CREATE',
          table_name: 'services',
          old_values: null,
          new_values: data as unknown as Record<string, unknown>,
          metadata: { service_name: data.name },
        })
      }

      setServices([...services, data].sort((a, b) => a.name.localeCompare(b.name)))
      setNewService({ name: '', base_price: 0, cost_price: 0 })
      setIsCreateDialogOpen(false)
      toastSuccess('Servicio creado correctamente')
      logger.info('AdminServicesPage', 'Service created', { id: data.id })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err)
      toastError('Error al crear servicio: ' + errorMessage)
      logger.error('AdminServicesPage', 'Error creating service', err instanceof Error ? err : new Error(String(err)))
    } finally {
      setSaving(null)
    }
  }

  const handleDeleteService = async (id: string) => {
    setSaving(id)
    try {
      const serviceToDelete = services.find((s) => s.id === id)
      
      // Verificar si el servicio está siendo usado en cotizaciones
      const { data: quoteServices, error: checkError } = await supabase
        .from('quote_services')
        .select('id')
        .eq('service_id', id)
        .limit(1)

      if (checkError) {
        throw checkError
      }

      if (quoteServices && quoteServices.length > 0) {
        toastError('No se puede eliminar el servicio porque está siendo usado en cotizaciones')
        setSaving(null)
        return
      }

      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', id)

      if (error) {
        throw error
      }

      // Obtener usuario para auditoría
      const { data: { user } } = await supabase.auth.getUser()
      if (user && serviceToDelete) {
        await createAuditLog({
          user_id: user.id,
          action: 'DELETE',
          table_name: 'services',
          old_values: serviceToDelete as unknown as Record<string, unknown>,
          new_values: null,
          metadata: { service_name: serviceToDelete.name },
        })
      }

      setServices(services.filter((s) => s.id !== id))
      toastSuccess('Servicio eliminado correctamente')
      logger.info('AdminServicesPage', 'Service deleted', { id })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err)
      toastError('Error al eliminar servicio: ' + errorMessage)
      logger.error('AdminServicesPage', 'Error deleting service', err instanceof Error ? err : new Error(String(err)), { id })
    } finally {
      setSaving(null)
    }
  }

  const openEditDialog = (service: Service) => {
    setEditingService(service)
    setIsEditDialogOpen(service.id)
  }

  const handleEditService = async () => {
    if (!editingService) return

    setErrors({})
    
    // Validar con Zod
    const validationResult = ServiceSchema.safeParse({
      name: editingService.name,
      base_price: editingService.base_price,
      cost_price: editingService.cost_price,
    })
    
    if (!validationResult.success) {
      const fieldErrors: Record<string, string> = {}
      validationResult.error.issues.forEach((issue) => {
        const path = issue.path[0] as string
        fieldErrors[path] = issue.message
      })
      setErrors(fieldErrors)
      return
    }

    setSaving(editingService.id)
    try {
      const oldService = services.find((s) => s.id === editingService.id)
      
      const { error } = await supabase
        .from('services')
        .update({
          name: editingService.name.trim(),
          base_price: editingService.base_price,
          cost_price: editingService.cost_price,
        })
        .eq('id', editingService.id)

      if (error) {
        throw error
      }

      // Obtener usuario para auditoría
      const { data: { user } } = await supabase.auth.getUser()
      if (user && oldService) {
        await createAuditLog({
          user_id: user.id,
          action: 'UPDATE',
          table_name: 'services',
          old_values: oldService as unknown as Record<string, unknown>,
          new_values: editingService as unknown as Record<string, unknown>,
          metadata: { service_name: editingService.name },
        })
      }

      setServices(
        services.map((s) => (s.id === editingService.id ? editingService : s)).sort((a, b) => a.name.localeCompare(b.name))
      )
      setIsEditDialogOpen(null)
      setEditingService(null)
      toastSuccess('Servicio actualizado correctamente')
      logger.info('AdminServicesPage', 'Service updated', { id: editingService.id })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err)
      toastError('Error al actualizar servicio: ' + errorMessage)
      logger.error('AdminServicesPage', 'Error updating service', err instanceof Error ? err : new Error(String(err)), { id: editingService.id })
    } finally {
      setSaving(null)
    }
  }

  if (loading) {
    return (
      <div className="space-y-8 p-6 lg:p-8">
        <PageHeader
          title="Gestión de Servicios"
          description="Administra los precios y costos de los servicios"
        />
        <Card variant="elevated">
          <CardContent className="p-6">
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 w-full rounded-xl" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-8 p-6 lg:p-8">
      {/* Premium Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
            Gestión de Servicios
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Administra los servicios disponibles para cotizaciones
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="premium" size="lg" className="shadow-lg hover:shadow-xl gap-2">
              <Plus className="h-5 w-5" />
              Nuevo Servicio
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear Nuevo Servicio</DialogTitle>
              <DialogDescription>
                Agrega un nuevo servicio que estará disponible para usar en cotizaciones.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-5 py-4">
              <Input
                label="Nombre del Servicio"
                placeholder="Ej: Mesa Redonda"
                value={newService.name}
                onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                error={errors.name}
              />
              <Input
                type="number"
                step="0.01"
                min="0"
                label="Precio Base (MXN)"
                placeholder="0.00"
                icon={<DollarSign className="h-4 w-4" />}
                value={newService.base_price || ''}
                onChange={(e) => setNewService({ ...newService, base_price: parseFloat(e.target.value) || 0 })}
                error={errors.base_price}
              />
              <Input
                type="number"
                step="0.01"
                min="0"
                label="Costo (MXN)"
                placeholder="0.00"
                icon={<DollarSign className="h-4 w-4" />}
                value={newService.cost_price || ''}
                onChange={(e) => setNewService({ ...newService, cost_price: parseFloat(e.target.value) || 0 })}
                error={errors.cost_price}
              />
            </div>
            <DialogFooter className="gap-3">
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateService} isLoading={saving === 'create'} variant="premium">
                Crear Servicio
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Premium Services Table */}
      <Card variant="elevated" className="overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-indigo-50 to-violet-50 dark:from-indigo-950/30 dark:to-violet-950/30 border-b border-gray-200/60 dark:border-gray-800/60">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">Lista de Servicios</CardTitle>
              <CardDescription className="mt-1">
                {services.length} {services.length === 1 ? 'servicio' : 'servicios'} disponible{services.length !== 1 ? 's' : ''}
              </CardDescription>
            </div>
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shadow-lg">
              <Settings className="h-5 w-5 text-white" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {services.length === 0 ? (
            <EmptyState
              icon={<Settings className="h-10 w-10" />}
              title="No hay servicios disponibles"
              description="Comienza agregando tu primer servicio para que esté disponible en las cotizaciones"
              action={{
                label: 'Crear Primer Servicio',
                onClick: () => setIsCreateDialogOpen(true),
              }}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Servicio</TableHead>
                  <TableHead>Costo</TableHead>
                  <TableHead>Precio Base</TableHead>
                  <TableHead>Margen</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {services.map((service) => {
                  const margin = service.cost_price > 0
                    ? ((service.base_price - service.cost_price) / service.cost_price) * 100
                    : 0
                  return (
                    <TableRow key={service.id} className="group">
                      <TableCell>
                        <div className="font-semibold text-gray-900 dark:text-white">{service.name}</div>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          defaultValue={service.cost_price}
                          onBlur={(e) => {
                            const newValue = parseFloat(e.target.value) || 0
                            if (newValue !== service.cost_price) {
                              updateService(service.id, 'cost_price', newValue)
                            }
                          }}
                          className="w-32"
                          disabled={saving === service.id}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          defaultValue={service.base_price}
                          onBlur={(e) => {
                            const newValue = parseFloat(e.target.value) || 0
                            if (newValue !== service.base_price) {
                              updateService(service.id, 'base_price', newValue)
                            }
                          }}
                          className="w-32"
                          disabled={saving === service.id}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <TrendingUp className={cn(
                            "h-4 w-4",
                            margin > 50 ? "text-emerald-600 dark:text-emerald-400" : margin > 20 ? "text-blue-600 dark:text-blue-400" : "text-gray-400 dark:text-gray-500"
                          )} />
                          <span className="text-sm font-semibold text-gray-900 dark:text-white">
                            {margin.toFixed(1)}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-2">
                          <Dialog open={isEditDialogOpen === service.id} onOpenChange={(open) => {
                            if (!open) {
                              setIsEditDialogOpen(null)
                              setEditingService(null)
                            } else {
                              openEditDialog(service)
                            }
                          }}>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                <Edit2 className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Editar Servicio</DialogTitle>
                                <DialogDescription>
                                  Modifica los datos del servicio.
                                </DialogDescription>
                              </DialogHeader>
                              {editingService && (
                                <div className="space-y-5 py-4">
                                  <Input
                                    label="Nombre del Servicio"
                                    placeholder="Ej: Mesa Redonda"
                                    value={editingService.name}
                                    onChange={(e) => setEditingService({ ...editingService, name: e.target.value })}
                                    error={errors.name}
                                  />
                                  <Input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    label="Precio Base (MXN)"
                                    placeholder="0.00"
                                    icon={<DollarSign className="h-4 w-4" />}
                                    value={editingService.base_price || ''}
                                    onChange={(e) => setEditingService({ ...editingService, base_price: parseFloat(e.target.value) || 0 })}
                                    error={errors.base_price}
                                  />
                                  <Input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    label="Costo (MXN)"
                                    placeholder="0.00"
                                    icon={<DollarSign className="h-4 w-4" />}
                                    value={editingService.cost_price || ''}
                                    onChange={(e) => setEditingService({ ...editingService, cost_price: parseFloat(e.target.value) || 0 })}
                                    error={errors.cost_price}
                                  />
                                </div>
                              )}
                              <DialogFooter className="gap-3">
                                <Button variant="outline" onClick={() => {
                                  setIsEditDialogOpen(null)
                                  setEditingService(null)
                                }}>
                                  Cancelar
                                </Button>
                                <Button onClick={handleEditService} isLoading={saving === editingService?.id} variant="premium">
                                  Guardar Cambios
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>¿Eliminar servicio?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta acción no se puede deshacer. El servicio &quot;{service.name}&quot; será eliminado permanentemente.
                                  {service.id && (
                                    <span className="block mt-2 text-sm text-gray-500 dark:text-gray-400">
                                      Nota: No se puede eliminar si está siendo usado en cotizaciones.
                                    </span>
                                  )}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteService(service.id)}
                                  variant="destructive"
                                  disabled={saving === service.id}
                                >
                                  {saving === service.id ? 'Eliminando...' : 'Eliminar'}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
                {services.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12">
                      <div className="flex flex-col items-center justify-center">
                        <Settings className="h-12 w-12 text-gray-400 mb-4" />
                        <p className="text-gray-500 dark:text-gray-400 mb-4">No hay servicios disponibles</p>
                        <Button onClick={() => setIsCreateDialogOpen(true)}>
                          <Plus className="mr-2 h-4 w-4" />
                          Crear Primer Servicio
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  services.map((service) => {
                    const margin = service.cost_price > 0
                      ? ((service.base_price - service.cost_price) / service.cost_price) * 100
                      : 0
                    return (
                      <TableRow key={service.id}>
                        <TableCell>
                          <div className="font-medium text-gray-900 dark:text-white">{service.name}</div>
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            defaultValue={service.cost_price}
                            onBlur={(e) => {
                              const newValue = parseFloat(e.target.value) || 0
                              if (newValue !== service.cost_price) {
                                updateService(service.id, 'cost_price', newValue)
                              }
                            }}
                            className="w-32"
                            disabled={saving === service.id}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            defaultValue={service.base_price}
                            onBlur={(e) => {
                              const newValue = parseFloat(e.target.value) || 0
                              if (newValue !== service.base_price) {
                                updateService(service.id, 'base_price', newValue)
                              }
                            }}
                            className="w-32"
                            disabled={saving === service.id}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <TrendingUp className={cn(
                              "h-4 w-4",
                              margin > 50 ? "text-green-600" : margin > 20 ? "text-blue-600" : "text-gray-400"
                            )} />
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {margin.toFixed(1)}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end space-x-2">
                            <Dialog open={isEditDialogOpen === service.id} onOpenChange={(open) => {
                              if (!open) {
                                setIsEditDialogOpen(null)
                                setEditingService(null)
                              } else {
                                openEditDialog(service)
                              }
                            }}>
                              <DialogTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Editar Servicio</DialogTitle>
                                  <DialogDescription>
                                    Modifica los datos del servicio.
                                  </DialogDescription>
                                </DialogHeader>
                                {editingService && (
                                  <div className="space-y-4 py-4">
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Nombre del Servicio *
                                      </label>
                                      <Input
                                        value={editingService.name}
                                        onChange={(e) => setEditingService({ ...editingService, name: e.target.value })}
                                        placeholder="Ej: Mesa Redonda"
                                        error={errors.name}
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Precio Base (MXN) *
                                      </label>
                                      <Input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={editingService.base_price || ''}
                                        onChange={(e) => setEditingService({ ...editingService, base_price: parseFloat(e.target.value) || 0 })}
                                        placeholder="0.00"
                                        error={errors.base_price}
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Costo (MXN)
                                      </label>
                                      <Input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={editingService.cost_price || ''}
                                        onChange={(e) => setEditingService({ ...editingService, cost_price: parseFloat(e.target.value) || 0 })}
                                        placeholder="0.00"
                                        error={errors.cost_price}
                                      />
                                    </div>
                                  </div>
                                )}
                                <DialogFooter>
                                  <Button variant="outline" onClick={() => {
                                    setIsEditDialogOpen(null)
                                    setEditingService(null)
                                  }}>
                                    Cancelar
                                  </Button>
                                  <Button onClick={handleEditService} isLoading={saving === editingService?.id}>
                                    Guardar Cambios
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>¿Eliminar servicio?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Esta acción no se puede deshacer. El servicio "{service.name}" será eliminado permanentemente.
                                    {service.id && (
                                      <span className="block mt-2 text-sm text-gray-500">
                                        Nota: No se puede eliminar si está siendo usado en cotizaciones.
                                      </span>
                                    )}
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteService(service.id)}
                                    className="bg-red-600 hover:bg-red-700"
                                    disabled={saving === service.id}
                                  >
                                    {saving === service.id ? 'Eliminando...' : 'Eliminar'}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
