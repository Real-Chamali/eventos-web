'use client'

import { useState } from 'react'
import { z } from 'zod'
import { useToast } from '@/lib/hooks'
import { logger } from '@/lib/utils/logger'
import { useServices } from '@/lib/hooks/useServices'
import { TableSkeleton } from '@/components/Skeleton'

interface Service {
  id: string
  name: string
  base_price: number
  cost_price: number
}

const PriceUpdateSchema = z.object({
  price: z.number().nonnegative('El precio no puede ser negativo').finite('El precio debe ser un número válido'),
  field: z.enum(['base_price', 'cost_price']),
})

export default function AdminServicesPage() {
  const { services, isLoading, error: serviceError, mutate } = useServices()
  const [saving, setSaving] = useState<string | null>(null)
  const { success: toastSuccess, error: toastError } = useToast()

  // REFACTORIZADO: Ahora llama a nuestra API Route en lugar de a Supabase directamente.
  const updateService = async (id: string, field: 'base_price' | 'cost_price', value: number) => {
    const validationResult = PriceUpdateSchema.safeParse({ price: value, field })
    if (!validationResult.success) {
      toastError(validationResult.error.issues[0]?.message || 'Datos inválidos')
      return
    }

    setSaving(id)
    try {
      const response = await fetch(`/api/services/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ field, value }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error en el servidor')
      }

      await mutate() // Le decimos a SWR que los datos han cambiado para que refresque la UI.
      toastSuccess('Servicio actualizado correctamente')
      logger.info('AdminServicesPage', `Llamada a API para actualizar servicio exitosa`, { id, value })

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err)
      toastError('Error al actualizar: ' + errorMessage)
      logger.error('AdminServicesPage', 'Fallo al llamar a la API de actualización de servicio', err instanceof Error ? err : new Error(String(err)))
    } finally {
      setSaving(null)
    }
  }

  if (isLoading) {
    return (
      <div className="p-8 bg-white dark:bg-gray-900 min-h-screen">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Gestión de Servicios</h1>
        <TableSkeleton rows={5} columns={4} />
      </div>
    )
  }

  if (serviceError) {
    return (
      <div className="p-8 text-center text-red-600">
        Error al cargar los servicios. Por favor, intenta de nuevo.
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Servicio</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Costo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Precio Base</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Margen</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {services.map((service: Service) => {
                const margin = service.cost_price > 0 ? ((service.base_price - service.cost_price) / service.cost_price) * 100 : 0
                return (
                  <tr key={service.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap"><div className="text-sm font-medium text-gray-900 dark:text-white">{service.name}</div></td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="number" step="0.01" min="0" defaultValue={service.cost_price}
                        onBlur={(e) => { const newValue = parseFloat(e.target.value) || 0; if (newValue !== service.cost_price) { updateService(service.id, 'cost_price', newValue) } }}
                        className="w-32 px-3 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        disabled={saving === service.id}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="number" step="0.01" min="0" defaultValue={service.base_price}
                        onBlur={(e) => { const newValue = parseFloat(e.target.value) || 0; if (newValue !== service.base_price) { updateService(service.id, 'base_price', newValue) } }}
                        className="w-32 px-3 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        disabled={saving === service.id}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap"><div className="text-sm text-gray-900 dark:text-gray-300">{margin.toFixed(1)}%</div></td>
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
