/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Tests para utilidades de auditoría
 * Verifica funciones de creación y consulta de logs
 */

import { 
  createAuditLog, 
  getAuditLogs, 
  getChangedFields, 
  getRecordAuditTrail 
} from '@/lib/utils/audit'

// Mock de Supabase
jest.mock('@/utils/supabase/client', () => ({
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

describe('Audit Utils', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('createAuditLog', () => {
    it('debería crear un log de auditoría exitosamente', async () => {
      const { createClient } = require('@/utils/supabase/client')
      const mockSupabase = {
        from: jest.fn(() => ({
          insert: jest.fn().mockResolvedValue({
            data: null,
            error: null,
          }),
        })),
      }
      createClient.mockReturnValue(mockSupabase)

      await createAuditLog({
        user_id: 'user-123',
        action: 'CREATE',
        table_name: 'quotes',
        new_values: { id: 'quote-123', total: 1000 },
      })

      expect(mockSupabase.from).toHaveBeenCalledWith('audit_logs')
      expect(mockSupabase.from().insert).toHaveBeenCalled()
    })

    it('debería manejar errores silenciosamente', async () => {
      const { createClient } = require('@/utils/supabase/client')
      const mockSupabase = {
        from: jest.fn(() => ({
          insert: jest.fn().mockResolvedValue({
            data: null,
            error: { message: 'Database error' },
          }),
        })),
      }
      createClient.mockReturnValue(mockSupabase)

      // No debería lanzar error
      await expect(
        createAuditLog({
          user_id: 'user-123',
          action: 'CREATE',
          table_name: 'quotes',
          new_values: { id: 'quote-123' },
        })
      ).resolves.not.toThrow()
    })
  })

  describe('getChangedFields', () => {
    it('debería detectar campos cambiados', () => {
      const oldValues = {
        name: 'John',
        email: 'john@example.com',
        age: 30,
      }
      const newValues = {
        name: 'Jane',
        email: 'john@example.com',
        age: 31,
      }

      const changes = getChangedFields(oldValues, newValues)

      expect(changes).toHaveLength(2)
      expect(changes[0]).toEqual({ field: 'name', old: 'John', new: 'Jane' })
      expect(changes[1]).toEqual({ field: 'age', old: 30, new: 31 })
    })

    it('debería manejar valores null', () => {
      const oldValues = { name: 'John' }
      const newValues = { name: null }

      const changes = getChangedFields(oldValues, newValues)

      expect(changes).toHaveLength(1)
      expect(changes[0].old).toBe('John')
      expect(changes[0].new).toBeNull()
    })

    it('debería retornar array vacío si no hay cambios', () => {
      const values = { name: 'John', email: 'john@example.com' }

      const changes = getChangedFields(values, values)

      expect(changes).toHaveLength(0)
    })
  })

  describe('getAuditLogs', () => {
    it('debería obtener logs sin filtros', async () => {
      const { createClient } = require('@/utils/supabase/client')
      const mockLogs = [
        {
          id: 'log-1',
          user_id: 'user-123',
          action: 'CREATE',
          table_name: 'quotes',
          created_at: '2024-01-01T00:00:00Z',
        },
      ]
      const mockSupabase = {
        from: jest.fn(() => ({
          select: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnThis(),
          limit: jest.fn().mockResolvedValue({
            data: mockLogs,
            error: null,
          }),
        })),
      }
      createClient.mockReturnValue(mockSupabase)

      const logs = await getAuditLogs()

      expect(logs).toHaveLength(1)
      expect(logs[0].id).toBe('log-1')
    })

    it('debería filtrar por tabla', async () => {
      const { createClient } = require('@/utils/supabase/client')
      const mockSupabase = {
        from: jest.fn(() => ({
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnThis(),
          limit: jest.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        })),
      }
      createClient.mockReturnValue(mockSupabase)

      await getAuditLogs('quotes')

      expect(mockSupabase.from().eq).toHaveBeenCalledWith('table_name', 'quotes')
    })

    it('debería retornar array vacío en caso de error', async () => {
      const { createClient } = require('@/utils/supabase/client')
      const mockSupabase = {
        from: jest.fn(() => ({
          select: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnThis(),
          limit: jest.fn().mockResolvedValue({
            data: null,
            error: { message: 'Error' },
          }),
        })),
      }
      createClient.mockReturnValue(mockSupabase)

      const logs = await getAuditLogs()

      expect(logs).toEqual([])
    })
  })

  describe('getRecordAuditTrail', () => {
    it('debería obtener el historial de un registro', async () => {
      const { createClient } = require('@/utils/supabase/client')
      const mockSupabase = {
        rpc: jest.fn().mockResolvedValue({
          data: [
            {
              id: 'log-1',
              action: 'CREATE',
              created_at: '2024-01-01T00:00:00Z',
            },
          ],
          error: null,
        }),
      }
      createClient.mockReturnValue(mockSupabase)

      const trail = await getRecordAuditTrail('quotes', 'quote-123')

      expect(trail).toHaveLength(1)
      expect(mockSupabase.rpc).toHaveBeenCalledWith('get_record_audit_trail', {
        p_table_name: 'quotes',
        p_record_id: 'quote-123',
        p_limit: 50,
      })
    })

    it('debería usar fallback si RPC falla', async () => {
      const { createClient } = require('@/utils/supabase/client')
      const mockSupabase = {
        rpc: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'RPC not found' },
        }),
        from: jest.fn(() => ({
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          or: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnThis(),
          limit: jest.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        })),
      }
      createClient.mockReturnValue(mockSupabase)

      const trail = await getRecordAuditTrail('quotes', 'quote-123')

      expect(trail).toEqual([])
      expect(mockSupabase.from).toHaveBeenCalledWith('audit_logs')
    })
  })
})
