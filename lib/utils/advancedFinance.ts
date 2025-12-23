/**
 * Utilidades para Análisis Financiero Avanzado
 * Acceso a funciones SQL avanzadas para análisis completo
 */

import { createClient } from '@/utils/supabase/client'
import { logger } from './logger'

export interface ServiceProfitability {
  serviceId: string
  serviceName: string
  basePrice: number
  costPrice: number
  unitProfit: number
  marginPercent: number
  timesSold: number
  totalQuantitySold: number
  totalRevenue: number
  totalProfit: number
  averageSalePrice: number
  minSalePrice: number
  maxSalePrice: number
}

export interface ClientProfitability {
  clientId: string
  clientName: string
  email: string | null
  totalQuotes: number
  confirmedQuotes: number
  totalSales: number
  totalProfit: number
  averageQuoteValue: number
  totalPaid: number
  totalPending: number
  lastQuoteDate: string | null
}

export interface CashFlowProjection {
  date: string
  dayType: 'weekday' | 'weekend'
  depositsReceived: number
  paymentsReceived: number
  totalInflow: number
  paymentsDue: number
  depositsDue: number
  totalOutflow: number
  netFlow: number
  cumulativeBalance: number
}

export interface MonthlyComparison {
  month: string
  monthName: string
  confirmedQuotes: number
  totalSales: number
  totalProfit: number
  uniqueClients: number
  salesChangePercent: number
  profitChangePercent: number
  quotesChangePercent: number
  marginPercent: number
}

export interface ProfitabilityAnalysis {
  totalRevenue: number
  totalCost: number
  totalProfit: number
  marginPercent: number
  totalQuotes: number
  averageQuoteValue: number
  averageProfitPerQuote: number
  topServiceId: string | null
  topServiceName: string | null
  topServiceProfit: number
  topClientId: string | null
  topClientName: string | null
  topClientRevenue: number
}

export interface FinancialAlert {
  alertType: string
  alertLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'WARNING'
  alertMessage: string
  alertValue: number
  alertDate: string
}

export interface ExecutiveFinancialSummary {
  reportDate: string
  monthlySales: number
  yearlySales: number
  monthlyProfit: number
  yearlyProfit: number
  monthlyPayments: number
  yearlyPayments: number
  totalPending: number
  totalOverdue: number
  monthlyQuotes: number
  monthlyClients: number
  averageQuoteValue: number
}

/**
 * Obtiene rentabilidad por servicio
 */
export async function getServiceProfitability(): Promise<ServiceProfitability[]> {
  try {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('service_profitability')
      .select('*')
      .order('total_profit', { ascending: false })
    
    if (error) {
      logger.error('advancedFinance', 'Error getting service profitability', error as Error)
      return []
    }
    
    return (data || []).map((s: any) => ({
      serviceId: s.service_id,
      serviceName: s.service_name,
      basePrice: Number(s.base_price || 0),
      costPrice: Number(s.cost_price || 0),
      unitProfit: Number(s.unit_profit || 0),
      marginPercent: Number(s.margin_percent || 0),
      timesSold: Number(s.times_sold || 0),
      totalQuantitySold: Number(s.total_quantity_sold || 0),
      totalRevenue: Number(s.total_revenue || 0),
      totalProfit: Number(s.total_profit || 0),
      averageSalePrice: Number(s.average_sale_price || 0),
      minSalePrice: Number(s.min_sale_price || 0),
      maxSalePrice: Number(s.max_sale_price || 0),
    }))
  } catch (error) {
    logger.error('advancedFinance', 'Failed to get service profitability', error as Error)
    return []
  }
}

/**
 * Obtiene rentabilidad por cliente
 */
export async function getClientProfitability(): Promise<ClientProfitability[]> {
  try {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('client_profitability')
      .select('*')
      .order('total_sales', { ascending: false })
      .limit(50)
    
    if (error) {
      logger.error('advancedFinance', 'Error getting client profitability', error as Error)
      return []
    }
    
    return (data || []).map((c: any) => ({
      clientId: c.client_id,
      clientName: c.client_name,
      email: c.email,
      totalQuotes: Number(c.total_quotes || 0),
      confirmedQuotes: Number(c.confirmed_quotes || 0),
      totalSales: Number(c.total_sales || 0),
      totalProfit: Number(c.total_profit || 0),
      averageQuoteValue: Number(c.average_quote_value || 0),
      totalPaid: Number(c.total_paid || 0),
      totalPending: Number(c.total_pending || 0),
      lastQuoteDate: c.last_quote_date,
    }))
  } catch (error) {
    logger.error('advancedFinance', 'Failed to get client profitability', error as Error)
    return []
  }
}

/**
 * Obtiene proyección avanzada de flujo de efectivo
 */
export async function getAdvancedCashFlowProjection(
  daysAhead: number = 90
): Promise<CashFlowProjection[]> {
  try {
    const supabase = createClient()
    
    const { data, error } = await supabase.rpc('get_advanced_cash_flow_projection', {
      p_days_ahead: daysAhead,
    })
    
    if (error) {
      logger.error('advancedFinance', 'Error getting cash flow projection', error as Error, {
        daysAhead,
      })
      return []
    }
    
    return (data || []).map((cf: any) => ({
      date: cf.date,
      dayType: cf.day_type as 'weekday' | 'weekend',
      depositsReceived: Number(cf.deposits_received || 0),
      paymentsReceived: Number(cf.payments_received || 0),
      totalInflow: Number(cf.total_inflow || 0),
      paymentsDue: Number(cf.payments_due || 0),
      depositsDue: Number(cf.deposits_due || 0),
      totalOutflow: Number(cf.total_outflow || 0),
      netFlow: Number(cf.net_flow || 0),
      cumulativeBalance: Number(cf.cumulative_balance || 0),
    }))
  } catch (error) {
    logger.error('advancedFinance', 'Failed to get cash flow projection', error as Error)
    return []
  }
}

/**
 * Obtiene comparativa mensual con porcentajes
 */
export async function getMonthlyComparisonWithPercentages(
  monthsBack: number = 12
): Promise<MonthlyComparison[]> {
  try {
    const supabase = createClient()
    
    const { data, error } = await supabase.rpc('get_monthly_comparison_with_percentages', {
      p_months_back: monthsBack,
    })
    
    if (error) {
      logger.error('advancedFinance', 'Error getting monthly comparison', error as Error, {
        monthsBack,
      })
      return []
    }
    
    return (data || []).map((m: any) => ({
      month: m.month,
      monthName: m.month_name,
      confirmedQuotes: Number(m.confirmed_quotes || 0),
      totalSales: Number(m.total_sales || 0),
      totalProfit: Number(m.total_profit || 0),
      uniqueClients: Number(m.unique_clients || 0),
      salesChangePercent: Number(m.sales_change_percent || 0),
      profitChangePercent: Number(m.profit_change_percent || 0),
      quotesChangePercent: Number(m.quotes_change_percent || 0),
      marginPercent: Number(m.margin_percent || 0),
    }))
  } catch (error) {
    logger.error('advancedFinance', 'Failed to get monthly comparison', error as Error)
    return []
  }
}

/**
 * Obtiene análisis de rentabilidad
 */
export async function getProfitabilityAnalysis(
  startDate?: string,
  endDate?: string
): Promise<ProfitabilityAnalysis | null> {
  try {
    const supabase = createClient()
    
    const { data, error } = await supabase.rpc('get_profitability_analysis', {
      p_start_date: startDate || null,
      p_end_date: endDate || null,
    })
    
    if (error) {
      logger.error('advancedFinance', 'Error getting profitability analysis', error as Error, {
        startDate,
        endDate,
      })
      return null
    }
    
    if (!data || data.length === 0) {
      return null
    }
    
    const result = data[0]
    return {
      totalRevenue: Number(result.total_revenue || 0),
      totalCost: Number(result.total_cost || 0),
      totalProfit: Number(result.total_profit || 0),
      marginPercent: Number(result.margin_percent || 0),
      totalQuotes: Number(result.total_quotes || 0),
      averageQuoteValue: Number(result.average_quote_value || 0),
      averageProfitPerQuote: Number(result.average_profit_per_quote || 0),
      topServiceId: result.top_service_id,
      topServiceName: result.top_service_name,
      topServiceProfit: Number(result.top_service_profit || 0),
      topClientId: result.top_client_id,
      topClientName: result.top_client_name,
      topClientRevenue: Number(result.top_client_revenue || 0),
    }
  } catch (error) {
    logger.error('advancedFinance', 'Failed to get profitability analysis', error as Error)
    return null
  }
}

/**
 * Obtiene alertas financieras
 */
export async function getFinancialAlerts(): Promise<FinancialAlert[]> {
  try {
    const supabase = createClient()
    
    const { data, error } = await supabase.rpc('get_financial_alerts')
    
    if (error) {
      logger.error('advancedFinance', 'Error getting financial alerts', error as Error)
      return []
    }
    
    return (data || []).map((a: any) => ({
      alertType: a.alert_type,
      alertLevel: a.alert_level as 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'WARNING',
      alertMessage: a.alert_message,
      alertValue: Number(a.alert_value || 0),
      alertDate: a.alert_date,
    }))
  } catch (error) {
    logger.error('advancedFinance', 'Failed to get financial alerts', error as Error)
    return []
  }
}

/**
 * Obtiene resumen ejecutivo financiero
 */
export async function getExecutiveFinancialSummary(): Promise<ExecutiveFinancialSummary | null> {
  try {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('executive_financial_summary')
      .select('*')
      .single()
    
    if (error) {
      logger.error('advancedFinance', 'Error getting executive summary', error as Error)
      return null
    }
    
    return {
      reportDate: data?.report_date || new Date().toISOString(),
      monthlySales: Number(data?.monthly_sales || 0),
      yearlySales: Number(data?.yearly_sales || 0),
      monthlyProfit: Number(data?.monthly_profit || 0),
      yearlyProfit: Number(data?.yearly_profit || 0),
      monthlyPayments: Number(data?.monthly_payments || 0),
      yearlyPayments: Number(data?.yearly_payments || 0),
      totalPending: Number(data?.total_pending || 0),
      totalOverdue: Number(data?.total_overdue || 0),
      monthlyQuotes: Number(data?.monthly_quotes || 0),
      monthlyClients: Number(data?.monthly_clients || 0),
      averageQuoteValue: Number(data?.average_quote_value || 0),
    }
  } catch (error) {
    logger.error('advancedFinance', 'Failed to get executive summary', error as Error)
    return null
  }
}

