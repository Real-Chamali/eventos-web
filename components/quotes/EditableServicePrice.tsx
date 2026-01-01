'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { logger } from '@/lib/utils/logger'
import { useToast, useIsAdmin } from '@/lib/hooks'
import { logPriceOverride } from '@/lib/utils/criticalAudit'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { Edit2, Check, X, DollarSign } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface EditableServicePriceProps {
  quoteServiceId: string
  quoteId: string
  serviceName: string
  currentPrice: number
  quantity: number
  quoteStatus: string
  onPriceUpdate?: () => void
  disabled?: boolean
}

export default function EditableServicePrice({
  quoteServiceId,
  quoteId,
  serviceName,
  currentPrice,
  quantity,
  quoteStatus,
  onPriceUpdate,
  disabled = false,
}: EditableServicePriceProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editPrice, setEditPrice] = useState(currentPrice.toString())
  const [saving, setSaving] = useState(false)
  const supabase = createClient()
  const { success: toastSuccess, error: toastError } = useToast()
  const { isAdmin } = useIsAdmin()

  // Determinar si se puede editar
  const canEdit = () => {
    if (disabled) return false
    
    // Admin puede editar cualquier cotización, independientemente del estado
    if (isAdmin) {
      return true
    }
    
    // Si está confirmada o cancelada, solo admin puede editar
    if (quoteStatus === 'confirmed' || quoteStatus === 'cancelled') {
      return false
    }
    
    // Si está en draft o pending, todos pueden editar
    return true
  }

  const handleStartEdit = () => {
    if (!canEdit()) {
      toastError('No tienes permisos para editar este precio')
      return
    }
    setEditPrice(currentPrice.toString())
    setIsEditing(true)
  }

  const handleCancel = () => {
    setEditPrice(currentPrice.toString())
    setIsEditing(false)
  }

  const handleSave = async () => {
    const newPrice = parseFloat(editPrice)
    
    if (isNaN(newPrice) || newPrice < 0) {
      toastError('El precio debe ser un número válido mayor o igual a 0')
      return
    }

    try {
      setSaving(true)
      
      // Actualizar el precio del servicio
      const { error: updateError } = await supabase
        .from('quote_services')
        .update({ final_price: newPrice })
        .eq('id', quoteServiceId)

      if (updateError) throw updateError

      // Recalcular el total de la cotización
      const { data: quoteServices } = await supabase
        .from('quote_services')
        .select('final_price, quantity')
        .eq('quote_id', quoteId)

      if (quoteServices) {
        const newTotal = quoteServices.reduce(
          (sum, qs) => sum + (qs.final_price * qs.quantity),
          0
        )

        // Actualizar el total de la cotización
        const { error: totalError } = await supabase
          .from('quotes')
          .update({ 
            total_price: newTotal,
            updated_at: new Date().toISOString()
          })
          .eq('id', quoteId)

        if (totalError) {
          logger.warn('EditableServicePrice', 'Error updating quote total', {
            error: totalError.message,
            code: totalError.code,
          })
          // No fallar si solo falla la actualización del total
        }
      }

      // Log acción crítica si es cambio de precio en cotización confirmada
      if ((quoteStatus === 'confirmed' || quoteStatus === 'cancelled') && isAdmin) {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          await logPriceOverride(
            user.id,
            quoteId,
            quoteServiceId,
            currentPrice,
            newPrice,
            `Modificación de precio en cotización ${quoteStatus} por administrador`,
            {
              ipAddress: undefined,
              userAgent: navigator.userAgent,
            }
          )
        }
      }

      toastSuccess('Precio actualizado exitosamente')
      setIsEditing(false)
      onPriceUpdate?.()
    } catch (error) {
      logger.error('EditableServicePrice', 'Error updating price', error as Error)
      toastError('Error al actualizar el precio')
      setEditPrice(currentPrice.toString())
    } finally {
      setSaving(false)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price)
  }

  const subtotal = currentPrice * quantity
  const editable = canEdit()

  if (isEditing) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <Input
            type="number"
            step="0.01"
            min="0"
            value={editPrice}
            onChange={(e) => setEditPrice(e.target.value)}
            className="text-right font-mono"
            disabled={saving}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSave()
              } else if (e.key === 'Escape') {
                handleCancel()
              }
            }}
          />
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleSave}
          disabled={saving}
          className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
        >
          <Check className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleCancel}
          disabled={saving}
          className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-end gap-2 group">
      <div className="text-right">
        <div className="font-semibold text-gray-900 dark:text-white">
          {formatPrice(currentPrice)}
        </div>
        {quantity > 1 && (
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {formatPrice(subtotal)} total
          </div>
        )}
      </div>
      {editable && (
        <Button
          size="sm"
          variant="ghost"
          onClick={handleStartEdit}
          className={cn(
            "opacity-0 group-hover:opacity-100 transition-opacity duration-200",
            "text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/20"
          )}
          title={
            quoteStatus === 'confirmed' || quoteStatus === 'cancelled'
              ? 'Solo administradores pueden editar precios de cotizaciones confirmadas'
              : 'Editar precio'
          }
        >
          <Edit2 className="h-4 w-4" />
        </Button>
      )}
      {!editable && (quoteStatus === 'confirmed' || quoteStatus === 'cancelled') && !isAdmin && (
        <div 
          className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          title="Solo administradores pueden editar"
        >
          <DollarSign className="h-4 w-4 text-gray-400" />
        </div>
      )}
    </div>
  )
}

