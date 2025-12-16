'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { z } from 'zod'
import { useToast } from '@/lib/hooks'
import { logger } from '@/lib/utils/logger'
import { createAuditLog } from '@/lib/utils/audit'

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
      <div className="p-8 bg-white dark:bg-gray-900 min-h-screen">
        <div className="text-center text-gray-900 dark:text-white">Cargando servicios...</div>
      </div>
    )
  }

  return (
    <div className="p-8 bg-white dark:bg-gray-900 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Gestión de Servicios</h1>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Servicio
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Costo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Precio Base
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Margen
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {services.map((service) => {
                const margin = service.cost_price > 0
                  ? ((service.base_price - service.cost_price) / service.cost_price) * 100
                  : 0
                return (
                  <tr key={service.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{service.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
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
                        className="w-32 px-3 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        disabled={saving === service.id}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
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
                        className="w-32 px-3 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        disabled={saving === service.id}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-gray-300">
                        {margin.toFixed(1)}%
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
