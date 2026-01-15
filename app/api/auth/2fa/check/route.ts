import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: NextRequest) {
  void request
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const twoFactorEnabled = user.user_metadata?.two_factor_enabled === true

    return NextResponse.json({ enabled: twoFactorEnabled })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

