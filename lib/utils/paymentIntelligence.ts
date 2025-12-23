/**
 * Utilidades para pagos inteligentes
 * Anticipos, fechas límite, recordatorios, reportes
 */

import { createClient } from '@/utils/supabase/client'
import { logger } from './logger'

export interface OverduePayment {
  paymentId: string
  quoteId: string
  amount: number
  dueDate: string
  daysOverdue: number
  clientName: string
}

export interface UpcomingPayment {
  paymentId: string
  quoteId: string
  amount: number
  dueDate: string
  daysUntilDue: number
  clientName: string
}

export interface FinancialReport {
  quoteId: string
  status: string
  totalAmount: number
  totalPaid: number
  depositPaid: number
  balanceDue: number
  paymentsCount: number
  depositsCount: number
  estimatedProfit: number
  estimatedCommission: number
  createdAt: string
}

/**
 * Calcula anticipo requerido
 */
export async function calculateRequiredDeposit(
  quoteId: string,
  depositPercent: number = 30
): Promise<number> {
  try {
    const supabase = createClient()
    
    const { data, error } = await supabase.rpc('calculate_required_deposit', {
      p_quote_id: quoteId,
      p_deposit_percent: depositPercent,
    })
    
    if (error) {
      logger.error('paymentIntelligence', 'Error calculating deposit', error as Error, {
        quoteId,
        depositPercent,
      })
      throw error
    }
    
    return Number(data) || 0
  } catch (error) {
    logger.error('paymentIntelligence', 'Failed to calculate required deposit', error as Error)
    return 0
  }
}

/**
 * Obtiene pagos vencidos
 */
export async function getOverduePayments(userId?: string): Promise<OverduePayment[]> {
  try {
    const supabase = createClient()
    
    const { data, error } = await supabase.rpc('get_overdue_payments', {
      p_user_id: userId || null,
    })
    
    if (error) {
      logger.error('paymentIntelligence', 'Error getting overdue payments', error as Error, {
        userId,
      })
      return []
    }
    
    return (data || []) as OverduePayment[]
  } catch (error) {
    logger.error('paymentIntelligence', 'Failed to get overdue payments', error as Error)
    return []
  }
}

/**
 * Obtiene pagos próximos a vencer
 */
export async function getUpcomingPayments(
  daysAhead: number = 7,
  userId?: string
): Promise<UpcomingPayment[]> {
  try {
    const supabase = createClient()
    
    const { data, error } = await supabase.rpc('get_upcoming_payments', {
      p_days_ahead: daysAhead,
      p_user_id: userId || null,
    })
    
    if (error) {
      logger.error('paymentIntelligence', 'Error getting upcoming payments', error as Error, {
        daysAhead,
        userId,
      })
      return []
    }
    
    return (data || []) as UpcomingPayment[]
  } catch (error) {
    logger.error('paymentIntelligence', 'Failed to get upcoming payments', error as Error)
    return []
  }
}

/**
 * Obtiene reporte financiero
 */
export async function getFinancialReport(userId?: string): Promise<FinancialReport[]> {
  try {
    const supabase = createClient()
    
    let query = supabase.from('financial_reports').select('*')
    
    if (userId) {
      query = query.eq('vendor_id', userId)
    }
    
    const { data, error } = await query.order('created_at', { ascending: false })
    
    if (error) {
      logger.error('paymentIntelligence', 'Error getting financial report', error as Error, {
        userId,
      })
      return []
    }
    
    return (data || []) as FinancialReport[]
  } catch (error) {
    logger.error('paymentIntelligence', 'Failed to get financial report', error as Error)
    return []
  }
}

/**
 * Calcula resumen financiero
 */
export async function calculateFinancialSummary(userId?: string): Promise<{
  totalSales: number
  totalPaid: number
  totalPending: number
  totalProfit: number
  totalCommissions: number
  overduePayments: number
  upcomingPayments: number
}> {
  const reports = await getFinancialReport(userId)
  const overdue = await getOverduePayments(userId)
  const upcoming = await getUpcomingPayments(7, userId)
  
  const confirmedReports = reports.filter(r => r.status === 'APPROVED' || r.status === 'confirmed')
  
  return {
    totalSales: confirmedReports.reduce((sum, r) => sum + Number(r.totalAmount || 0), 0),
    totalPaid: confirmedReports.reduce((sum, r) => sum + Number(r.totalPaid || 0), 0),
    totalPending: confirmedReports.reduce((sum, r) => sum + Number(r.balanceDue || 0), 0),
    totalProfit: confirmedReports.reduce((sum, r) => sum + Number(r.estimatedProfit || 0), 0),
    totalCommissions: confirmedReports.reduce((sum, r) => sum + Number(r.estimatedCommission || 0), 0),
    overduePayments: overdue.length,
    upcomingPayments: upcoming.length,
  }
}

