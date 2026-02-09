/**
 * API para corregir login del admin (admin@chamali.com)
 * - Confirma email
 * - Establece nueva contraseña
 * - Verifica perfil con role admin
 *
 * POST /api/admin/fix-admin-login
 * Body: { "secret": "FIX_ADMIN_SECRET de env", "password": "nueva_contraseña" }
 * Requiere FIX_ADMIN_SECRET en variables de entorno.
 */

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const ADMIN_EMAIL = 'admin@chamali.com'

export async function POST(request: Request) {
  try {
    const secret = process.env.FIX_ADMIN_SECRET
    if (!secret) {
      return NextResponse.json(
        { error: 'FIX_ADMIN_SECRET no configurado. Añádelo en Vercel/env y vuelve a intentar.' },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { secret: providedSecret, password } = body as { secret?: string; password?: string }

    if (providedSecret !== secret) {
      return NextResponse.json({ error: 'Secret inválido' }, { status: 401 })
    }

    const pwd = typeof password === 'string' && password.length >= 6 ? password : 'Admin2024!'

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!url || !serviceKey) {
      return NextResponse.json(
        { error: 'Faltan variables de Supabase (URL o SERVICE_ROLE_KEY)' },
        { status: 500 }
      )
    }

    const supabase = createClient(url, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const { data: { users } } = await supabase.auth.admin.listUsers({ perPage: 1000 })
    const adminUser = users?.find((u) => u.email === ADMIN_EMAIL)

    if (!adminUser) {
      return NextResponse.json(
        { error: 'No se encontró admin@chamali.com en auth.users. Créalo en Supabase Dashboard.' },
        { status: 404 }
      )
    }

    const { error: confirmErr } = await supabase.auth.admin.updateUserById(adminUser.id, {
      email_confirm: true,
    })
    if (confirmErr) {
      return NextResponse.json({ error: 'Error al confirmar email: ' + confirmErr.message }, { status: 500 })
    }

    const { error: pwdErr } = await supabase.auth.admin.updateUserById(adminUser.id, { password: pwd })
    if (pwdErr) {
      return NextResponse.json({ error: 'Error al actualizar contraseña: ' + pwdErr.message }, { status: 500 })
    }

    await supabase
      .from('profiles')
      .upsert(
        { id: adminUser.id, role: 'admin', updated_at: new Date().toISOString() },
        { onConflict: 'id' }
      )

    return NextResponse.json({
      success: true,
      message: 'Admin corregido. Prueba iniciar sesión con admin@chamali.com y la contraseña que enviaste.',
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
