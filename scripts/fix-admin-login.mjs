#!/usr/bin/env node
/**
 * Script para corregir el login del admin (admin@chamali.com)
 * - Confirma el email si no está confirmado
 * - Establece una contraseña conocida
 * - Asegura que el perfil tenga role 'admin'
 *
 * Uso: node --env-file=.env.local scripts/fix-admin-login.mjs [nueva_contraseña]
 * O:   set -a && source .env.local && set +a && node scripts/fix-admin-login.mjs [nueva_contraseña]
 */

import { createClient } from '@supabase/supabase-js'

const ADMIN_EMAIL = 'admin@chamali.com'
const DEFAULT_PASSWORD = 'Admin2024!'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceKey) {
  console.error('❌ Faltan variables: NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY')
  console.error('   Ejecuta: node --env-file=.env.local scripts/fix-admin-login.mjs [contraseña]')
  process.exit(1)
}

const password = process.argv[2] || DEFAULT_PASSWORD
const supabase = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } })

async function fixAdmin() {
  console.log('🔍 Buscando usuario admin@chamali.com...')

  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers({ perPage: 1000 })

  if (listError) {
    console.error('❌ Error al listar usuarios:', listError.message)
    process.exit(1)
  }

  const adminUser = users?.find(u => u.email === ADMIN_EMAIL)

  if (!adminUser) {
    console.error('❌ No se encontró admin@chamali.com en auth.users')
    console.error('   Créalo en Supabase Dashboard: Authentication > Users > Add user')
    process.exit(1)
  }

  console.log('✓ Usuario encontrado:', adminUser.id)

  const { error: confirmError } = await supabase.auth.admin.updateUserById(adminUser.id, { email_confirm: true })
  if (confirmError) {
    console.error('❌ Error al confirmar email:', confirmError.message)
    process.exit(1)
  }
  console.log('✓ Email confirmado')

  const { error: pwdError } = await supabase.auth.admin.updateUserById(adminUser.id, { password })
  if (pwdError) {
    console.error('❌ Error al actualizar contraseña:', pwdError.message)
    process.exit(1)
  }
  console.log('✓ Contraseña actualizada')

  const { error: profileError } = await supabase
    .from('profiles')
    .upsert(
      { id: adminUser.id, role: 'admin', updated_at: new Date().toISOString() },
      { onConflict: 'id' }
    )

  if (profileError) {
    console.warn('⚠ No se pudo actualizar perfil (puede que RLS lo impida):', profileError.message)
  } else {
    console.log('✓ Perfil con role admin verificado')
  }

  console.log('')
  console.log('✅ Listo. Prueba iniciar sesión con:')
  console.log('   Email:', ADMIN_EMAIL)
  console.log('   Contraseña:', password)
  console.log('')
}

fixAdmin().catch(err => {
  console.error('❌ Error:', err)
  process.exit(1)
})
