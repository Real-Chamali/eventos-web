import { NextResponse } from 'next/server'

// Funci?n helper para devolver errores JSON de forma consistente
// Esta funci?n NO puede fallar, debe ser lo m?s simple posible
function errorResponse(error: string, message: string, status: number = 500): NextResponse {
  try {
    const response = NextResponse.json({ error, message }, { status })
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('Content-Type', 'application/json')
    return response
  } catch {
    // Si incluso esto falla, crear respuesta b?sica
    return new NextResponse(
      JSON.stringify({ error, message }),
      {
        status,
        headers: {
          'Content-Type': 'application/json',
          'X-Content-Type-Options': 'nosniff',
        },
      }
    )
  }
}

/**
 * GET /api/admin/vendors - Get all vendors with statistics
 * Requires admin role
 * 
 * Esta funci?n est? dise?ada para ser ultra-robusta y siempre devolver JSON,
 * incluso en caso de errores cr?ticos.
 */
export async function GET() {
  // Envolver TODO en try-catch para asegurar que siempre devolvamos JSON
  try {
    // Importaciones din?micas para evitar errores de inicializaci?n
    let createClient, createAdminClient, logger, sanitizeForLogging, getUserFromSession, checkAdmin
    
    try {
      const supabaseServer = await import('@/utils/supabase/server')
      createClient = supabaseServer.createClient
      
      const supabaseJs = await import('@supabase/supabase-js')
      createAdminClient = supabaseJs.createClient
      
      const loggerModule = await import('@/lib/utils/logger')
      logger = loggerModule.logger
      
      const securityModule = await import('@/lib/utils/security')
      sanitizeForLogging = securityModule.sanitizeForLogging
      
      const middlewareModule = await import('@/lib/api/middleware')
      getUserFromSession = middlewareModule.getUserFromSession
      checkAdmin = middlewareModule.checkAdmin
    } catch (importError) {
      // Si las importaciones fallan, devolver error JSON
      try {
        if (logger) {
          logger.error('API /admin/vendors', 'Error importing modules', importError instanceof Error ? importError : new Error(String(importError)))
        }
      } catch {
        // Fallback si logger no est? disponible
      }
      return errorResponse(
        'Module import error',
        importError instanceof Error ? importError.message : 'Error al cargar m?dulos necesarios',
        500
      )
    }

    // Usar funci?n centralizada para obtener usuario de sesi?n
    let user, authError
    try {
      const sessionResult = await getUserFromSession()
      user = sessionResult.user
      authError = sessionResult.error
    } catch (sessionError) {
      const errorMsg = sessionError instanceof Error ? sessionError.message : 'Error al obtener sesi?n'
      try {
        logger.error('API /admin/vendors', 'Error getting session', sessionError as Error)
      } catch {
        // Fallback silencioso si logger no est? disponible
      }
      return errorResponse('Session error', errorMsg, 500)
    }

    if (!user || authError) {
      return errorResponse('Unauthorized', authError || 'No se encontr? sesi?n de usuario', 401)
    }

    // Verificar que sea admin usando checkAdmin (pasar email para bypass)
    let isAdmin = false
    try {
      isAdmin = await checkAdmin(user.id, user.email)
    } catch (checkError) {
      const errorMsg = checkError instanceof Error ? checkError.message : 'Error al verificar rol de administrador'
      try {
        logger.error('API /admin/vendors', 'Error checking admin role', checkError as Error)
      } catch {
        // Fallback silencioso si logger no est? disponible
      }
      return errorResponse('Authorization error', errorMsg, 500)
    }

    if (!isAdmin) {
      try {
        logger.warn('API /admin/vendors', 'Non-admin attempted access', sanitizeForLogging({
          userId: user.id,
        }))
      } catch {
        console.warn('Non-admin attempted access:', user.id)
      }
      return errorResponse('Forbidden', 'Acceso denegado. Se requiere rol de administrador.', 403)
    }

    // Crear cliente de administraci?n con service role key
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      const errorMsg = 'SUPABASE_SERVICE_ROLE_KEY no est? configurado. Verifica las variables de entorno en Vercel.'
      try {
        logger.error('API /admin/vendors', 'Missing service role key', new Error('SUPABASE_SERVICE_ROLE_KEY not set'), sanitizeForLogging({
          hasUrl: !!supabaseUrl,
          hasServiceKey: !!supabaseServiceKey,
        }))
      } catch {
        console.error('Missing service role key:', { hasUrl: !!supabaseUrl, hasServiceKey: !!supabaseServiceKey })
      }
      return errorResponse('Server configuration error', errorMsg, 500)
    }

    let adminClient
    try {
      adminClient = createAdminClient(supabaseUrl, supabaseServiceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      })
    } catch (clientError) {
      const errorMsg = clientError instanceof Error ? clientError.message : 'Error al crear cliente de administraci?n'
      try {
        logger.error('API /admin/vendors', 'Error creating admin client', clientError as Error)
      } catch {
        console.error('Error creating admin client:', errorMsg)
      }
      return errorResponse('Client creation error', errorMsg, 500)
    }

    // Obtener todos los usuarios usando Admin API
    try {
      logger.info('API /admin/vendors', 'Fetching users from Supabase Admin API', sanitizeForLogging({}))
    } catch {
      console.log('Fetching users from Supabase Admin API')
    }
    
    let usersData, usersError
    try {
      const result = await adminClient.auth.admin.listUsers({
        page: 1,
        perPage: 1000,
      })
      usersData = result.data
      usersError = result.error
    } catch (listError) {
      const errorMsg = listError instanceof Error ? listError.message : 'Error al llamar a la API de Supabase'
      try {
        logger.error('API /admin/vendors', 'Error calling listUsers', listError as Error)
      } catch {
        console.error('Error calling listUsers:', errorMsg)
      }
      return errorResponse('Supabase API error', errorMsg, 500)
    }

    if (usersError) {
      const errorMsg = usersError.message || 'Error desconocido de Supabase'
      try {
        logger.error('API /admin/vendors', 'Error listing users', new Error(usersError.message), sanitizeForLogging({
          errorCode: usersError.status,
          errorMessage: usersError.message,
          errorName: usersError.name,
        }))
      } catch {
        console.error('Error listing users:', errorMsg)
      }
      return errorResponse('Error al obtener usuarios de Supabase', errorMsg, 500)
    }

    // Validar que usersData existe
    if (!usersData) {
      try {
        logger.error('API /admin/vendors', 'No users data returned', new Error('usersData is null'), sanitizeForLogging({}))
      } catch {
        console.error('No users data returned')
      }
      return errorResponse('No se recibieron datos de usuarios', 'La API de Supabase no devolvi? datos de usuarios.', 500)
    }

    // Validar que usersData.users existe y es un array
    if (!usersData.users || !Array.isArray(usersData.users)) {
      try {
        logger.error('API /admin/vendors', 'Invalid users data structure', new Error('users is not an array'), sanitizeForLogging({
          usersDataType: typeof usersData.users,
          usersDataKeys: usersData ? Object.keys(usersData) : [],
        }))
      } catch {
        console.error('Invalid users data structure')
      }
      return errorResponse('Estructura de datos de usuarios inv?lida', 'La respuesta de usuarios de Supabase no es un array v?lido.', 500)
    }

    try {
      logger.info('API /admin/vendors', 'Users fetched successfully', sanitizeForLogging({
        totalUsers: usersData.users.length,
      }))
    } catch {
      console.log('Users fetched successfully:', usersData.users.length)
    }

    // Crear cliente de Supabase para queries regulares
    let supabase
    try {
      supabase = await createClient()
    } catch (supabaseError) {
      const errorMsg = supabaseError instanceof Error ? supabaseError.message : 'Error al crear cliente de Supabase'
      try {
        logger.error('API /admin/vendors', 'Error creating Supabase client', supabaseError as Error)
      } catch {
        console.error('Error creating Supabase client:', errorMsg)
      }
      return errorResponse('Supabase client error', errorMsg, 500)
    }

    // Obtener estad?sticas de cotizaciones por vendedor
    let quotesData
    try {
      const quotesResult = await supabase
        .from('quotes')
        .select('vendor_id, total_amount, status')
      quotesData = quotesResult.data
    } catch (quotesQueryError) {
      try {
        logger.warn('API /admin/vendors', 'Error loading quotes stats', sanitizeForLogging({ 
          error: quotesQueryError instanceof Error ? quotesQueryError.message : String(quotesQueryError)
        }))
      } catch {
        console.warn('Error loading quotes stats:', quotesQueryError)
      }
      quotesData = null
    }

    // Calcular estad?sticas por vendedor
    const statsMap = new Map<string, { count: number; sales: number }>()
    if (quotesData) {
      quotesData.forEach((quote) => {
        if (quote.vendor_id) {
          const existing = statsMap.get(quote.vendor_id) || { count: 0, sales: 0 }
          existing.count++
          if (quote.status === 'APPROVED' || quote.status === 'confirmed') {
            existing.sales += Number(quote.total_amount) || 0
          }
          statsMap.set(quote.vendor_id, existing)
        }
      })
    }

    // Obtener roles de perfiles usando el cliente admin para evitar problemas con RLS
    let profilesData
    try {
      const profilesResult = await adminClient
        .from('profiles')
        .select('id, role, full_name')
      profilesData = profilesResult.data
    } catch (profilesQueryError) {
      try {
        logger.warn('API /admin/vendors', 'Error loading profiles', sanitizeForLogging({ 
          error: profilesQueryError instanceof Error ? profilesQueryError.message : String(profilesQueryError)
        }))
      } catch {
        console.warn('Error loading profiles:', profilesQueryError)
      }
      profilesData = null
    }
    
    const profilesMap = new Map<string, { role: 'admin' | 'vendor'; full_name: string | null }>()
    if (profilesData) {
      profilesData.forEach((profile) => {
        try {
          // Manejar el enum de PostgreSQL correctamente
          let role: 'admin' | 'vendor' = 'vendor' // default
          
          if (profile.role !== null && profile.role !== undefined) {
            // Convertir a string y normalizar
            const roleStr = String(profile.role).trim().toLowerCase()
            
            // Verificar expl?citamente si es 'admin'
            if (roleStr === 'admin') {
              role = 'admin'
            } else {
              role = 'vendor'
            }
            
            // Log para debugging (sanitizado)
            try {
              logger.debug('API /admin/vendors', 'Processing role', sanitizeForLogging({
                userId: profile.id,
                roleRaw: String(profile.role),
                roleStr,
                roleFinal: role,
                roleType: typeof profile.role,
              }))
            } catch {
              // Ignorar errores de logging
            }
          }
          
          profilesMap.set(profile.id, {
            role,
            full_name: profile.full_name,
          })
        } catch {
          // Si hay error procesando un perfil, usar defaults
          profilesMap.set(profile.id, {
            role: 'vendor',
            full_name: profile.full_name,
          })
        }
      })
    }

    // Usar los usuarios directamente (ya validados arriba)
    const users = usersData.users

    // Combinar datos de usuarios con estad?sticas y roles
    const vendorsWithStats = users.map((user) => {
      try {
        const stats = statsMap.get(user.id) || { count: 0, sales: 0 }
        const profile = profilesMap.get(user.id)
        
        // Usar el rol del mapa de perfiles (ya procesado correctamente)
        const role: 'admin' | 'vendor' = profile?.role || 'vendor'
        
        // Log para debugging del usuario admin (sanitizado)
        if (user.email === 'admin@chamali.com') {
          try {
            logger.info('API /admin/vendors', 'Admin user found', sanitizeForLogging({
              userId: user.id,
              email: user.email,
              profileRole: String(profile?.role || ''),
              finalRole: role,
            }))
          } catch {
            // Ignorar errores de logging
          }
        }
        
        return {
          id: user.id,
          email: user.email || '',
          raw_user_meta_data: user.user_metadata || {},
          created_at: user.created_at,
          last_sign_in_at: user.last_sign_in_at || null,
          quotes_count: stats.count,
          total_sales: stats.sales,
          role,
          full_name: profile?.full_name || user.user_metadata?.name || null,
        }
      } catch (userError) {
        try {
          logger.error('API /admin/vendors', 'Error processing user', userError as Error, sanitizeForLogging({
            userId: user?.id,
            userEmail: user?.email,
          }))
        } catch {
          console.error('Error processing user:', user?.id)
        }
        // Retornar un objeto b?sico para este usuario
        return {
          id: user.id,
          email: user.email || '',
          raw_user_meta_data: user.user_metadata || {},
          created_at: user.created_at,
          last_sign_in_at: user.last_sign_in_at || null,
          quotes_count: 0,
          total_sales: 0,
          role: 'vendor' as const,
          full_name: user.user_metadata?.name || null,
        }
      }
    })

    try {
      logger.info('API /admin/vendors', 'Vendors loaded successfully', sanitizeForLogging({
        totalVendors: vendorsWithStats.length,
      }))
    } catch {
      console.log('Vendors loaded successfully:', vendorsWithStats.length)
    }

    // Crear respuesta exitosa
    try {
      const response = NextResponse.json({ data: vendorsWithStats })
      response.headers.set('X-Content-Type-Options', 'nosniff')
      response.headers.set('X-Frame-Options', 'DENY')
      response.headers.set('X-XSS-Protection', '1; mode=block')
      response.headers.set('Content-Type', 'application/json')
      return response
    } catch {
      // Si crear la respuesta falla, usar m?todo alternativo
      return new NextResponse(
        JSON.stringify({ data: vendorsWithStats }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'DENY',
            'X-XSS-Protection': '1; mode=block',
          },
        }
      )
    }
  } catch (error) {
    // Catch absoluto para cualquier error no capturado
    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorStack = error instanceof Error ? error.stack : undefined
    
    // Intentar loguear, pero no fallar si el logger no funciona
    try {
      const loggerModule = await import('@/lib/utils/logger')
      const sanitizeModule = await import('@/lib/utils/security')
      loggerModule.logger.error('API /admin/vendors', 'Unexpected error', error as Error, sanitizeModule.sanitizeForLogging({
        errorMessage,
        errorType: error instanceof Error ? error.constructor.name : typeof error,
        errorStack: errorStack ? errorStack.substring(0, 500) : undefined,
      }))
    } catch {
      // Si el logger falla, usar console.error
      console.error('API /admin/vendors - Unexpected error:', errorMessage)
      if (errorStack) {
        console.error('Stack trace:', errorStack.substring(0, 500))
      }
    }
    
    // SIEMPRE devolver JSON, nunca dejar que Vercel devuelva HTML
    return errorResponse(
      'Internal server error',
      errorMessage || 'Un error inesperado ocurri? en el servidor',
      500
    )
  }
}

/**
 * POST /api/admin/vendors - Create new vendor/admin user
 * Requires admin role
 */
export async function POST(request: Request) {
  try {
    let createAdminClient, logger, sanitizeForLogging, getUserFromSession, checkAdmin

    try {
      const supabaseJs = await import('@supabase/supabase-js')
      createAdminClient = supabaseJs.createClient

      const loggerModule = await import('@/lib/utils/logger')
      logger = loggerModule.logger

      const securityModule = await import('@/lib/utils/security')
      sanitizeForLogging = securityModule.sanitizeForLogging

      const middlewareModule = await import('@/lib/api/middleware')
      getUserFromSession = middlewareModule.getUserFromSession
      checkAdmin = middlewareModule.checkAdmin
    } catch (importError) {
      return errorResponse(
        'Module import error',
        importError instanceof Error ? importError.message : 'Error al cargar m?dulos necesarios',
        500
      )
    }

    let user, authError
    try {
      const sessionResult = await getUserFromSession()
      user = sessionResult.user
      authError = sessionResult.error
    } catch (sessionError) {
      const errorMsg = sessionError instanceof Error ? sessionError.message : 'Error al obtener sesi?n'
      return errorResponse('Session error', errorMsg, 500)
    }

    if (!user || authError) {
      return errorResponse('Unauthorized', authError || 'No se encontr? sesi?n de usuario', 401)
    }

    let isAdmin = false
    try {
      isAdmin = await checkAdmin(user.id, user.email)
    } catch (checkError) {
      const errorMsg = checkError instanceof Error ? checkError.message : 'Error al verificar rol de administrador'
      return errorResponse('Authorization error', errorMsg, 500)
    }

    if (!isAdmin) {
      try {
        logger.warn('API /admin/vendors', 'Non-admin attempted vendor creation', sanitizeForLogging({
          userId: user.id,
        }))
      } catch {
        console.warn('Non-admin attempted vendor creation:', user.id)
      }
      return errorResponse('Forbidden', 'Acceso denegado. Se requiere rol de administrador.', 403)
    }

    const body = await request.json()
    const name = typeof body?.name === 'string' ? body.name.trim() : ''
    const email = typeof body?.email === 'string' ? body.email.trim() : ''
    const phone = typeof body?.phone === 'string' ? body.phone.trim() : ''
    const password = typeof body?.password === 'string' ? body.password : ''
    const role = body?.role === 'admin' ? 'admin' : 'vendor'

    if (!email || !password) {
      return errorResponse('Validation error', 'Email y contrase?a son requeridos', 400)
    }

    if (password.length < 6) {
      return errorResponse('Validation error', 'La contrase?a debe tener al menos 6 caracteres', 400)
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      const errorMsg = 'SUPABASE_SERVICE_ROLE_KEY no est? configurado. Verifica las variables de entorno en Vercel.'
      return errorResponse('Server configuration error', errorMsg, 500)
    }

    const adminClient = createAdminClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    const { data: createdUser, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name,
        phone,
      },
    })

    if (createError || !createdUser?.user) {
      const errorMsg = createError?.message || 'Error al crear el usuario'
      return errorResponse('Create user error', errorMsg, 400)
    }

    const created = createdUser.user

    const { error: profileError } = await adminClient
      .from('profiles')
      .upsert({
        id: created.id,
        role,
        full_name: name || null,
      }, { onConflict: 'id' })

    if (profileError) {
      try {
        logger.warn('API /admin/vendors', 'Profile upsert failed after user creation', sanitizeForLogging({
          userId: created.id,
          error: profileError.message,
        }))
      } catch {
        // ignore logging issues
      }
    }

    return NextResponse.json({
      data: {
        id: created.id,
        email: created.email,
        role,
      },
      message: 'Vendedor creado exitosamente',
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    return errorResponse('Internal server error', errorMessage || 'Un error inesperado ocurri? en el servidor', 500)
  }
}
