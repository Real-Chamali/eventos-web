#!/usr/bin/env node
/**
 * Script para configurar variables de entorno automáticamente
 * Crea/actualiza .env.local con las credenciales necesarias
 */

import fs from 'fs'
import path from 'path'

const ENV_FILE = path.join(process.cwd(), '.env.local')

// Variables de entorno críticas
const requiredEnv = `# ============================================
# VARIABLES DE ENTORNO - Sistema de Eventos
# ============================================
# 
# INSTRUCCIONES:
# 1. Este archivo contiene las credenciales reales
# 2. NO commitees este archivo (ya está en .gitignore)
# 3. Reemplaza los valores con tus credenciales reales
#
# ============================================

# ============================================
# VARIABLES REQUERIDAS (Obligatorias)
# ============================================

# URL del proyecto Supabase
# Obténla en: https://app.supabase.com → Tu Proyecto → Settings → API → Project URL
NEXT_PUBLIC_SUPABASE_URL=https://nmcrmgdnpzrrklpcgyzn.supabase.co

# Clave anónima pública de Supabase
# Obténla en: https://app.supabase.com → Tu Proyecto → Settings → API → anon public key
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5tY3JtZ2RucHpya2xwY2d5em4iLCJyb2xlIjoiYW5vbiIsImlhdCI6MTczODk4NjYyMCwiZXhwIjoyMDU0NTYyNjIwfQ.8fQJ7K_tT5aL2ZJ9Z8XQ3xYwJ8M7yBfPnRkHwXeZc

# Clave de servicio de Supabase (para operaciones del servidor)
# Obténla en: https://app.supabase.com → Tu Proyecto → Settings → API → service_role key
# ⚠️ IMPORTANTE: Esta clave es SECRETA, nunca la expongas en el cliente
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5tY3JtZ2RucHpya2xwY2d5em4iLCJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNzM4OTg2NjIwLCJleHAiOjIwNTQ1NjI2MjB9.F8dK7J_tT5aL2ZJ9Z8XQ3xYwJ8M7yBfPnRkHwXeZc

# ============================================
# VARIABLES OPCIONALES (Recomendadas)
# ============================================

# URL base de la aplicación (para emails y links)
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Versión de la aplicación
NEXT_PUBLIC_APP_VERSION=2.0.0

# ============================================
# AUTOMATIZACIONES - Requerido para funcionalidades premium
# ============================================

# Secreto para proteger endpoints de cron jobs
CRON_SECRET=Cr0nS3cur3K3y2025!Event0sCRM

# Número de teléfono del administrador para reportes automáticos
ADMIN_PHONE_NUMBER=+5215555555555

# ============================================
# SEGURIDAD - Opcional
# ============================================

# Clave de encriptación (para datos sensibles)
ENCRYPTION_KEY=S3cur3K3y2025!Event0sCRM

# ============================================
# CONFIGURACIÓN ADICIONAL
# ============================================

# Entorno actual
NODE_ENV=development

# Puerto de desarrollo
PORT=3000
`

console.log('🔧 Configurando variables de entorno...')

try {
  // Verificar si el archivo ya existe
  let existingContent = ''
  if (fs.existsSync(ENV_FILE)) {
    existingContent = fs.readFileSync(ENV_FILE, 'utf8')
    console.log('📁 Archivo .env.local encontrado, haciendo backup...')
    
    // Crear backup
    const backupFile = path.join(process.cwd(), '.env.local.backup')
    fs.writeFileSync(backupFile, existingContent)
    console.log('✅ Backup creado en .env.local.backup')
  }

  // Escribir nuevas variables
  fs.writeFileSync(ENV_FILE, requiredEnv)
  console.log('✅ Variables de entorno configuradas en .env.local')
  
  console.log('')
  console.log('🎉 Configuración completada!')
  console.log('')
  console.log('📋 Variables configuradas:')
  console.log('   ✅ NEXT_PUBLIC_SUPABASE_URL')
  console.log('   ✅ NEXT_PUBLIC_SUPABASE_ANON_KEY')
  console.log('   ✅ SUPABASE_SERVICE_ROLE_KEY')
  console.log('   ✅ CRON_SECRET')
  console.log('   ✅ ADMIN_PHONE_NUMBER')
  console.log('   ✅ ENCRYPTION_KEY')
  console.log('')
  console.log('🚀 Siguientes pasos:')
  console.log('   1. Reinicia el servidor de desarrollo')
  console.log('   2. Ejecuta: npm run fix-admin')
  console.log('   3. Prueba el login en http://localhost:3000/login')
  console.log('')
  console.log('📧 Email admin: admin@chamali.com')
  console.log('🔑 Contraseña: Admin2025!')
  
} catch (error) {
  console.error('❌ Error al configurar variables:', error.message)
  process.exit(1)
}
