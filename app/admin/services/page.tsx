'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { z } from 'zod'
import { useToast } from '@/lib/hooks'
import { logger } from '@/lib/utils/logger'
import { createAuditLog } from '@/lib/utils/audit'
import PageHeader from '@/components/ui/PageHeader'
import { Card, CardContent } from '@/components/ui/Card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table'
import Input from '@/components/ui/Input'
import Skeleton from '@/components/ui/Skeleton'
import { Settings, DollarSign, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface Service {
  id: string
  name: string
  base_price: number
  cost_price: number
}

// Zod schema para validación de precios
const PriceUpdateSchema = z.object({
  price: z.number().nonnegative('El precio no puede ser negativo').finite('El precio debe ser un número válido'),
  field: z.enum(['base_price', 'cost_price']),
})

export default function AdminServicesPage() {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
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

  const updateService = async (id: string, field: 'base_price' | 'cost_price', value: number) => {
    // Validate with Zod
    const validationResult = PriceUpdateSchema.safeParse({ price: value, field })
    if (!validationResult.success) {
      const errorMessage = validationResult.error.issues[0]?.message || 'Datos inválidos'
      toastError(errorMessage)
      return
    }

    setSaving(id)
    try {
      // Obtener el servicio actual para auditoría
      const currentService = services.find((s) => s.id === id)
      const oldValue = currentService ? { [field]: currentService[field] } : null

      const { error } = await supabase
        .from('services')
        .update({ [field]: value })
        .eq('id', id)

      if (error) {
        throw error
      } else {
        const updatedService = { ...currentService, [field]: value } as Service
        setServices(
          services.map((s) => (s.id === id ? updatedService : s))
        )

        // Obtener usuario para auditoría
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          await createAuditLog({
            user_id: user.id,
            action: 'UPDATE',
            table_name: 'services',
            old_values: oldValue ? { id, ...oldValue } : null,
            new_values: { id, [field]: value },
            metadata: { field, service_name: currentService?.name },
          })
        }

        toastSuccess('Servicio actualizado correctamente')
        logger.info('AdminServicesPage', `Service ${field} updated`, { id, value })
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err)
      toastError('Error al actualizar: ' + errorMessage)
      logger.error('AdminServicesPage', 'Error updating service', err instanceof Error ? err : new Error(String(err)), { id, field, value })
    } finally {
      setSaving(null)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Gestión de Servicios"
          description="Administra los precios y costos de los servicios"
        />
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestión de Servicios"
        description="Administra los precios y costos de los servicios disponibles"
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Servicios' },
        ]}
      />

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Servicio</TableHead>
                  <TableHead>Costo</TableHead>
                  <TableHead>Precio Base</TableHead>
                  <TableHead>Margen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {services.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-12">
                      <div className="flex flex-col items-center justify-center">
                        <Settings className="h-12 w-12 text-gray-400 mb-4" />
                        <p className="text-gray-500 dark:text-gray-400">No hay servicios disponibles</p>
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
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
