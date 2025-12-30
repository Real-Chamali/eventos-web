'use client'

import { useState, useEffect } from 'react'
import { OptimizedImage } from '@/components/ui/OptimizedImage'
import { useToast } from '@/lib/hooks'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Badge from '@/components/ui/Badge'
import { Shield, Smartphone, CheckCircle2, Copy, Check } from 'lucide-react'
import { logger } from '@/lib/utils/logger'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog'

export default function SecuritySettings() {
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
  const [loading, setLoading] = useState(true)
  const [setupLoading, setSetupLoading] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [showSetupDialog, setShowSetupDialog] = useState(false)
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [secret, setSecret] = useState<string | null>(null)
  const [verificationToken, setVerificationToken] = useState('')
  const [copied, setCopied] = useState(false)
  const { success: toastSuccess, error: toastError } = useToast()

  useEffect(() => {
    const loadSecuritySettings = async () => {
      try {
        const response = await fetch('/api/auth/2fa/check')
        if (response.ok) {
          const data = await response.json()
          setTwoFactorEnabled(data.enabled || false)
        }
      } catch (error) {
        logger.error('SecuritySettings', 'Error loading security settings', error as Error)
      } finally {
        setLoading(false)
      }
    }
    loadSecuritySettings()
  }, [])

  const handleEnable2FA = async () => {
    try {
      setSetupLoading(true)
      const response = await fetch('/api/auth/2fa/setup', {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Error setting up 2FA')
      }

      const data = await response.json()
      setQrCode(data.qrCode)
      setSecret(data.secret)
      setShowSetupDialog(true)
    } catch (error) {
      logger.error('SecuritySettings', 'Error enabling 2FA', error as Error)
      toastError('Error al configurar 2FA')
    } finally {
      setSetupLoading(false)
    }
  }

  const handleVerify2FA = async () => {
    if (!verificationToken || !secret) {
      toastError('Por favor ingresa el código de verificación')
      return
    }

    try {
      setVerifying(true)
      const response = await fetch('/api/auth/2fa/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: verificationToken,
          secret: secret,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error verifying 2FA')
      }

      toastSuccess('2FA habilitado correctamente')
      setTwoFactorEnabled(true)
      setShowSetupDialog(false)
      setVerificationToken('')
      setQrCode(null)
      setSecret(null)
    } catch (error) {
      logger.error('SecuritySettings', 'Error verifying 2FA', error as Error)
      toastError(error instanceof Error ? error.message : 'Error al verificar 2FA')
    } finally {
      setVerifying(false)
    }
  }

  const handleDisable2FA = async () => {
    try {
      const response = await fetch('/api/auth/2fa/disable', {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Error disabling 2FA')
      }

      toastSuccess('2FA deshabilitado correctamente')
      setTwoFactorEnabled(false)
    } catch (error) {
      logger.error('SecuritySettings', 'Error disabling 2FA', error as Error)
      toastError('Error al deshabilitar 2FA')
    }
  }

  const copySecret = () => {
    if (secret) {
      navigator.clipboard.writeText(secret)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
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
              {loading ? (
                <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              ) : twoFactorEnabled ? (
                <>
                  <Badge variant="success">Habilitado</Badge>
                  <Button variant="outline" size="sm" onClick={handleDisable2FA}>
                    Deshabilitar
                  </Button>
                </>
              ) : (
                <Button size="sm" onClick={handleEnable2FA} disabled={setupLoading}>
                  {setupLoading ? 'Configurando...' : 'Habilitar 2FA'}
                </Button>
              )}
            </div>
          </div>

          {/* 2FA Setup Dialog */}
          <Dialog open={showSetupDialog} onOpenChange={setShowSetupDialog}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Configurar Autenticación de Dos Factores</DialogTitle>
                <DialogDescription>
                  Escanea el código QR con tu aplicación de autenticación (Google Authenticator, Authy, etc.)
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                {qrCode && (
                  <div className="flex flex-col items-center space-y-4">
                    <OptimizedImage
                      src={qrCode}
                      alt="QR Code para autenticación de dos factores"
                      width={256}
                      height={256}
                      className="object-contain border rounded-lg"
                      priority
                    />
                    {secret && (
                      <div className="w-full">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          O ingresa manualmente esta clave:
                        </p>
                        <div className="flex items-center space-x-2">
                          <code className="flex-1 px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded text-sm font-mono break-all">
                            {secret}
                          </code>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={copySecret}
                            className="shrink-0"
                          >
                            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                    )}
                    <div className="w-full">
                      <Input
                        label="Código de verificación"
                        placeholder="000000"
                        value={verificationToken}
                        onChange={(e) => setVerificationToken(e.target.value)}
                        maxLength={6}
                      />
                    </div>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowSetupDialog(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleVerify2FA} disabled={verifying || !verificationToken}>
                  {verifying ? 'Verificando...' : 'Verificar y Habilitar'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

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

