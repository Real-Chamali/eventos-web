import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
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

    // Deshabilitar 2FA
    const { error: updateError } = await supabase.auth.updateUser({
      data: {
        two_factor_enabled: false,
        two_factor_secret: null,
      },
    })

    if (updateError) {
      logger.error('API /auth/2fa/disable', 'Error updating user metadata', updateError)
      return NextResponse.json({ error: 'Error disabling 2FA' }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: '2FA disabled successfully' })
  } catch (error) {
    logger.error('API /auth/2fa/disable', 'Error disabling 2FA', error as Error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

