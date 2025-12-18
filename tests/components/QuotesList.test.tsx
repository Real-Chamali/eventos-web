/**
 * Tests para el componente QuotesList
 * Verifica funcionalidad de paginación infinita y filtros
 */

import { render, screen, waitFor } from '@testing-library/react'
import { QuotesList } from '@/components/quotes/QuotesList'
import { SWRConfig } from 'swr'

// Mock de useInfiniteQuotes
jest.mock('@/lib/hooks/useInfiniteQuotes', () => ({
  useInfiniteQuotes: jest.fn(),
}))

const mockQuotes = [
  {
    id: '1',
    client_name: 'Cliente Test',
    total_price: 1000,
    status: 'confirmed' as const,
    created_at: '2024-01-01T00:00:00Z',
  },
]

describe('QuotesList', () => {
  const wrapper = ({ children }: { children: React.ReactNode }): React.ReactElement => {
    return (
      <SWRConfig value={{ provider: () => new Map() }}>
        {children}
      </SWRConfig>
    )
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('debería mostrar skeleton mientras carga', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { useInfiniteQuotes } = require('@/lib/hooks/useInfiniteQuotes')
    useInfiniteQuotes.mockReturnValue({
      quotes: [],
      isLoading: true,
      isLoadingMore: false,
      isReachingEnd: false,
      error: null,
      loadMore: jest.fn(),
      refresh: jest.fn(),
    })

    render(<QuotesList />, { wrapper })
    expect(screen.getByRole('table')).toBeInTheDocument()
  })

  it('debería mostrar lista de cotizaciones', async () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { useInfiniteQuotes } = require('@/lib/hooks/useInfiniteQuotes')
    useInfiniteQuotes.mockReturnValue({
      quotes: mockQuotes,
      isLoading: false,
      isLoadingMore: false,
      isReachingEnd: true,
      error: null,
      loadMore: jest.fn(),
      refresh: jest.fn(),
    })

    render(<QuotesList />, { wrapper })
    
    await waitFor(() => {
      expect(screen.getByText('Cliente Test')).toBeInTheDocument()
    })
  })

  it('debería filtrar cotizaciones por término de búsqueda', async () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { useInfiniteQuotes } = require('@/lib/hooks/useInfiniteQuotes')
    useInfiniteQuotes.mockReturnValue({
      quotes: [
        ...mockQuotes,
        {
          id: '2',
          client_name: 'Otro Cliente',
          total_price: 2000,
          status: 'pending' as const,
          created_at: '2024-01-02T00:00:00Z',
        },
      ],
      isLoading: false,
      isLoadingMore: false,
      isReachingEnd: true,
      error: null,
      loadMore: jest.fn(),
      refresh: jest.fn(),
    })

    render(<QuotesList searchTerm="Test" />, { wrapper })
    
    await waitFor(() => {
      expect(screen.getByText('Cliente Test')).toBeInTheDocument()
      expect(screen.queryByText('Otro Cliente')).not.toBeInTheDocument()
    })
  })

  it('debería mostrar estado vacío cuando no hay cotizaciones', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { useInfiniteQuotes } = require('@/lib/hooks/useInfiniteQuotes')
    useInfiniteQuotes.mockReturnValue({
      quotes: [],
      isLoading: false,
      isLoadingMore: false,
      isReachingEnd: true,
      error: null,
      loadMore: jest.fn(),
      refresh: jest.fn(),
    })

    render(<QuotesList />, { wrapper })
    expect(screen.getByText(/No hay cotizaciones/i)).toBeInTheDocument()
  })

  it('debería mostrar error cuando hay un problema', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { useInfiniteQuotes } = require('@/lib/hooks/useInfiniteQuotes')
    useInfiniteQuotes.mockReturnValue({
      quotes: [],
      isLoading: false,
      isLoadingMore: false,
      isReachingEnd: false,
      error: new Error('Error de red'),
      loadMore: jest.fn(),
      refresh: jest.fn(),
    })

    render(<QuotesList />, { wrapper })
    expect(screen.getByText(/Error al cargar cotizaciones/i)).toBeInTheDocument()
  })
})

