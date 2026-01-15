'use client'

import { useState, useEffect } from 'react'
import { usePaymentSummary } from '@/lib/hooks'
import { useToast } from '@/lib/hooks'
import { logger } from '@/lib/utils/logger'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select'
import Input from '@/components/ui/Input'
import Textarea from '@/components/ui/Textarea'
import Button from '@/components/ui/Button'
import { DollarSign, CreditCard, Wallet, Building2, FileText, Receipt, CheckCircle2, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils/cn'

interface PaymentModalProps {
  open: boolean
  onClose: () => void
  quoteId: string
  totalPrice: number
  onSuccess?: () => void
}

export default function PaymentModal({
  open,
  onClose,
  quoteId,
  totalPrice,
  onSuccess,
}: PaymentModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [amount, setAmount] = useState<string>('')
  const [paymentDate, setPaymentDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer' | 'card' | 'check' | 'other'>('cash')
  const [referenceNumber, setReferenceNumber] = useState('')
  const [notes, setNotes] = useState('')
  
  const { summary, loading: summaryLoading } = usePaymentSummary(quoteId, totalPrice)
  const { success: toastSuccess, error: toastError } = useToast()

  const balanceDue = summary.balance_due
  const totalPaid = summary.total_paid
  const paymentProgress = totalPrice > 0 ? (totalPaid / totalPrice) * 100 : 0

  // Resetear formulario cuando se abre
  useEffect(() => {
    if (open) {
      setAmount(balanceDue.toString())
      setPaymentDate(format(new Date(), 'yyyy-MM-dd'))
      setPaymentMethod('cash')
      setReferenceNumber('')
      setNotes('')
    }
  }, [open, balanceDue])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const amountNum = parseFloat(amount)
    
    // Validaciones
    if (isNaN(amountNum) || amountNum <= 0) {
      toastError('El monto debe ser mayor a 0')
      return
    }

    if (amountNum > balanceDue) {
      toastError(`El monto no puede exceder el balance pendiente de ${new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN',
      }).format(balanceDue)}`)
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quote_id: quoteId,
          amount: amountNum,
          payment_date: paymentDate,
          payment_method: paymentMethod,
          reference_number: referenceNumber || null,
          notes: notes || null,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        const errorMessage = result.error || result.message || 'Error al registrar el pago'
        const errorDetails = result.details ? `\n${JSON.stringify(result.details, null, 2)}` : ''
        throw new Error(`${errorMessage}${errorDetails}`)
      }

      toastSuccess('Pago registrado exitosamente')
      
      // Resetear formulario
      setAmount(balanceDue.toString())
      setPaymentDate(format(new Date(), 'yyyy-MM-dd'))
      setPaymentMethod('cash')
      setReferenceNumber('')
      setNotes('')
      
      onSuccess?.()
      onClose()
    } catch (error) {
      logger.error('PaymentModal', 'Error registering payment', error instanceof Error ? error : new Error(String(error)))
      toastError('Error al registrar el pago: ' + (error instanceof Error ? error.message : String(error)))
    } finally {
      setIsSubmitting(false)
    }
  }

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'cash':
        return <Wallet className="h-4 w-4" />
      case 'transfer':
        return <Building2 className="h-4 w-4" />
      case 'card':
        return <CreditCard className="h-4 w-4" />
      case 'check':
        return <FileText className="h-4 w-4" />
      default:
        return <Receipt className="h-4 w-4" />
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <DollarSign className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            Registrar Pago Parcial
          </DialogTitle>
          <DialogDescription className="text-base">
            Registra un nuevo pago para esta cotización
          </DialogDescription>
        </DialogHeader>

        {/* Resumen Financiero Premium */}
        <div className="space-y-4 p-4 rounded-xl bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-950/30 dark:to-violet-950/30 border border-indigo-200 dark:border-indigo-800">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Total Cotizado</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {new Intl.NumberFormat('es-MX', {
                  style: 'currency',
                  currency: 'MXN',
                }).format(totalPrice)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Total Pagado</p>
              <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                {new Intl.NumberFormat('es-MX', {
                  style: 'currency',
                  currency: 'MXN',
                }).format(totalPaid)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Saldo Pendiente</p>
              <p className="text-lg font-bold text-amber-600 dark:text-amber-400">
                {new Intl.NumberFormat('es-MX', {
                  style: 'currency',
                  currency: 'MXN',
                }).format(balanceDue)}
              </p>
            </div>
          </div>

          {/* Barra de Progreso Visual */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-gray-700 dark:text-gray-300">
                Progreso de Pago
              </span>
              <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                {paymentProgress.toFixed(1)}%
              </span>
            </div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full transition-all duration-500 rounded-full",
                  paymentProgress === 100 
                    ? "bg-gradient-to-r from-emerald-500 to-emerald-600"
                    : paymentProgress > 0
                    ? "bg-gradient-to-r from-indigo-500 to-violet-500"
                    : "bg-gray-300 dark:bg-gray-600"
                )}
                style={{ width: `${Math.min(paymentProgress, 100)}%` }}
              />
            </div>
            {paymentProgress === 100 && (
              <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-4 w-4" />
                <span className="font-medium">Cotización completamente pagada</span>
              </div>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Monto */}
          <div>
            <label htmlFor="payment-amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Monto del Pago *
            </label>
            <Input
              id="payment-amount"
              name="amount"
              type="number"
              step="0.01"
              min="0.01"
              max={balanceDue}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              required
              className="w-full"
            />
            {balanceDue > 0 && (
              <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                Balance pendiente: {new Intl.NumberFormat('es-MX', {
                  style: 'currency',
                  currency: 'MXN',
                }).format(balanceDue)}
              </p>
            )}
            {balanceDue <= 0 && (
              <div className="mt-2 p-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5" />
                  <p className="text-xs text-amber-800 dark:text-amber-200">
                    Esta cotización ya está completamente pagada. No se pueden registrar más pagos.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Fecha */}
          <div>
            <label htmlFor="payment-date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Fecha del Pago *
            </label>
            <Input
              id="payment-date"
              name="payment_date"
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              required
              className="w-full"
            />
          </div>

          {/* Método de Pago */}
          <div>
            <label htmlFor="payment-method" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Método de Pago *
            </label>
            <Select
              value={paymentMethod}
              onValueChange={(value: 'cash' | 'transfer' | 'card' | 'check' | 'other') => setPaymentMethod(value)}
            >
              <SelectTrigger id="payment-method" name="payment_method" className="w-full">
                <div className="flex items-center gap-2">
                  {getPaymentMethodIcon(paymentMethod)}
                  <SelectValue placeholder="Selecciona el método" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">
                  <div className="flex items-center gap-2">
                    <Wallet className="h-4 w-4" />
                    Efectivo
                  </div>
                </SelectItem>
                <SelectItem value="transfer">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Transferencia
                  </div>
                </SelectItem>
                <SelectItem value="card">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Tarjeta
                  </div>
                </SelectItem>
                <SelectItem value="check">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Cheque
                  </div>
                </SelectItem>
                <SelectItem value="other">
                  <div className="flex items-center gap-2">
                    <Receipt className="h-4 w-4" />
                    Otro
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Número de Referencia (opcional) */}
          {(paymentMethod === 'transfer' || paymentMethod === 'check' || paymentMethod === 'card') && (
            <div>
              <label htmlFor="payment-reference" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Número de Referencia
              </label>
              <Input
                id="payment-reference"
                name="reference_number"
                type="text"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                placeholder="Ej: Transferencia #12345, Cheque #789"
                className="w-full"
              />
            </div>
          )}

          {/* Notas */}
          <div>
            <label htmlFor="payment-notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Notas (Opcional)
            </label>
            <Textarea
              id="payment-notes"
              name="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notas adicionales sobre el pago..."
              rows={3}
              className="w-full"
            />
          </div>

          <DialogFooter className="gap-3 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="w-full sm:w-auto min-h-[44px]"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="premium"
              disabled={isSubmitting || balanceDue <= 0 || summaryLoading}
              isLoading={isSubmitting}
              className="w-full sm:w-auto gap-2 min-h-[44px]"
            >
              <DollarSign className="h-4 w-4" />
              Registrar Pago
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

