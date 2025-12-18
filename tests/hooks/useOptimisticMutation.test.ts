/**
 * Tests para hook useOptimisticMutation
 */

import React from 'react'
import { renderHook, waitFor } from '@testing-library/react'
import { SWRConfig } from 'swr'
import { useOptimisticMutation } from '@/lib/hooks/useOptimisticMutation'
import type { ReactNode } from 'react'

const wrapper = ({ children }: { children: ReactNode }): React.ReactElement => {
  return React.createElement(
    SWRConfig,
    { value: { provider: () => new Map(), dedupingInterval: 0 } },
    children
  )
}

describe('useOptimisticMutation', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns execute function and isMutating state', () => {
    const { result } = renderHook(() => useOptimisticMutation(), { wrapper })

    expect(result.current.execute).toBeInstanceOf(Function)
    expect(result.current.isMutating).toBe(false)
  })

  it('updates isMutating during mutation', async () => {
    const { result } = renderHook(() => useOptimisticMutation(), { wrapper })

    const mutationPromise = result.current.execute({
      swrKey: 'test-key',
      optimisticUpdate: (current) => current,
      mutateFn: async () => {
        await new Promise(resolve => setTimeout(resolve, 100))
        return 'result'
      },
    })

    // isMutating should be true during mutation
    expect(result.current.isMutating).toBe(true)

    await mutationPromise

    await waitFor(() => {
      expect(result.current.isMutating).toBe(false)
    })
  })

  it('performs optimistic update before mutation', async () => {
    const { result } = renderHook(() => useOptimisticMutation(), { wrapper })

    const optimisticUpdate = jest.fn((current) => {
      return current ? [...current, 'new-item'] : ['new-item']
    })

    const mutateFn = jest.fn().mockResolvedValue('result')

    await result.current.execute({
      swrKey: 'test-key',
      optimisticUpdate,
      mutateFn,
    })

    expect(optimisticUpdate).toHaveBeenCalled()
    expect(mutateFn).toHaveBeenCalled()
  })

  it('rolls back on error when rollback function provided', async () => {
    const { result } = renderHook(() => useOptimisticMutation(), { wrapper })

    const rollback = jest.fn((current) => current)

    await expect(
      result.current.execute({
        swrKey: 'test-key',
        optimisticUpdate: (current) => current,
        mutateFn: async () => {
          throw new Error('Mutation failed')
        },
        rollback,
      })
    ).rejects.toThrow('Mutation failed')

    expect(rollback).toHaveBeenCalled()
  })

  it('revalidates cache on error when no rollback provided', async () => {
    const { result } = renderHook(() => useOptimisticMutation(), { wrapper })

    await expect(
      result.current.execute({
        swrKey: 'test-key',
        optimisticUpdate: (current) => current,
        mutateFn: async () => {
          throw new Error('Mutation failed')
        },
      })
    ).rejects.toThrow('Mutation failed')

    // Should complete without throwing
    await waitFor(() => {
      expect(result.current.isMutating).toBe(false)
    })
  })
})

