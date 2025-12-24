'use client'

import { useState, useCallback, useEffect, useMemo } from 'react'
import { createClient } from '@/utils/supabase/client'
import { logger } from '@/lib/utils/logger'
import toast from 'react-hot-toast'

/**
 * Hook para solicitudes asincrónicas con manejo de loading y errores
 */
export function useAsync<T, E = string>(
  asyncFunction: () => Promise<T>,
  immediate = true
) {
  const [status, setStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle')
  const [value, setValue] = useState<T | null>(null)
  const [error, setError] = useState<E | null>(null)

  const execute = useCallback(async () => {
    setStatus('pending')
    setValue(null)
    setError(null)
    try {
      const response = await asyncFunction()
      setValue(response)
      setStatus('success')
      return response
    } catch (error) {
      setError(error as E)
      setStatus('error')
      throw error
    }
  }, [asyncFunction])

  useEffect(() => {
    if (immediate) {
      const t = setTimeout(() => {
        void execute().catch(() => {})
      }, 0)
      return () => clearTimeout(t)
    }
    return undefined
  }, [execute, immediate])

  return { execute, status, value, error }
}

/**
 * Hook para autenticación del usuario
 */
type MaybeUser = { id: string; email?: string } | null
type MaybeProfile = { role?: string | { value?: string } | unknown } | null

export function useAuth() {
  const [user, setUser] = useState<MaybeUser>(null)
  const [profile, setProfile] = useState<MaybeProfile>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        setUser(user)

        if (user) {
          const res = await supabase.from('profiles').select('role').eq('id', user.id).single()
          setProfile(res.data as MaybeProfile)
        }
      } catch (error) {
        logger.error('useAuth', 'Error fetching user', error instanceof Error ? error : new Error(String(error)))
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [supabase])

  return { user, profile, loading }
}

/**
 * Hook para control de acceso basado en roles
 */
export function useCanAccess(permission: string) {
  const { profile } = useAuth()

  const permissions: Record<string, string[]> = {
    admin: ['view_all_quotes', 'edit_services', 'view_finance', 'manage_users', 'export_reports'],
    vendor: ['create_quote', 'view_own_quotes', 'edit_own_quotes', 'export_own_quotes'],
  }

  const userPermissions = permissions[(profile?.role as string) || ''] || []
  return userPermissions.includes(permission)
}

/**
 * Hook para verificar si el usuario actual es admin
 * Versión mejorada que obtiene el perfil directamente para evitar problemas con RLS
 */
export function useIsAdmin() {
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    let cancelled = false
    let timeoutId: NodeJS.Timeout | null = null
    
    const checkAdminStatus = async () => {
      try {
        setLoading(true)
        
        // Timeout de seguridad: si después de 5 segundos no hay respuesta, asumir no admin
        timeoutId = setTimeout(() => {
          if (!cancelled) {
            logger.warn('useIsAdmin', 'Timeout waiting for admin check, assuming not admin')
            setIsAdmin(false)
            setLoading(false)
          }
        }, 5000)
        
        // Obtener usuario autenticado
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        if (cancelled) return
        
        if (userError || !user) {
          if (timeoutId) clearTimeout(timeoutId)
          setIsAdmin(false)
          setLoading(false)
          return
        }

        // Bypass para admin@chamali.com
        if (user.email === 'admin@chamali.com') {
          if (timeoutId) clearTimeout(timeoutId)
          setIsAdmin(true)
          setLoading(false)
          logger.debug('useIsAdmin', 'Admin email detected', { email: user.email })
          return
        }

        // Obtener perfil directamente (intentar con el cliente normal primero)
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .maybeSingle()

        if (cancelled) return

        if (profileError) {
          logger.warn('useIsAdmin', 'Error fetching profile', {
            error: profileError.message,
            code: profileError.code,
            userId: user.id,
          })
          // Si hay error pero el email es admin@chamali.com, asumir admin
          if (user.email === 'admin@chamali.com') {
            if (timeoutId) clearTimeout(timeoutId)
            setIsAdmin(true)
            setLoading(false)
            return
          }
        }

        if (!profile || !profile.role) {
          if (timeoutId) clearTimeout(timeoutId)
          setIsAdmin(false)
          setLoading(false)
          return
        }

        // Manejar enum de PostgreSQL correctamente
        let roleStr: string
        const role = profile.role
        if (typeof role === 'string') {
          roleStr = role.trim().toLowerCase()
        } else if (role && typeof role === 'object' && role !== null && 'value' in role) {
          const roleValue = (role as { value?: unknown }).value
          roleStr = String(roleValue || '').trim().toLowerCase()
        } else {
          roleStr = String(role || '').trim().toLowerCase()
        }

        const adminStatus = roleStr === 'admin'
        if (timeoutId) clearTimeout(timeoutId)
        setIsAdmin(adminStatus)
        
        logger.debug('useIsAdmin', 'Admin status determined', {
          userId: user.id,
          email: user.email,
          roleStr,
          isAdmin: adminStatus,
        })
      } catch (error) {
        if (cancelled) return
        if (timeoutId) clearTimeout(timeoutId)
        logger.error('useIsAdmin', 'Unexpected error checking admin status', error instanceof Error ? error : new Error(String(error)))
        setIsAdmin(false)
      } finally {
        if (!cancelled && timeoutId) {
          clearTimeout(timeoutId)
        }
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    checkAdminStatus()

    return () => {
      cancelled = true
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [supabase])

  return { isAdmin, loading }
}

/**
 * Hook para notificaciones toast
 * Retorna referencias estables usando useMemo para evitar re-renders innecesarios
 */
export function useToast() {
  return useMemo(() => ({
    success: (message: string) => {
      toast.success(message, {
        duration: 4000,
        position: 'top-right',
      })
    },
    error: (message: string) => {
      toast.error(message, {
        duration: 4000,
        position: 'top-right',
      })
    },
    loading: (message: string) => {
      return toast.loading(message)
    },
    dismiss: (toastId: string) => {
      toast.dismiss(toastId)
    },
  }), [])
}

/**
 * Hook para debouncing
 */
export function useDebounce<T>(value: T, delay: number = 500) {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => clearTimeout(handler)
  }, [value, delay])

  return debouncedValue
}

/**
 * Hook para usar almacenamiento local
 */
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(initialValue)
  const [isLoading, setIsLoading] = useState(true)

  // Leer del localStorage
  useEffect(() => {
    try {
      const item = typeof window !== 'undefined' ? window.localStorage.getItem(key) : null
      if (item) {
        setStoredValue(JSON.parse(item))
      }
    } catch (error) {
      logger.error('useLocalStorage', 'Error reading from localStorage', error instanceof Error ? error : new Error(String(error)))
    } finally {
      setIsLoading(false)
    }
  }, [key])

  // Actualizar localStorage
  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value
      setStoredValue(valueToStore)
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore))
      }
    } catch (error) {
      logger.error('useLocalStorage', 'Error writing to localStorage', error instanceof Error ? error : new Error(String(error)))
    }
  }, [key, storedValue])

  return [storedValue, setValue, isLoading] as const
}

/**
 * Hook para formularios con validación
 */
export function useForm<T extends Record<string, unknown>>(initialValues: T, onSubmit: (values: T) => Promise<void>) {
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const toast = useToast()

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setValues((prev) => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value,
    }))
    // Limpiar error cuando el usuario escribe
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }, [errors])

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setIsSubmitting(true)
      try {
        await onSubmit(values)
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Error al enviar formulario'
        toast.error(message)
        logger.error('useForm', 'Submit error', error instanceof Error ? error : new Error(String(error)))
      } finally {
        setIsSubmitting(false)
      }
    },
    [values, onSubmit, toast]
  )

  const reset = useCallback(() => {
    setValues(initialValues)
    setErrors({})
  }, [initialValues])

  return {
    values,
    errors,
    isSubmitting,
    setErrors,
    handleChange,
    handleSubmit,
    reset,
  }
}

// Re-export hooks con SWR
export { useQuotes } from './useQuotes'
export { useRecentQuotes } from './useRecentQuotes'
export { usePartialPayments, usePaymentSummary, type PartialPayment, type PaymentSummary } from './usePartialPayments'
export { useInfiniteQuotes } from './useInfiniteQuotes'
export { useDashboardStats } from './useDashboardStats'
export { useClients } from './useClients'
export { useServices } from './useServices'
export { useEvents } from './useEvents'
export { useAdminEvents } from './useAdminEvents'
export { useOptimisticMutation } from './useOptimisticMutation'

