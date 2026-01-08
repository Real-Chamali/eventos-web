/**
 * Tests para API routes de cotizaciones
 * Verifica creación, actualización, y validaciones
 */

import { POST, GET } from '@/app/api/quotes/route'
import { NextRequest } from 'next/server'

// Mock de Supabase
jest.mock('@/utils/supabase/server', () => ({
  createClient: jest.fn(),
}))

// Mock de middleware
jest.mock('@/lib/api/middleware', () => ({
  verifyAuth: jest.fn(),
  checkAdmin: jest.fn(),
  errorResponse: jest.fn((error, status) => ({ error, status })),
  successResponse: jest.fn((data, message) => ({ success: true, data, message })),
  auditAPIAction: jest.fn(),
  validateMethod: jest.fn(),
  checkRateLimitAsync: jest.fn(),
  handleAPIError: jest.fn(),
}))

// Mock de validaciones
jest.mock('@/lib/validations/schemas', () => ({
  CreateQuoteSchema: {
    parse: jest.fn(),
    safeParse: jest.fn(),
  },
}))

// Mock de notificaciones
jest.mock('@/lib/utils/notifications', () => ({
  createNotification: jest.fn(),
}))

describe('API /api/quotes', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
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
    
    // Mock verifyAuth
    const { verifyAuth } = require('@/lib/api/middleware')
    verifyAuth.mockResolvedValue({ userId: mockUser.id, user: mockUser })
    
    // Mock checkAdmin
    const { checkAdmin } = require('@/lib/api/middleware')
    checkAdmin.mockResolvedValue(false)
    
    // Mock validateMethod
    const { validateMethod } = require('@/lib/api/middleware')
    validateMethod.mockReturnValue(null)
    
    // Mock checkRateLimitAsync
    const { checkRateLimitAsync } = require('@/lib/api/middleware')
    checkRateLimitAsync.mockResolvedValue(true)
  })

  describe('POST /api/quotes', () => {
    it('debería crear una cotización exitosamente', async () => {
      const { CreateQuoteSchema } = require('@/lib/validations/schemas')
      CreateQuoteSchema.safeParse.mockReturnValue({
        success: true,
        data: {
          client_id: 'client-123',
          services: [{ service_id: 'service-123', quantity: 1, final_price: 1000 }],
          total_amount: 1000,
        },
      })

      const { createClient } = require('@/utils/supabase/server')
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null,
          }),
        },
        from: jest.fn(() => ({
          insert: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: mockQuote,
            error: null,
          }),
          eq: jest.fn().mockReturnThis(),
        })),
      }
      createClient.mockResolvedValue(mockSupabase)

      const request = new NextRequest('http://localhost:3000/api/quotes', {
        method: 'POST',
        body: JSON.stringify({
          client_id: 'client-123',
          services: [{ service_id: 'service-123', quantity: 1, final_price: 1000 }],
          total_amount: 1000,
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
    })

    it('debería rechazar datos inválidos', async () => {
      const { CreateQuoteSchema } = require('@/lib/validations/schemas')
      CreateQuoteSchema.safeParse.mockReturnValue({
        success: false,
        error: {
          issues: [{ path: ['client_id'], message: 'Client ID is required' }],
        },
      })

      const request = new NextRequest('http://localhost:3000/api/quotes', {
        method: 'POST',
        body: JSON.stringify({}),
      })

      const response = await POST(request)
      
      expect(response.status).toBe(400)
    })

    it('debería requerir autenticación', async () => {
      const { verifyAuth } = require('@/lib/api/middleware')
      verifyAuth.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/quotes', {
        method: 'POST',
        body: JSON.stringify({
          client_id: 'client-123',
          total_amount: 1000,
        }),
      })

      const response = await POST(request)
      
      expect(response.status).toBe(401)
    })
  })

  describe('GET /api/quotes', () => {
    it('debería obtener cotizaciones del usuario', async () => {
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
            data: [mockQuote],
            error: null,
          }),
        })),
      }
      createClient.mockResolvedValue(mockSupabase)

      const request = new NextRequest('http://localhost:3000/api/quotes', {
        method: 'GET',
      })

      const response = await GET(request)
      
      expect(response.status).toBe(200)
    })

    it('debería permitir a admin ver todas las cotizaciones', async () => {
      const { checkAdmin } = require('@/lib/api/middleware')
      checkAdmin.mockResolvedValue(true)

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
          order: jest.fn().mockResolvedValue({
            data: [mockQuote],
            error: null,
          }),
        })),
      }
      createClient.mockResolvedValue(mockSupabase)

      const request = new NextRequest('http://localhost:3000/api/quotes', {
        method: 'GET',
      })

      const response = await GET(request)
      
      expect(response.status).toBe(200)
    })
  })
})
