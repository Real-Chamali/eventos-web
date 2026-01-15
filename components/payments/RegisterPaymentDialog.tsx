'use client'

import { useState, memo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/utils/supabase/client'
import { logger } from '@/lib/utils/logger'
import { useToast, usePartialPayments } from '@/lib/hooks'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { DollarSign, CreditCard, Wallet, Building2, FileText, Receipt, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'
import { useEffect } from 'react'

const paymentSchema = z.object({
  amount: z.number().min(0.01, 'El monto debe ser mayor a 0'),
  payment_date: z.string().min(1, 'La fecha es requerida'),
  payment_method: z.enum(['cash', 'transfer', 'card', 'check', 'other']),
  reference_number: z.string().optional(),
  notes: z.string().optional(),
  is_deposit: z.boolean().default(false),
  due_date: z.string().optional(),
})

type PaymentFormData = z.infer<typeof paymentSchema>

interface RegisterPaymentDialogProps {
  quoteId: string
  totalPrice: number
  currentPaid: number
  trigger?: React.ReactNode
  onSuccess?: () => void
}

function RegisterPaymentDialog({
  quoteId,
  totalPrice,
  currentPaid,
  trigger,
  onSuccess,
}: RegisterPaymentDialogProps) {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [requiredDeposit, setRequiredDeposit] = useState(0)
  const { refresh } = usePartialPayments(quoteId)
  const { success: toastSuccess, error: toastError } = useToast()
  const supabase = createClient()

  const balanceDue = Math.max(totalPrice - currentPaid, 0)

  // Calcular anticipo requerido cuando se abre el diálogo
  useEffect(() => {
    if (open) {
      import('@/lib/utils/paymentIntelligence').then(({ calculateRequiredDeposit }) => {
        calculateRequiredDeposit(quoteId, 30).then(setRequiredDeposit).catch(() => {})
      })
    }
  }, [open, quoteId])

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      amount: balanceDue,
      payment_date: format(new Date(), 'yyyy-MM-dd'),
      payment_method: 'cash',
      reference_number: '',
      notes: '',
      is_deposit: false,
      due_date: '',
    },
  })

  const paymentMethod = watch('payment_method')

  const onSubmit = async (data: PaymentFormData) => {
    if (data.amount > balanceDue) {
      toastError(`El monto no puede exceder el balance pendiente de ${new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN',
      }).format(balanceDue)}`)
      return
    }

    if (data.amount <= 0) {
      toastError('El monto debe ser mayor a 0')
      return
    }

    setIsSubmitting(true)
    try {
      // Usar API route para registrar pago con validaciones del servidor
      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quote_id: quoteId,
          amount: data.amount,
          payment_date: data.payment_date,
          payment_method: data.payment_method,
          reference_number: data.reference_number || null,
          notes: data.notes || null,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Error al registrar el pago')
      }

      // Track analytics
      try {
        const { trackingEvents } = await import('@/lib/utils/analytics')
        trackingEvents.exportPDF(`payment-${quoteId}-${Date.now()}`)
      } catch (analyticsError) {
        // No fallar si hay error en analytics
        logger.warn('RegisterPaymentDialog', 'Error tracking analytics', {
          error: analyticsError instanceof Error ? analyticsError.message : String(analyticsError),
        })
      }

      // Enviar WhatsApp al cliente si tiene teléfono
      try {
        const { data: quoteData } = await supabase
          .from('quotes')
          .select(`
            id,
            total_amount,
            client_id,
            clients:client_id (
              name,
              phone
            )
          `)
          .eq('id', quoteId)
          .single()

        // Calcular total pagado
        const { data: paymentsData } = await supabase
          .from('partial_payments')
          .select('amount')
          .eq('quote_id', quoteId)

        const totalPaid = (paymentsData || []).reduce((sum, p) => sum + (p.amount || 0), 0)

        if (quoteData?.clients) {
          const clientsArray = Array.isArray(quoteData.clients) ? quoteData.clients : [quoteData.clients]
          const client = clientsArray[0] as { name?: string; phone?: string } | undefined
          if (client?.phone && client?.name) {
            const { whatsappTemplates } = await import('@/lib/integrations/whatsapp')
            const message = whatsappTemplates.paymentRegistered(
              quoteId,
              client.name,
              data.amount,
              totalPaid,
              quoteData.total_amount || 0
            )
            // Enviar vía API route (solo funciona en servidor)
            await fetch('/api/whatsapp/send', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                to: client.phone,
                message,
              }),
            }).catch(() => {
              // Silenciar errores de WhatsApp
            })

            // Enviar notificación al admin si el pago es significativo (>10% del total)
            if (data.amount > (quoteData.total_amount || 0) * 0.1) {
              try {
                const { whatsappTemplates } = await import('@/lib/integrations/whatsapp')
                const adminMessage = whatsappTemplates.admin.paymentReceived(
                  quoteId,
                  client.name,
                  data.amount,
                  totalPaid,
                  quoteData.total_amount || 0
                )
                await fetch('/api/whatsapp/send-admin', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ message: adminMessage }),
                }).catch(() => {
                  // Silenciar errores de WhatsApp al admin
                })
              } catch (adminError) {
                // No fallar si hay error
                logger.warn('RegisterPaymentDialog', 'Error sending WhatsApp to admin', {
                  error: adminError instanceof Error ? adminError.message : String(adminError),
                })
              }
            }
          }
        }
      } catch (whatsappError) {
        // No fallar si hay error en WhatsApp
        logger.warn('RegisterPaymentDialog', 'Error sending WhatsApp', {
          error: whatsappError instanceof Error ? whatsappError.message : String(whatsappError),
          quoteId,
        })
      }

      toastSuccess('Pago registrado exitosamente')
      reset()
      setOpen(false)
      await refresh()
      onSuccess?.()
    } catch (error) {
      logger.error('RegisterPaymentDialog', 'Error registering payment', error instanceof Error ? error : new Error(String(error)))
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="premium" size="lg" className="shadow-lg hover:shadow-xl gap-2">
            <DollarSign className="h-5 w-5" />
            Registrar Pago
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Registrar Pago Parcial
          </DialogTitle>
          <DialogDescription className="text-base">
            Registra un pago parcial para esta cotización
          </DialogDescription>
        </DialogHeader>

        {/* Resumen Premium */}
        <div className="grid grid-cols-3 gap-4 p-4 rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 border border-indigo-200 dark:border-indigo-800">
          <div className="text-center">
            <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Total</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              {new Intl.NumberFormat('es-MX', {
                style: 'currency',
                currency: 'MXN',
              }).format(totalPrice)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Pagado</p>
            <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
              {new Intl.NumberFormat('es-MX', {
                style: 'currency',
                currency: 'MXN',
              }).format(currentPaid)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Pendiente</p>
            <p className="text-lg font-bold text-amber-600 dark:text-amber-400">
              {new Intl.NumberFormat('es-MX', {
                style: 'currency',
                currency: 'MXN',
              }).format(balanceDue)}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Monto */}
          <div>
            <Input
              type="number"
              step="0.01"
              label="Monto del Pago"
              placeholder="0.00"
              icon={<DollarSign className="h-4 w-4" />}
              {...register('amount', { valueAsNumber: true })}
              error={errors.amount?.message}
              max={balanceDue}
            />
            {balanceDue > 0 && (
              <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                Balance pendiente: {new Intl.NumberFormat('es-MX', {
                  style: 'currency',
                  currency: 'MXN',
                }).format(balanceDue)}
              </p>
            )}
          </div>

          {/* Fecha */}
          <div>
            <Input
              type="date"
              label="Fecha del Pago"
              {...register('payment_date')}
              error={errors.payment_date?.message}
            />
          </div>

          {/* Método de Pago */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Método de Pago
            </label>
            <Select
              value={paymentMethod}
              onValueChange={(value: 'cash' | 'transfer' | 'card' | 'check' | 'other') => setValue('payment_method', value)}
            >
              <SelectTrigger>
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
            {errors.payment_method && (
              <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">
                {errors.payment_method.message}
              </p>
            )}
          </div>

          {/* Número de Referencia (opcional) */}
          {(paymentMethod === 'transfer' || paymentMethod === 'check' || paymentMethod === 'card') && (
            <div>
              <Input
                label="Número de Referencia"
                placeholder="Ej: Transferencia #12345"
                {...register('reference_number')}
                error={errors.reference_number?.message}
              />
            </div>
          )}

          {/* Anticipo */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="is_deposit"
              {...register('is_deposit')}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="is_deposit" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Marcar como anticipo
            </label>
          </div>
          {requiredDeposit > 0 && (
            <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                    Anticipo requerido: {new Intl.NumberFormat('es-MX', {
                      style: 'currency',
                      currency: 'MXN',
                    }).format(requiredDeposit)}
                  </p>
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                    Se recomienda recibir al menos el 30% como anticipo antes de confirmar el evento.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Fecha límite */}
          <div>
            <Input
              type="date"
              label="Fecha Límite de Pago (Opcional)"
              {...register('due_date')}
              error={errors.due_date?.message}
            />
            <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
              Establece una fecha límite para recibir este pago. Se enviarán recordatorios automáticos.
            </p>
          </div>

          {/* Notas */}
          <div>
            <Textarea
              label="Notas (Opcional)"
              placeholder="Notas adicionales sobre el pago..."
              rows={3}
              {...register('notes')}
              error={errors.notes?.message}
            />
          </div>

          <DialogFooter className="gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                reset()
                setOpen(false)
              }}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="premium"
              disabled={isSubmitting || balanceDue <= 0}
              isLoading={isSubmitting}
              className="gap-2"
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

export default memo(RegisterPaymentDialog)

