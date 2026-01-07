/**
 * Tests para componente DashboardStats
 */

import { render, screen, waitFor } from '@testing-library/react'
import { DashboardStats } from '@/components/dashboard/DashboardStats'
import { useDashboardStats } from '@/lib/hooks/useDashboardStats'

// Mock del hook
jest.mock('@/lib/hooks/useDashboardStats')

const mockUseDashboardStats = useDashboardStats as jest.MockedFunction<typeof useDashboardStats>

describe('DashboardStats', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('shows loading skeletons when loading', () => {
    mockUseDashboardStats.mockReturnValue({
      stats: undefined,
      loading: true,
      error: null,
    })

    render(<DashboardStats />)
    
    // Verificar que hay skeletons
    const skeletons = screen.getAllByTestId?.('skeleton') || document.querySelectorAll('[class*="animate-pulse"]')
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it('renders stats correctly when loaded', async () => {
    const mockStats = {
      totalSales: 100000,
      totalCommissions: 10000,
      pendingQuotes: 5,
      confirmedQuotes: 10,
      conversionRate: 66.67,
      averageSale: 10000,
      monthlySales: 50000,
      totalClients: 20,
    }

    mockUseDashboardStats.mockReturnValue({
      stats: mockStats,
      loading: false,
      error: null,
    })

    render(<DashboardStats />)

    await waitFor(() => {
      expect(screen.getByText(/Ventas Totales/i)).toBeInTheDocument()
      expect(screen.getByText(/Comisiones/i)).toBeInTheDocument()
      expect(screen.getByText(/Tasa de Conversión/i)).toBeInTheDocument()
      expect(screen.getByText(/Promedio de Venta/i)).toBeInTheDocument()
    })
  })

  it('formats currency values correctly', async () => {
    const mockStats = {
      totalSales: 100000,
      totalCommissions: 10000,
      pendingQuotes: 5,
      confirmedQuotes: 10,
      conversionRate: 66.67,
      averageSale: 10000,
      monthlySales: 50000,
      totalClients: 20,
    }

    mockUseDashboardStats.mockReturnValue({
      stats: mockStats,
      loading: false,
      error: null,
    })

    render(<DashboardStats />)

    await waitFor(() => {
      // Verificar que los valores de moneda están presentes
      const content = document.body.textContent || ''
      expect(content).toMatch(/100,000|100\.000/) // Formato mexicano o internacional
    })
  })

  it('displays all secondary metrics', async () => {
    const mockStats = {
      totalSales: 100000,
      totalCommissions: 10000,
      pendingQuotes: 5,
      confirmedQuotes: 10,
      conversionRate: 66.67,
      averageSale: 10000,
      monthlySales: 50000,
      totalClients: 20,
    }

    mockUseDashboardStats.mockReturnValue({
      stats: mockStats,
      loading: false,
      error: null,
    })

    render(<DashboardStats />)

    await waitFor(() => {
      expect(screen.getByText(/Cotizaciones Pendientes/i)).toBeInTheDocument()
      expect(screen.getByText(/Ventas del Mes/i)).toBeInTheDocument()
      expect(screen.getByText(/Total Clientes/i)).toBeInTheDocument()
    })
  })

  it('handles zero values correctly', async () => {
    const mockStats = {
      totalSales: 0,
      totalCommissions: 0,
      pendingQuotes: 0,
      confirmedQuotes: 0,
      conversionRate: 0,
      averageSale: 0,
      monthlySales: 0,
      totalClients: 0,
    }

    mockUseDashboardStats.mockReturnValue({
      stats: mockStats,
      loading: false,
      error: null,
    })

    render(<DashboardStats />)

    await waitFor(() => {
      // Verificar que se muestran los valores cero
      expect(screen.getByText('0')).toBeInTheDocument()
    })
  })

  it('does not render stats when stats is undefined and not loading', () => {
    mockUseDashboardStats.mockReturnValue({
      stats: undefined,
      loading: false,
      error: null,
    })

    render(<DashboardStats />)
    
    // Debería mostrar skeletons cuando no hay stats
    const skeletons = document.querySelectorAll('[class*="animate-pulse"]')
    expect(skeletons.length).toBeGreaterThan(0)
  })
})

