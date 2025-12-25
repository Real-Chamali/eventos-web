'use client'

import { useState, useMemo } from 'react'
import { createClient } from '@/utils/supabase/client'
import { logger } from '@/lib/utils/logger'
import { useToast, useIsAdmin } from '@/lib/hooks'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/AlertDialog'
import { Shield, Edit, Trash2, RefreshCw, CheckCircle2, XCircle, Clock, AlertTriangle } from 'lucide-react'
import {
  isValidTransition,
  getValidTransitions,
  getStatusLabel,
  getStatusVariant,
  canDeleteQuote,
  type QuoteStatus,
} from '@/lib/utils/quoteStateMachine'
import { logQuoteStatusChange, logQuoteDelete } from '@/lib/utils/criticalAudit'

interface AdminQuoteControlsProps {
  quoteId: string
  currentStatus: string
  onStatusChange?: () => void
  onDelete?: () => void
  allowEdit?: boolean
  allowDelete?: boolean
}

export default function AdminQuoteControls({
  quoteId,
  currentStatus,
  onStatusChange,
  onDelete,
  allowEdit = true,
  allowDelete = true,
}: AdminQuoteControlsProps) {
  const [newStatus, setNewStatus] = useState<QuoteStatus>(currentStatus as QuoteStatus)
  const [changingStatus, setChangingStatus] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const supabase = createClient()
  const { success: toastSuccess, error: toastError } = useToast()
  const { isAdmin } = useIsAdmin()

  // Obtener transiciones válidas usando la máquina de estados
  const validTransitions = useMemo(
    () => getValidTransitions(currentStatus as QuoteStatus, isAdmin),
    [currentStatus, isAdmin]
  )

  // Opciones de estado filtradas por transiciones válidas
  const statusOptions = useMemo(() => {
    const allOptions = [
      { value: 'draft' as QuoteStatus, label: 'Borrador', icon: Clock },
      { value: 'pending' as QuoteStatus, label: 'Pendiente', icon: Clock },
      { value: 'confirmed' as QuoteStatus, label: 'Confirmada', icon: CheckCircle2 },
      { value: 'cancelled' as QuoteStatus, label: 'Cancelada', icon: XCircle },
    ]

    // Solo mostrar estados a los que se puede transicionar
    return allOptions.filter((option) =>
      validTransitions.some((t) => t.to === option.value) || option.value === currentStatus
    )
  }, [validTransitions, currentStatus])

  const handleStatusChange = async () => {
    if (newStatus === currentStatus) return

    // Validar transición usando la máquina de estados
    const validation = isValidTransition(currentStatus as QuoteStatus, newStatus, isAdmin)
    if (!validation.valid) {
      toastError(validation.reason || 'Transición de estado inválida')
      setNewStatus(currentStatus as QuoteStatus)
      return
    }

    try {
      setChangingStatus(true)
      const { error } = await supabase
        .from('quotes')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', quoteId)

      if (error) {
        // Si el error es de validación de BD (trigger), mostrar mensaje específico
        if (error.message.includes('Transición de estado inválida')) {
          toastError(error.message)
        } else {
          throw error
        }
        setNewStatus(currentStatus as QuoteStatus)
        return
      }

      // Log acción crítica (cambio de estado)
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await logQuoteStatusChange(
          user.id,
          quoteId,
          currentStatus,
          newStatus,
          `Cambio de estado por ${isAdmin ? 'administrador' : 'usuario'}`,
          {
            ipAddress: undefined, // No disponible en cliente
            userAgent: navigator.userAgent,
          }
        )
      }

      toastSuccess(`Estado cambiado a ${getStatusLabel(newStatus)}`)
      onStatusChange?.()
    } catch (error) {
      logger.error('AdminQuoteControls', 'Error changing status', error as Error)
      toastError('Error al cambiar el estado de la cotización')
      setNewStatus(currentStatus as QuoteStatus) // Revertir cambio
    } finally {
      setChangingStatus(false)
    }
  }

  // Verificar si se puede eliminar
  const canDelete = useMemo(
    () => allowDelete && canDeleteQuote(currentStatus as QuoteStatus, isAdmin),
    [allowDelete, currentStatus, isAdmin]
  )

  const handleDelete = async () => {
    try {
      // Obtener datos de la cotización antes de eliminar (para audit log)
      const { data: quoteData } = await supabase
        .from('quotes')
        .select('*')
        .eq('id', quoteId)
        .single()

      const { error } = await supabase
        .from('quotes')
        .delete()
        .eq('id', quoteId)

      if (error) throw error

      // Log acción crítica (eliminación)
      const { data: { user } } = await supabase.auth.getUser()
      if (user && quoteData) {
        await logQuoteDelete(
          user.id,
          quoteId,
          quoteData as Record<string, unknown>,
          `Eliminación por ${isAdmin ? 'administrador' : 'usuario'}`,
          {
            ipAddress: undefined, // No disponible en cliente
            userAgent: navigator.userAgent,
          }
        )
      }

      toastSuccess('Cotización eliminada exitosamente')
      onDelete?.()
    } catch (error) {
      logger.error('AdminQuoteControls', 'Error deleting quote', error as Error)
      toastError('Error al eliminar la cotización')
    } finally {
      setDeleteConfirmOpen(false)
    }
  }


  return (
    <Card variant="elevated" className="border-2 border-amber-200 dark:border-amber-800">
      <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              Controles de Administrador
            </CardTitle>
            <CardDescription className="mt-1">
              Gestiona el estado y acciones de esta cotización
            </CardDescription>
          </div>
          <Badge variant="warning" size="sm">
            Admin Only
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-6">
        {/* Status Change */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Estado Actual
          </label>
          <div className="flex items-center gap-3">
            <Badge
              variant={getStatusVariant(currentStatus as QuoteStatus)}
              className="flex items-center gap-2"
            >
              {(() => {
                const option = statusOptions.find((s) => s.value === currentStatus)
                const IconComponent = option?.icon
                return IconComponent ? <IconComponent className="h-4 w-4" /> : null
              })()}
              {getStatusLabel(currentStatus as QuoteStatus)}
            </Badge>
          </div>
        </div>

        {validTransitions.length > 0 ? (
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Cambiar Estado
            </label>
            <div className="flex items-center gap-2">
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as QuoteStatus)}
                className="flex-1 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-sm font-medium text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-400 transition-all"
              >
                <option value={currentStatus}>{getStatusLabel(currentStatus as QuoteStatus)} (actual)</option>
                {validTransitions.map((transition) => {
                  const option = statusOptions.find((o) => o.value === transition.to)
                  return (
                    <option key={transition.to} value={transition.to}>
                      {option?.label || transition.to} {transition.requiresAdmin && '(Solo Admin)'}
                    </option>
                  )
                })}
              </select>
              <Button
                onClick={handleStatusChange}
                disabled={changingStatus || newStatus === currentStatus}
                size="sm"
                variant="outline"
              >
                {changingStatus ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Cambiando...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Aplicar
                  </>
                )}
              </Button>
            </div>
            {validTransitions.length > 0 && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Transiciones válidas: {validTransitions.map((t) => getStatusLabel(t.to)).join(', ')}
              </p>
            )}
          </div>
        ) : (
          <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
            <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
              <AlertTriangle className="h-4 w-4" />
              <p className="text-sm font-medium">
                Estado terminal: No se pueden realizar más cambios
              </p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-200 dark:border-gray-800">
          {allowEdit && (
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => window.location.href = `/dashboard/quotes/${quoteId}/edit`}
            >
              <Edit className="h-4 w-4 mr-2" />
              Editar Cotización
            </Button>
          )}

          {canDelete && (
            <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  size="sm"
                  className="flex-1"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Eliminar
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Eliminar cotización?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta acción no se puede deshacer. La cotización será eliminada permanentemente,
                    junto con todos sus servicios asociados y pagos.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Eliminar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

