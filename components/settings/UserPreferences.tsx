'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useToast } from '@/lib/hooks'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select'
import { Settings, Moon, Sun, Globe } from 'lucide-react'

interface UserPreferences {
  theme: 'light' | 'dark' | 'auto'
  language: 'es' | 'en'
  timezone: string
  email_notifications: boolean
  push_notifications: boolean
}

export default function UserPreferences() {
  const [preferences, setPreferences] = useState<UserPreferences>({
    theme: 'auto',
    language: 'es',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    email_notifications: true,
    push_notifications: true,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const supabase = createClient()
  const { success: toastSuccess, error: toastError } = useToast()

  useEffect(() => {
    loadPreferences()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadPreferences = async () => {
    try {
      setLoading(true)
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      // Cargar preferencias desde la base de datos
      const { data } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (data) {
        setPreferences(data as UserPreferences)
      }
    } catch (error) {
      console.error('Error loading preferences:', error)
    } finally {
      setLoading(false)
    }
  }

  const savePreferences = async () => {
    try {
      setSaving(true)
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        toastError('Debes estar autenticado')
        return
      }

      const { error } = await supabase.from('user_preferences').upsert({
        user_id: user.id,
        ...preferences,
        updated_at: new Date().toISOString(),
      })

      if (error) throw error

      toastSuccess('Preferencias guardadas correctamente')
    } catch (error) {
      console.error('Error saving preferences:', error)
      toastError('Error al guardar preferencias')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="text-center py-8">Cargando preferencias...</div>
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Preferencias de Usuario</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Theme */}
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
              <Moon className="inline h-4 w-4 mr-2" />
              Tema
            </label>
            <Select
              value={preferences.theme}
              onValueChange={(value) =>
                setPreferences({ ...preferences, theme: value as 'light' | 'dark' | 'auto' })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Claro</SelectItem>
                <SelectItem value="dark">Oscuro</SelectItem>
                <SelectItem value="auto">Automático</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Language */}
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
              <Globe className="inline h-4 w-4 mr-2" />
              Idioma
            </label>
            <Select
              value={preferences.language}
              onValueChange={(value) =>
                setPreferences({ ...preferences, language: value as 'es' | 'en' })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="es">Español</SelectItem>
                <SelectItem value="en">English</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Timezone */}
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
              Zona Horaria
            </label>
            <Select
              value={preferences.timezone}
              onValueChange={(value) => setPreferences({ ...preferences, timezone: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="America/Mexico_City">Ciudad de México (GMT-6)</SelectItem>
                <SelectItem value="America/New_York">Nueva York (GMT-5)</SelectItem>
                <SelectItem value="America/Los_Angeles">Los Ángeles (GMT-8)</SelectItem>
                <SelectItem value="Europe/Madrid">Madrid (GMT+1)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-800">
            <Button onClick={savePreferences} disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar Preferencias'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

