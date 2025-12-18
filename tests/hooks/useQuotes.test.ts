/**
 * Tests para hook useQuotes
 */

import { renderHook, waitFor } from '@testing-library/react'
import { SWRConfig } from 'swr'
import { useQuotes } from '@/lib/hooks/useQuotes'
import { createClient } from '@/utils/supabase/client'

jest.mock('@/utils/supabase/client')

const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>

describe('useQuotes', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
      {children}
    </SWRConfig>
  )

  it('returns loading state initially', () => {
    const mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'user-1' } },
          error: null,
        }),
      },
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      }),
    }

    mockCreateClient.mockReturnValue(mockSupabase as any)

    const { result } = renderHook(() => useQuotes(), { wrapper })

    expect(result.current.loading).toBe(true)
    expect(result.current.quotes).toEqual([])
  })

  it('fetches quotes successfully', async () => {
    const mockQuotes = [
      {
        id: 'quote-1',
        total_price: 1000,
        status: 'confirmed',
        created_at: '2025-01-01',
        clients: { name: 'Client 1' },
      },
      {
        id: 'quote-2',
        total_price: 2000,
        status: 'draft',
        created_at: '2025-01-02',
        clients: { name: 'Client 2' },
      },
    ]

    const mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'user-1' } },
          error: null,
        }),
      },
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: mockQuotes,
          error: null,
        }),
      }),
    }

    mockCreateClient.mockReturnValue(mockSupabase as any)

    const { result } = renderHook(() => useQuotes(), { wrapper })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.quotes).toHaveLength(2)
    expect(result.current.quotes[0].client_name).toBe('Client 1')
    expect(result.current.error).toBeNull()
  })

  it('handles error correctly', async () => {
    const mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'user-1' } },
          error: null,
        }),
      },
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error' },
        }),
      }),
    }

    mockCreateClient.mockReturnValue(mockSupabase as any)

    const { result } = renderHook(() => useQuotes(), { wrapper })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.error).toBeTruthy()
    expect(result.current.quotes).toEqual([])
  })

  it('handles unauthorized user', async () => {
    const mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: null },
          error: { message: 'Unauthorized' },
        }),
      },
      from: jest.fn(),
    }

    mockCreateClient.mockReturnValue(mockSupabase as any)

    const { result } = renderHook(() => useQuotes(), { wrapper })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.error).toBeTruthy()
  })
})

