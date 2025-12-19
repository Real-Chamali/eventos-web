'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useToast } from '@/lib/hooks'
import { logger } from '@/lib/utils/logger'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
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
import { Calendar, Clock } from 'lucide-react'
import { format } from 'date-fns'

interface EditEventData {
  id: string
  quote_id: string
  start_date: string
  end_date: string | null
  status: string
}

interface EditEventDialogProps {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
  event: EditEventData | null
}

export default function EditEventDialog({ open, onClose, onSuccess, event }: EditEventDialogProps) {
  const [loading, setLoading] = useState(false)
  const [eventDate, setEventDate] = useState('')
  const [eventTime, setEventTime] = useState('')
  const [eventEndDate, setEventEndDate] = useState('')
  const [eventEndTime, setEventEndTime] = useState('')
  const [status, setStatus] = useState<string>('CONFIRMED')

  const supabase = createClient()
  const { success: toastSuccess, error: toastError } = useToast()

  useEffect(() => {
    if (open && event) {
      // Cargar datos del evento
      const startDate = new Date(event.start_date)
      setEventDate(format(startDate, 'yyyy-MM-dd'))
      setEventTime(format(startDate, 'HH:mm'))
      setStatus(event.status || 'CONFIRMED')

      if (event.end_date) {
        const endDate = new Date(event.end_date)
        setEventEndDate(format(endDate, 'yyyy-MM-dd'))
        setEventEndTime(format(endDate, 'HH:mm'))
      } else {
        setEventEndDate('')
        setEventEndTime('')
      }
    }
  }, [open, event])

  const handleSubmit = async () => {
    if (!event) return
    if (!eventDate || !eventTime) {
      toastError('Debes seleccionar fecha y hora de inicio')
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

      // Validar que end_date sea después de start_date
      if (endDateTime && endDateTime <= startDateTime) {
        toastError('La fecha de fin debe ser posterior a la fecha de inicio')
        return
      }

      // Actualizar evento
      const { error: updateError } = await supabase
        .from('events')
        .update({
          start_date: startDateTime.toISOString(),
          end_date: endDateTime ? endDateTime.toISOString() : null,
          status: status,
        })
        .eq('id', event.id)

      if (updateError) throw updateError

      toastSuccess('Evento actualizado exitosamente')
      onSuccess?.()
      onClose()
    } catch (error) {
      logger.error('EditEventDialog', 'Error updating event', error instanceof Error ? error : new Error(String(error)))
      toastError('Error al actualizar el evento: ' + (error instanceof Error ? error.message : String(error)))
    } finally {
      setLoading(false)
    }
  }

  if (!event) return null

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <Calendar className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            Editar Evento
          </DialogTitle>
          <DialogDescription>
            Modifica la fecha, hora y estado del evento
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
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

          {/* Estado */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Estado del Evento</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CONFIRMED">Confirmado</SelectItem>
                  <SelectItem value="LOGISTICS">En Logística</SelectItem>
                  <SelectItem value="IN_PROGRESS">En Progreso</SelectItem>
                  <SelectItem value="FINISHED">Finalizado</SelectItem>
                  <SelectItem value="CANCELLED">Cancelado</SelectItem>
                  <SelectItem value="NO_SHOW">No se Presentó</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Botones de Acción */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button variant="ghost" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loading || !eventDate || !eventTime}
              className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700"
            >
              {loading ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

