'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import { CreateQuoteSchema } from '@/lib/validations/schemas'
import { useToast, useDebounce } from '@/lib/hooks'
import { logger } from '@/lib/utils/logger'
import { createAuditLog } from '@/lib/utils/audit'
import QuoteTemplateSelector from '@/components/templates/QuoteTemplateSelector'

interface Client {
  id: string
  name: string
  email: string
}

interface Service {
  id: string
  name: string
  base_price: number
}

interface QuoteService {
  service_id: string
  quantity: number
  final_price: number
  service?: Service
}

export default function NewQuotePage() {
  const searchParams = useSearchParams()
  const [step, setStep] = useState(1)
  const [clients, setClients] = useState<Client[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [searchClient, setSearchClient] = useState('')
  const [quoteServices, setQuoteServices] = useState<QuoteService[]>([])
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const { success: toastSuccess, error: toastError } = useToast()
  const debouncedSearchClient = useDebounce(searchClient, 300)

  // Cargar cliente si viene en query params
  useEffect(() => {
    const clientId = searchParams.get('client_id')
    if (clientId && !selectedClient) {
      const loadClient = async () => {
        const { data } = await supabase
          .from('clients')
          .select('*')
          .eq('id', clientId)
          .single()
        if (data) {
          setSelectedClient(data)
        }
      }
      loadClient()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  useEffect(() => {
    let cancelled = false
    
    const loadServices = async () => {
      try {
        const { data, error } = await supabase
          .from('services')
          .select('*')
          .order('name')
        
        if (cancelled) return
        
        if (error) {
          // Si el error es de esquema (PGRST106), solo loguear warning
          if (error.code === 'PGRST106' || error.message?.includes('schema')) {
            logger.warn('NewQuotePage', 'Services table not accessible (schema error)', {
              supabaseError: error.message,
              supabaseCode: error.code,
            })
            // No mostrar toast de error para errores de esquema (problema de configuración)
            // El usuario verá una lista vacía de servicios
          } else {
            // Para otros errores, mostrar notificación
            const errorMessage = error?.message || 'Error loading services'
            const errorForLogging = error instanceof Error 
              ? error 
              : new Error(errorMessage)
            logger.error('NewQuotePage', 'Error loading services', errorForLogging, {
              supabaseError: errorMessage,
              supabaseCode: error?.code,
            })
            toastError('Error al cargar los servicios')
          }
        } else if (data) {
          setServices(data)
        } else {
          // No hay datos pero tampoco hay error
          setServices([])
        }
      } catch (err) {
        if (cancelled) return
        logger.error('NewQuotePage', 'Unexpected error loading services', err as Error)
        toastError('Error inesperado al cargar los servicios')
      }
    }
    
    void loadServices()
    
    return () => {
      cancelled = true
    }
    // toastError no debe estar en las dependencias - solo se usa para notificaciones, no para lógica de datos
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase])

  useEffect(() => {
    let cancelled = false
    
    const searchClients = async (searchTerm: string) => {
      if (!searchTerm.trim()) {
        if (!cancelled) {
          setClients([])
        }
        return
      }

      try {
        const { data, error } = await supabase
          .from('clients')
          .select('*')
          .ilike('name', `%${searchTerm}%`)
          .limit(10)
        
        if (cancelled) return
        
        if (error) {
          // Si el error es de esquema (PGRST106), solo loguear warning
          if (error.code === 'PGRST106' || error.message?.includes('schema')) {
            logger.warn('NewQuotePage', 'Clients table not accessible (schema error)', {
              supabaseError: error.message,
              supabaseCode: error.code,
              searchTerm: searchTerm,
            })
            // No mostrar toast de error para errores de esquema
            setClients([])
          } else {
            // Para otros errores, mostrar notificación
            const errorMessage = error?.message || 'Error searching clients'
            const errorForLogging = error instanceof Error 
              ? error 
              : new Error(errorMessage)
            logger.error('NewQuotePage', 'Error searching clients', errorForLogging, {
              supabaseError: errorMessage,
              supabaseCode: error?.code,
              searchTerm: searchTerm,
            })
            toastError('Error al buscar clientes')
          }
        } else {
          setClients(data || [])
        }
      } catch (err) {
        if (cancelled) return
        logger.error('NewQuotePage', 'Unexpected error searching clients', err as Error)
        toastError('Error inesperado al buscar clientes')
      }
    }
    
    void searchClients(debouncedSearchClient)
    
    return () => {
      cancelled = true
    }
    // toastError no debe estar en las dependencias - solo se usa para notificaciones, no para lógica de datos
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearchClient, supabase])

  const addService = useCallback(() => {
    if (services.length > 0) {
      setQuoteServices((prev) => [
        ...prev,
        {
          service_id: services[0].id,
          quantity: 1,
          final_price: services[0].base_price,
        },
      ])
    }
  }, [services])

  const updateService = useCallback((index: number, field: keyof QuoteService, value: number | string) => {
    setQuoteServices((prev) => {
      const updated = [...prev]
      
      if (field === 'quantity') {
        const v = Number(value) || 1
        updated[index] = { ...updated[index], quantity: Math.max(1, v) }
      } else if (field === 'final_price') {
        const v = Number(value) || 0
        updated[index] = { ...updated[index], final_price: Math.max(0, v) }
      } else {
        updated[index] = { ...updated[index], [field]: value }
      }
      
      return updated
    })
  }, [])

  const removeService = useCallback((index: number) => {
    setQuoteServices((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const total = useMemo(() => {
    return quoteServices.reduce((sum, qs) => sum + (qs.final_price * qs.quantity), 0)
  }, [quoteServices])

  const saveDraft = async () => {
    // Limpiar errores previos
    setErrors({})

    // Validar cliente seleccionado
    if (!selectedClient) {
      setErrors({ client: 'Por favor selecciona un cliente' })
      toastError('Por favor selecciona un cliente')
      return
    }

    // Validar servicios agregados
    if (quoteServices.length === 0) {
      setErrors({ services: 'Por favor agrega al menos un servicio' })
      toastError('Por favor agrega al menos un servicio')
      return
    }

    // Validar con Zod
    const validationResult = CreateQuoteSchema.safeParse({
      client_id: selectedClient.id,
      services: quoteServices.map(qs => ({
        service_id: qs.service_id,
        quantity: qs.quantity,
        final_price: qs.final_price,
      })),
      total_price: total,
    })

    if (!validationResult.success) {
      const fieldErrors: Record<string, string> = {}
      validationResult.error.issues.forEach((err) => {
        fieldErrors[err.path.join('.')] = err.message
      })
      setErrors(fieldErrors)
      toastError('Por favor valida los datos de la cotización')
      logger.warn('NewQuotePage', 'Quote validation failed', { errors: fieldErrors })
      return
    }

    setLoading(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        toastError('Usuario no autenticado')
        logger.error('NewQuotePage', 'User not authenticated when saving quote')
        setLoading(false)
        return
      }

      const { data: quote, error } = await supabase
        .from('quotes')
        .insert({
          client_id: selectedClient.id,
          vendor_id: user.id,
          status: 'draft',
          total_price: total,
        })
        .select()
        .single()

      if (error) {
        const errorMessage = error?.message || 'Error saving quote'
        toastError('Error al guardar: ' + errorMessage)
        // Convertir error de Supabase a Error estándar
        const errorForLogging = error instanceof Error 
          ? error 
          : new Error(errorMessage)
        logger.error('NewQuotePage', 'Error saving quote', errorForLogging, {
          supabaseError: errorMessage,
          supabaseCode: error?.code,
          quoteData: {
            client_id: selectedClient?.id,
            total_price: total,
            services_count: quoteServices.length,
          },
        })
        setLoading(false)
        return
      }

      // Guardar servicios de la cotización
      const quoteServicesData = quoteServices.map((qs) => ({
        quote_id: quote.id,
        service_id: qs.service_id,
        quantity: qs.quantity,
        final_price: qs.final_price,
      }))

      const { error: insertError } = await supabase
        .from('quote_services')
        .insert(quoteServicesData)

      if (insertError) {
        toastError('Error al guardar los servicios: ' + insertError.message)
        logger.error('NewQuotePage', 'Error saving quote services', insertError)
        setLoading(false)
        return
      }

      // Crear registro de auditoría
      await createAuditLog({
        user_id: user.id,
        action: 'CREATE',
        table_name: 'quotes',
        old_values: null,
        new_values: quote,
        metadata: {
          services_count: quoteServices.length,
          total_price: total,
        },
      })

      toastSuccess('Cotización guardada como borrador exitosamente')
      logger.info('NewQuotePage', 'Quote created successfully', { quoteId: quote.id })
      
      router.push(`/dashboard/quotes/${quote.id}`)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      toastError('Error inesperado: ' + message)
      logger.error('NewQuotePage', 'Unexpected error saving quote', err instanceof Error ? err : new Error(String(err)))
      setLoading(false)
    }
  }

  const selectedService = useCallback((serviceId: string) => {
    return services.find((s) => s.id === serviceId)
  }, [services])

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Nueva Cotización</h1>

      {/* Indicador de pasos */}
      <div className="mb-8">
        <div className="flex items-center">
          <div
            className={`flex items-center justify-center w-10 h-10 rounded-full ${
              step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600 dark:bg-gray-700'
            }`}
          >
            1
          </div>
          <div className={`flex-1 h-1 mx-2 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'}`} />
          <div
            className={`flex items-center justify-center w-10 h-10 rounded-full ${
              step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600 dark:bg-gray-700'
            }`}
          >
            2
          </div>
        </div>
        <div className="flex justify-between mt-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">Seleccionar Cliente</span>
          <span className="text-sm text-gray-600 dark:text-gray-400">Agregar Servicios</span>
        </div>
      </div>

      {/* Error messages */}
      {Object.keys(errors).length > 0 && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm font-medium text-red-800 dark:text-red-200 mb-2">Errores en el formulario:</p>
          <ul className="list-disc list-inside space-y-1">
            {Object.values(errors).map((error, idx) => (
              <li key={idx} className="text-sm text-red-700 dark:text-red-300">{error}</li>
            ))}
          </ul>
        </div>
      )}

      {step === 1 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Seleccionar Cliente</h2>
          <input
            type="text"
            value={searchClient}
            onChange={(e) => setSearchClient(e.target.value)}
            placeholder="Buscar cliente por nombre..."
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          />
          {clients.length > 0 && (
            <div className="mt-4 space-y-2">
              {clients.map((client) => (
                <button
                  key={client.id}
                  onClick={() => {
                    setSelectedClient(client)
                    setStep(2)
                    setErrors({})
                  }}
                  className="w-full text-left p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors dark:bg-gray-800"
                >
                  <p className="font-medium text-gray-900 dark:text-white">{client.name}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{client.email}</p>
                </button>
              ))}
            </div>
          )}
          {selectedClient && (
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-gray-600 dark:text-gray-400">Cliente seleccionado:</p>
              <p className="font-medium text-gray-900 dark:text-white">{selectedClient.name}</p>
            </div>
          )}
        </div>
      )}

      {step === 2 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Agregar Servicios</h2>
            <button
              onClick={addService}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-800"
            >
              + Agregar Servicio
            </button>
          </div>

          {quoteServices.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                No hay servicios agregados. Haz clic en &quot;Agregar Servicio&quot; para comenzar.
              </p>
          ) : (
            <div className="space-y-4">
              {quoteServices.map((qs, index) => {
                const service = selectedService(qs.service_id)
                return (
                  <div
                    key={index}
                    className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg space-y-3 dark:bg-gray-700"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <select
                          value={qs.service_id}
                          onChange={(e) => {
                            const newService = services.find((s) => s.id === e.target.value)
                            if (newService) {
                              updateService(index, 'service_id', e.target.value)
                              updateService(index, 'final_price', newService.base_price)
                            }
                          }}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-600 dark:text-white"
                        >
                          {services.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name} - ${s.base_price.toLocaleString()}
                            </option>
                          ))}
                        </select>
                      </div>
                      <button
                        onClick={() => removeService(index)}
                        className="ml-4 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                      >
                        ✕
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Cantidad
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={qs.quantity}
                          onChange={(e) =>
                            updateService(index, 'quantity', parseInt(e.target.value) || 1)
                          }
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-600 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Precio Base: ${service?.base_price.toLocaleString()}
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={qs.final_price}
                          onChange={(e) =>
                            updateService(index, 'final_price', parseFloat(e.target.value) || 0)
                          }
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-600 dark:text-white"
                        />
                      </div>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Subtotal: ${(qs.final_price * qs.quantity).toLocaleString('es-MX', {
                        minimumFractionDigits: 2,
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-gray-900 dark:text-white">Total:</span>
              <span className="text-2xl font-bold text-blue-600">
                ${total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          <div className="mt-6 flex justify-between gap-4">
            <button
              onClick={() => {
                setStep(1)
                setErrors({})
              }}
              className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white"
            >
              Atrás
            </button>
            <button
              onClick={saveDraft}
              disabled={loading || quoteServices.length === 0}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Guardando...' : 'Guardar Borrador'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
