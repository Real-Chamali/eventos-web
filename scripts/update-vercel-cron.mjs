#!/usr/bin/env node
/**
 * Script para actualizar configuración de cron jobs en vercel.json
 * Agrega los endpoints de automatizaciones que faltan
 */

import fs from 'fs'
import path from 'path'

const VERCEL_FILE = path.join(process.cwd(), 'vercel.json')

console.log('🔄 Actualizando configuración de cron jobs en Vercel...')

try {
  // Leer configuración actual
  let vercelConfig = { version: 2, buildCommand: "npm run build", outputDirectory: ".next", installCommand: "npm install", framework: "nextjs", crons: [] }
  
  if (fs.existsSync(VERCEL_FILE)) {
    const existingContent = fs.readFileSync(VERCEL_FILE, 'utf8')
    vercelConfig = JSON.parse(existingContent)
    console.log('📁 Configuración Vercel encontrada')
  }

  // Configuración correcta de cron jobs
  const correctCrons = [
    {
      path: "/api/automations/payment-reminders",
      schedule: "0 9 * * *"
    },
    {
      path: "/api/automations/weekly-reports", 
      schedule: "0 9 * * 1"
    }
  ]

  // Actualizar cron jobs
  vercelConfig.crons = correctCrons

  // Escribir nueva configuración
  fs.writeFileSync(VERCEL_FILE, JSON.stringify(vercelConfig, null, 2))
  
  console.log('✅ Cron jobs actualizados correctamente:')
  console.log('')
  console.log('📅 Automatizaciones configuradas:')
  console.log('   🕘 9:00 AM Diario - Recordatorios de pagos')
  console.log('   🕘 9:00 AM Lunes - Reportes semanales')
  console.log('')
  console.log('🔗 Endpoints:')
  console.log('   POST/GET /api/automations/payment-reminders')
  console.log('   POST/GET /api/automations/weekly-reports')
  console.log('')
  console.log('🛡️ Seguridad:')
  console.log('   Los endpoints están protegidos con CRON_SECRET')
  console.log('   Solo accesibles con Authorization: Bearer {CRON_SECRET}')
  console.log('')
  console.log('🚀 Para activar en producción:')
  console.log('   1. Haz deploy a Vercel')
  console.log('   2. Los cron jobs se activarán automáticamente')
  console.log('   3. Revisa en Vercel Dashboard → Functions → Cron Jobs')
  
} catch (error) {
  console.error('❌ Error al actualizar vercel.json:', error.message)
  process.exit(1)
}
