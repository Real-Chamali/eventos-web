/**
 * Utilidades para Dashboard del Dueño
 * KPIs, análisis y control total
 */

import { createClient } from '@/utils/supabase/client'
import { logger } from './logger'

export interface OwnerKPIs {
  monthlySales: number
  moneyToCollect: number
  eventsNext7Days: number
  eventsNext30Days: number
  eventsNext90Days: number
  eventsAtRisk: number
  confirmedEventsCount: number
  eventsAtRiskCount: number
}

export interface VendorPerformance {
  vendorId: string
  vendorName: string
  role: string
  confirmedQuotes: number
  draftQuotes: number
  totalSales: number
  monthlySales: number
  averageSale: number
  conversionRate: number
  totalCommissions: number
}

export interface MonthlyComparison {
  month: string
  confirmedQuotes: number
  totalSales: number
  totalProfit: number
  uniqueClients: number
}

export interface EventAtRisk {
  eventId: string
  quoteId: string
  clientName: string
  totalAmount: number
  paidAmount: number
  balanceDue: number
  daysOverdue: number
  riskLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
}

export interface CashFlowSummary {
  reportDate: string
  depositsReceived: number
  paymentsReceived: number
  totalReceived: number
  depositsPending: number
  paymentsDue30Days: number
  paymentsDue90Days: number
  paymentsOverdue: number
  totalBalanceDue: number
}

/**
 * Obtiene KPIs del dashboard del dueño
 */
export async function getOwnerKPIs(): Promise<OwnerKPIs> {
  try {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('owner_dashboard_kpis')
      .select('*')
      .single()
    
    if (error) {
      logger.error('ownerDashboard', 'Error getting KPIs', error as Error)
      throw error
    }
    
    return {
      monthlySales: Number(data?.monthly_sales || 0),
      moneyToCollect: Number(data?.money_to_collect || 0),
      eventsNext7Days: Number(data?.events_next_7_days || 0),
      eventsNext30Days: Number(data?.events_next_30_days || 0),
      eventsNext90Days: Number(data?.events_next_90_days || 0),
      eventsAtRisk: Number(data?.events_at_risk || 0),
      confirmedEventsCount: Number(data?.confirmed_events_count || 0),
      eventsAtRiskCount: Number(data?.events_at_risk_count || 0),
    }
  } catch (error) {
    logger.error('ownerDashboard', 'Failed to get owner KPIs', error as Error)
    return {
      monthlySales: 0,
      moneyToCollect: 0,
      eventsNext7Days: 0,
      eventsNext30Days: 0,
      eventsNext90Days: 0,
      eventsAtRisk: 0,
      confirmedEventsCount: 0,
      eventsAtRiskCount: 0,
    }
  }
}

/**
 * Obtiene rendimiento de vendedores
 */
export async function getVendorPerformance(): Promise<VendorPerformance[]> {
  try {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('vendor_performance')
      .select('*')
      .order('total_sales', { ascending: false })
    
    if (error) {
      logger.error('ownerDashboard', 'Error getting vendor performance', error as Error)
      return []
    }
    
    return (data || []).map((v: any) => ({
      vendorId: v.vendor_id,
      vendorName: v.vendor_name || 'Sin nombre',
      role: v.role,
      confirmedQuotes: Number(v.confirmed_quotes || 0),
      draftQuotes: Number(v.draft_quotes || 0),
      totalSales: Number(v.total_sales || 0),
      monthlySales: Number(v.monthly_sales || 0),
      averageSale: Number(v.average_sale || 0),
      conversionRate: Number(v.conversion_rate || 0),
      totalCommissions: Number(v.total_commissions || 0),
    }))
  } catch (error) {
    logger.error('ownerDashboard', 'Failed to get vendor performance', error as Error)
    return []
  }
}

/**
 * Obtiene comparación mensual
 */
export async function getMonthlyComparison(): Promise<MonthlyComparison[]> {
  try {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('monthly_comparison')
      .select('*')
      .order('month', { ascending: false })
      .limit(12)
    
    if (error) {
      logger.error('ownerDashboard', 'Error getting monthly comparison', error as Error)
      return []
    }
    
    return (data || []).map((m: any) => ({
      month: m.month,
      confirmedQuotes: Number(m.confirmed_quotes || 0),
      totalSales: Number(m.total_sales || 0),
      totalProfit: Number(m.total_profit || 0),
      uniqueClients: Number(m.unique_clients || 0),
    }))
  } catch (error) {
    logger.error('ownerDashboard', 'Failed to get monthly comparison', error as Error)
    return []
  }
}

/**
 * Obtiene eventos en riesgo
 */
export async function getEventsAtRisk(): Promise<EventAtRisk[]> {
  try {
    const supabase = createClient()
    
    const { data, error } = await supabase.rpc('get_events_at_risk')
    
    if (error) {
      logger.error('ownerDashboard', 'Error getting events at risk', error as Error)
      return []
    }
    
    return (data || []).map((e: any) => ({
      eventId: e.event_id,
      quoteId: e.quote_id,
      clientName: e.client_name,
      totalAmount: Number(e.total_amount || 0),
      paidAmount: Number(e.paid_amount || 0),
      balanceDue: Number(e.balance_due || 0),
      daysOverdue: Number(e.days_overdue || 0),
      riskLevel: e.risk_level,
    }))
  } catch (error) {
    logger.error('ownerDashboard', 'Failed to get events at risk', error as Error)
    return []
  }
}

/**
 * Obtiene resumen de flujo de efectivo
 */
export async function getCashFlowSummary(): Promise<CashFlowSummary | null> {
  try {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('cash_flow_summary')
      .select('*')
      .single()
    
    if (error) {
      logger.error('ownerDashboard', 'Error getting cash flow summary', error as Error)
      return null
    }
    
    return {
      reportDate: data?.report_date || new Date().toISOString(),
      depositsReceived: Number(data?.deposits_received || 0),
      paymentsReceived: Number(data?.payments_received || 0),
      totalReceived: Number(data?.total_received || 0),
      depositsPending: Number(data?.deposits_pending || 0),
      paymentsDue30Days: Number(data?.payments_due_30_days || 0),
      paymentsDue90Days: Number(data?.payments_due_90_days || 0),
      paymentsOverdue: Number(data?.payments_overdue || 0),
      totalBalanceDue: Number(data?.total_balance_due || 0),
    }
  } catch (error) {
    logger.error('ownerDashboard', 'Failed to get cash flow summary', error as Error)
    return null
  }
}

/**
 * Obtiene resumen de descuentos por cotización
 */
export async function getQuoteDiscountSummary(quoteId: string): Promise<{
  originalTotal: number
  totalDiscounts: number
  finalTotal: number
  discountCount: number
  lastDiscountDate: string | null
  authorizedByNames: string | null
  discountReasons: string | null
} | null> {
  try {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('quote_discount_summary')
      .select('*')
      .eq('quote_id', quoteId)
      .single()
    
    if (error) {
      logger.error('ownerDashboard', 'Error getting discount summary', error as Error)
      return null
    }
    
    return {
      originalTotal: Number(data?.original_total || 0),
      totalDiscounts: Number(data?.total_discounts || 0),
      finalTotal: Number(data?.final_total || 0),
      discountCount: Number(data?.discount_count || 0),
      lastDiscountDate: data?.last_discount_date || null,
      authorizedByNames: data?.authorized_by_names || null,
      discountReasons: data?.discount_reasons || null,
    }
  } catch (error) {
    logger.error('ownerDashboard', 'Failed to get discount summary', error as Error)
    return null
  }
}

