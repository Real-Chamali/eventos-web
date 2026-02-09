/**
 * Sistema de Recordatorios de Pagos Automáticos
 * 
 * Este sistema envía recordatorios automáticos para:
 * - Pagos vencidos
 * - Pagos próximos a vencer
 * - Seguimiento de pagos atrasados
 */

import { createClient } from '@/utils/supabase/client'
import { sendWhatsAppWithRetry } from '@/lib/integrations/whatsapp'
import { logger } from '@/lib/utils/logger'
import { format, addDays, isAfter, isBefore, startOfDay, endOfDay } from 'date-fns'
import { es } from 'date-fns/locale'

interface PaymentReminderConfig {
  daysBeforeDue: number[]
  daysAfterDue: number[]
  maxReminders: number
  adminPhoneNumber: string
}

interface OverduePayment {
  id: string
  quote_id: string
  amount: number
  due_date: string
  status: 'pending' | 'overdue' | 'paid'
  client_name: string
  client_phone: string
  client_email: string
  quote_total: number
  quote_paid_amount: number
  remaining_balance: number
  days_overdue: number
  reminder_count: number
  last_reminder_date?: string
}

interface PaymentReminder {
  payment: OverduePayment
  type: 'before_due' | 'overdue' | 'follow_up'
  days: number
  message: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
}

const DEFAULT_CONFIG: PaymentReminderConfig = {
  daysBeforeDue: [3, 1], // 3 días y 1 día antes
  daysAfterDue: [1, 3, 7, 14], // 1, 3, 7 y 14 días después
  maxReminders: 6,
  adminPhoneNumber: process.env.ADMIN_PHONE_NUMBER || '',
}

/**
 * Plantillas de mensajes para recordatorios de pagos
 */
const paymentReminderTemplates = {
  beforeDue: {
    3: (clientName: string, amount: number, dueDate: string) => 
      `💳 *Recordatorio de Próximo Pago*\n\n` +
      `Hola ${clientName},\n\n` +
      `Te recordamos que tienes un pago de *$${amount.toFixed(2)}* que vence en *3 días* (${dueDate}).\n\n` +
      `📅 *Fecha de vencimiento:* ${dueDate}\n` +
      `💰 *Monto:* $${amount.toFixed(2)}\n\n` +
      `Puedes realizar tu pago mediante los métodos habituales. Si tienes alguna pregunta, no dudes en contactarnos.\n\n` +
      `¡Gracias por tu puntualidad! 🙏`,
    
    1: (clientName: string, amount: number, dueDate: string) => 
      `⚠️ *Recordatorio Urgente de Pago*\n\n` +
      `Hola ${clientName},\n\n` +
      `Te recordamos que tienes un pago de *$${amount.toFixed(2)}* que vence *mañana* (${dueDate}).\n\n` +
      `📅 *Fecha de vencimiento:* ${dueDate}\n` +
      `💰 *Monto:* $${amount.toFixed(2)}\n\n` +
      `Por favor realiza tu pago a la brevedad para evitar recargos. Si necesitas ayuda, estamos para asistirte.\n\n` +
      `¡Gracias! 🙏`,
  },
  
  overdue: {
    1: (clientName: string, amount: number, daysOverdue: number) => 
      `🚨 *Pago Vencido - Acción Requerida*\n\n` +
      `Hola ${clientName},\n\n` +
      `Te informamos que tienes un pago vencido de *$${amount.toFixed(2)}* desde hace *${daysOverdue} día(s)*.\n\n` +
      `💰 *Monto vencido:* $${amount.toFixed(2)}\n` +
      `📅 *Días de retraso:* ${daysOverdue}\n\n` +
      `Es importante que regularices tu pago lo antes posible para evitar recargos y suspensiones del servicio.\n\n` +
      `Si ya realizaste el pago, por favor ignora este mensaje y envíanos el comprobante.\n\n` +
      `Gracias por tu comprensión.`,
    
    3: (clientName: string, amount: number, daysOverdue: number) => 
      `🔴 *Pago Vencido - Seguimiento*\n\n` +
      `Hola ${clientName},\n\n` +
      `Tu pago de *$${amount.toFixed(2)}* sigue vencido hace *${daysOverdue} días*.\n\n` +
      `⚠️ *Estado:* Vencido\n` +
      `💰 *Monto:* $${amount.toFixed(2)}\n` +
      `📅 *Días de retraso:* ${daysOverdue}\n\n` +
      `Por favor contactanos urgentemente para regularizar tu situación. Podemos ofrecer opciones de pago si lo necesitas.\n\n` +
      `Tu pago es muy importante para nosotros.`,
    
    7: (clientName: string, amount: number, daysOverdue: number) => 
      `🔴 *URGENTE - Pago Muy Vencido*\n\n` +
      `Hola ${clientName},\n\n` +
      `Tu pago de *$${amount.toFixed(2)}* tiene *${daysOverdue} días* de retraso.\n\n` +
      `⚠️ *ADVERTENCIA:* Este retraso prolongado puede afectar tu historial y servicios.\n` +
      `💰 *Deuda total:* $${amount.toFixed(2)}\n` +
      `📅 *Días vencido:* ${daysOverdue}\n\n` +
      `Es crucial que nos contactes hoy mismo para resolver esta situación. Temos opciones disponibles.\n\n` +
      `Por favor, no ignores este mensaje.`,
    
    14: (clientName: string, amount: number, daysOverdue: number) => 
      `🚨 *ÚLTIMA ADVERTENCIA - Pago Críticamente Vencido*\n\n` +
      `Hola ${clientName},\n\n` +
      `Tu pago de *$${amount.toFixed(2)}* está *${daysOverdue} días* vencido.\n\n` +
      `⚠️ *ESTADO CRÍTICO:* Se tomarán acciones inmediatas si no regularizas hoy.\n` +
      `💰 *Deuda:* $${amount.toFixed(2)}\n` +
      `📅 *Días vencido:* ${daysOverdue}\n\n` +
      `Esta es tu última oportunidad para resolverlo voluntariamente. Contactanos inmediatamente.\n\n` +
      `Acciones inmediatas requeridas.`,
  },
  
  admin: {
    overdueReport: (overduePayments: OverduePayment[], totalAmount: number) => 
      `📊 *Reporte Diario de Pagos Vencidos*\n\n` +
      `Resumen de pagos vencidos al ${format(new Date(), 'dd/MM/yyyy')}:\n\n` +
      `📈 *Estadísticas:*\n` +
      `• Pagos vencidos: ${overduePayments.length}\n` +
      `• Monto total vencido: $${totalAmount.toFixed(2)}\n` +
      `• Promedio por pago: $${(totalAmount / overduePayments.length).toFixed(2)}\n\n` +
      `📋 *Detalle:*\n${overduePayments.map(p => 
        `• ${p.client_name}: $${p.amount.toFixed(2)} (${p.days_overdue} días)`
      ).join('\n')}\n\n` +
      `🔗 *Acción recomendada:* Revisar y gestionar pagos críticos`,
    
    weeklySummary: (weeklyStats: any) => 
      `📈 *Reporte Semanal de Pagos*\n\n` +
      `Período: ${format(addDays(new Date(), -7), 'dd/MM/yyyy')} - ${format(new Date(), 'dd/MM/yyyy')}\n\n` +
      `📊 *Resumen:*\n` +
      `• Pagos recibidos: ${weeklyStats.paidCount}\n` +
      `• Total cobrado: $${weeklyStats.totalPaid.toFixed(2)}\n` +
      `• Pagos vencidos: ${weeklyStats.overdueCount}\n` +
      `• Total vencido: $${weeklyStats.totalOverdue.toFixed(2)}\n` +
      `• Tasa de pago: ${weeklyStats.paymentRate}%\n\n` +
      `🎯 *Métricas clave:*\n` +
      `• Ticket promedio: $${weeklyStats.averageTicket.toFixed(2)}\n` +
      `• Días promedio de pago: ${weeklyStats.averagePaymentDays}\n\n` +
      `Revisa el dashboard completo para más detalles.`,
  },
}

/**
 * Obtiene todos los pagos pendientes y vencidos
 */
async function getPendingPayments(): Promise<OverduePayment[]> {
  const supabase = createClient()
  
  try {
    const { data: payments, error } = await supabase
      .from('partial_payments')
      .select(`
        *,
        quotes!inner(
          id,
          total_amount,
          paid_amount,
          clients!inner(
            name,
            phone,
            email
          )
        )
      `)
      .in('status', ['pending', 'overdue'])
      .order('due_date', { ascending: true })

    if (error) throw error

    const today = startOfDay(new Date())
    
    return (payments || []).map(payment => {
      const dueDate = new Date(payment.due_date)
      const daysOverdue = Math.max(0, Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)))
      
      return {
        id: payment.id,
        quote_id: payment.quote_id,
        amount: payment.amount,
        due_date: payment.due_date,
        status: daysOverdue > 0 ? 'overdue' as const : 'pending' as const,
        client_name: payment.quotes.clients.name,
        client_phone: payment.quotes.clients.phone,
        client_email: payment.quotes.clients.email,
        quote_total: payment.quotes.total_amount,
        quote_paid_amount: payment.quotes.paid_amount,
        remaining_balance: payment.quotes.total_amount - payment.quotes.paid_amount,
        days_overdue: daysOverdue,
        reminder_count: payment.reminder_count || 0,
        last_reminder_date: payment.last_reminder_date,
      }
    })
  } catch (error) {
    logger.error('PaymentReminders', 'Error fetching pending payments', error as Error)
    return []
  }
}

/**
 * Determina qué recordatorios enviar
 */
function generatePaymentReminders(payments: OverduePayment[], config: PaymentReminderConfig): PaymentReminder[] {
  const reminders: PaymentReminder[] = []
  const today = startOfDay(new Date())
  
  payments.forEach(payment => {
    const dueDate = new Date(payment.due_date)
    
    // Recordatorios antes del vencimiento
    config.daysBeforeDue.forEach(days => {
      const reminderDate = addDays(dueDate, -days)
      if (isSameDay(reminderDate, today) && payment.reminder_count < config.maxReminders) {
        const template = paymentReminderTemplates.beforeDue[days as keyof typeof paymentReminderTemplates.beforeDue]
        if (template) {
          reminders.push({
            payment,
            type: 'before_due',
            days,
            message: template(payment.client_name, payment.amount, format(dueDate, 'dd/MM/yyyy')),
            priority: days === 1 ? 'high' : 'medium',
          })
        }
      }
    })
    
    // Recordatorios después del vencimiento
    if (payment.days_overdue > 0) {
      config.daysAfterDue.forEach(days => {
        if (payment.days_overdue === days && payment.reminder_count < config.maxReminders) {
          const template = paymentReminderTemplates.overdue[days as keyof typeof paymentReminderTemplates.overdue]
          if (template) {
            const priority = days >= 7 ? 'urgent' : days >= 3 ? 'high' : 'medium'
            reminders.push({
              payment,
              type: 'overdue',
              days,
              message: template(payment.client_name, payment.amount, payment.days_overdue),
              priority,
            })
          }
        }
      })
    }
  })
  
  return reminders
}

/**
 * Envía recordatorios de pagos
 */
async function sendPaymentReminders(reminders: PaymentReminder[]): Promise<void> {
  const supabase = createClient()
  
  for (const reminder of reminders) {
    try {
      // Enviar WhatsApp al cliente
      if (reminder.payment.client_phone) {
        await sendWhatsAppWithRetry({
          to: reminder.payment.client_phone,
          message: reminder.message,
        })
        
        logger.info('PaymentReminders', 'Reminder sent to client', {
          paymentId: reminder.payment.id,
          clientName: reminder.payment.client_name,
          type: reminder.type,
          days: reminder.days,
        })
      }
      
      // Actualizar contador de recordatorios
      await supabase
        .from('partial_payments')
        .update({
          reminder_count: reminder.payment.reminder_count + 1,
          last_reminder_date: new Date().toISOString(),
        })
        .eq('id', reminder.payment.id)
        
    } catch (error) {
      logger.error('PaymentReminders', 'Error sending reminder', error as Error, {
        paymentId: reminder.payment.id,
        clientName: reminder.payment.client_name,
      })
    }
  }
}

/**
 * Envía reporte diario al administrador
 */
async function sendDailyAdminReport(overduePayments: OverduePayment[]): Promise<void> {
  if (!DEFAULT_CONFIG.adminPhoneNumber || overduePayments.length === 0) {
    return
  }
  
  try {
    const totalAmount = overduePayments.reduce((sum, p) => sum + p.amount, 0)
    const message = paymentReminderTemplates.admin.overdueReport(overduePayments, totalAmount)
    
    await sendWhatsAppWithRetry({
      to: DEFAULT_CONFIG.adminPhoneNumber,
      message,
    })
    
    logger.info('PaymentReminders', 'Daily admin report sent', {
      overdueCount: overduePayments.length,
      totalAmount,
    })
  } catch (error) {
    logger.error('PaymentReminders', 'Error sending admin report', error as Error)
  }
}

/**
 * Función principal de recordatorios de pagos
 */
export async function processPaymentReminders(): Promise<void> {
  try {
    logger.info('PaymentReminders', 'Starting payment reminders process')
    
    // Obtener pagos pendientes
    const payments = await getPendingPayments()
    
    // Generar recordatorios
    const reminders = generatePaymentReminders(payments, DEFAULT_CONFIG)
    
    // Enviar recordatorios
    if (reminders.length > 0) {
      await sendPaymentReminders(reminders)
      logger.info('PaymentReminders', `Sent ${reminders.length} payment reminders`)
    }
    
    // Enviar reporte diario al admin
    const overduePayments = payments.filter(p => p.days_overdue > 0)
    await sendDailyAdminReport(overduePayments)
    
    logger.info('PaymentReminders', 'Payment reminders process completed', {
      totalPayments: payments.length,
      overduePayments: overduePayments.length,
      remindersSent: reminders.length,
    })
  } catch (error) {
    logger.error('PaymentReminders', 'Error in payment reminders process', error as Error)
  }
}

/**
 * Función auxiliar para comparar fechas
 */
function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  )
}

/**
 * Endpoint API para ejecutar recordatorios manualmente
 */
export async function triggerPaymentReminders(): Promise<{ success: boolean; message: string }> {
  try {
    await processPaymentReminders()
    return {
      success: true,
      message: 'Recordatorios de pagos procesados exitosamente',
    }
  } catch (error) {
    logger.error('PaymentReminders', 'Manual trigger failed', error as Error)
    return {
      success: false,
      message: 'Error al procesar recordatorios de pagos',
    }
  }
}
