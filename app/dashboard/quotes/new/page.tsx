'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation' // <--- AÑADIDO: useSearchParams
import { CreateQuoteSchema } from '@/lib/validations/schemas'
import { useToast } from '@/lib/hooks'
import { logger } from '@/lib/utils/logger'
import { useServices } from '@/lib/hooks/useServices'
import { CardSkeleton } from '@/components/Skeleton'

// --- Interfaces (sin cambios) ---
interface Client { id: string; name: string; email: string; }
interface QuoteService { service_id: string; quantity: number; final_price: number; }
// --- Fin de Interfaces ---

export default function NewQuotePage() {
  const { services, isLoading: isLoadingServices, error: servicesError } = useServices()
  const router = useRouter()
  const searchParams = useSearchParams() // <--- AÑADIDO: Para leer la URL
  const supabase = createClient()
  const { success: toastSuccess, error: toastError } = useToast()

  const [step, setStep] = useState(1)
  const [clients, setClients] = useState<Client[]>([])
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [searchClient, setSearchClient] = useState('')
  const [quoteServices, setQuoteServices] = useState<QuoteService[]>([])
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // MEJORADO: Leer la fecha de la URL y establecerla como valor inicial
  const [eventDate, setEventDate] = useState(searchParams.get('date') || '')

  useEffect(() => {
    if (servicesError) toastError('Error al cargar los servicios. Intenta recargar la página.')
  }, [servicesError, toastError])

  useEffect(() => {
    const handler = setTimeout(() => { if (searchClient.length > 2) searchClients() }, 300)
    return () => clearTimeout(handler)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchClient])

  const searchClients = useCallback(async () => {
    // ... (sin cambios)
    try {
      const { data, error } = await supabase.from('clients').select('*').ilike('name', `%${searchClient}%`).limit(10);
      if (error) throw error;
      setClients(data || []);
    } catch (err) { logger.error('NewQuotePage', 'Error searching clients', err as Error); toastError('Error al buscar clientes'); }
  }, [supabase, searchClient, toastError])

  const addService = () => {
    if (services.length > 0) setQuoteServices([...quoteServices, { service_id: services[0].id, quantity: 1, final_price: services[0].base_price }])
  }

  const updateService = (index: number, field: keyof QuoteService, value: any) => {
    const updated = [...quoteServices];
    updated[index] = { ...updated[index], [field]: value };
    setQuoteServices(updated);
  }

  const removeService = (index: number) => setQuoteServices(quoteServices.filter((_, i) => i !== index))
  
  const getTotal = () => quoteServices.reduce((sum, qs) => sum + (qs.final_price * qs.quantity), 0)

  const saveDraft = async () => {
    if (!selectedClient) { toastError('Por favor selecciona un cliente'); return; }

    const quoteData = {
      client_id: selectedClient.id,
      services: quoteServices.map(s => ({ ...s, quantity: Number(s.quantity), final_price: Number(s.final_price) })),
      total_price: getTotal(), // Aunque se recalcula en backend, lo enviamos para validación inicial
      event_date: eventDate || undefined,
    }

    const validation = CreateQuoteSchema.safeParse(quoteData)
    if (!validation.success) {
      toastError(validation.error.issues[0].message); return;
    }

    setLoading(true)
    try {
      const response = await fetch('/api/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validation.data),
      })

      if (!response.ok) {
        const errorData = await response.json(); throw new Error(errorData.error);
      }

      const newQuote = await response.json()
      toastSuccess('Cotización guardada como borrador')
      router.push(`/dashboard/quotes/${newQuote.id}`)
    } catch (err) { toastError(`Error: ${(err as Error).message}`) } 
    finally { setLoading(false) }
  }
  
  const selectedServiceDetails = (serviceId: string) => services.find((s) => s.id === serviceId)

  // --- RENDERIZADO con campo de fecha --- 
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Nueva Cotización</h1>
      {/* ... Stepper y errores ... */}
      {step === 1 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border">
          <h2 className="text-xl font-semibold mb-4">1. Seleccionar Cliente</h2>
          <input type="text" value={searchClient} onChange={e => setSearchClient(e.target.value)} placeholder="Buscar cliente..." className="w-full input" />
          {clients.map(c => <button key={c.id} onClick={() => { setSelectedClient(c); setStep(2) }} className="w-full btn-outline mt-2">{c.name}</button>)}
        </div>
      )}
      {step === 2 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border">
          <h2 className="text-xl font-semibold mb-4">2. Detalles del Evento y Servicios</h2>
          {/* AÑADIDO: Campo de fecha del evento */}
          <div className="mb-6">
            <label htmlFor="event_date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fecha del Evento (Opcional)</label>
            <input id="event_date" type="date" value={eventDate} onChange={e => setEventDate(e.target.value)} className="w-full input" />
          </div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Servicios</h3>
            <button onClick={addService} className="btn-primary">+ Agregar Servicio</button>
          </div>
          {/* ... Mapeo de servicios ... */}
          {quoteServices.map((qs, i) => (
              <div key={i} className="p-4 border rounded-lg space-y-3 mb-4">
                <select value={qs.service_id} onChange={e => updateService(i, 'service_id', e.target.value)} className="w-full input">
                  {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                 <input type="number" value={qs.quantity} onChange={e => updateService(i, 'quantity', e.target.value)} className="w-full input" placeholder="Cantidad" />
                 <input type="number" value={qs.final_price} onChange={e => updateService(i, 'final_price', e.target.value)} className="w-full input" placeholder="Precio Final" />
                 <button onClick={() => removeService(i)} className="btn-danger">Eliminar</button>
              </div>
          ))}
          <div className="mt-6 flex justify-between gap-4">
            <button onClick={() => setStep(1)} className="btn-outline">Atrás</button>
            <button onClick={saveDraft} disabled={loading || quoteServices.length === 0} className="btn-primary">{loading ? 'Guardando...' : 'Guardar Borrador'}</button>
          </div>
        </div>
      )}
    </div>
  )
}
