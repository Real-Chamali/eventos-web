/**
 * Utilidades para precios inteligentes
 * Aplica reglas automáticas, descuentos y protege márgenes
 */

import { createClient } from '@/utils/supabase/client'
import { logger } from './logger'

export interface PricingRule {
  serviceId: string
  quantity: number
  basePrice: number
  costPrice: number
  eventDate?: string
}

export interface CalculatedPrice {
  basePrice: number
  discountPercent: number
  finalPrice: number
  marginPercent: number
  isValid: boolean
  warnings: string[]
}

/**
 * Calcula precio automático aplicando reglas
 */
export async function calculateIntelligentPrice(
  serviceId: string,
  quantity: number,
  eventDate?: string
): Promise<number> {
  try {
    const supabase = createClient()
    
    const { data, error } = await supabase.rpc('calculate_service_price_with_rules', {
      p_service_id: serviceId,
      p_quantity: quantity,
      p_event_date: eventDate || null,
    })
    
    if (error) {
      logger.error('intelligentPricing', 'Error calculating price', error as Error, {
        serviceId,
        quantity,
        eventDate,
      })
      throw error
    }
    
    return Number(data) || 0
  } catch (error) {
    logger.error('intelligentPricing', 'Failed to calculate intelligent price', error as Error)
    throw error
  }
}

/**
 * Valida margen mínimo de un template
 */
export async function validateTemplateMargin(
  templateId: string,
  totalPrice: number
): Promise<boolean> {
  try {
    const supabase = createClient()
    
    const { data, error } = await supabase.rpc('validate_template_margin', {
      p_template_id: templateId,
      p_total_price: totalPrice,
    })
    
    if (error) {
      logger.error('intelligentPricing', 'Error validating margin', error as Error, {
        templateId,
        totalPrice,
      })
      return false
    }
    
    return Boolean(data)
  } catch (error) {
    logger.error('intelligentPricing', 'Failed to validate template margin', error as Error)
    return false
  }
}

/**
 * Calcula precio completo con validaciones
 */
export async function calculateFullPrice(
  rules: PricingRule[]
): Promise<CalculatedPrice[]> {
  const results: CalculatedPrice[] = []
  
  for (const rule of rules) {
    try {
      const finalPrice = await calculateIntelligentPrice(
        rule.serviceId,
        rule.quantity,
        rule.eventDate
      )
      
      const discountPercent = finalPrice < rule.basePrice
        ? ((rule.basePrice - finalPrice) / rule.basePrice) * 100
        : 0
      
      const marginPercent = rule.costPrice > 0
        ? ((finalPrice - rule.costPrice) / finalPrice) * 100
        : 0
      
      const warnings: string[] = []
      if (marginPercent < 10) {
        warnings.push(`Margen muy bajo (${marginPercent.toFixed(1)}%). Considera aumentar el precio.`)
      }
      if (marginPercent < 0) {
        warnings.push('⚠️ PÉRDIDA: El precio es menor al costo.')
      }
      
      results.push({
        basePrice: rule.basePrice,
        discountPercent,
        finalPrice,
        marginPercent,
        isValid: marginPercent >= 0,
        warnings,
      })
    } catch (error) {
      logger.error('intelligentPricing', 'Error calculating price for rule', error as Error, {
        rule,
      })
      results.push({
        basePrice: rule.basePrice,
        discountPercent: 0,
        finalPrice: rule.basePrice,
        marginPercent: 0,
        isValid: false,
        warnings: ['Error al calcular precio automático'],
      })
    }
  }
  
  return results
}

