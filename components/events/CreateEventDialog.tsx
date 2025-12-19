'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useToast } from '@/lib/hooks'
import { logger } from '@/lib/utils/logger'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import SearchInput from '@/components/ui/SearchInput'
import Badge from '@/components/ui/Badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/Dialog'
import { X, Plus, Trash2, Calendar, Clock, User, ShoppingCart } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface Client {
  id: string
  name: string
  email: string | null
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

interface CreateEventDialogProps {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
}

export default function CreateEventDialog({ open, onClose, onSuccess }: CreateEventDialogProps) {
  const [loading, setLoading] = useState(false)
  const [clients, setClients] = useState<Client[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [searchClient, setSearchClient] = useState('')
  const [quoteServices, setQuoteServices] = useState<QuoteService[]>([])
  const [selectedServiceId, setSelectedServiceId] = useState<string>('')
  const [eventDate, setEventDate] = useState('')
  const [eventTime, setEventTime] = useState('')
  const [eventEndDate, setEventEndDate] = useState('')
  const [eventEndTime, setEventEndTime] = useState('')
  const [notes, setNotes] = useState('')
  const [showNewClientForm, setShowNewClientForm] = useState(false)
  const [newClientName, setNewClientName] = useState('')
  const [newClientEmail, setNewClientEmail] = useState('')
  const [newClientPhone, setNewClientPhone] = useState('')
  const [creatingClient, setCreatingClient] = useState(false)
  const [showNewServiceForm, setShowNewServiceForm] = useState(false)
  const [newServiceName, setNewServiceName] = useState('')
  const [newServicePrice, setNewServicePrice] = useState('')
  const [creatingService, setCreatingService] = useState(false)
  const [customTotal, setCustomTotal] = useState<number | null>(null)

  const supabase = createClient()
  const { success: toastSuccess, error: toastError } = useToast()

  useEffect(() => {
    if (open) {
      loadServices()
      loadClients()
      // Establecer fecha y hora por defecto (hoy, hora actual + 1 hora)
      const now = new Date()
      now.setHours(now.getHours() + 1)
      setEventDate(format(now, 'yyyy-MM-dd'))
      setEventTime(format(now, 'HH:mm'))
    }
  }, [open])

  const loadServices = async () => {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('id, name, base_price')
        .order('name', { ascending: true })

      if (error) throw error
      setServices(data || [])
    } catch (error) {
      logger.error('CreateEventDialog', 'Error loading services', error instanceof Error ? error : new Error(String(error)))
      toastError('Error al cargar los servicios')
    }
  }

  const loadClients = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('clients')
        .select('id, name, email')
        .order('name', { ascending: true })
        .limit(50)

      if (error) throw error
      setClients(data || [])
    } catch (error) {
      logger.error('CreateEventDialog', 'Error loading clients', error instanceof Error ? error : new Error(String(error)))
    }
  }

  const filteredClients = useMemo(() => {
    if (!searchClient) return clients.slice(0, 10)
    return clients
      .filter(c => c.name.toLowerCase().includes(searchClient.toLowerCase()))
      .slice(0, 10)
  }, [clients, searchClient])

  const addService = () => {
    if (!selectedServiceId) return

    const service = services.find(s => s.id === selectedServiceId)
    if (!service) return

    const existingIndex = quoteServices.findIndex(qs => qs.service_id === selectedServiceId)
    if (existingIndex >= 0) {
      // Incrementar cantidad
      const updated = [...quoteServices]
      updated[existingIndex].quantity += 1
      updated[existingIndex].final_price = updated[existingIndex].quantity * service.base_price
      setQuoteServices(updated)
    } else {
      // Agregar nuevo servicio
      setQuoteServices([
        ...quoteServices,
        {
          service_id: selectedServiceId,
          quantity: 1,
          final_price: service.base_price,
          service,
        },
      ])
    }
    setSelectedServiceId('')
  }

  const removeService = (index: number) => {
    setQuoteServices(quoteServices.filter((_, i) => i !== index))
  }

  const updateServiceQuantity = (index: number, quantity: number) => {
    if (quantity < 1) return
    const updated = [...quoteServices]
    updated[index].quantity = quantity
    const service = services.find(s => s.id === updated[index].service_id)
    if (service) {
      updated[index].final_price = quantity * service.base_price
    }
    setQuoteServices(updated)
  }

  const total = useMemo(() => {
    if (customTotal !== null) return customTotal
    return quoteServices.reduce((sum, qs) => sum + qs.final_price, 0)
  }, [quoteServices, customTotal])

  const handleCreateClient = async () => {
    if (!newClientName.trim()) {
      toastError('El nombre del cliente es requerido')
      return
    }

    try {
      setCreatingClient(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toastError('No estás autenticado')
        return
      }

      const { data: client, error } = await supabase
        .from('clients')
        .insert({
          name: newClientName.trim(),
          email: newClientEmail.trim() || null,
          phone: newClientPhone.trim() || null,
          created_by: user.id,
        })
        .select()
        .single()

      if (error) throw error

      setSelectedClient(client)
      setShowNewClientForm(false)
      setNewClientName('')
      setNewClientEmail('')
      setNewClientPhone('')
      setSearchClient('')
      loadClients() // Recargar lista de clientes
      toastSuccess('Cliente creado exitosamente')
    } catch (error) {
      logger.error('CreateEventDialog', 'Error creating client', error instanceof Error ? error : new Error(String(error)))
      toastError('Error al crear el cliente: ' + (error instanceof Error ? error.message : String(error)))
    } finally {
      setCreatingClient(false)
    }
  }

  const handleCreateService = async () => {
    if (!newServiceName.trim()) {
      toastError('El nombre del servicio es requerido')
      return
    }
    const price = parseFloat(newServicePrice)
    if (isNaN(price) || price <= 0) {
      toastError('El precio debe ser un número mayor a 0')
      return
    }

    try {
      setCreatingService(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toastError('No estás autenticado')
        return
      }

      // Verificar si el usuario es admin
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle()

      if (profile?.role !== 'admin') {
        toastError('Solo los administradores pueden crear servicios')
        return
      }

      const { data: service, error } = await supabase
        .from('services')
        .insert({
          name: newServiceName.trim(),
          base_price: price,
          cost_price: price * 0.7, // Estimar costo como 70% del precio base
        })
        .select()
        .single()

      if (error) throw error

      setServices([...services, service])
      setSelectedServiceId(service.id)
      setShowNewServiceForm(false)
      setNewServiceName('')
      setNewServicePrice('')
      toastSuccess('Servicio creado exitosamente')
    } catch (error) {
      logger.error('CreateEventDialog', 'Error creating service', error instanceof Error ? error : new Error(String(error)))
      toastError('Error al crear el servicio: ' + (error instanceof Error ? error.message : String(error)))
    } finally {
      setCreatingService(false)
    }
  }

  const handleSubmit = async () => {
    if (!selectedClient) {
      toastError('Debes seleccionar un cliente')
      return
    }
    if (quoteServices.length === 0) {
      toastError('Debes agregar al menos un servicio')
      return
    }
    if (!eventDate || !eventTime) {
      toastError('Debes seleccionar fecha y hora del evento')
      return
    }

    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toastError('No estás autenticado')
        return
      }

      // Crear fecha/hora combinada
      const startDateTime = new Date(`${eventDate}T${eventTime}`)
      const endDateTime = eventEndDate && eventEndTime 
        ? new Date(`${eventEndDate}T${eventEndTime}`)
        : null

      // 1. Crear cotización
      const finalTotal = customTotal !== null ? customTotal : total
      const { data: quote, error: quoteError } = await supabase
        .from('quotes')
        .insert({
          client_id: selectedClient.id,
          vendor_id: user.id,
          status: 'confirmed',
          total_amount: finalTotal,
          event_date: eventDate,
          notes: notes || null,
        })
        .select()
        .single()

      if (quoteError) throw quoteError

      // 2. Crear servicios de la cotización
      const quoteServicesData = quoteServices.map((qs) => ({
        quote_id: quote.id,
        service_id: qs.service_id,
        quantity: qs.quantity,
        final_price: qs.final_price,
      }))

      const { error: servicesError } = await supabase
        .from('quote_services')
        .insert(quoteServicesData)

      if (servicesError) throw servicesError

      // 3. Crear evento
      const { error: eventError } = await supabase
        .from('events')
        .insert({
          quote_id: quote.id,
          start_date: startDateTime.toISOString(),
          end_date: endDateTime ? endDateTime.toISOString() : null,
          status: 'confirmed',
        })

      if (eventError) throw eventError

      toastSuccess('Evento creado exitosamente')
      
      // Resetear formulario
      setSelectedClient(null)
      setQuoteServices([])
      setEventDate('')
      setEventTime('')
      setEventEndDate('')
      setEventEndTime('')
      setNotes('')
      setSearchClient('')
      setCustomTotal(null)
      setShowNewClientForm(false)
      setShowNewServiceForm(false)

      onSuccess?.()
      onClose()
    } catch (error) {
      logger.error('CreateEventDialog', 'Error creating event', error instanceof Error ? error : new Error(String(error)))
      toastError('Error al crear el evento: ' + (error instanceof Error ? error.message : String(error)))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <Calendar className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            Crear Nuevo Evento
          </DialogTitle>
          <DialogDescription>
            Selecciona el cliente, servicios, fecha y hora para crear un evento y cotización
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Selección de Cliente */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5" />
                Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!showNewClientForm ? (
                <>
                  <div className="flex gap-2">
                    <SearchInput
                      placeholder="Buscar cliente..."
                      value={searchClient}
                      onChange={(e) => setSearchClient(e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowNewClientForm(true)}
                      className="gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Nuevo Cliente
                    </Button>
                  </div>
                  {selectedClient ? (
                <div className="flex items-center justify-between p-4 rounded-xl bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-800">
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">{selectedClient.name}</p>
                    {selectedClient.email && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">{selectedClient.email}</p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedClient(null)
                      setSearchClient('')
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {filteredClients.map((client) => (
                    <button
                      key={client.id}
                      onClick={() => {
                        setSelectedClient(client)
                        setSearchClient('')
                      }}
                      className="w-full text-left p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                      <p className="font-medium text-gray-900 dark:text-white">{client.name}</p>
                      {client.email && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">{client.email}</p>
                      )}
                    </button>
                  ))}
                  {filteredClients.length === 0 && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                      No se encontraron clientes
                    </p>
                  )}
                </div>
                  )}
                </>
              ) : (
                <div className="space-y-4 p-4 rounded-xl bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-800">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-gray-900 dark:text-white">Crear Nuevo Cliente</h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setShowNewClientForm(false)
                        setNewClientName('')
                        setNewClientEmail('')
                        setNewClientPhone('')
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <Input
                    placeholder="Nombre del cliente *"
                    value={newClientName}
                    onChange={(e) => setNewClientName(e.target.value)}
                    required
                  />
                  <Input
                    type="email"
                    placeholder="Email (opcional)"
                    value={newClientEmail}
                    onChange={(e) => setNewClientEmail(e.target.value)}
                  />
                  <Input
                    type="tel"
                    placeholder="Teléfono (opcional)"
                    value={newClientPhone}
                    onChange={(e) => setNewClientPhone(e.target.value)}
                  />
                  <Button
                    onClick={handleCreateClient}
                    disabled={creatingClient || !newClientName.trim()}
                    className="w-full"
                  >
                    {creatingClient ? 'Creando...' : 'Crear Cliente'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Servicios */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Servicios
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!showNewServiceForm ? (
                <div className="flex gap-2">
                  <Select value={selectedServiceId} onValueChange={setSelectedServiceId}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Seleccionar servicio" />
                    </SelectTrigger>
                    <SelectContent>
                      {services.map((service) => (
                        <SelectItem key={service.id} value={service.id}>
                          {service.name} - {new Intl.NumberFormat('es-MX', {
                            style: 'currency',
                            currency: 'MXN',
                          }).format(service.base_price)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button onClick={addService} disabled={!selectedServiceId}>
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowNewServiceForm(true)}
                    className="gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Nuevo
                  </Button>
                </div>
              ) : (
                <div className="space-y-4 p-4 rounded-xl bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-800">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-gray-900 dark:text-white">Crear Nuevo Servicio</h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setShowNewServiceForm(false)
                        setNewServiceName('')
                        setNewServicePrice('')
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <Input
                    placeholder="Nombre del servicio *"
                    value={newServiceName}
                    onChange={(e) => setNewServiceName(e.target.value)}
                    required
                  />
                  <Input
                    type="number"
                    placeholder="Precio base (MXN) *"
                    value={newServicePrice}
                    onChange={(e) => setNewServicePrice(e.target.value)}
                    min="0"
                    step="0.01"
                    required
                  />
                  <Button
                    onClick={handleCreateService}
                    disabled={creatingService || !newServiceName.trim() || !newServicePrice}
                    className="w-full"
                  >
                    {creatingService ? 'Creando...' : 'Crear Servicio'}
                  </Button>
                </div>
              )}

              {quoteServices.length > 0 && (
                <div className="space-y-2">
                  {quoteServices.map((qs, index) => {
                    const service = services.find(s => s.id === qs.service_id)
                    return (
                      <div
                        key={index}
                        className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                      >
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {service?.name || 'Servicio desconocido'}
                          </p>
                          <div className="flex items-center gap-4 mt-2">
                            <div className="flex items-center gap-2">
                              <label className="text-sm text-gray-600 dark:text-gray-400">Cantidad:</label>
                              <Input
                                type="number"
                                min="1"
                                value={qs.quantity}
                                onChange={(e) => updateServiceQuantity(index, parseInt(e.target.value) || 1)}
                                className="w-20"
                              />
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Precio unitario: {new Intl.NumberFormat('es-MX', {
                                style: 'currency',
                                currency: 'MXN',
                              }).format(service?.base_price || 0)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <p className="font-bold text-lg text-gray-900 dark:text-white">
                            {new Intl.NumberFormat('es-MX', {
                              style: 'currency',
                              currency: 'MXN',
                            }).format(qs.final_price)}
                          </p>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeService(index)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                  <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="text-right space-y-2">
                      <div className="flex items-center gap-2">
                        <p className="text-sm text-gray-600 dark:text-gray-400">Total:</p>
                        <Input
                          type="number"
                          value={customTotal !== null ? customTotal : total}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value)
                            setCustomTotal(isNaN(value) ? null : value)
                          }}
                          className="w-32 text-right font-bold"
                          min="0"
                          step="0.01"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setCustomTotal(null)}
                          title="Usar total calculado"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      {customTotal !== null && customTotal !== total && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Calculado: {new Intl.NumberFormat('es-MX', {
                            style: 'currency',
                            currency: 'MXN',
                          }).format(total)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Fecha y Hora */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Fecha y Hora del Evento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Fecha de Inicio *
                  </label>
                  <Input
                    type="date"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Hora de Inicio *
                  </label>
                  <Input
                    type="time"
                    value={eventTime}
                    onChange={(e) => setEventTime(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Fecha de Fin (opcional)
                  </label>
                  <Input
                    type="date"
                    value={eventEndDate}
                    onChange={(e) => setEventEndDate(e.target.value)}
                    min={eventDate}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Hora de Fin (opcional)
                  </label>
                  <Input
                    type="time"
                    value={eventEndTime}
                    onChange={(e) => setEventEndTime(e.target.value)}
                    disabled={!eventEndDate}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notas */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Notas Adicionales</CardTitle>
            </CardHeader>
            <CardContent>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Agregar notas sobre el evento..."
                className="w-full min-h-[100px] px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </CardContent>
          </Card>

          {/* Botones de Acción */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button variant="ghost" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loading || !selectedClient || quoteServices.length === 0 || !eventDate || !eventTime}
              className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700"
            >
              {loading ? 'Creando...' : 'Crear Evento y Cotización'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}


