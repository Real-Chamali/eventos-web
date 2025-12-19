import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { TOTP } from 'otpauth'
import QRCode from 'qrcode'
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

    // Generar secreto TOTP
    const secret = new TOTP({
      issuer: 'Eventos Web',
      label: user.email || 'Usuario',
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
    })

    // Generar QR code
    const qrCodeUrl = await QRCode.toDataURL(secret.toString())

    // Guardar secreto temporalmente (en producción, usar tabla separada o metadata)
    // Por ahora, lo retornamos para que el cliente lo guarde
    const secretBase32 = secret.secret.base32

    return NextResponse.json({
      success: true,
      secret: secretBase32,
      qrCode: qrCodeUrl,
      manualEntryKey: secretBase32,
    })
  } catch (error) {
    logger.error('API /auth/2fa/setup', 'Error setting up 2FA', error as Error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

