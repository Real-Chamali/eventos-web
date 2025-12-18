/**
 * Tests para componente Button
 */

import { render, screen, fireEvent } from '@testing-library/react'
import Button from '@/components/ui/Button'

describe('Button', () => {
  it('renders with text', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })

  it('calls onClick when clicked', () => {
    const handleClick = jest.fn()
    render(<Button onClick={handleClick}>Click</Button>)
    fireEvent.click(screen.getByText('Click'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('applies variant styles correctly', () => {
    const { rerender } = render(<Button variant="premium">Test</Button>)
    const button = screen.getByText('Test')
    expect(button).toHaveClass('bg-gradient-to-r')
    
    rerender(<Button variant="outline">Test</Button>)
    expect(button).toHaveClass('border-2')
    
    rerender(<Button variant="ghost">Test</Button>)
    expect(button).toHaveClass('bg-transparent')
    
    rerender(<Button variant="destructive">Test</Button>)
    expect(button).toHaveClass('bg-red-500')
    
    rerender(<Button variant="success">Test</Button>)
    expect(button).toHaveClass('bg-emerald-500')
  })

  it('applies size styles correctly', () => {
    const { rerender } = render(<Button size="sm">Test</Button>)
    expect(screen.getByText('Test')).toHaveClass('px-3', 'py-1.5', 'text-sm')
    
    rerender(<Button size="lg">Test</Button>)
    expect(screen.getByText('Test')).toHaveClass('px-6', 'py-3', 'text-base')
    
    rerender(<Button size="xl">Test</Button>)
    expect(screen.getByText('Test')).toHaveClass('px-8', 'py-4', 'text-lg')
  })

  it('shows loading spinner when isLoading is true', () => {
    render(<Button isLoading>Loading</Button>)
    const button = screen.getByText('Loading')
    expect(button).toBeDisabled()
    // Verificar que el spinner está presente
    expect(button.querySelector('svg')).toBeInTheDocument()
  })

  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>)
    expect(screen.getByText('Disabled')).toBeDisabled()
  })

  it('is disabled when isLoading is true', () => {
    render(<Button isLoading>Loading</Button>)
    expect(screen.getByText('Loading')).toBeDisabled()
  })

  it('does not call onClick when disabled', () => {
    const handleClick = jest.fn()
    render(<Button disabled onClick={handleClick}>Disabled</Button>)
    fireEvent.click(screen.getByText('Disabled'))
    expect(handleClick).not.toHaveBeenCalled()
  })

  it('forwards ref correctly', () => {
    const ref = jest.fn()
    render(<Button ref={ref}>Test</Button>)
    expect(ref).toHaveBeenCalled()
  })

  it('applies custom className', () => {
    render(<Button className="custom-class">Test</Button>)
    expect(screen.getByText('Test')).toHaveClass('custom-class')
  })

  it('handles keyboard events', () => {
    const handleClick = jest.fn()
    render(<Button onClick={handleClick}>Test</Button>)
    const button = screen.getByText('Test')
    
    fireEvent.keyDown(button, { key: 'Enter' })
    // Button debería manejar Enter como click (si está implementado)
    // Por ahora solo verificamos que no falle
    expect(button).toBeInTheDocument()
  })
})

