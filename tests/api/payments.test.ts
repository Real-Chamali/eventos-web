/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Tests para API routes de pagos
 * Verifica registro de pagos y validaciones
 */

import { POST, GET } from '@/app/api/payments/route'
import { NextRequest } from 'next/server'

// Mock de Supabase
jest.mock('@/utils/supabase/server', () => ({
  createClient: jest.fn(),
}))

// Mock de logger
jest.mock('@/lib/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}))

describe('API /api/payments', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
  }

  const mockQuote = {
    id: 'quote-123',
    vendor_id: 'user-123',
    total_amount: 1000,
    status: 'DRAFT',
  }

  const mockPayment = {
    id: 'payment-123',
    quote_id: 'quote-123',
    amount: 500,
    payment_date: '2024-01-01T00:00:00Z',
    payment_method: 'cash',
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('POST /api/payments', () => {
    it('debería registrar un pago exitosamente', async () => {
      const { createClient } = require('@/utils/supabase/server')
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null,
          }),
        },
        from: jest.fn((table) => {
          if (table === 'quotes') {
            return {
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnThis(),
              single: jest.fn().mockResolvedValue({
                data: mockQuote,
                error: null,
              }),
            }
          }
          if (table === 'partial_payments') {
            return {
              insert: jest.fn().mockReturnThis(),
              select: jest.fn().mockReturnThis(),
              single: jest.fn().mockResolvedValue({
                data: mockPayment,
                error: null,
              }),
            }
          }
          return {}
        }),
      }
      createClient.mockResolvedValue(mockSupabase)

      const request = new NextRequest('http://localhost:3000/api/payments', {
        method: 'POST',
        body: JSON.stringify({
          quote_id: 'quote-123',
          amount: 500,
          payment_date: '2024-01-01',
          payment_method: 'cash',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
    })

    it('debería rechazar pago con monto inválido', async () => {
      const { createClient } = require('@/utils/supabase/server')
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null,
          }),
        },
      }
      createClient.mockResolvedValue(mockSupabase)

      const request = new NextRequest('http://localhost:3000/api/payments', {
        method: 'POST',
        body: JSON.stringify({
          quote_id: 'quote-123',
          amount: -100, // Monto inválido
          payment_date: '2024-01-01',
          payment_method: 'cash',
        }),
      })

      const response = await POST(request)
      
      expect(response.status).toBe(400)
    })

    it('debería rechazar pago si la cotización no existe', async () => {
      const { createClient } = require('@/utils/supabase/server')
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null,
          }),
        },
        from: jest.fn(() => ({
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: null,
            error: { message: 'Not found' },
          }),
        })),
      }
      createClient.mockResolvedValue(mockSupabase)

      const request = new NextRequest('http://localhost:3000/api/payments', {
        method: 'POST',
        body: JSON.stringify({
          quote_id: 'quote-invalid',
          amount: 500,
          payment_date: '2024-01-01',
          payment_method: 'cash',
        }),
      })

      const response = await POST(request)
      
      expect(response.status).toBe(404)
    })
  })

  describe('GET /api/payments', () => {
    it('debería obtener pagos de una cotización', async () => {
      const { createClient } = require('@/utils/supabase/server')
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null,
          }),
        },
        from: jest.fn(() => ({
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          order: jest.fn().mockResolvedValue({
            data: [mockPayment],
            error: null,
          }),
        })),
      }
      createClient.mockResolvedValue(mockSupabase)

      const request = new NextRequest('http://localhost:3000/api/payments?quote_id=quote-123', {
        method: 'GET',
      })

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(Array.isArray(data)).toBe(true)
    })
  })
})
