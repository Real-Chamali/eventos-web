import { validateFormData, LoginSchema, CreateQuoteSchema } from '@/lib/validations/schemas'

describe('Schema Validations', () => {
  describe('LoginSchema', () => {
    it('should validate correct email and password', () => {
      const data = { email: 'user@example.com', password: 'password123' }
      const result = validateFormData(LoginSchema, data)
      expect(result.valid).toBe(true)
    })

    it('should reject invalid email', () => {
      const data = { email: 'invalid-email', password: 'password123' }
      const result = validateFormData(LoginSchema, data)
      expect(result.valid).toBe(false)
      expect(result.errors?.email).toBeDefined()
    })

    it('should reject short password', () => {
      const data = { email: 'user@example.com', password: '123' }
      const result = validateFormData(LoginSchema, data)
      expect(result.valid).toBe(false)
      expect(result.errors?.password).toBeDefined()
    })
  })

  describe('CreateQuoteSchema', () => {
    it('should validate correct quote data', () => {
      const data = {
        client_id: '550e8400-e29b-41d4-a716-446655440000',
        services: [
          {
            service_id: '550e8400-e29b-41d4-a716-446655440001',
            quantity: 2,
            final_price: 100.5,
          },
        ],
        total_price: 201,
      }
      const result = validateFormData(CreateQuoteSchema, data)
      expect(result.valid).toBe(true)
    })

    it('should reject empty services', () => {
      const data = {
        client_id: '550e8400-e29b-41d4-a716-446655440000',
        services: [],
        total_price: 0,
      }
      const result = validateFormData(CreateQuoteSchema, data)
      expect(result.valid).toBe(false)
      expect(result.errors?.services).toBeDefined()
    })

    it('should reject invalid quantity', () => {
      const data = {
        client_id: '550e8400-e29b-41d4-a716-446655440000',
        services: [
          {
            service_id: '550e8400-e29b-41d4-a716-446655440001',
            quantity: 0,
            final_price: 100,
          },
        ],
        total_price: 0,
      }
      const result = validateFormData(CreateQuoteSchema, data)
      expect(result.valid).toBe(false)
    })
  })
})
