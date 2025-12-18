'use client'

import { useState, useEffect } from 'react'
import { useToast } from '@/lib/hooks'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Badge from '@/components/ui/Badge'
import { Shield, Smartphone, CheckCircle2 } from 'lucide-react'
import { logger } from '@/lib/utils/logger'

export default function SecuritySettings() {
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
  const { success: toastSuccess, error: toastError } = useToast()

  useEffect(() => {
    const loadSecuritySettings = async () => {
      try {
        // TODO: Implementar verificación de 2FA
        // Por ahora, solo mostramos la UI
        setTwoFactorEnabled(false)
      } catch (error) {
        logger.error('SecuritySettings', 'Error loading security settings', error as Error)
      }
    }
    loadSecuritySettings()
  }, [])

  const handleEnable2FA = async () => {
    try {
      // TODO: Implementar 2FA con Supabase Auth
      // Esto requeriría configurar TOTP
      toastSuccess('2FA habilitado (simulado)')
      setTwoFactorEnabled(true)
    } catch (error) {
      logger.error('SecuritySettings', 'Error enabling 2FA', error as Error)
      toastError('Error al habilitar 2FA')
    }
  }

  const handleDisable2FA = async () => {
    try {
      // TODO: Implementar deshabilitación de 2FA
      toastSuccess('2FA deshabilitado')
      setTwoFactorEnabled(false)
    } catch (error) {
      logger.error('SecuritySettings', 'Error disabling 2FA', error as Error)
      toastError('Error al deshabilitar 2FA')
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Configuración de Seguridad</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 2FA */}
          <div className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-800">
            <div className="flex items-center space-x-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/20">
                <Smartphone className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Autenticación de Dos Factores</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Agrega una capa extra de seguridad a tu cuenta
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {twoFactorEnabled ? (
                <>
                  <Badge variant="success">Habilitado</Badge>
                  <Button variant="outline" size="sm" onClick={handleDisable2FA}>
                    Deshabilitar
                  </Button>
                </>
              ) : (
                <Button size="sm" onClick={handleEnable2FA}>
                  Habilitar 2FA
                </Button>
              )}
            </div>
          </div>

          {/* Active Sessions */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-4">
              Sesiones Activas
            </h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                <div className="flex items-center space-x-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      Sesión Actual
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date().toLocaleString('es-MX')}
                    </p>
                  </div>
                </div>
                <Badge variant="success">Activa</Badge>
              </div>
            </div>
          </div>

          {/* Password Change */}
          <div className="border-t border-gray-200 dark:border-gray-800 pt-6">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-4">
              Cambiar Contraseña
            </h3>
            <div className="space-y-4">
              <Input type="password" label="Contraseña Actual" />
              <Input type="password" label="Nueva Contraseña" />
              <Input type="password" label="Confirmar Nueva Contraseña" />
              <Button>Cambiar Contraseña</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

