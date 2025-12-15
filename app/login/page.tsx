'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createClient } from '@/utils/supabase/client'
import { LoginSchema } from '@/lib/validations/schemas'
import { useToast } from '@/lib/hooks'
import { logger } from '@/lib/utils/logger'

// Forzar renderizado dinámico para evitar prerendering durante build
export const dynamic = 'force-dynamic'

type LoginFormData = {
  email: string
  password: string
}

export default function LoginPage() {
  const supabase = createClient()
  const { success: toastSuccess, error: toastError } = useToast()
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(LoginSchema),
  })

  const handleLogin = async (data: LoginFormData) => {
    try {
      const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })

      if (signInError) {
        // Mapear errores comunes de Supabase a mensajes más claros en español
        let userFriendlyMessage = 'Error al iniciar sesión'
        
        if (signInError.message) {
          const errorMsg = signInError.message.toLowerCase()
          
          if (errorMsg.includes('invalid login credentials') || errorMsg.includes('invalid credentials')) {
            userFriendlyMessage = 'Credenciales incorrectas. Verifica tu email y contraseña.'
          } else if (errorMsg.includes('email not confirmed')) {
            userFriendlyMessage = 'Por favor, confirma tu email antes de iniciar sesión.'
          } else if (errorMsg.includes('too many requests')) {
            userFriendlyMessage = 'Demasiados intentos. Por favor, espera unos minutos e intenta de nuevo.'
          } else if (errorMsg.includes('user not found')) {
            userFriendlyMessage = 'No se encontró una cuenta con este email.'
          } else if (errorMsg.includes('network') || errorMsg.includes('connection')) {
            userFriendlyMessage = 'Error de conexión. Verifica tu conexión a internet.'
          } else {
            // Usar el mensaje original si no coincide con ningún patrón conocido
            userFriendlyMessage = signInError.message
          }
        }
        
        toastError(userFriendlyMessage)
        
        // Convertir el error de Supabase a Error estándar para el logger
        const errorMessage = signInError.message || 'Unknown authentication error'
        const errorForLogging = signInError instanceof Error 
          ? signInError 
          : new Error(errorMessage)
        
        logger.error('LoginPage', 'Authentication error', errorForLogging, {
          code: signInError.status,
          email: data.email,
          originalMessage: signInError.message,
        })
        return
      }

      if (!authData.user) {
        toastError('No se pudo obtener información del usuario')
        logger.error('LoginPage', 'User data missing after login', new Error('User is null'))
        return
      }

      // Obtener el rol del usuario
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', authData.user.id)
        .single()

      if (profileError) {
        logger.warn('LoginPage', 'Profile not found, using default role', {
          userId: authData.user.id,
          error: profileError.message,
        })
      }

      const role = profile?.role || 'vendor'
      
      toastSuccess(`¡Bienvenido de vuelta, ${authData.user.email}!`)
      logger.info('LoginPage', 'User logged in successfully', { 
        userId: authData.user.id, 
        role,
        email: authData.user.email,
      })
      
      // Usar window.location.assign para forzar recarga completa y asegurar que las cookies estén establecidas
      // Esto evita problemas de timing con el middleware
      const targetPath = role === 'admin' ? '/admin' : '/dashboard'
      window.location.assign(targetPath)
    } catch (err) {
      // Manejar errores inesperados
      let error: Error
      let errorMessage: string
      
      if (err instanceof Error) {
        error = err
        errorMessage = err.message || 'Error al iniciar sesión. Por favor, intenta de nuevo.'
      } else if (err && typeof err === 'object') {
        // Intentar extraer información del objeto de error
        const errObj = err as Record<string, unknown>
        const message = errObj.message 
          ? String(errObj.message)
          : errObj.error
          ? String(errObj.error)
          : 'Error desconocido al iniciar sesión'
        
        error = new Error(message)
        errorMessage = message
        
        // Si hay stack, agregarlo al error
        if (errObj.stack && typeof errObj.stack === 'string') {
          error.stack = errObj.stack
        }
      } else if (err) {
        error = new Error(String(err))
        errorMessage = String(err)
      } else {
        error = new Error('Error desconocido al iniciar sesión')
        errorMessage = 'Error al iniciar sesión. Por favor, intenta de nuevo.'
      }
      
      toastError(errorMessage)
      
      // Logging mejorado con más contexto
      const errorData: Record<string, unknown> = {
        email: data.email,
        errorType: err?.constructor?.name || typeof err,
      }
      
      // Agregar información adicional si está disponible
      if (err && typeof err === 'object') {
        try {
          const serialized = JSON.stringify(err, Object.getOwnPropertyNames(err))
          if (serialized !== '{}') {
            errorData.errorDetails = serialized
          }
        } catch {
          // Si no se puede serializar, usar toString
          errorData.errorString = String(err)
        }
      }
      
      logger.error('LoginPage', 'Unexpected login error', error, errorData)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow-lg dark:bg-gray-800">
        <div>
          <h2 className="text-center text-3xl font-bold text-gray-900 dark:text-white">
            Iniciar Sesión
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Ingresa tus credenciales para continuar
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(handleLogin)}>
          <div className="space-y-4">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                {...register('email')}
                className={`mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 dark:bg-gray-700 dark:text-white dark:border-gray-600 ${
                  errors.email
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                }`}
                placeholder="tu@email.com"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.email.message || 'Email inválido'}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                {...register('password')}
                className={`mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 dark:bg-gray-700 dark:text-white dark:border-gray-600 ${
                  errors.password
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                }`}
                placeholder="••••••••"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.password.message || 'Contraseña inválida'}
                </p>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed dark:hover:bg-blue-800 dark:focus:ring-offset-gray-900"
          >
            {isSubmitting ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </button>
        </form>
      </div>
    </div>
  )
}
