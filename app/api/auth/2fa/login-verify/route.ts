import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { TOTP } from 'otpauth'
import { logger } from '@/lib/utils/logger'

/**
 * POST /api/auth/2fa/login-verify
 * Verifica código TOTP durante el proceso de login
 * Este endpoint NO requiere autenticación previa
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, token } = body

    if (!email || !token) {
      return NextResponse.json(
        { error: 'Email and token are required' },
        { status: 400 }
      )
    }

    // Obtener usuario por email usando admin client
    const supabaseAdmin = createAdminClient()
    
    // Buscar usuario por email en auth.users usando listUsers
    // Nota: listUsers no tiene filtro directo, así que listamos y filtramos
    const { data: { users }, error: userError } = await supabaseAdmin.auth.admin.listUsers()

    if (userError) {
      logger.warn('API /auth/2fa/login-verify', 'Error listing users', { email, error: userError })
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Filtrar por email
    const user = users?.find((u) => u.email?.toLowerCase() === email.toLowerCase())

    if (!user) {
      logger.warn('API /auth/2fa/login-verify', 'User not found', { email })
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Verificar si el usuario tiene 2FA habilitado
    const twoFactorEnabled = user.user_metadata?.two_factor_enabled === true
    const twoFactorSecret = user.user_metadata?.two_factor_secret

    if (!twoFactorEnabled || !twoFactorSecret) {
      return NextResponse.json(
        { error: '2FA is not enabled for this user' },
        { status: 400 }
      )
    }

    // Verificar token TOTP
    const totp = new TOTP({
      secret: twoFactorSecret,
    })

    const isValid = totp.validate({ token, window: 1 }) !== null

    if (!isValid) {
      logger.warn('API /auth/2fa/login-verify', 'Invalid TOTP token', { email, userId: user.id })
      return NextResponse.json(
        { error: 'Invalid verification code' },
        { status: 400 }
      )
    }

    logger.info('API /auth/2fa/login-verify', 'TOTP verified successfully', {
      userId: user.id,
      email,
    })

    return NextResponse.json({
      success: true,
      message: '2FA verification successful',
    })
  } catch (error) {
    logger.error('API /auth/2fa/login-verify', 'Error verifying 2FA during login', error as Error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

