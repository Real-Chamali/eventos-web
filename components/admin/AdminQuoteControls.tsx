'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { logger } from '@/lib/utils/logger'
import { useToast } from '@/lib/hooks'
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
import { Shield, Edit, Trash2, RefreshCw, CheckCircle2, XCircle, Clock } from 'lucide-react'

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
  const [newStatus, setNewStatus] = useState(currentStatus)
  const [changingStatus, setChangingStatus] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const supabase = createClient()
  const { success: toastSuccess, error: toastError } = useToast()

  const statusOptions = [
    { value: 'draft', label: 'Borrador', icon: Clock, color: 'text-gray-600' },
    { value: 'pending', label: 'Pendiente', icon: Clock, color: 'text-amber-600' },
    { value: 'confirmed', label: 'Confirmada', icon: CheckCircle2, color: 'text-emerald-600' },
    { value: 'cancelled', label: 'Cancelada', icon: XCircle, color: 'text-red-600' },
  ]

  const handleStatusChange = async () => {
    if (newStatus === currentStatus) return

    try {
      setChangingStatus(true)
      const { error } = await supabase
        .from('quotes')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', quoteId)

      if (error) throw error

      toastSuccess(`Estado cambiado a ${statusOptions.find(s => s.value === newStatus)?.label || newStatus}`)
      onStatusChange?.()
    } catch (error) {
      logger.error('AdminQuoteControls', 'Error changing status', error as Error)
      toastError('Error al cambiar el estado de la cotización')
      setNewStatus(currentStatus) // Revertir cambio
    } finally {
      setChangingStatus(false)
    }
  }

  const handleDelete = async () => {
    try {
      const { error } = await supabase
        .from('quotes')
        .delete()
        .eq('id', quoteId)

      if (error) throw error

      toastSuccess('Cotización eliminada exitosamente')
      onDelete?.()
    } catch (error) {
      logger.error('AdminQuoteControls', 'Error deleting quote', error as Error)
      toastError('Error al eliminar la cotización')
    } finally {
      setDeleteConfirmOpen(false)
    }
  }

  const currentStatusOption = statusOptions.find(s => s.value === currentStatus)

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
            {currentStatusOption && (
              <Badge
                variant={
                  currentStatus === 'confirmed' ? 'success' :
                  currentStatus === 'pending' ? 'warning' :
                  currentStatus === 'cancelled' ? 'error' : 'default'
                }
                className="flex items-center gap-2"
              >
                <currentStatusOption.icon className="h-4 w-4" />
                {currentStatusOption.label}
              </Badge>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Cambiar Estado
          </label>
          <div className="flex items-center gap-2">
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              className="flex-1 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-sm font-medium text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-400 transition-all"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
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
        </div>

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

          {allowDelete && (
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

