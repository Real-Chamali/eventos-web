/**
 * Tests para el componente RegisterPaymentDialog
 * Verifica funcionalidad de registro de pagos
 */

import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import RegisterPaymentDialog from '@/components/payments/RegisterPaymentDialog'
import { createClient } from '@/utils/supabase/client'

// Mock de Supabase
jest.mock('@/utils/supabase/client', () => ({
  createClient: jest.fn(),
}))

// Mock de toast
jest.mock('@/lib/hooks', () => ({
  useToast: () => ({
    success: jest.fn(),
    error: jest.fn(),
  }),
}))

// Mock de logger
jest.mock('@/lib/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}))

describe('RegisterPaymentDialog', () => {
  const mockQuote = {
    id: 'quote-123',
    total_amount: 1000,
    clients: {
      name: 'Cliente Test',
      phone: '+521234567890',
    },
  }

  const defaultProps = {
    quoteId: 'quote-123',
    totalPrice: 1000,
    currentPaid: 0,
    trigger: <button>Registrar Pago</button>,
    onSuccess: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    
    const mockSupabase = {
      from: jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockQuote,
          error: null,
        }),
      })),
    }
    
    ;(createClient as jest.Mock).mockReturnValue(mockSupabase)
  })

  it('debería renderizar el diálogo cuando está abierto', () => {
    render(<RegisterPaymentDialog {...defaultProps} />)
    
    // El trigger debería estar presente
    expect(screen.getByText('Registrar Pago')).toBeInTheDocument()
  })

  it('debería mostrar el balance pendiente correctamente', () => {
    render(
      <RegisterPaymentDialog
        {...defaultProps}
        totalPrice={1000}
        currentPaid={300}
      />
    )
    
    // Debería mostrar el balance pendiente (700)
    expect(screen.getByText(/700/i)).toBeInTheDocument()
  })

  it('debería validar que el monto no exceda el balance pendiente', async () => {
    render(
      <RegisterPaymentDialog
        {...defaultProps}
        totalPrice={1000}
        currentPaid={0}
      />
    )
    
    // Abrir el diálogo (simular click en trigger)
    const trigger = screen.getByText('Registrar Pago')
    fireEvent.click(trigger)
    
    await waitFor(() => {
      // Buscar el input de monto
      const amountInput = screen.getByLabelText(/monto/i)
      expect(amountInput).toBeInTheDocument()
    })
    
    // Intentar ingresar un monto mayor al balance
    const amountInput = screen.getByLabelText(/monto/i)
    fireEvent.change(amountInput, { target: { value: '1500' } })
    
    // Debería mostrar error de validación
    await waitFor(() => {
      expect(screen.getByText(/no puede exceder/i)).toBeInTheDocument()
    })
  })

  it('debería permitir registrar un pago válido', async () => {
    const onSuccess = jest.fn()
    render(
      <RegisterPaymentDialog
        {...defaultProps}
        onSuccess={onSuccess}
      />
    )
    
    // Abrir el diálogo
    const trigger = screen.getByText('Registrar Pago')
    fireEvent.click(trigger)
    
    await waitFor(() => {
      const amountInput = screen.getByLabelText(/monto/i)
      expect(amountInput).toBeInTheDocument()
    })
    
    // Llenar el formulario
    const amountInput = screen.getByLabelText(/monto/i)
    fireEvent.change(amountInput, { target: { value: '500' } })
    
    // Seleccionar método de pago
    const methodSelect = screen.getByLabelText(/método/i)
    fireEvent.change(methodSelect, { target: { value: 'cash' } })
    
    // Enviar formulario
    const submitButton = screen.getByRole('button', { name: /registrar/i })
    fireEvent.click(submitButton)
    
    // Verificar que se llamó onSuccess
    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled()
    })
  })
})
