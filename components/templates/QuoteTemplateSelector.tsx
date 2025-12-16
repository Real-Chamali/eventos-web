'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useToast } from '@/lib/hooks'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { FileText, Plus, Star } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/Dialog'
import Input from '@/components/ui/Input'
import Textarea from '@/components/ui/Textarea'
import Badge from '@/components/ui/Badge'

interface Template {
  id: string
  name: string
  description: string | null
  event_type: string | null
  services: any[]
  default_notes: string | null
  is_public: boolean
  created_by: string
}

interface QuoteTemplateSelectorProps {
  onSelectTemplate: (template: Template) => void
}

export default function QuoteTemplateSelector({ onSelectTemplate }: QuoteTemplateSelectorProps) {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    description: '',
    event_type: '',
    default_notes: '',
  })
  const supabase = createClient()
  const { success: toastSuccess, error: toastError } = useToast()

  useEffect(() => {
    loadTemplates()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadTemplates = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('quote_templates')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setTemplates(data || [])
    } catch (error) {
      console.error('Error loading templates:', error)
      toastError('Error al cargar plantillas')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTemplate = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        toastError('Debes estar autenticado')
        return
      }

      const { error } = await supabase.from('quote_templates').insert({
        name: newTemplate.name,
        description: newTemplate.description || null,
        event_type: newTemplate.event_type || null,
        default_notes: newTemplate.default_notes || null,
        services: [],
        created_by: user.id,
        is_public: false,
      })

      if (error) throw error

      toastSuccess('Plantilla creada correctamente')
      setShowCreateDialog(false)
      setNewTemplate({ name: '', description: '', event_type: '', default_notes: '' })
      loadTemplates()
    } catch (error) {
      console.error('Error creating template:', error)
      toastError('Error al crear plantilla')
    }
  }

  if (loading) {
    return <div className="text-center py-8 text-gray-500">Cargando plantillas...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Plantillas de Cotización</h3>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Nueva Plantilla
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear Nueva Plantilla</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                label="Nombre de la Plantilla *"
                value={newTemplate.name}
                onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                placeholder="Ej: Boda Estándar"
              />
              <Textarea
                label="Descripción"
                value={newTemplate.description}
                onChange={(e) => setNewTemplate({ ...newTemplate, description: e.target.value })}
                placeholder="Descripción de la plantilla..."
                rows={3}
              />
              <Input
                label="Tipo de Evento"
                value={newTemplate.event_type}
                onChange={(e) => setNewTemplate({ ...newTemplate, event_type: e.target.value })}
                placeholder="Ej: Boda, Cumpleaños, Corporativo"
              />
              <Textarea
                label="Notas por Defecto"
                value={newTemplate.default_notes}
                onChange={(e) => setNewTemplate({ ...newTemplate, default_notes: e.target.value })}
                placeholder="Notas que se agregarán automáticamente..."
                rows={3}
              />
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreateTemplate} disabled={!newTemplate.name.trim()}>
                  Crear Plantilla
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {templates.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-500 dark:text-gray-400">No hay plantillas disponibles</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
              Crea tu primera plantilla para ahorrar tiempo
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((template) => (
            <Card
              key={template.id}
              className="cursor-pointer hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
              onClick={() => onSelectTemplate(template)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base">{template.name}</CardTitle>
                  {template.is_public && (
                    <Badge variant="info" className="ml-2">
                      <Star className="h-3 w-3 mr-1" />
                      Pública
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {template.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    {template.description}
                  </p>
                )}
                {template.event_type && (
                  <Badge variant="info" className="text-xs">
                    {template.event_type}
                  </Badge>
                )}
                {template.services && template.services.length > 0 && (
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                    {template.services.length} servicios pre-configurados
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

