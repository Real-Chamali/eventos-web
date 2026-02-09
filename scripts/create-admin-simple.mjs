#!/usr/bin/env node
/**
 * Script simple para crear/verificar usuario admin
 * Usa SQL directo en lugar de API admin
 */

import { createClient } from '@supabase/supabase-js'

const ADMIN_EMAIL = 'admin@chamali.com'
const ADMIN_PASSWORD = 'Admin2025!'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceKey) {
  console.error('❌ Faltan variables de entorno')
  console.error('   Asegúrate de tener NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(url, serviceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function createAdmin() {
  console.log('🔧 Configurando usuario administrador...')
  console.log(`📧 Email: ${ADMIN_EMAIL}`)
  console.log(`🔑 Contraseña: ${ADMIN_PASSWORD}`)
  console.log('')

  try {
    // 1. Intentar crear el usuario con signup
    console.log('📝 Creando usuario...')
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      options: {
        emailRedirectTo: `${url}/login`,
        data: {
          role: 'admin',
          full_name: 'Administrador'
        }
      }
    })

    if (signUpError && !signUpError.message.includes('already registered')) {
      console.error('❌ Error al crear usuario:', signUpError.message)
      return
    }

    if (signUpData.user) {
      console.log('✅ Usuario creado exitosamente')
      console.log('📧 Revisa tu email para confirmar la cuenta')
    } else {
      console.log('ℹ️  Usuario ya existe, intentando resetear contraseña...')
    }

    // 2. Si ya existe, intentar resetear contraseña
    if (!signUpData.user) {
      const { data: resetData, error: resetError } = await supabase.auth.resetPasswordForEmail(
        ADMIN_EMAIL,
        {
          redirectTo: `${url}/reset-password`
        }
      )

      if (resetError) {
        console.error('❌ Error al enviar email de reset:', resetError.message)
      } else {
        console.log('✅ Email de reseteo enviado')
      }
    }

    // 3. Verificar/crear perfil
    console.log('🔍 Verificando perfil...')
    
    // Primero obtener el ID del usuario
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers({
      perPage: 1000
    })

    if (listError) {
      // Si no podemos usar admin API, intentar con SQL directo
      console.log('⚠️  No se puede usar API admin, intentando método alternativo...')
      
      // Intentar obtener el ID desde la tabla auth.users con SQL
      const { data: userData, error: userError } = await supabase
        .rpc('get_user_id_by_email', { email: ADMIN_EMAIL })
        .catch(() => ({ data: null, error: { message: 'RPC not available' } }))

      if (userError || !userData) {
        console.log('ℹ️  No se puede verificar el perfil automáticamente')
        console.log('📝 Por favor, verifica manualmente en Supabase Dashboard:')
        console.log('   1. Ve a Authentication → Users')
        console.log('   2. Busca admin@chamali.com')
        console.log('   3. Confirma el email si es necesario')
        console.log('   4. Ve a Table Editor → profiles')
        console.log('   5. Asegúrate que tenga role = "admin"')
      } else {
        // Crear/actualizar perfil
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: userData,
            role: 'admin',
            full_name: 'Administrador',
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'id'
          })

        if (profileError) {
          console.warn('⚠️  Error al actualizar perfil:', profileError.message)
        } else {
          console.log('✅ Perfil configurado correctamente')
        }
      }
    } else {
      const adminUser = users?.find(u => u.email === ADMIN_EMAIL)
      
      if (adminUser) {
        // Crear/actualizar perfil
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: adminUser.id,
            role: 'admin',
            full_name: 'Administrador',
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'id'
          })

        if (profileError) {
          console.warn('⚠️  Error al actualizar perfil:', profileError.message)
          console.log('💡 Esto puede ser por políticas RLS. Verifica manualmente en Supabase Dashboard.')
        } else {
          console.log('✅ Perfil configurado correctamente')
        }
      }
    }

    console.log('')
    console.log('🎉 Configuración completada!')
    console.log('')
    console.log('📋 Resumen:')
    console.log(`   📧 Email: ${ADMIN_EMAIL}`)
    console.log(`   🔑 Contraseña: ${ADMIN_PASSWORD}`)
    console.log(`   🌐 Login URL: ${url}/login`)
    console.log('')
    console.log('📝 Siguientes pasos:')
    console.log('   1. Confirma tu email si recibiste el enlace')
    console.log('   2. Inicia sesión en /login')
    console.log('   3. Deberías redirigir a /admin')
    console.log('')
    console.log('🔍 Si tienes problemas:')
    console.log('   - Revisa la carpeta de spam')
    console.log('   - Verifica en Supabase Dashboard → Authentication → Users')
    console.log('   - Asegúrate que el perfil tenga role = "admin"')

  } catch (error) {
    console.error('❌ Error inesperado:', error.message)
  }
}

createAdmin()
