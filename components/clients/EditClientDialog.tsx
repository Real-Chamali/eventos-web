'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useToast } from '@/lib/hooks'
import { logger } from '@/lib/utils/logger'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/Dialog'
import { User, Mail, Phone } from 'lucide-react'

interface EditClientData {
  id: string
  name: string
  email: string | null
  phone: string | null
}

interface EditClientDialogProps {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
  client: EditClientData | null
}

export default function EditClientDialog({ open, onClose, onSuccess, client }: EditClientDialogProps) {
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')

  const supabase = createClient()
  const { success: toastSuccess, error: toastError } = useToast()

  useEffect(() => {
    if (open && client) {
      setName(client.name || '')
      setEmail(client.email || '')
      setPhone(client.phone || '')
    }
  }, [open, client])

  const handleSubmit = async () => {
    if (!client) return
    if (!name.trim()) {
      toastError('El nombre del cliente es requerido')
      return
    }

    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toastError('No estás autenticado')
        return
      }

      // Actualizar cliente
      const { error: updateError } = await supabase
        .from('clients')
        .update({
          name: name.trim(),
          email: email.trim() || null,
          phone: phone.trim() || null,
        })
        .eq('id', client.id)

      if (updateError) throw updateError

      toastSuccess('Cliente actualizado exitosamente')
      onSuccess?.()
      onClose()
    } catch (error) {
      logger.error('EditClientDialog', 'Error updating client', error instanceof Error ? error : new Error(String(error)))
      toastError('Error al actualizar el cliente: ' + (error instanceof Error ? error.message : String(error)))
    } finally {
      setLoading(false)
    }
  }

  if (!client) return null

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <User className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            Editar Cliente
          </DialogTitle>
          <DialogDescription>
            Modifica la información del cliente
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Información del Cliente */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5" />
                Datos del Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nombre *
                </label>
                <Input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nombre del cliente"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Mail className="h-4 w-4 inline mr-1" />
                  Email
                </label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@ejemplo.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Phone className="h-4 w-4 inline mr-1" />
                  Teléfono
                </label>
                <Input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+52 123 456 7890"
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
              disabled={loading || !name.trim()}
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


