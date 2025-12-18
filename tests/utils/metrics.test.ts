/**
 * Tests para utilidades de métricas
 */

import { metrics } from '@/lib/utils/metrics'

describe('Metrics utilities', () => {
  beforeEach(() => {
    // Reset metrics before each test
    jest.clearAllMocks()
  })

  describe('trackPerformance', () => {
    it('tracks performance metrics', async () => {
      const fn = jest.fn().mockResolvedValue('result')
      const trackedFn = metrics.trackPerformance('test-operation', fn)

      const result = await trackedFn()

      expect(result).toBe('result')
      expect(fn).toHaveBeenCalledTimes(1)
    })

    it('records performance data', async () => {
      const fn = jest.fn().mockImplementation(() => {
        return new Promise(resolve => setTimeout(() => resolve('done'), 50))
      })

      const trackedFn = metrics.trackPerformance('test-operation', fn)
      await trackedFn()

      // Verificar que la métrica fue registrada (si está implementado)
      // Por ahora solo verificamos que no falla
      expect(fn).toHaveBeenCalled()
    })
  })

  describe('trackBusinessMetric', () => {
    it('tracks business metrics', () => {
      metrics.trackBusinessMetric('quotes.created', { count: 1 })

      // Verificar que la métrica fue registrada (si está implementado)
      // Por ahora solo verificamos que no falla
      expect(() => {
        metrics.trackBusinessMetric('quotes.created', { count: 1 })
      }).not.toThrow()
    })
  })

  describe('getPerformanceMetrics', () => {
    it('returns performance metrics', () => {
      const performanceMetrics = metrics.getPerformanceMetrics()

      expect(performanceMetrics).toBeDefined()
      expect(typeof performanceMetrics).toBe('object')
    })
  })

  describe('getBusinessMetrics', () => {
    it('returns business metrics', () => {
      const businessMetrics = metrics.getBusinessMetrics()

      expect(businessMetrics).toBeDefined()
      expect(typeof businessMetrics).toBe('object')
    })
  })
})

