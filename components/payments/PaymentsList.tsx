'use client'

import { usePartialPayments, usePaymentSummary } from '@/lib/hooks'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Skeleton from '@/components/ui/Skeleton'
import EmptyState from '@/components/ui/EmptyState'
import RegisterPaymentDialog from './RegisterPaymentDialog'
import { DollarSign, Wallet, Building2, CreditCard, FileText, Receipt, Trash2, Calendar } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { createClient } from '@/utils/supabase/client'
import { logger } from '@/lib/utils/logger'
import { useToast } from '@/lib/hooks'
import { useState } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/AlertDialog'

interface PaymentsListProps {
  quoteId: string
  totalPrice: number
}

export default function PaymentsList({ quoteId, totalPrice }: PaymentsListProps) {
  const { payments, loading, error, refresh } = usePartialPayments(quoteId)
  const { summary } = usePaymentSummary(quoteId, totalPrice)
  const { success: toastSuccess, error: toastError } = useToast()
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [paymentToDelete, setPaymentToDelete] = useState<string | null>(null)
  const supabase = createClient()

  const handleDelete = async (paymentId: string) => {
    setPaymentToDelete(paymentId)
    setShowDeleteDialog(true)
  }

  const confirmDelete = async () => {
    if (!paymentToDelete) return

    setDeletingId(paymentToDelete)
    try {
      const { error } = await supabase
        .from('partial_payments')
        .delete()
        .eq('id', paymentToDelete)

      if (error) throw error

      toastSuccess('Pago eliminado exitosamente')
      await refresh()
    } catch (error) {
      logger.error('PaymentsList', 'Error deleting payment', error instanceof Error ? error : new Error(String(error)))
      toastError('Error al eliminar el pago')
    } finally {
      setDeletingId(null)
      setPaymentToDelete(null)
      setShowDeleteDialog(false)
    }
  }

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'cash':
        return <Wallet className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
      case 'transfer':
        return <Building2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
      case 'card':
        return <CreditCard className="h-4 w-4 text-purple-600 dark:text-purple-400" />
      case 'check':
        return <FileText className="h-4 w-4 text-amber-600 dark:text-amber-400" />
      default:
        return <Receipt className="h-4 w-4 text-gray-600 dark:text-gray-400" />
    }
  }

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case 'cash':
        return 'Efectivo'
      case 'transfer':
        return 'Transferencia'
      case 'card':
        return 'Tarjeta'
      case 'check':
        return 'Cheque'
      default:
        return 'Otro'
    }
  }

  if (loading) {
    return (
      <Card variant="elevated">
        <CardHeader>
          <CardTitle>Pagos Parciales</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-10 w-full mb-4" />
          <Skeleton className="h-10 w-full mb-4" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card variant="elevated">
        <CardHeader>
          <CardTitle>Pagos Parciales</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600 dark:text-red-400">Error al cargar los pagos: {error.message}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card variant="elevated" className="overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 border-b border-gray-200/60 dark:border-gray-800/60">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">Pagos Parciales</CardTitle>
              <CardDescription className="mt-1">
                {summary.payments_count} {summary.payments_count === 1 ? 'pago registrado' : 'pagos registrados'}
              </CardDescription>
            </div>
            <RegisterPaymentDialog
              quoteId={quoteId}
              totalPrice={totalPrice}
              currentPaid={summary.total_paid}
              onSuccess={refresh}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {/* Resumen Premium */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-800">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30">
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Total Pagado</p>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  {new Intl.NumberFormat('es-MX', {
                    style: 'currency',
                    currency: 'MXN',
                  }).format(summary.total_paid)}
                </p>
              </div>
              <div className="text-center p-4 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30">
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Balance Pendiente</p>
                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                  {new Intl.NumberFormat('es-MX', {
                    style: 'currency',
                    currency: 'MXN',
                  }).format(summary.balance_due)}
                </p>
              </div>
              <div className="text-center p-4 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30">
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Total Cotización</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {new Intl.NumberFormat('es-MX', {
                    style: 'currency',
                    currency: 'MXN',
                  }).format(summary.total_price)}
                </p>
              </div>
            </div>
          </div>

          {/* Lista de Pagos */}
          {payments.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={<DollarSign className="h-10 w-10" />}
                title="No hay pagos registrados"
                description="Comienza registrando el primer pago parcial para esta cotización"
                action={{
                  label: 'Registrar Primer Pago',
                  onClick: () => {},
                }}
              />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Método</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Referencia</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id} className="group">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {format(new Date(payment.payment_date), "dd MMM yyyy", { locale: es })}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getPaymentMethodIcon(payment.payment_method)}
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {getPaymentMethodLabel(payment.payment_method)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">
                        {new Intl.NumberFormat('es-MX', {
                          style: 'currency',
                          currency: 'MXN',
                        }).format(payment.amount)}
                      </span>
                    </TableCell>
                    <TableCell>
                      {payment.reference_number ? (
                        <Badge variant="info" size="sm">
                          {payment.reference_number}
                        </Badge>
                      ) : (
                        <span className="text-sm text-gray-400 dark:text-gray-500">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(payment.id)}
                        disabled={deletingId === payment.id}
                        className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar este pago?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El pago será eliminado permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

