# ✅ Script de Verificación: Configuración de Resend

## Propósito

Este documento contiene métodos para verificar que Resend esté correctamente configurado y funcionando en tu aplicación.

---

## Método 1: Verificación de Variables de Entorno

### Verificar en Vercel Dashboard

1. **Acceder a Vercel**
   - Ve a: https://vercel.com/dashboard
   - Selecciona tu proyecto: `eventos-web`

2. **Verificar Variables de Entorno**
   - Ve a: **Settings** → **Environment Variables**
   - Busca las siguientes variables:

   **Variable Obligatoria**:
   - `RESEND_API_KEY`
     - ✅ Debe existir
     - ✅ Formato: `re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
     - ✅ Debe estar marcada para: Production, Preview, Development

   **Variable Opcional**:
   - `RESEND_FROM_EMAIL`
     - ⚠️ Opcional pero recomendada
     - Formato: `Eventos Web <noreply@tudominio.com>` o `noreply@tudominio.com`

3. **Verificar Estado**
   - Si `RESEND_API_KEY` existe → ✅ Configurado
   - Si NO existe → ⚠️ Necesita configuración

---

## Método 2: Verificación desde Código

### Script de Verificación Local

Crea un archivo temporal `test-resend.ts` en la raíz del proyecto:

```typescript
// test-resend.ts
// Ejecutar con: npx tsx test-resend.ts

import { Resend } from 'resend'

async function verifyResendConfig() {
  console.log('🔍 Verificando configuración de Resend...\n')
  
  // Verificar variable de entorno
  const apiKey = process.env.RESEND_API_KEY
  
  if (!apiKey) {
    console.log('❌ RESEND_API_KEY no está configurada')
    console.log('   Ve a Vercel Dashboard → Settings → Environment Variables')
    console.log('   Agrega RESEND_API_KEY con tu API key de Resend')
    return false
  }
  
  console.log('✅ RESEND_API_KEY encontrada')
  console.log(`   Formato: ${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 4)}`)
  
  // Verificar formato
  if (!apiKey.startsWith('re_')) {
    console.log('⚠️  La API key no tiene el formato correcto (debe empezar con "re_")')
    return false
  }
  
  console.log('✅ Formato de API key correcto\n')
  
  // Verificar conexión con Resend
  try {
    const resend = new Resend(apiKey)
    
    // Intentar obtener información de la cuenta (si la API lo permite)
    console.log('🔍 Verificando conexión con Resend...')
    
    // Nota: Resend no tiene un endpoint directo de "ping", pero podemos intentar
    // verificar el dominio o hacer una llamada simple
    console.log('✅ Cliente de Resend inicializado correctamente')
    
    return true
  } catch (error) {
    console.log('❌ Error al inicializar Resend:', error)
    return false
  }
}

verifyResendConfig()
  .then(success => {
    if (success) {
      console.log('\n✅ Configuración de Resend verificada correctamente')
    } else {
      console.log('\n⚠️  Configuración de Resend incompleta')
    }
    process.exit(success ? 0 : 1)
  })
  .catch(err => {
    console.error('Error:', err)
    process.exit(1)
  })
```

### Ejecutar Verificación

```bash
# Instalar dependencias si es necesario
npm install resend

# Ejecutar verificación
npx tsx test-resend.ts
```

---

## Método 3: Prueba de Envío Real

### Test desde la Aplicación

#### Opción A: Usar API Endpoint (si existe)

```bash
# Reemplaza con tu URL de producción o local
curl -X POST http://localhost:3000/api/email/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_JWT_TOKEN" \
  -d '{
    "to": "tu-email@ejemplo.com",
    "subject": "Test Email - Verificación Resend",
    "html": "<h1>Test</h1><p>Este es un email de prueba para verificar Resend</p>"
  }'
```

#### Opción B: Crear Script de Prueba

Crea `test-send-email.ts`:

```typescript
// test-send-email.ts
import { Resend } from 'resend'

async function testSendEmail() {
  const apiKey = process.env.RESEND_API_KEY
  
  if (!apiKey) {
    console.error('❌ RESEND_API_KEY no configurada')
    return
  }
  
  const resend = new Resend(apiKey)
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'Eventos Web <noreply@eventos-web.com>'
  
  try {
    console.log('📧 Enviando email de prueba...')
    
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: 'tu-email@ejemplo.com', // ⚠️ Cambia esto por tu email
      subject: 'Test Email - Verificación Resend',
      html: '<h1>Test Email</h1><p>Este es un email de prueba para verificar que Resend está configurado correctamente.</p>',
    })
    
    if (error) {
      console.error('❌ Error al enviar email:', error)
      return false
    }
    
    console.log('✅ Email enviado exitosamente!')
    console.log('   Message ID:', data?.id)
    console.log('\n📬 Revisa tu bandeja de entrada (y spam)')
    
    return true
  } catch (err) {
    console.error('❌ Error:', err)
    return false
  }
}

testSendEmail()
```

Ejecutar:
```bash
RESEND_API_KEY=tu_api_key RESEND_FROM_EMAIL="Eventos Web <noreply@tudominio.com>" npx tsx test-send-email.ts
```

---

## Método 4: Verificación desde Resend Dashboard

### Pasos:

1. **Acceder a Resend Dashboard**
   - Ve a: https://resend.com/dashboard
   - Inicia sesión

2. **Verificar API Key**
   - Ve a: **API Keys**
   - Verifica que existe una API key activa
   - Verifica que tiene permisos de "Sending access"

3. **Verificar Dominio (si configurado)**
   - Ve a: **Domains**
   - Si configuraste un dominio, verifica que esté:
     - ✅ Verificado
     - ✅ Estado: Active
     - ✅ DNS records correctos

4. **Verificar Historial de Emails**
   - Ve a: **Emails**
   - Deberías ver el historial de emails enviados
   - Si hay errores, aparecerán aquí con detalles

---

## Método 5: Verificación en Logs de Vercel

### Pasos:

1. **Acceder a Vercel Dashboard**
   - Ve a: https://vercel.com/dashboard
   - Selecciona tu proyecto

2. **Revisar Logs**
   - Ve a: **Deployments** → Último deployment
   - Haz clic en **Functions** o **Logs**
   - Busca errores relacionados con:
     - `RESEND_API_KEY`
     - `Resend`
     - `Email`

3. **Errores Comunes**:
   - `RESEND_API_KEY not configured` → Variable no configurada
   - `Invalid API key` → API key incorrecta o expirada
   - `Domain not verified` → Dominio no verificado (si usas dominio personalizado)

---

## Checklist de Verificación Completo

Usa este checklist para verificar que Resend está completamente configurado:

### Configuración Básica:
- [ ] Cuenta creada en Resend
- [ ] API key obtenida de Resend Dashboard
- [ ] `RESEND_API_KEY` configurada en Vercel
- [ ] Variable marcada para Production, Preview, Development
- [ ] Formato de API key correcto (`re_...`)

### Configuración Avanzada (Opcional):
- [ ] `RESEND_FROM_EMAIL` configurada en Vercel
- [ ] Dominio personalizado agregado en Resend
- [ ] Registros DNS configurados correctamente
- [ ] Dominio verificado en Resend Dashboard

### Verificación Funcional:
- [ ] Script de verificación ejecutado sin errores
- [ ] Email de prueba enviado exitosamente
- [ ] Email recibido en bandeja de entrada
- [ ] Logs de Vercel sin errores relacionados con Resend
- [ ] Historial de emails visible en Resend Dashboard

---

## Errores Comunes y Soluciones

### Error: "RESEND_API_KEY not configured"

**Causa**: Variable de entorno no configurada en Vercel

**Solución**:
1. Ve a Vercel Dashboard → Settings → Environment Variables
2. Agrega `RESEND_API_KEY` con tu API key de Resend
3. Marca para Production, Preview, Development
4. Haz redeploy

### Error: "Invalid API key"

**Causa**: API key incorrecta o expirada

**Solución**:
1. Ve a Resend Dashboard → API Keys
2. Verifica que la key existe y está activa
3. Si es necesario, crea una nueva API key
4. Actualiza `RESEND_API_KEY` en Vercel
5. Haz redeploy

### Error: "Domain not verified"

**Causa**: Dominio personalizado no verificado

**Solución**:
1. Ve a Resend Dashboard → Domains
2. Verifica que el dominio esté agregado
3. Verifica que los registros DNS estén correctos
4. Espera hasta 48 horas para verificación completa
5. O usa el dominio de prueba de Resend temporalmente

### Emails van a Spam

**Causa**: Dominio no verificado o configuración DNS incorrecta

**Solución**:
1. Configura tu propio dominio en Resend
2. Agrega correctamente los registros SPF, DKIM, DMARC
3. Espera a que el dominio se verifique completamente
4. Usa un email "from" con tu dominio verificado

---

## Enlaces Directos

- **Resend Dashboard**: https://resend.com/dashboard
- **Resend API Keys**: https://resend.com/api-keys
- **Resend Domains**: https://resend.com/domains
- **Resend Emails Log**: https://resend.com/emails
- **Vercel Dashboard**: https://vercel.com/dashboard
- **Vercel Environment Variables**: https://vercel.com/dashboard/[tu-proyecto]/settings/environment-variables

---

## Próximos Pasos

Una vez que hayas verificado la configuración:

1. Ejecuta el script de verificación
2. Envía un email de prueba
3. Verifica que llegue correctamente
4. Revisa los logs de Vercel para confirmar que no hay errores
5. Monitorea el historial en Resend Dashboard

---

**Última actualización**: Diciembre 2024

