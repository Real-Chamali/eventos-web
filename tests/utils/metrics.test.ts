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
    it('tracks performance metrics', () => {
      const start = Date.now()
      metrics.trackPerformance('test-operation', 100, { test: true })
      const duration = Date.now() - start

      const performanceMetrics = metrics.getPerformanceMetrics()
      const lastMetric = performanceMetrics[performanceMetrics.length - 1]

      expect(lastMetric).toBeDefined()
      expect(lastMetric.name).toBe('test-operation')
      expect(lastMetric.duration).toBeGreaterThanOrEqual(0)
      expect(lastMetric.metadata?.test).toBe(true)
    })

    it('records performance data with metadata', () => {
      metrics.trackPerformance('test-operation', 50, { count: 1 })

      const performanceMetrics = metrics.getPerformanceMetrics()
      const lastMetric = performanceMetrics[performanceMetrics.length - 1]

      expect(lastMetric).toBeDefined()
      expect(lastMetric.name).toBe('test-operation')
      expect(lastMetric.duration).toBe(50)
      expect(lastMetric.metadata?.count).toBe(1)
    })
  })

  describe('trackBusiness', () => {
    it('tracks business metrics', () => {
      metrics.trackBusiness('quote_created', 1, { count: 1 })

      const businessMetrics = metrics.getBusinessMetrics()
      const lastMetric = businessMetrics[businessMetrics.length - 1]

      expect(lastMetric).toBeDefined()
      expect(lastMetric.type).toBe('quote_created')
      expect(lastMetric.value).toBe(1)
      expect(lastMetric.metadata?.count).toBe(1)
    })

    it('tracks multiple business metrics', () => {
      metrics.trackBusiness('quote_created', 1)
      metrics.trackBusiness('quote_confirmed', 2)

      const businessMetrics = metrics.getBusinessMetrics()
      expect(businessMetrics.length).toBeGreaterThanOrEqual(2)
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

