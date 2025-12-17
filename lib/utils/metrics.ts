/**
 * Sistema de métricas y observabilidad
 * Tracking de rendimiento y métricas de negocio
 */

import { logger } from './logger'

export interface PerformanceMetric {
  name: string
  duration: number
  timestamp: number
  metadata?: Record<string, unknown>
}

export interface BusinessMetric {
  type: 'quote_created' | 'quote_confirmed' | 'client_created' | 'event_scheduled'
  value: number
  metadata?: Record<string, unknown>
  timestamp: number
}

class MetricsCollector {
  private performanceMetrics: PerformanceMetric[] = []
  private businessMetrics: BusinessMetric[] = []
  private maxMetrics = 1000 // Limitar memoria
  
  /**
   * Registrar métrica de rendimiento
   */
  trackPerformance(name: string, duration: number, metadata?: Record<string, unknown>) {
    const metric: PerformanceMetric = {
      name,
      duration,
      timestamp: Date.now(),
      metadata,
    }
    
    this.performanceMetrics.push(metric)
    
    // Mantener solo las últimas N métricas
    if (this.performanceMetrics.length > this.maxMetrics) {
      this.performanceMetrics = this.performanceMetrics.slice(-this.maxMetrics)
    }
    
    // Log para debugging
    if (duration > 1000) {
      logger.warn('Metrics', `Slow performance: ${name}`, {
        duration,
        metadata,
      })
    }
  }
  
  /**
   * Registrar métrica de negocio
   */
  trackBusiness(type: BusinessMetric['type'], value: number, metadata?: Record<string, unknown>) {
    const metric: BusinessMetric = {
      type,
      value,
      timestamp: Date.now(),
      metadata,
    }
    
    this.businessMetrics.push(metric)
    
    // Mantener solo las últimas N métricas
    if (this.businessMetrics.length > this.maxMetrics) {
      this.businessMetrics = this.businessMetrics.slice(-this.maxMetrics)
    }
    
    logger.info('Metrics', `Business metric: ${type}`, {
      value,
      metadata,
    })
  }
  
  /**
   * Obtener promedio de rendimiento por nombre
   */
  getAveragePerformance(name: string): number {
    const metrics = this.performanceMetrics.filter((m) => m.name === name)
    if (metrics.length === 0) return 0
    
    const sum = metrics.reduce((acc, m) => acc + m.duration, 0)
    return sum / metrics.length
  }
  
  /**
   * Obtener todas las métricas de rendimiento
   */
  getPerformanceMetrics(): PerformanceMetric[] {
    return [...this.performanceMetrics]
  }
  
  /**
   * Obtener todas las métricas de negocio
   */
  getBusinessMetrics(): BusinessMetric[] {
    return [...this.businessMetrics]
  }
  
  /**
   * Limpiar métricas
   */
  clear() {
    this.performanceMetrics = []
    this.businessMetrics = []
  }
}

// Singleton
export const metrics = new MetricsCollector()

/**
 * Decorador para medir tiempo de ejecución
 */
export function measurePerformance(name: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value
    
    descriptor.value = async function (...args: any[]) {
      const start = Date.now()
      try {
        const result = await originalMethod.apply(this, args)
        const duration = Date.now() - start
        metrics.trackPerformance(`${name}.${propertyKey}`, duration, {
          args: args.length,
        })
        return result
      } catch (error) {
        const duration = Date.now() - start
        metrics.trackPerformance(`${name}.${propertyKey}`, duration, {
          error: error instanceof Error ? error.message : String(error),
        })
        throw error
      }
    }
    
    return descriptor
  }
}

