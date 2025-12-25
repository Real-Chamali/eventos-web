'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import { CreateQuoteSchema } from '@/lib/validations/schemas'
import { useToast, useDebounce, useOptimisticMutation, useQuotes, useInfiniteQuotes } from '@/lib/hooks'
import { useAutoSave } from '@/lib/hooks/useAutoSave'
import ProgressIndicator from '@/components/ui/ProgressIndicator'
import { logger } from '@/lib/utils/logger'
import { createAuditLog } from '@/lib/utils/audit'
import { createNotification } from '@/lib/utils/notifications'
import type { Quote } from '@/types'
import PageHeader from '@/components/ui/PageHeader'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import SearchInput from '@/components/ui/SearchInput'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select'
import { Plus, X, ArrowLeft, User, ShoppingCart, DollarSign, CheckCircle2, Sparkles, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils/cn'

interface Client {
  id: string
  name: string
  email: string
}

interface Service {
  id: string
  name: string
  base_price: number
  cost_price?: number | null
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
  const { error: toastError } = useToast()
  const debouncedSearchClient = useDebounce(searchClient, 300)
  const { execute: optimisticCreate } = useOptimisticMutation<Quote[]>()
  const { refresh: refreshQuotes } = useQuotes()
  const { refresh: refreshInfiniteQuotes } = useInfiniteQuotes()

  // Auto-save del borrador
  const draftData = useMemo(() => ({
    selectedClientId: selectedClient?.id || null,
    quoteServices,
    step,
  }), [selectedClient?.id, quoteServices, step])

  const { clear: clearDraft, hasDraft } = useAutoSave({
    data: draftData,
    storageKey: 'quote-new-draft',
    enabled: true,
    debounceMs: 2000,
    onRestore: (restored) => {
      // Restaurar cliente si existe
      if (restored.selectedClientId) {
        const client = clients.find(c => c.id === restored.selectedClientId)
        if (client) {
          setSelectedClient(client)
        }
      }
      // Restaurar servicios
      if (restored.quoteServices && Array.isArray(restored.quoteServices)) {
        setQuoteServices(restored.quoteServices)
      }
      // Restaurar paso
      if (restored.step) {
        setStep(restored.step)
      }
    },
  })

  // Limpiar borrador cuando se guarda exitosamente
  useEffect(() => {
    // Limpiar borrador si se completa exitosamente (se detecta por la redirección)
    return () => {
      // Este cleanup se ejecuta cuando el componente se desmonta
      // Si hay una redirección, significa que se guardó exitosamente
    }
  }, [])

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
          .select('id, name, base_price, cost_price')
          .order('name')
        
        if (cancelled) return
        
        if (error) {
          if (error.code === 'PGRST106' || error.message?.includes('schema')) {
            logger.warn('NewQuotePage', 'Services table not accessible (schema error)', {
              supabaseError: error.message,
              supabaseCode: error.code,
            })
          } else {
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
          if (error.code === 'PGRST106' || error.message?.includes('schema')) {
            logger.warn('NewQuotePage', 'Clients table not accessible (schema error)', {
              supabaseError: error.message,
              supabaseCode: error.code,
              searchTerm: searchTerm,
            })
            setClients([])
          } else {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearchClient, supabase])

  const addService = useCallback(async () => {
    if (services.length > 0) {
      const service = services[0]
      try {
        // Calcular precio inteligente con reglas automáticas
        const { calculateIntelligentPrice } = await import('@/lib/utils/intelligentPricing')
        const intelligentPrice = await calculateIntelligentPrice(service.id, 1)
        
        setQuoteServices((prev) => [
          ...prev,
          {
            service_id: service.id,
            quantity: 1,
            final_price: intelligentPrice > 0 ? intelligentPrice : service.base_price,
          },
        ])
      } catch (error) {
        // Fallback a precio base si hay error
        logger.warn('NewQuotePage', 'Error calculating intelligent price, using base price', { error: error instanceof Error ? error.message : String(error) })
        setQuoteServices((prev) => [
          ...prev,
          {
            service_id: service.id,
            quantity: 1,
            final_price: service.base_price,
          },
        ])
      }
    }
  }, [services])

  const updateService = useCallback(async (index: number, field: keyof QuoteService, value: number | string) => {
    setQuoteServices((prev) => {
      const updated = [...prev]
      const service = services.find(s => s.id === updated[index].service_id)
      
      if (field === 'quantity') {
        const v = Number(value) || 1
        updated[index] = { ...updated[index], quantity: Math.max(1, v) }
        
        // Recalcular precio inteligente cuando cambia la cantidad
        if (service) {
          import('@/lib/utils/intelligentPricing').then(({ calculateIntelligentPrice }) => {
            calculateIntelligentPrice(service.id, v).then(intelligentPrice => {
              if (intelligentPrice > 0) {
                setQuoteServices(current => {
                  const newServices = [...current]
                  if (newServices[index]) {
                    newServices[index] = { ...newServices[index], final_price: intelligentPrice }
                  }
                  return newServices
                })
              }
            }).catch(() => {
              // Fallback: usar precio base * cantidad
              if (service) {
                setQuoteServices(current => {
                  const newServices = [...current]
                  if (newServices[index]) {
                    newServices[index] = { ...newServices[index], final_price: service.base_price * v }
                  }
                  return newServices
                })
              }
            })
          })
        }
      } else if (field === 'final_price') {
        const v = Number(value) || 0
        updated[index] = { ...updated[index], final_price: Math.max(0, v) }
      } else {
        updated[index] = { ...updated[index], [field]: value }
      }
      
      return updated
    })
  }, [services])

  const removeService = useCallback((index: number) => {
    setQuoteServices((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const total = useMemo(() => {
    return quoteServices.reduce((sum, qs) => sum + (qs.final_price * qs.quantity), 0)
  }, [quoteServices])

  // Calcular margen y validaciones
  const marginAnalysis = useMemo(() => {
    let totalCost = 0
    let totalRevenue = 0
    const warnings: string[] = []
    const errors: string[] = []

    quoteServices.forEach((qs) => {
      const service = services.find(s => s.id === qs.service_id)
      if (service) {
        const cost = (service.cost_price || 0) * qs.quantity
        const revenue = qs.final_price * qs.quantity
        totalCost += cost
        totalRevenue += revenue

        if (service.cost_price && service.cost_price > 0) {
          const margin = ((qs.final_price - service.cost_price) / qs.final_price) * 100
          if (margin < 0) {
            errors.push(`⚠️ PÉRDIDA en ${service.name}: El precio es menor al costo`)
          } else if (margin < 10) {
            warnings.push(`Margen bajo en ${service.name}: ${margin.toFixed(1)}%`)
          }
        }
      }
    })

    const totalMargin = totalRevenue > 0 ? ((totalRevenue - totalCost) / totalRevenue) * 100 : 0
    const hasLoss = errors.length > 0 || (totalCost > 0 && totalRevenue < totalCost)

    return {
      totalCost,
      totalRevenue,
      totalMargin,
      warnings,
      errors,
      hasLoss,
      isValid: !hasLoss,
    }
  }, [quoteServices, services])

  const saveDraft = async () => {
    setErrors({})

    if (!selectedClient) {
      setErrors({ client: 'Por favor selecciona un cliente' })
      toastError('Por favor selecciona un cliente')
      return
    }

    if (quoteServices.length === 0) {
      setErrors({ services: 'Por favor agrega al menos un servicio' })
      toastError('Por favor agrega al menos un servicio')
      return
    }

    // Validar margen antes de guardar
    if (marginAnalysis.hasLoss) {
      toastError('No se puede guardar: hay servicios con pérdida. Revisa los precios.')
      setErrors({ margin: marginAnalysis.errors.join('; ') })
      return
    }

    if (marginAnalysis.warnings.length > 0 && marginAnalysis.totalMargin < 5) {
      toastError('Margen muy bajo. Revisa los precios antes de continuar.')
      setErrors({ margin: marginAnalysis.warnings.join('; ') })
      return
    }

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

      // Crear cotización con optimistic update
      const tempQuoteId = `temp-${Date.now()}`
      const optimisticQuote = {
        id: tempQuoteId,
        client_id: selectedClient.id,
        vendor_id: user.id,
        status: 'draft' as const,
        total_price: total,
        created_at: new Date().toISOString(),
        updated_at: null,
        client_name: selectedClient.name,
        clients: { name: selectedClient.name },
      }

      let createdQuoteId: string | null = null

      await optimisticCreate({
        swrKey: 'quotes',
        optimisticUpdate: (current: Quote[] | undefined) => {
          // Agregar la cotización optimista al inicio de la lista
          return current ? [optimisticQuote, ...current] : [optimisticQuote]
        },
        mutateFn: async () => {
          // Crear la cotización real
          const { data: quote, error } = await supabase
            .from('quotes')
            .insert({
              client_id: selectedClient.id,
              vendor_id: user.id,
              status: 'draft',
              total_price: total,
            })
            .select(`
              id,
              total_price,
              status,
              created_at,
              updated_at,
              clients (
                name
              )
            `)
            .single()

          if (error) throw error
          createdQuoteId = quote.id

          // Crear servicios de la cotización
          const quoteServicesData = quoteServices.map((qs) => ({
            quote_id: quote.id,
            service_id: qs.service_id,
            quantity: qs.quantity,
            final_price: qs.final_price,
          }))

          const { error: insertError } = await supabase
            .from('quote_services')
            .insert(quoteServicesData)

          if (insertError) throw insertError

          // Crear audit log
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

          // Crear notificaciones
          try {
            // Notificar al vendedor
            await createNotification({
              userId: user.id,
              type: 'quote',
              title: 'Cotización creada',
              message: `Has creado una nueva cotización #${quote.id.slice(0, 8)}`,
              metadata: {
                quote_id: quote.id,
                link: `/dashboard/quotes/${quote.id}`,
              },
            })

            // Notificar al cliente si existe
            if (selectedClient?.id) {
              await createNotification({
                userId: selectedClient.id,
                type: 'quote',
                title: 'Nueva cotización recibida',
                message: `Has recibido una nueva cotización`,
                metadata: {
                  quote_id: quote.id,
                  link: `/dashboard/quotes/${quote.id}`,
                },
              })
            }
          } catch (notificationError) {
            // No fallar si hay error en notificaciones
            logger.warn('NewQuotePage', 'Error creating notifications', {
              error: notificationError instanceof Error ? notificationError.message : String(notificationError),
              quoteId: quote.id,
            })
          }

          // Revalidar el cache para obtener todas las quotes actualizadas
          await refreshQuotes()
          await refreshInfiniteQuotes()

          // Retornar array con la cotización creada (cast seguro)
          return quote ? [quote as unknown as Quote] : []
        },
        successMessage: 'Cotización guardada como borrador exitosamente',
        errorMessage: 'Error al guardar la cotización',
        rollback: (current: Quote[] | undefined) => {
          // Remover la cotización optimista en caso de error
          return current?.filter((q: Quote) => q.id !== tempQuoteId) || current
        },
      })
      
      logger.info('NewQuotePage', 'Quote created successfully', { quoteId: createdQuoteId })
      
      // Limpiar borrador antes de redirigir
      clearDraft()
      
      // Redirigir a la cotización creada
      if (createdQuoteId) {
        router.push(`/dashboard/quotes/${createdQuoteId}`)
      } else {
        router.push('/dashboard/quotes')
      }
    } catch (err) {
      // El error ya se maneja en useOptimisticMutation
      logger.error('NewQuotePage', 'Unexpected error saving quote', err instanceof Error ? err : new Error(String(err)))
      // El error ya se muestra en el toast del optimistic update
      setLoading(false)
    } finally {
      setLoading(false)
    }
  }

  const selectedService = useCallback((serviceId: string) => {
    return services.find((s) => s.id === serviceId)
  }, [services])

  return (
    <div className="space-y-8 p-6 lg:p-8">
      <PageHeader
        title="Nueva Cotización"
        description="Crea una nueva cotización para tu cliente"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Cotizaciones', href: '/dashboard/quotes' },
          { label: 'Nueva' },
        ]}
      />

      {/* Premium Step Indicator */}
      <Card variant="elevated" className="overflow-hidden">
        <CardContent className="p-6">
          <ProgressIndicator
            steps={[
              { id: 'client', label: 'Cliente', completed: step > 1, current: step === 1 },
              { id: 'services', label: 'Servicios', completed: step > 2, current: step === 2 },
            ]}
            currentStep={step - 1}
          />
          {hasDraft() && (
            <div className="mt-4 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
              <p className="text-sm text-amber-700 dark:text-amber-300 flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Tienes un borrador guardado automáticamente
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Error messages */}
      {Object.keys(errors).length > 0 && (
        <Card variant="elevated" className="border-2 border-red-200 dark:border-red-800 overflow-hidden">
          <CardContent className="p-6 bg-red-50 dark:bg-red-950/30">
            <p className="text-sm font-semibold text-red-800 dark:text-red-200 mb-3">Errores en el formulario:</p>
            <ul className="list-disc list-inside space-y-1">
              {Object.values(errors).map((error, idx) => (
                <li key={idx} className="text-sm text-red-700 dark:text-red-300">{error}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {step === 1 && (
        <Card variant="elevated" className="overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b border-gray-200/60 dark:border-gray-800/60">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">Seleccionar Cliente</CardTitle>
                <CardDescription className="mt-1">Busca y selecciona el cliente para esta cotización</CardDescription>
              </div>
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shadow-lg">
                <User className="h-5 w-5 text-white" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <SearchInput
              placeholder="Buscar cliente por nombre..."
              value={searchClient}
              onChange={(e) => setSearchClient(e.target.value)}
              onClear={() => setSearchClient('')}
            />
            {clients.length > 0 && (
              <div className="space-y-2">
                {clients.map((client) => (
                  <button
                    key={client.id}
                    onClick={() => {
                      setSelectedClient(client)
                      setStep(2)
                      setErrors({})
                    }}
                    className="w-full text-left p-4 rounded-xl border border-gray-200/60 dark:border-gray-800/60 hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-gradient-to-r hover:from-indigo-50/50 hover:to-violet-50/50 dark:hover:from-indigo-950/20 dark:hover:to-violet-950/20 transition-all duration-200 group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-950/30 dark:to-violet-950/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                        <User className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 dark:text-white">{client.name}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{client.email}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
            {selectedClient && (
              <Card variant="outlined" className="border-2 border-indigo-200 dark:border-indigo-800">
                <CardContent className="p-4 bg-gradient-to-r from-indigo-50 to-violet-50 dark:from-indigo-950/30 dark:to-violet-950/30">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shadow-md">
                      <CheckCircle2 className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Cliente seleccionado:</p>
                      <p className="font-semibold text-gray-900 dark:text-white">{selectedClient.name}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <div className="space-y-6">
          <Card variant="elevated" className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border-b border-gray-200/60 dark:border-gray-800/60">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">Agregar Servicios</CardTitle>
                  <CardDescription className="mt-1">Selecciona los servicios para esta cotización</CardDescription>
                </div>
                <Button
                  onClick={addService}
                  variant="premium"
                  size="sm"
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Agregar Servicio
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {quoteServices.length === 0 ? (
                <div className="text-center py-12">
                  <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 dark:bg-gray-800 mb-4">
                    <ShoppingCart className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                  </div>
                  <p className="text-gray-500 dark:text-gray-400 font-medium mb-2">
                    No hay servicios agregados
                  </p>
                  <p className="text-sm text-gray-400 dark:text-gray-500 mb-4">
                    Haz clic en &quot;Agregar Servicio&quot; para comenzar
                  </p>
                  <Button onClick={addService} variant="premium" className="gap-2">
                    <Plus className="h-4 w-4" />
                    Agregar Primer Servicio
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {quoteServices.map((qs, index) => {
                    const service = selectedService(qs.service_id)
                    return (
                      <Card key={index} variant="outlined" className="border-2 border-gray-200/60 dark:border-gray-800/60">
                        <CardContent className="p-5 space-y-4">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <Select
                                value={qs.service_id}
                                onValueChange={(value: string) => {
                                  const newService = services.find((s) => s.id === value)
                                  if (newService) {
                                    updateService(index, 'service_id', value)
                                    updateService(index, 'final_price', newService.base_price)
                                  }
                                }}
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Selecciona un servicio" />
                                </SelectTrigger>
                                <SelectContent>
                                  {services.map((s) => (
                                    <SelectItem key={s.id} value={s.id}>
                                      {s.name} - {new Intl.NumberFormat('es-MX', {
                                        style: 'currency',
                                        currency: 'MXN',
                                      }).format(s.base_price)}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeService(index)}
                              className="ml-4 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <Input
                              type="number"
                              min="1"
                              label="Cantidad"
                              value={qs.quantity.toString()}
                              onChange={(e) =>
                                updateService(index, 'quantity', parseInt(e.target.value) || 1)
                              }
                            />
                            <div>
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                label={`Precio (Base: ${new Intl.NumberFormat('es-MX', {
                                  style: 'currency',
                                  currency: 'MXN',
                                }).format(service?.base_price || 0)})`}
                                icon={<DollarSign className="h-4 w-4" />}
                                value={qs.final_price.toString()}
                                onChange={(e) =>
                                  updateService(index, 'final_price', parseFloat(e.target.value) || 0)
                                }
                              />
                            </div>
                          </div>
                          <div className="pt-3 border-t border-gray-200 dark:border-gray-800">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Subtotal:</span>
                              <span className="text-lg font-bold text-gray-900 dark:text-white">
                                {new Intl.NumberFormat('es-MX', {
                                  style: 'currency',
                                  currency: 'MXN',
                                  minimumFractionDigits: 2,
                                }).format(qs.final_price * qs.quantity)}
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Premium Total Summary */}
          <Card variant="elevated" className="overflow-hidden border-2 border-indigo-200 dark:border-indigo-800">
            <CardHeader className="bg-gradient-to-r from-indigo-50 to-violet-50 dark:from-indigo-950/30 dark:to-violet-950/30 border-b border-gray-200/60 dark:border-gray-800/60">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">Resumen</CardTitle>
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shadow-lg">
                  <DollarSign className="h-5 w-5 text-white" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-gray-900 dark:text-white">Total:</span>
                <span className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                  {new Intl.NumberFormat('es-MX', {
                    style: 'currency',
                    currency: 'MXN',
                    minimumFractionDigits: 2,
                  }).format(total)}
                </span>
              </div>

              {/* Análisis de Margen */}
              {marginAnalysis.totalCost > 0 && (
                <div className="pt-4 border-t border-gray-200 dark:border-gray-800 space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Costo Total:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {new Intl.NumberFormat('es-MX', {
                        style: 'currency',
                        currency: 'MXN',
                        minimumFractionDigits: 2,
                      }).format(marginAnalysis.totalCost)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Utilidad:</span>
                    <span className={cn(
                      "font-medium flex items-center gap-1",
                      marginAnalysis.totalMargin >= 20 
                        ? "text-green-600 dark:text-green-400"
                        : marginAnalysis.totalMargin >= 10
                        ? "text-amber-600 dark:text-amber-400"
                        : marginAnalysis.totalMargin >= 0
                        ? "text-orange-600 dark:text-orange-400"
                        : "text-red-600 dark:text-red-400"
                    )}>
                      {marginAnalysis.totalMargin >= 0 ? (
                        <TrendingUp className="h-4 w-4" />
                      ) : (
                        <TrendingDown className="h-4 w-4" />
                      )}
                      {marginAnalysis.totalMargin.toFixed(1)}%
                    </span>
                  </div>
                  
                  {/* Alertas de margen */}
                  {marginAnalysis.errors.length > 0 && (
                    <div className="mt-3 p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-red-900 dark:text-red-200 mb-1">
                            ⚠️ Advertencias de Pérdida
                          </p>
                          <ul className="text-xs text-red-700 dark:text-red-300 space-y-1">
                            {marginAnalysis.errors.map((error, idx) => (
                              <li key={idx}>• {error}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {marginAnalysis.warnings.length > 0 && marginAnalysis.errors.length === 0 && (
                    <div className="mt-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-amber-900 dark:text-amber-200 mb-1">
                            ⚠️ Márgenes Bajos
                          </p>
                          <ul className="text-xs text-amber-700 dark:text-amber-300 space-y-1">
                            {marginAnalysis.warnings.map((warning, idx) => (
                              <li key={idx}>• {warning}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Premium Actions */}
          <div className="flex justify-between gap-4">
            <Link href="/dashboard/quotes">
              <Button variant="outline" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Cancelar
              </Button>
            </Link>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setStep(1)
                  setErrors({})
                }}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Atrás
              </Button>
              <Button
                onClick={saveDraft}
                disabled={loading || quoteServices.length === 0}
                variant="premium"
                size="lg"
                isLoading={loading}
                className="gap-2 shadow-lg hover:shadow-xl"
              >
                <Sparkles className="h-5 w-5" />
                Guardar Borrador
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
