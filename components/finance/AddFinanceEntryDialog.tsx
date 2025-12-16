'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
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
import { FinanceEntrySchema, type FinanceEntryFormData } from '@/lib/validations/schemas'
import { Plus } from 'lucide-react'

interface AddFinanceEntryDialogProps {
  onSuccess?: () => void
  trigger?: React.ReactNode
}

export default function AddFinanceEntryDialog({
  onSuccess,
  trigger,
}: AddFinanceEntryDialogProps) {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<FinanceEntryFormData>({
    resolver: zodResolver(FinanceEntrySchema),
    defaultValues: {
      type: 'income',
      amount: 0,
      description: '',
    },
  })

  const typeValue = watch('type')

  const onSubmit = async (data: FinanceEntryFormData) => {
    setIsSubmitting(true)
    try {
      const { createClient } = await import('@/utils/supabase/client')
      const supabase = createClient()

      const { error } = await supabase.from('finance_ledger').insert({
        amount: data.amount,
        type: data.type,
        description: data.description,
      })

      if (error) throw error

      reset()
      setOpen(false)
      onSuccess?.()
    } catch (error) {
      console.error('Error al crear movimiento:', error)
      // El error se manejará por el toast provider si está configurado
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Agregar Movimiento
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Agregar Movimiento Financiero</DialogTitle>
          <DialogDescription>
            Registra un nuevo ingreso o egreso en el ledger financiero
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Tipo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Tipo de Movimiento
            </label>
            <Select
              value={typeValue}
              onValueChange={(value: 'income' | 'expense') => setValue('type', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona el tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="income">Ingreso</SelectItem>
                <SelectItem value="expense">Egreso</SelectItem>
              </SelectContent>
            </Select>
            {errors.type && (
              <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">
                {errors.type.message}
              </p>
            )}
          </div>

          {/* Monto */}
          <div>
            <Input
              type="number"
              step="0.01"
              label="Monto"
              placeholder="0.00"
              {...register('amount', { valueAsNumber: true })}
              error={errors.amount?.message}
            />
          </div>

          {/* Descripción */}
          <div>
            <Textarea
              label="Descripción"
              placeholder="Describe el movimiento financiero..."
              rows={3}
              {...register('description')}
              error={errors.description?.message}
            />
          </div>

          <DialogFooter>
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
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Guardando...' : 'Guardar Movimiento'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

