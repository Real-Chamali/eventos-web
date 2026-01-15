'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
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
import { X, Plus, Trash2, Calendar, Clock, User, ShoppingCart, AlertTriangle, CheckCircle2, Sparkles } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { cn } from '@/lib/utils/cn'

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
  const [location, setLocation] = useState('')
  const [guestCount, setGuestCount] = useState<number | ''>('')
  const [eventType, setEventType] = useState('')
  const [emergencyContact, setEmergencyContact] = useState('')
  const [emergencyPhone, setEmergencyPhone] = useState('')
  const [specialRequirements, setSpecialRequirements] = useState('')
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
  const [dateConflicts, setDateConflicts] = useState<Array<{ eventId: string; quoteId: string; startDate: string; endDate: string; status: string; clientName: string }>>([])
  const [checkingConflicts, setCheckingConflicts] = useState(false)

  const supabase = createClient()
  const { success: toastSuccess, error: toastError } = useToast()

  // Verificar conflictos cuando cambian las fechas
  useEffect(() => {
    if (eventDate && open) {
      const checkConflicts = async () => {
        setCheckingConflicts(true)
        try {
          const { checkDateConflicts } = await import('@/lib/utils/calendarIntelligence')
          const endDate = eventEndDate || eventDate
          const conflicts = await checkDateConflicts(eventDate, endDate)
          setDateConflicts(conflicts)
        } catch (error) {
          logger.error('CreateEventDialog', 'Error checking conflicts', error instanceof Error ? error : new Error(String(error)))
        } finally {
          setCheckingConflicts(false)
        }
      }
      
      const timeoutId = setTimeout(checkConflicts, 500) // Debounce
      return () => clearTimeout(timeoutId)
    } else {
      setDateConflicts([])
    }
  }, [eventDate, eventEndDate, open])

  const loadServices = useCallback(async () => {
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
  }, [supabase, toastError])

  const loadClients = useCallback(async () => {
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
  }, [supabase])

  useEffect(() => {
    if (open) {
      loadServices()
      loadClients()
      // Establecer fecha y hora por defecto (hoy, hora actual + 1 hora)
      const now = new Date()
      now.setHours(now.getHours() + 1)
      setEventDate(format(now, 'yyyy-MM-dd'))
      setEventTime(format(now, 'HH:mm'))
      setDateConflicts([])
    }
  }, [open, loadClients, loadServices])

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

      // Validar conflictos de fechas antes de crear (permitir continuar si hay errores)
      try {
        const { canCreateEvent } = await import('@/lib/utils/calendarIntelligence')
        const validation = await canCreateEvent(
          eventDate,
          endDateTime ? format(endDateTime, 'yyyy-MM-dd') : eventDate
        )
        
        if (!validation.canCreate) {
          toastError(validation.message || 'No se puede crear el evento debido a conflictos de fechas')
          setLoading(false)
          return
        }
        
        if (validation.conflicts.length > 0) {
          // Mostrar advertencia pero permitir continuar
          logger.warn('CreateEventDialog', 'Date conflicts detected', {
            conflicts: validation.conflicts,
            startDate: eventDate,
            endDate: endDateTime ? format(endDateTime, 'yyyy-MM-dd') : eventDate,
          })
        }
      } catch (conflictError) {
        // Si hay error al verificar conflictos, permitir continuar pero loguear
        logger.warn('CreateEventDialog', 'Error checking conflicts, allowing event creation', {
          error: conflictError instanceof Error ? conflictError.message : String(conflictError),
        })
      }

      // 1. Crear cotización AUTOMÁTICAMENTE al crear evento
      // Esto asegura que cada evento tenga una cotización asociada
      const finalTotal = customTotal !== null ? customTotal : total
      
      // Mapear status del frontend a la base de datos
      const { mapQuoteStatusToDB } = await import('@/lib/utils/statusMapper')
      const dbStatus = mapQuoteStatusToDB('confirmed') // 'confirmed' -> 'APPROVED'
      
      const { data: quote, error: quoteError } = await supabase
        .from('quotes')
        .insert({
          client_id: selectedClient.id,
          vendor_id: user.id,
          status: dbStatus,
          total_amount: finalTotal,
          event_date: eventDate,
          notes: notes || null,
        })
        .select()
        .single()

      if (quoteError) {
        logger.error('CreateEventDialog', 'Error creating quote for event', quoteError as Error, {
          clientId: selectedClient.id,
          total: finalTotal,
        })
        throw quoteError
      }
      
      // Verificar que la cotización se creó correctamente
      if (!quote || !quote.id) {
        throw new Error('Error: La cotización no se creó correctamente')
      }

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

      // 3. Crear evento con todos los detalles
      // Mapear status del frontend a la base de datos
      const { mapEventStatusToDB } = await import('@/lib/utils/statusMapper')
      const eventDbStatus = mapEventStatusToDB('confirmed') // 'confirmed' -> 'CONFIRMED'
      
      const eventData: Record<string, unknown> = {
        quote_id: quote.id,
        start_date: format(startDateTime, 'yyyy-MM-dd'),
        end_date: endDateTime ? format(endDateTime, 'yyyy-MM-dd') : null,
        start_time: eventTime || null,
        end_time: eventEndTime || null,
        status: eventDbStatus,
      }
      
      // Agregar campos opcionales si tienen valor
      if (location) eventData.location = location
      if (guestCount && typeof guestCount === 'number') eventData.guest_count = guestCount
      if (eventType) eventData.event_type = eventType
      if (emergencyContact) eventData.emergency_contact = emergencyContact
      if (emergencyPhone) eventData.emergency_phone = emergencyPhone
      if (specialRequirements) eventData.special_requirements = specialRequirements
      if (notes) eventData.additional_notes = notes
      
      const { data: event, error: eventError } = await supabase
        .from('events')
        .insert(eventData)
        .select()
        .single()

      if (eventError) throw eventError

      // 4. Crear notificaciones
      if (event) {
        try {
          const { createNotification } = await import('@/lib/utils/notifications')
          
          // Notificar al vendedor
          await createNotification({
            userId: user.id,
            type: 'event',
            title: 'Evento creado',
            message: `Has creado un nuevo evento para ${selectedClient.name}`,
            metadata: {
              event_id: event.id,
              quote_id: quote.id,
              link: `/dashboard/events/${event.id}`,
            },
          })

          // Notificar al cliente
          await createNotification({
            userId: selectedClient.id,
            type: 'event',
            title: 'Nuevo evento programado',
            message: `Se ha programado un nuevo evento para ti`,
            metadata: {
              event_id: event.id,
              quote_id: quote.id,
              link: `/dashboard/events/${event.id}`,
            },
          })
        } catch (notificationError) {
          // No fallar si hay error en notificaciones
          logger.warn('CreateEventDialog', 'Error creating notifications', {
            error: notificationError instanceof Error ? notificationError.message : String(notificationError),
            eventId: event?.id,
            quoteId: quote.id,
          })
        }
      }

      toastSuccess('Evento creado exitosamente')
      
      // Resetear formulario
      setSelectedClient(null)
      setQuoteServices([])
      setEventDate('')
      setEventTime('')
      setEventEndDate('')
      setEventEndTime('')
      setNotes('')
      setLocation('')
      setGuestCount('')
      setEventType('')
      setEmergencyContact('')
      setEmergencyPhone('')
      setSpecialRequirements('')
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
                    id="new-client-email"
                    name="newClientEmail"
                    type="email"
                    placeholder="Email (opcional)"
                    value={newClientEmail}
                    onChange={(e) => setNewClientEmail(e.target.value)}
                    autoComplete="email"
                  />
                  <Input
                    id="new-client-phone"
                    name="newClientPhone"
                    type="tel"
                    placeholder="Teléfono (opcional)"
                    value={newClientPhone}
                    onChange={(e) => setNewClientPhone(e.target.value)}
                    autoComplete="tel"
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
                    id="new-service-name"
                    name="newServiceName"
                    placeholder="Nombre del servicio *"
                    value={newServiceName}
                    onChange={(e) => setNewServiceName(e.target.value)}
                    required
                  />
                  <Input
                    id="new-service-price"
                    name="newServicePrice"
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

              {/* Alertas de Conflictos */}
              {checkingConflicts && (
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <div className="h-4 w-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                  Verificando disponibilidad...
                </div>
              )}

              {!checkingConflicts && dateConflicts.length > 0 && (
                <div className={cn(
                  "p-4 rounded-lg border",
                  dateConflicts.some(c => c.status === 'CONFIRMED')
                    ? "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900"
                    : "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900"
                )}>
                  <div className="flex items-start gap-2">
                    <AlertTriangle className={cn(
                      "h-5 w-5 mt-0.5 flex-shrink-0",
                      dateConflicts.some(c => c.status === 'CONFIRMED')
                        ? "text-red-600 dark:text-red-400"
                        : "text-amber-600 dark:text-amber-400"
                    )} />
                    <div className="flex-1">
                      <p className={cn(
                        "text-sm font-semibold mb-2",
                        dateConflicts.some(c => c.status === 'CONFIRMED')
                          ? "text-red-900 dark:text-red-200"
                          : "text-amber-900 dark:text-amber-200"
                      )}>
                        {dateConflicts.some(c => c.status === 'CONFIRMED')
                          ? '⚠️ No se puede crear el evento: hay eventos confirmados en estas fechas'
                          : `⚠️ Advertencia: hay ${dateConflicts.length} evento(s) en este rango de fechas`}
                      </p>
                      <div className="space-y-2">
                        {dateConflicts.map((conflict, idx) => (
                          <div key={idx} className="text-xs bg-white/50 dark:bg-gray-900/50 p-2 rounded">
                            <div className="flex items-center gap-2">
                              <Badge 
                                variant={conflict.status === 'CONFIRMED' ? 'error' : 'warning'} 
                                size="sm"
                              >
                                {conflict.status === 'CONFIRMED' ? 'Confirmado' : conflict.status}
                              </Badge>
                              <span className="font-medium">{conflict.clientName}</span>
                            </div>
                            <p className="text-gray-600 dark:text-gray-400 mt-1">
                              {format(new Date(conflict.startDate), "dd MMM yyyy", { locale: es })}
                              {conflict.endDate !== conflict.startDate && 
                                ` - ${format(new Date(conflict.endDate), "dd MMM yyyy", { locale: es })}`
                              }
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {!checkingConflicts && dateConflicts.length === 0 && eventDate && (
                <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                  <CheckCircle2 className="h-4 w-4" />
                  Fechas disponibles
                </div>
              )}
            </CardContent>
          </Card>

          {/* Detalles Adicionales del Evento */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Detalles Adicionales del Evento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Ubicación del Evento
                  </label>
                  <Input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Ej: Salón de eventos, dirección..."
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Número de Invitados
                  </label>
                  <Input
                    id="event-guest-count"
                    name="guestCount"
                    type="number"
                    value={guestCount}
                    onChange={(e) => setGuestCount(e.target.value ? parseInt(e.target.value) : '')}
                    placeholder="Ej: 50"
                    min="1"
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tipo de Evento
                  </label>
                  <Select value={eventType} onValueChange={setEventType}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Seleccionar tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="wedding">Boda</SelectItem>
                      <SelectItem value="birthday">Cumpleaños</SelectItem>
                      <SelectItem value="corporate">Corporativo</SelectItem>
                      <SelectItem value="anniversary">Aniversario</SelectItem>
                      <SelectItem value="graduation">Graduación</SelectItem>
                      <SelectItem value="baby_shower">Baby Shower</SelectItem>
                      <SelectItem value="quinceanera">Quinceañera</SelectItem>
                      <SelectItem value="other">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Contacto de Emergencia
                  </label>
                  <Input
                    id="event-emergency-contact"
                    name="emergencyContact"
                    type="text"
                    value={emergencyContact}
                    onChange={(e) => setEmergencyContact(e.target.value)}
                    placeholder="Nombre del contacto"
                    className="w-full"
                    autoComplete="name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Teléfono de Emergencia
                  </label>
                  <Input
                    id="event-emergency-phone"
                    name="emergencyPhone"
                    type="tel"
                    value={emergencyPhone}
                    onChange={(e) => setEmergencyPhone(e.target.value)}
                    placeholder="Ej: +52 123 456 7890"
                    className="w-full"
                    autoComplete="tel"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Requisitos Especiales
                </label>
                <textarea
                  id="event-special-requirements"
                  name="specialRequirements"
                  value={specialRequirements}
                  onChange={(e) => setSpecialRequirements(e.target.value)}
                  placeholder="Ej: Acceso para silla de ruedas, catering vegetariano, equipo de sonido especial..."
                  className="w-full min-h-[80px] px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Notas Adicionales
                </label>
                <textarea
                  id="event-notes"
                  name="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Agregar notas sobre el evento..."
                  className="w-full min-h-[100px] px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
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


