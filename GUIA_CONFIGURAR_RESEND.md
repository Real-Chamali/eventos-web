# 📧 Guía: Configurar Email Real con Resend

## 📋 Descripción

Esta guía explica cómo configurar Resend para enviar emails reales desde tu aplicación. El código ya está implementado, solo necesitas configurar las variables de entorno.

---

## 🎯 ¿Por qué Resend?

- ✅ API simple y confiable
- ✅ Tier gratuito generoso (3,000 emails/mes)
- ✅ Excelente deliverability
- ✅ Plantillas HTML profesionales ya implementadas
- ✅ Soporte para attachments

---

## 📝 Pasos para Configurar

### Paso 1: Crear Cuenta en Resend

1. Ve a [https://resend.com](https://resend.com)
2. Haz clic en **"Sign Up"** o **"Get Started"**
3. Crea una cuenta (puedes usar GitHub, Google, o email)
4. Verifica tu email si es necesario

### Paso 2: Obtener API Key

1. Una vez dentro del dashboard, ve a **"API Keys"** en el menú lateral
2. Haz clic en **"Create API Key"**
3. Dale un nombre descriptivo (ej: "Eventos Web Production")
4. Selecciona permisos:
   - ✅ **Sending access** (necesario)
   - ⚠️ **Full access** (solo si necesitas administrar dominios)
5. Haz clic en **"Add"**
6. **IMPORTANTE**: Copia la API key inmediatamente (solo se muestra una vez)
   - Formato: `re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

### Paso 3: Configurar Dominio (Opcional pero Recomendado)

**Para producción**, es recomendable configurar tu propio dominio:

1. Ve a **"Domains"** en el menú lateral
2. Haz clic en **"Add Domain"**
3. Ingresa tu dominio (ej: `tudominio.com`)
4. Resend te dará registros DNS para agregar:
   - Registro SPF
   - Registro DKIM
   - Registro DMARC (opcional)
5. Agrega estos registros en tu proveedor de DNS
6. Espera a que Resend verifique el dominio (puede tomar hasta 48 horas)

**Nota**: Si no configuras dominio, puedes usar el dominio de prueba de Resend, pero los emails pueden ir a spam.

### Paso 4: Configurar Variables en Vercel

1. Ve a [Vercel Dashboard](https://vercel.com/dashboard)
2. Selecciona tu proyecto
3. Ve a **Settings** → **Environment Variables**
4. Agrega las siguientes variables:

#### Variable Obligatoria:

```
RESEND_API_KEY
```
**Valor**: `re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` (tu API key de Resend)
- ✅ Marcar para **Production**, **Preview** y **Development**

#### Variable Opcional (pero recomendada):

```
RESEND_FROM_EMAIL
```
**Valor**: `Eventos Web <noreply@tudominio.com>` o `noreply@tudominio.com`
- Si no se configura, usa el default: `Eventos Web <noreply@eventos-web.com>`
- ✅ Marcar para **Production**, **Preview** y **Development**

**Nota**: Si configuraste tu dominio en Resend, usa ese dominio en el email.

### Paso 5: Verificar Configuración

1. Haz un redeploy en Vercel (o espera al próximo push)
2. Prueba enviar un email desde tu aplicación
3. Verifica que llegue correctamente
4. Revisa los logs en Vercel si hay problemas

---

## 🔍 Verificación y Testing

### Probar Envío de Email

Puedes probar el envío de email de varias formas:

#### Opción 1: Desde la aplicación
1. Crea una cotización
2. El sistema debería enviar un email automáticamente (si está configurado)

#### Opción 2: Desde API
```bash
curl -X POST https://tu-app.vercel.app/api/email/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_JWT_TOKEN" \
  -d '{
    "to": "tu-email@ejemplo.com",
    "subject": "Test Email",
    "html": "<h1>Test</h1><p>Este es un email de prueba</p>"
  }'
```

#### Opción 3: Desde Resend Dashboard
1. Ve a **"Emails"** en Resend Dashboard
2. Haz clic en **"Send Test Email"**
3. Ingresa tu email y envía

### Verificar Logs

Si hay problemas, revisa:

1. **Logs de Vercel**:
   - Ve a Vercel Dashboard → Deployments → [Tu deployment] → Functions
   - Busca errores relacionados con email

2. **Logs de Resend**:
   - Ve a Resend Dashboard → **"Emails"**
   - Verás el historial de emails enviados
   - Si hay errores, aparecerán aquí

---

## 📚 Plantillas Disponibles

El código ya incluye plantillas profesionales:

### 1. Cotización Creada
```typescript
import { sendEmail, emailTemplates } from '@/lib/integrations/email'

const template = emailTemplates.quoteCreated(quoteId, clientName, totalAmount)
await sendEmail({
  to: clientEmail,
  ...template,
})
```

### 2. Cotización Aprobada
```typescript
const template = emailTemplates.quoteApproved(quoteId, clientName, totalAmount)
await sendEmail({
  to: clientEmail,
  ...template,
})
```

### 3. Recordatorio de Evento
```typescript
const template = emailTemplates.eventReminder(eventDate, eventName, clientName)
await sendEmail({
  to: clientEmail,
  ...template,
})
```

---

## ⚠️ Troubleshooting

### Problema: Emails no se envían

**Solución**:
1. Verifica que `RESEND_API_KEY` esté configurada en Vercel
2. Verifica que la API key sea válida (no expirada)
3. Revisa los logs de Vercel para errores
4. Verifica que el dominio esté verificado (si usas dominio personalizado)

### Problema: Emails van a spam

**Solución**:
1. Configura tu propio dominio en Resend
2. Agrega los registros DNS correctamente
3. Espera a que el dominio se verifique completamente
4. Usa un email "from" con tu dominio verificado

### Problema: Error "Invalid API key"

**Solución**:
1. Verifica que copiaste la API key completa
2. Asegúrate de que no haya espacios al inicio/final
3. Regenera la API key si es necesario
4. Verifica que esté configurada en el ambiente correcto (Production/Preview/Development)

### Problema: Error "Domain not verified"

**Solución**:
1. Si usas dominio personalizado, verifica que esté configurado en Resend
2. Verifica que los registros DNS estén correctos
3. Espera hasta 48 horas para verificación completa
4. O usa el dominio de prueba de Resend temporalmente

---

## 📊 Límites y Pricing

### Tier Gratuito
- ✅ 3,000 emails/mes
- ✅ 100 emails/día
- ✅ API ilimitada
- ✅ Soporte por email

### Tier Pro ($20/mes)
- ✅ 50,000 emails/mes
- ✅ Dominios ilimitados
- ✅ Prioridad en soporte
- ✅ Analytics avanzados

**Para la mayoría de aplicaciones pequeñas/medianas, el tier gratuito es suficiente.**

---

## ✅ Checklist de Configuración

- [ ] Cuenta creada en Resend
- [ ] API key obtenida
- [ ] `RESEND_API_KEY` configurada en Vercel
- [ ] `RESEND_FROM_EMAIL` configurada (opcional)
- [ ] Dominio verificado (opcional pero recomendado)
- [ ] Email de prueba enviado exitosamente
- [ ] Logs verificados sin errores

---

## 🔗 Enlaces Útiles

### Resend:
- **Resend Dashboard**: https://resend.com/dashboard
- **API Keys**: https://resend.com/api-keys
- **Domains**: https://resend.com/domains
- **Emails Log**: https://resend.com/emails
- **Documentación Resend**: https://resend.com/docs
- **API Reference**: https://resend.com/docs/api-reference

### Vercel:
- **Vercel Dashboard**: https://vercel.com/dashboard
- **Environment Variables** (reemplaza [tu-proyecto]): https://vercel.com/dashboard/[tu-proyecto]/settings/environment-variables
- **Deployments**: https://vercel.com/dashboard/[tu-proyecto]/deployments

## ✅ Verificación Después de Configurar

Una vez que hayas configurado Resend, verifica usando:
- **Script de verificación**: Ver `VERIFICACION_RESEND.md`
- **Enviar email de prueba** desde tu aplicación
- **Revisar logs** en Vercel Dashboard
- **Verificar historial** en Resend Dashboard → Emails

---

## 📝 Notas Importantes

1. **API Key**: Nunca compartas tu API key públicamente ni la commitees al repositorio
2. **Dominio**: Configurar tu propio dominio mejora significativamente la deliverability
3. **Rate Limits**: El tier gratuito tiene límite de 100 emails/día
4. **Testing**: Siempre prueba en desarrollo antes de producción
5. **Logs**: Revisa los logs regularmente para detectar problemas

---

**Última actualización**: Diciembre 2024
