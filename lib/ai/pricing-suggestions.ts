/**
 * AI Features - Sugerencias Inteligentes de Precios
 * Analiza datos históricos para sugerir precios óptimos
 */

export interface PricingSuggestion {
  serviceId: string
  serviceName: string
  currentPrice: number
  suggestedPrice: number
  confidence: number // 0-1
  reasoning: string
}

export interface HistoricalData {
  serviceId: string
  prices: number[]
  quantities: number[]
  conversionRates: number[]
}

export function analyzePricingTrends(data: HistoricalData[]): PricingSuggestion[] {
  const suggestions: PricingSuggestion[] = []

  data.forEach((item) => {
    if (item.prices.length < 3) {
      // No hay suficientes datos
      return
    }

    const avgPrice = item.prices.reduce((sum, p) => sum + p, 0) / item.prices.length
    const currentPrice = item.prices[item.prices.length - 1]
    const avgConversion = item.conversionRates.reduce((sum, r) => sum + r, 0) / item.conversionRates.length

    // Lógica simple de sugerencia (en producción, usar ML)
    let suggestedPrice = currentPrice
    let confidence = 0.5
    let reasoning = ''

    if (avgConversion < 0.3 && currentPrice > avgPrice * 1.1) {
      // Precio alto, conversión baja - sugerir reducir
      suggestedPrice = avgPrice * 0.95
      confidence = 0.7
      reasoning = 'Conversión baja con precio alto. Reducir precio puede aumentar conversiones.'
    } else if (avgConversion > 0.7 && currentPrice < avgPrice * 0.9) {
      // Conversión alta, precio bajo - sugerir aumentar
      suggestedPrice = avgPrice * 1.05
      confidence = 0.8
      reasoning = 'Alta conversión con precio bajo. Aumentar precio puede maximizar ingresos.'
    } else if (currentPrice < avgPrice * 0.8) {
      // Precio muy por debajo del promedio
      suggestedPrice = avgPrice * 0.95
      confidence = 0.6
      reasoning = 'Precio por debajo del promedio histórico. Considerar ajuste.'
    }

    if (suggestedPrice !== currentPrice) {
      suggestions.push({
        serviceId: item.serviceId,
        serviceName: '', // Se llenará desde el contexto
        currentPrice,
        suggestedPrice: Math.round(suggestedPrice * 100) / 100,
        confidence,
        reasoning,
      })
    }
  })

  return suggestions.sort((a, b) => b.confidence - a.confidence)
}

export function suggestOptimalQuantity(
  serviceId: string,
  historicalQuantities: number[],
  targetRevenue: number,
  currentPrice: number
): number {
  if (historicalQuantities.length === 0) {
    return 1
  }

  const avgQuantity = historicalQuantities.reduce((sum, q) => sum + q, 0) / historicalQuantities.length
  const optimalQuantity = Math.ceil(targetRevenue / currentPrice)

  // Balance entre promedio histórico y cantidad óptima
  return Math.round((avgQuantity + optimalQuantity) / 2)
}

