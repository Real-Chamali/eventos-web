import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { TOTP } from 'otpauth'
import QRCode from 'qrcode'
import { logger } from '@/lib/utils/logger'
import { getAuthenticatedUser, checkApiKeyPermissions } from '@/lib/api/authHelper'
import { errorResponse, successResponse, validateMethod, checkRateLimitAsync, handleAPIError } from '@/lib/api/middleware'
import { sanitizeForLogging } from '@/lib/utils/security'

export async function POST(request: NextRequest) {
  try {
    const methodError = validateMethod(request, ['POST', 'OPTIONS'])
    if (methodError) return methodError

    const auth = await getAuthenticatedUser(request)
    if (auth.error || !auth.userId) {
      return errorResponse(auth.error || 'Unauthorized', 401)
    }
    
    // API keys no pueden configurar 2FA
    if (auth.isApiKey) {
      return errorResponse('API keys cannot configure 2FA', 403)
    }

    // Rate limiting
    const rateLimitAllowed = await checkRateLimitAsync(`2fa-setup-${auth.userId}`, 3, 300000) // 3 intentos cada 5 minutos
    if (!rateLimitAllowed) {
      return errorResponse('Too many requests', 429)
    }

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return errorResponse('User not found', 404)
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

    logger.info('API /auth/2fa/setup', '2FA setup initiated', sanitizeForLogging({
      userId: auth.userId,
    }))

    return successResponse({
      secret: secretBase32,
      qrCode: qrCodeUrl,
      manualEntryKey: secretBase32,
    }, '2FA setup initiated successfully')
  } catch (error) {
    return await handleAPIError(error, 'POST /api/auth/2fa/setup')
  }
}

