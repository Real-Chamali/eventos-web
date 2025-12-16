'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { CreateQuoteSchema } from '@/lib/validations/schemas'
import { useToast, useDebounce } from '@/lib/hooks'
import { logger } from '@/lib/utils/logger'
import { createAuditLog } from '@/lib/utils/audit'
import PageHeader from '@/components/ui/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import SearchInput from '@/components/ui/SearchInput'
import Badge from '@/components/ui/Badge'
import Skeleton from '@/components/ui/Skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/Table'
import { ArrowLeft, Plus, Trash2, Save } from 'lucide-react'
import Link from 'next/link'

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
  id?: string
  service_id: string
  quantity: number
  final_price: number
  service?: Service
}

interface Quote {
  id: string
  client_id: string
  total_price: number
  status: string
  quote_services?: Array<{
    id: string
    service_id: string
    quantity: number
    final_price: number
    service: {
      name: string
      base_price: number
    }
  }>
}

export default function EditQuotePage() {
  const params = useParams()
  const router = useRouter()
  const quoteId = params.id as string
  const [quote, setQuote] = useState<Quote | null>(null)
  const [clients, setClients] = useState<Client[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [searchClient, setSearchClient] = useState('')
  const [quoteServices, setQuoteServices] = useState<QuoteService[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const supabase = useMemo(() => createClient(), [])
  const { success: toastSuccess, error: toastError } = useToast()
  const debouncedSearchClient = useDebounce(searchClient, 300)

  useEffect(() => {
    loadQuote()
    loadServices()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quoteId])

  useEffect(() => {
    loadClients()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearchClient])

  const loadQuote = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('quotes')
        .select(`
          *,
          client:clients(*),
          quote_services(
            id,
            service_id,
            quantity,
            final_price,
            service:services(*)
          )
        `)
        .eq('id', quoteId)
        .single()

      if (error) {
        const errorMessage = error?.message || 'Error loading quote'
        toastError('Error al cargar la cotización: ' + errorMessage)
        logger.error('EditQuotePage', 'Error loading quote', new Error(errorMessage), {
          quoteId,
        })
        router.push('/dashboard/quotes')
        return
      }

      if (data.status !== 'draft') {
        toastError('Solo se pueden editar cotizaciones en estado borrador')
        router.push(`/dashboard/quotes/${quoteId}`)
        return
      }

      setQuote(data)
      setSelectedClient(data.client as Client)
      setQuoteServices(
        (data.quote_services || []).map((qs: any) => ({
          id: qs.id,
          service_id: qs.service_id,
          quantity: qs.quantity,
          final_price: qs.final_price,
          service: qs.service,
        }))
      )
    } catch (err) {
      logger.error('EditQuotePage', 'Unexpected error loading quote', err as Error)
      toastError('Error inesperado al cargar la cotización')
      router.push('/dashboard/quotes')
    } finally {
      setLoading(false)
    }
  }

  const loadServices = async () => {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('name')

      if (error && error.code !== 'PGRST106') {
        logger.error('EditQuotePage', 'Error loading services', new Error(error.message))
      } else if (data) {
        setServices(data)
      }
    } catch (err) {
      logger.error('EditQuotePage', 'Unexpected error loading services', err as Error)
    }
  }

  const loadClients = useCallback(async () => {
    try {
      let query = supabase.from('clients').select('*').order('name').limit(20)

      if (debouncedSearchClient) {
        query = query.ilike('name', `%${debouncedSearchClient}%`)
      }

      const { data, error } = await query

      if (error) {
        logger.error('EditQuotePage', 'Error loading clients', new Error(error.message))
      } else if (data) {
        setClients(data)
      }
    } catch (err) {
      logger.error('EditQuotePage', 'Unexpected error loading clients', err as Error)
    }
  }, [supabase, debouncedSearchClient])

  const addService = () => {
    if (services.length === 0) {
      toastError('No hay servicios disponibles')
      return
    }
    const firstService = services[0]
    setQuoteServices([
      ...quoteServices,
      {
        service_id: firstService.id,
        quantity: 1,
        final_price: firstService.base_price,
        service: firstService,
      },
    ])
  }

  const removeService = (index: number) => {
    setQuoteServices(quoteServices.filter((_, i) => i !== index))
  }

  const updateService = (index: number, field: keyof QuoteService, value: any) => {
    const updated = [...quoteServices]
    updated[index] = { ...updated[index], [field]: value }

    // Si cambió el servicio, actualizar el precio base
    if (field === 'service_id') {
      const service = services.find((s) => s.id === value)
      if (service) {
        updated[index].final_price = service.base_price
        updated[index].service = service
      }
    }

    setQuoteServices(updated)
  }

  const total = useMemo(() => {
    return quoteServices.reduce(
      (sum, qs) => sum + qs.quantity * qs.final_price,
      0
    )
  }, [quoteServices])

  const handleSave = async () => {
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

    const validationResult = CreateQuoteSchema.safeParse({
      client_id: selectedClient.id,
      services: quoteServices.map((qs) => ({
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
      return
    }

    setSaving(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        toastError('Usuario no autenticado')
        setSaving(false)
        return
      }

      // Actualizar cotización
      const { error: updateError } = await supabase
        .from('quotes')
        .update({
          client_id: selectedClient.id,
          total_price: total,
          updated_at: new Date().toISOString(),
        })
        .eq('id', quoteId)

      if (updateError) {
        toastError('Error al actualizar: ' + updateError.message)
        logger.error('EditQuotePage', 'Error updating quote', new Error(updateError.message))
        setSaving(false)
        return
      }

      // Eliminar servicios antiguos
      const { error: deleteError } = await supabase
        .from('quote_services')
        .delete()
        .eq('quote_id', quoteId)

      if (deleteError) {
        logger.error('EditQuotePage', 'Error deleting old services', new Error(deleteError.message))
      }

      // Insertar servicios nuevos
      const quoteServicesData = quoteServices.map((qs) => ({
        quote_id: quoteId,
        service_id: qs.service_id,
        quantity: qs.quantity,
        final_price: qs.final_price,
      }))

      const { error: insertError } = await supabase
        .from('quote_services')
        .insert(quoteServicesData)

      if (insertError) {
        toastError('Error al guardar los servicios: ' + insertError.message)
        logger.error('EditQuotePage', 'Error saving services', new Error(insertError.message))
        setSaving(false)
        return
      }

      await createAuditLog({
        user_id: user.id,
        action: 'UPDATE',
        table_name: 'quotes',
        old_values: quote,
        new_values: {
          id: quoteId,
          client_id: selectedClient.id,
          total_price: total,
          services_count: quoteServices.length,
        },
        metadata: {
          quote_id: quoteId,
        },
      })

      toastSuccess('Cotización actualizada correctamente')
      router.push(`/dashboard/quotes/${quoteId}`)
      router.refresh()
    } catch (err) {
      logger.error('EditQuotePage', 'Unexpected error saving quote', err as Error)
      toastError('Error inesperado al guardar')
      setSaving(false)
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

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Editar Cotización" />
        <Skeleton className="h-96" />
      </div>
    )
  }

  if (!quote) {
    return (
      <div className="space-y-6">
        <PageHeader title="Cotización no encontrada" />
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-red-600 dark:text-red-400 mb-4">
              La cotización solicitada no existe o no se puede editar.
            </p>
            <Link href="/dashboard/quotes">
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver a Cotizaciones
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Editar Cotización"
        description="Modifica los detalles de la cotización"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Cotizaciones', href: '/dashboard/quotes' },
          { label: 'Detalle', href: `/dashboard/quotes/${quoteId}` },
          { label: 'Editar' },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Client Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Cliente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <SearchInput
                  placeholder="Buscar cliente..."
                  value={searchClient}
                  onChange={(e) => setSearchClient(e.target.value)}
                />
              </div>
              <div>
                <Select
                  value={selectedClient?.id || ''}
                  onValueChange={(value) => {
                    const client = clients.find((c) => c.id === value)
                    setSelectedClient(client || null)
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name} {client.email && `(${client.email})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.client && (
                  <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">
                    {errors.client}
                  </p>
                )}
              </div>
              {selectedClient && (
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="font-medium text-gray-900 dark:text-white">
                    {selectedClient.name}
                  </p>
                  {selectedClient.email && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {selectedClient.email}
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Services */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Servicios</CardTitle>
                <Button variant="outline" size="sm" onClick={addService}>
                  <Plus className="mr-2 h-4 w-4" />
                  Agregar Servicio
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {errors.services && (
                <p className="mb-4 text-sm text-red-600 dark:text-red-400">{errors.services}</p>
              )}
              {quoteServices.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    No hay servicios agregados
                  </p>
                  <Button variant="outline" onClick={addService}>
                    <Plus className="mr-2 h-4 w-4" />
                    Agregar Primer Servicio
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Servicio</TableHead>
                      <TableHead className="w-24">Cantidad</TableHead>
                      <TableHead className="w-32">Precio Unit.</TableHead>
                      <TableHead className="w-32">Subtotal</TableHead>
                      <TableHead className="w-16"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {quoteServices.map((qs, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Select
                            value={qs.service_id}
                            onValueChange={(value) => updateService(index, 'service_id', value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {services.map((service) => (
                                <SelectItem key={service.id} value={service.id}>
                                  {service.name} - {formatCurrency(service.base_price)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="1"
                            value={qs.quantity}
                            onChange={(e) =>
                              updateService(index, 'quantity', parseInt(e.target.value) || 1)
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={qs.final_price}
                            onChange={(e) =>
                              updateService(index, 'final_price', parseFloat(e.target.value) || 0)
                            }
                          />
                        </TableCell>
                        <TableCell className="font-semibold">
                          {formatCurrency(qs.quantity * qs.final_price)}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeService(index)}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Resumen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Subtotal:</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {formatCurrency(total)}
                </span>
              </div>
              <div className="border-t border-gray-200 dark:border-gray-800 pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-900 dark:text-white">
                    Total:
                  </span>
                  <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {formatCurrency(total)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Status */}
          <Card>
            <CardHeader>
              <CardTitle>Estado</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant="warning">Borrador</Badge>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Esta cotización está en estado borrador y puede ser editada.
              </p>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex flex-col gap-2">
            <Button onClick={handleSave} disabled={saving} size="lg">
              <Save className="mr-2 h-4 w-4" />
              {saving ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
            <Link href={`/dashboard/quotes/${quoteId}`}>
              <Button variant="outline" className="w-full">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Cancelar
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

