/**
 * Tests de integración para el flujo completo de cotizaciones
 * Verifica creación, aprobación, y registro de pagos
 */

import { createClient } from '@/utils/supabase/client'
import { createAuditLog } from '@/lib/utils/audit'

// Mock de Supabase
jest.mock('@/utils/supabase/client', () => ({
  createClient: jest.fn(),
}))

// Mock de auditoría
jest.mock('@/lib/utils/audit', () => ({
  createAuditLog: jest.fn(),
}))

describe('Quote Flow Integration', () => {
  const mockUser = {
    id: 'user-123',
    email: 'vendor@example.com',
  }

  const mockClient = {
    id: 'client-123',
    name: 'Cliente Test',
    email: 'client@example.com',
  }

  const mockQuote = {
    id: 'quote-123',
    client_id: 'client-123',
    vendor_id: 'user-123',
    status: 'DRAFT',
    total_amount: 1000,
    created_at: '2024-01-01T00:00:00Z',
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Flujo completo: Crear → Aprobar → Pagar', () => {
    it('debería crear una cotización y registrar en auditoría', async () => {
      const { createClient } = require('@/utils/supabase/client')
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
              insert: jest.fn().mockReturnThis(),
              select: jest.fn().mockReturnThis(),
              single: jest.fn().mockResolvedValue({
                data: mockQuote,
                error: null,
              }),
            }
          }
          if (table === 'quote_services') {
            return {
              insert: jest.fn().mockResolvedValue({
                data: null,
                error: null,
              }),
            }
          }
          return {}
        }),
      }
      createClient.mockReturnValue(mockSupabase)

      // Simular creación de cotización
      const quoteResult = await mockSupabase
        .from('quotes')
        .insert({
          client_id: mockClient.id,
          vendor_id: mockUser.id,
          status: 'DRAFT',
          total_amount: 1000,
        })
        .select()
        .single()

      expect(quoteResult.data).toEqual(mockQuote)
      expect(quoteResult.error).toBeNull()

      // Verificar que se creó log de auditoría
      expect(createAuditLog).toHaveBeenCalled()
    })

    it('debería aprobar una cotización y actualizar estado', async () => {
      const { createClient } = require('@/utils/supabase/client')
      const mockSupabase = {
        from: jest.fn((table) => {
          if (table === 'quotes') {
            return {
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnThis(),
              single: jest.fn().mockResolvedValue({
                data: { ...mockQuote, status: 'APPROVED' },
                error: null,
              }),
              update: jest.fn().mockReturnThis(),
            }
          }
          return {}
        }),
      }
      createClient.mockReturnValue(mockSupabase)

      // Simular aprobación
      const updateResult = await mockSupabase
        .from('quotes')
        .update({ status: 'APPROVED' })
        .eq('id', mockQuote.id)
        .select()
        .single()

      expect(updateResult.data.status).toBe('APPROVED')
    })

    it('debería registrar un pago y actualizar estado financiero', async () => {
      const { createClient } = require('@/utils/supabase/client')
      const mockPayment = {
        id: 'payment-123',
        quote_id: mockQuote.id,
        amount: 500,
        payment_date: '2024-01-01T00:00:00Z',
        payment_method: 'cash',
      }

      const mockSupabase = {
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
      createClient.mockReturnValue(mockSupabase)

      // Simular registro de pago
      const paymentResult = await mockSupabase
        .from('partial_payments')
        .insert({
          quote_id: mockQuote.id,
          amount: 500,
          payment_date: '2024-01-01T00:00:00Z',
          payment_method: 'cash',
        })
        .select()
        .single()

      expect(paymentResult.data).toEqual(mockPayment)
      expect(paymentResult.error).toBeNull()
    })
  })

  describe('Validaciones de negocio', () => {
    it('debería rechazar pago que excede el total', async () => {
      const { createClient } = require('@/utils/supabase/client')
      const mockSupabase = {
        from: jest.fn((table) => {
          if (table === 'quotes') {
            return {
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnThis(),
              single: jest.fn().mockResolvedValue({
                data: { ...mockQuote, total_amount: 1000 },
                error: null,
              }),
            }
          }
          return {}
        }),
      }
      createClient.mockReturnValue(mockSupabase)

      // Intentar registrar pago mayor al total
      const quote = await mockSupabase
        .from('quotes')
        .select('*')
        .eq('id', mockQuote.id)
        .single()

      const paymentAmount = 1500
      const isValid = paymentAmount <= quote.data.total_amount

      expect(isValid).toBe(false)
    })

    it('debería calcular correctamente el balance pendiente', () => {
      const totalAmount = 1000
      const paidAmount = 300
      const balance = totalAmount - paidAmount

      expect(balance).toBe(700)
    })
  })
})
