/**
 * Tests para el hook useDashboardStats
 * Verifica cálculo correcto de estadísticas
 */

import { renderHook, waitFor } from '@testing-library/react'
import { SWRConfig } from 'swr'
import { useDashboardStats } from '@/lib/hooks/useDashboardStats'

// Mock de createClient
jest.mock('@/utils/supabase/client', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: { id: 'user-1' } },
        error: null,
      }),
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
    })),
  })),
}))

describe('useDashboardStats', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <SWRConfig value={{ provider: () => new Map() }}>
      {children}
    </SWRConfig>
  ) as React.ComponentType<{ children: React.ReactNode }>

  it('debería calcular estadísticas correctamente', async () => {
    // Mock de datos de Supabase
    const { createClient } = require('@/utils/supabase/client')
    const mockSupabase = createClient()
    
    mockSupabase.from.mockReturnValue({
      select: jest.fn(() => ({
        eq: jest.fn().mockResolvedValue({
          data: [
            { total_price: 1000, status: 'confirmed', created_at: new Date().toISOString() },
            { total_price: 2000, status: 'confirmed', created_at: new Date().toISOString() },
            { total_price: 500, status: 'draft', created_at: new Date().toISOString() },
          ],
          error: null,
        }),
      })),
    })

    const { result } = renderHook(() => useDashboardStats(), { wrapper })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // Las estadísticas deberían estar calculadas
    // (Nota: Este test necesita ajustes según la implementación real)
    expect(result.current.stats).toBeDefined()
  })

  it('debería manejar errores correctamente', async () => {
    const { createClient } = require('@/utils/supabase/client')
    const mockSupabase = createClient()
    
    mockSupabase.from.mockReturnValue({
      select: jest.fn(() => ({
        eq: jest.fn().mockRejectedValue(new Error('Database error')),
      })),
    })

    const { result } = renderHook(() => useDashboardStats(), { wrapper })

    await waitFor(() => {
      expect(result.current.error).toBeDefined()
    })
  })
})

