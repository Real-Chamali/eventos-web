'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createClient } from '@/utils/supabase/client'
import { LoginSchema } from '@/lib/validations/schemas'
import { useToast } from '@/lib/hooks'
import { logger } from '@/lib/utils/logger'
import { Card, CardContent } from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { FormGroup } from '@/components/ui/Form'

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

      // Obtener el rol del usuario con manejo mejorado de errores
      let role = 'vendor' // Rol por defecto
      
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', authData.user.id)
        .maybeSingle() // Usar maybeSingle para evitar errores si no existe

      if (profileError) {
        // Si el error es de esquema (PGRST106), intentar obtener el rol desde el servidor
        if (profileError.code === 'PGRST106' || profileError.message?.includes('schema')) {
          logger.warn('LoginPage', 'Profile table not accessible (schema error), trying server-side fetch', {
            userId: authData.user.id,
            error: profileError.message,
            code: profileError.code,
          })
          
          // Intentar obtener el rol desde el servidor como alternativa
          try {
            const response = await fetch('/api/user/role', {
              method: 'GET',
              credentials: 'include',
            })
            
            if (response.ok) {
              const { role: serverRole } = await response.json()
              role = serverRole === 'admin' ? 'admin' : 'vendor'
              logger.info('LoginPage', 'Role obtained from server API', {
                userId: authData.user.id,
                role,
              })
            } else {
              logger.warn('LoginPage', 'Failed to get role from server API, using default', {
                userId: authData.user.id,
                status: response.status,
              })
            }
          } catch (apiError) {
            logger.error('LoginPage', 'Error fetching role from API', apiError as Error, {
              userId: authData.user.id,
            })
            // Continuar con rol por defecto
          }
        } else if (profileError.code === 'PGRST116') {
          // No encontrado - perfil no existe, usar rol por defecto
          logger.info('LoginPage', 'Profile not found, using default role', {
            userId: authData.user.id,
          })
        } else {
          // Otros errores
          logger.error('LoginPage', 'Error fetching profile', new Error(profileError.message), {
            supabaseError: profileError.message,
            supabaseCode: profileError.code,
            userId: authData.user.id,
          })
        }
      } else if (profile) {
        // Convertir el enum a string si es necesario
        role = typeof profile.role === 'string' ? profile.role : String(profile.role)
        // Asegurar que sea 'admin' o 'vendor'
        role = (role === 'admin' ? 'admin' : 'vendor')
      }
      
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
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 via-indigo-50/30 to-violet-50/30 dark:from-gray-900 dark:via-indigo-950/20 dark:to-violet-950/20 px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        {/* Premium Header */}
        <div className="text-center space-y-4">
          <div className="mx-auto h-16 w-16 rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-500 to-purple-500 flex items-center justify-center shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-110">
            <span className="text-white font-bold text-2xl">E</span>
          </div>
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
              Bienvenido de vuelta
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Ingresa tus credenciales para continuar
            </p>
          </div>
        </div>

        {/* Premium Form Card */}
        <Card variant="elevated" className="overflow-hidden shadow-2xl">
          <CardContent className="p-8">
            <form className="space-y-6" onSubmit={handleSubmit(handleLogin)}>
              <div className="space-y-1">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Iniciar Sesión
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Accede a tu cuenta para gestionar tus eventos
                </p>
              </div>

              <FormGroup>
                <Input
                  id="email"
                  type="email"
                  label="Email"
                  autoComplete="email"
                  placeholder="tu@email.com"
                  error={errors.email?.message}
                  {...register('email')}
                />
              </FormGroup>

              <FormGroup>
                <Input
                  id="password"
                  type="password"
                  label="Contraseña"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  error={errors.password?.message}
                  {...register('password')}
                />
              </FormGroup>

              <Button
                type="submit"
                variant="premium"
                size="lg"
                className="w-full shadow-lg hover:shadow-xl"
                isLoading={isSubmitting}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Iniciando sesión...' : 'Iniciar Sesión'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Footer Info */}
        <div className="text-center">
          <p className="text-sm text-gray-500 dark:text-gray-500">
            Sistema de gestión de eventos premium
          </p>
        </div>
      </div>
    </div>
  )
}
