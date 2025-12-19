import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { TOTP } from 'otpauth'
import { logger } from '@/lib/utils/logger'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { token, secret } = body

    if (!token || !secret) {
      return NextResponse.json({ error: 'Token and secret are required' }, { status: 400 })
    }

    // Verificar token TOTP
    const totp = new TOTP({
      secret: secret,
    })

    const isValid = totp.validate({ token, window: 1 }) !== null

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 400 })
    }

    // Guardar secreto en metadata del usuario (en producción, usar tabla separada)
    const { error: updateError } = await supabase.auth.updateUser({
      data: {
        two_factor_secret: secret,
        two_factor_enabled: true,
      },
    })

    if (updateError) {
      logger.error('API /auth/2fa/verify', 'Error updating user metadata', updateError)
      return NextResponse.json({ error: 'Error saving 2FA settings' }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: '2FA enabled successfully' })
  } catch (error) {
    logger.error('API /auth/2fa/verify', 'Error verifying 2FA', error as Error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

