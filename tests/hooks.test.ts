import { renderHook, act } from '@testing-library/react'
import { useAsync, useDebounce, useLocalStorage, useToast, useForm } from '@/lib/hooks'

describe('Hooks', () => {
  describe('useAsync', () => {
    it('should execute async function and return success', async () => {
      const asyncFn = jest.fn().mockResolvedValue('success')
      const { result } = renderHook(() => useAsync(asyncFn, false))

      await act(async () => {
        await result.current.execute()
      })

      expect(result.current.status).toBe('success')
      expect(result.current.value).toBe('success')
      expect(result.current.error).toBeNull()
    })

    it('should handle errors correctly', async () => {
      const asyncFn = jest.fn().mockRejectedValue(new Error('Test error'))
      const { result } = renderHook(() => useAsync(asyncFn, false))

      await act(async () => {
        try {
          await result.current.execute()
        } catch {
          // Expected error
        }
      })

      expect(result.current.status).toBe('error')
      expect(result.current.value).toBeNull()
      expect(result.current.error).toBeDefined()
    })

    it('should set status to pending during execution', async () => {
      const asyncFn = jest.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve('done'), 100))
      )
      const { result } = renderHook(() => useAsync(asyncFn, false))

      act(() => {
        void result.current.execute()
      })

      expect(result.current.status).toBe('pending')
    })
  })

  describe('useDebounce', () => {
    beforeEach(() => {
      jest.useFakeTimers()
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    it('should debounce value changes', () => {
      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebounce(value, delay),
        { initialProps: { value: 'initial', delay: 500 } }
      )

      expect(result.current).toBe('initial')

      rerender({ value: 'updated', delay: 500 })
      expect(result.current).toBe('initial') // Still initial

      act(() => {
        jest.advanceTimersByTime(500)
      })

      expect(result.current).toBe('updated')
    })
  })

  describe('useLocalStorage', () => {
    beforeEach(() => {
      localStorage.clear()
    })

    it('should read from localStorage', () => {
      localStorage.setItem('test-key', JSON.stringify({ value: 'test' }))
      const { result } = renderHook(() => useLocalStorage('test-key', { value: 'default' }))

      expect(result.current[0]).toEqual({ value: 'test' })
    })

    it('should use initial value if localStorage is empty', () => {
      const { result } = renderHook(() => useLocalStorage('new-key', { value: 'default' }))

      expect(result.current[0]).toEqual({ value: 'default' })
    })

    it('should update localStorage when value changes', () => {
      const { result } = renderHook(() => useLocalStorage('test-key', { value: 'initial' }))

      act(() => {
        result.current[1]({ value: 'updated' })
      })

      expect(result.current[0]).toEqual({ value: 'updated' })
      expect(localStorage.getItem('test-key')).toBe(JSON.stringify({ value: 'updated' }))
    })
  })

  describe('useToast', () => {
    it('should return toast functions', () => {
      const { result } = renderHook(() => useToast())

      expect(result.current.success).toBeDefined()
      expect(result.current.error).toBeDefined()
      expect(result.current.loading).toBeDefined()
      expect(result.current.dismiss).toBeDefined()
    })
  })

  describe('useForm', () => {
    it('should initialize with initial values', () => {
      const initialValues = { name: 'Test', email: 'test@example.com' }
      const onSubmit = jest.fn().mockResolvedValue(undefined)
      const { result } = renderHook(() => useForm(initialValues, onSubmit))

      expect(result.current.values).toEqual(initialValues)
      expect(result.current.errors).toEqual({})
      expect(result.current.isSubmitting).toBe(false)
    })

    it('should update values on change', () => {
      const initialValues = { name: '', email: '' }
      const onSubmit = jest.fn().mockResolvedValue(undefined)
      const { result } = renderHook(() => useForm(initialValues, onSubmit))

      act(() => {
        result.current.handleChange({
          target: { name: 'name', value: 'New Name', type: 'text' }
        } as React.ChangeEvent<HTMLInputElement>)
      })

      expect(result.current.values.name).toBe('New Name')
    })

    it('should handle form submission', async () => {
      const initialValues = { name: 'Test' }
      const onSubmit = jest.fn().mockResolvedValue(undefined)
      const { result } = renderHook(() => useForm(initialValues, onSubmit))

      await act(async () => {
        await result.current.handleSubmit({
          preventDefault: jest.fn()
        } as unknown as React.FormEvent)
      })

      expect(onSubmit).toHaveBeenCalledWith(initialValues)
    })

    it('should reset form to initial values', () => {
      const initialValues = { name: 'Initial' }
      const onSubmit = jest.fn().mockResolvedValue(undefined)
      const { result } = renderHook(() => useForm(initialValues, onSubmit))

      act(() => {
        result.current.handleChange({
          target: { name: 'name', value: 'Changed', type: 'text' }
        } as React.ChangeEvent<HTMLInputElement>)
      })

      expect(result.current.values.name).toBe('Changed')

      act(() => {
        result.current.reset()
      })

      expect(result.current.values).toEqual(initialValues)
      expect(result.current.errors).toEqual({})
    })
  })
})

