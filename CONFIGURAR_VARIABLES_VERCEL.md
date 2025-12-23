# 🔐 Configurar Variables de Entorno en Vercel Dashboard

## 📋 Variables a Configurar

Después de remover los secrets de `vercel.json`, debes configurar estas variables en el **Vercel Dashboard**.

### 🔗 Acceso al Dashboard

1. Ve a: https://vercel.com/dashboard
2. Selecciona tu proyecto: **eventos-web**
3. Ve a: **Settings** → **Environment Variables**

---

## ✅ Variables Públicas (NEXT_PUBLIC_*)

Estas variables son accesibles en el cliente (navegador).

### 1. `NEXT_PUBLIC_SENTRY_DSN`
**Valor**: `https://66e295a3c88588a96d03742182952e8b@o4510508203704320.ingest.us.sentry.io/4510508220088320`
- **Descripción**: URL de Sentry para monitoreo de errores
- **Ambientes**: Production, Preview, Development

### 2. `NEXT_PUBLIC_APP_VERSION`
**Valor**: `1.0.0`
- **Descripción**: Versión de la aplicación
- **Ambientes**: Production, Preview, Development

### 3. `NEXT_PUBLIC_APP_URL`
**Valor**: `https://eventos-web-lovat.vercel.app`
- **Descripción**: URL pública de la aplicación
- **Ambientes**: Production, Preview, Development

---

## 🔒 Variables Privadas (Secrets)

Estas variables NO son accesibles en el cliente.

### 4. `SUPABASE_URL`
**Valor**: `[OBTENER DE SUPABASE DASHBOARD]`
- **Descripción**: URL de tu proyecto Supabase
- **Dónde obtener**: Supabase Dashboard → Settings → API → Project URL
- **Ambientes**: Production, Preview, Development

### 5. `SUPABASE_ANON_KEY`
**Valor**: `[OBTENER DE SUPABASE DASHBOARD]`
- **Descripción**: Clave pública anónima de Supabase
- **Dónde obtener**: Supabase Dashboard → Settings → API → Project API keys → `anon` `public`
- **Ambientes**: Production, Preview, Development

### 6. `SUPABASE_SERVICE_ROLE_KEY`
**Valor**: `[OBTENER DE SUPABASE DASHBOARD]`
- **Descripción**: Clave de servicio de Supabase (⚠️ SECRETO - nunca exponer)
- **Dónde obtener**: Supabase Dashboard → Settings → API → Project API keys → `service_role` `secret`
- **Ambientes**: Production, Preview, Development
- **⚠️ IMPORTANTE**: Esta clave tiene acceso completo a la base de datos. Mantener secreta.

### 7. `ENCRYPTION_KEY`
**Valor**: `[GENERAR CLAVE SEGURA]`
- **Descripción**: Clave para encriptación de datos sensibles
- **Cómo generar**: Usa `openssl rand -hex 32` o cualquier generador de claves seguras
- **Ambientes**: Production, Preview, Development
- **⚠️ IMPORTANTE**: Debe ser una cadena hexadecimal de 64 caracteres (32 bytes)

### 8. `RESEND_API_KEY`
**Valor**: `[OBTENER DE RESEND DASHBOARD]`
- **Descripción**: API key de Resend para envío de emails
- **Dónde obtener**: https://resend.com/api-keys
- **Ambientes**: Production, Preview (opcional en Development)

### 9. `UPSTASH_REDIS_REST_URL`
**Valor**: `[OBTENER DE UPSTASH DASHBOARD]`
- **Descripción**: URL REST de Upstash Redis para rate limiting distribuido
- **Dónde obtener**: Upstash Dashboard → Redis Database → REST API → REST URL
- **Ambientes**: Production, Preview (opcional en Development)

### 10. `UPSTASH_REDIS_REST_TOKEN`
**Valor**: `[OBTENER DE UPSTASH DASHBOARD]`
- **Descripción**: Token REST de Upstash Redis
- **Dónde obtener**: Upstash Dashboard → Redis Database → REST API → REST TOKEN
- **Ambientes**: Production, Preview (opcional en Development)

### 11. `ALLOWED_ORIGINS`
**Valor**: `https://eventos-web-lovat.vercel.app,https://eventos-web.vercel.app`
- **Descripción**: Orígenes permitidos para CORS (separados por comas)
- **Ambientes**: Production, Preview, Development

### 12. `NODE_ENV`
**Valor**: `production` (solo en Production)
- **Descripción**: Entorno de ejecución
- **Ambientes**: Production (automático, no necesita configurarse manualmente)

---

## 🚀 Pasos para Configurar

### Opción 1: Vía Dashboard Web

1. **Ir a Vercel Dashboard**:
   - https://vercel.com/dashboard
   - Seleccionar proyecto: **eventos-web**

2. **Navegar a Environment Variables**:
   - Settings → Environment Variables

3. **Agregar cada variable**:
   - Click en **"Add New"**
   - Ingresar **Key** (nombre de la variable)
   - Ingresar **Value** (valor de la variable)
   - Seleccionar **Environments** (Production, Preview, Development)
   - Click en **"Save"**

4. **Redeploy**:
   - Después de agregar todas las variables, hacer redeploy
   - Vercel → Deployments → Click en "..." → Redeploy

### Opción 2: Vía Vercel CLI

```bash
# Instalar Vercel CLI (si no está instalado)
npm i -g vercel

# Login
vercel login

# Agregar variable de entorno
vercel env add NEXT_PUBLIC_SENTRY_DSN production
# (te pedirá el valor)

# Repetir para cada variable
```

---

## ✅ Verificación

Después de configurar las variables:

1. **Redeploy la aplicación**:
   ```bash
   vercel --prod
   ```

2. **Verificar en logs**:
   - Vercel Dashboard → Deployments → Seleccionar deployment → Logs
   - Verificar que no hay errores de variables faltantes

3. **Probar funcionalidades**:
   - Login/autenticación
   - API endpoints
   - Rate limiting (si Upstash está configurado)

---

## 📝 Notas Importantes

- ⚠️ **Nunca commits secrets** en el código
- ⚠️ **NEXT_PUBLIC_*** variables son públicas (accesibles en el navegador)
- ⚠️ **Variables sin NEXT_PUBLIC_*** son privadas (solo servidor)
- ✅ **Usar diferentes valores** para Production, Preview y Development cuando sea necesario
- ✅ **Rotar secrets periódicamente** (especialmente `SUPABASE_SERVICE_ROLE_KEY` y `ENCRYPTION_KEY`)

---

## 🔗 Enlaces Útiles

- **Vercel Dashboard**: https://vercel.com/dashboard
- **Supabase Dashboard**: https://supabase.com/dashboard
- **Resend Dashboard**: https://resend.com/dashboard
- **Upstash Dashboard**: https://console.upstash.com

---

**Estado**: ✅ Configuración lista para aplicar
**Última actualización**: 2025-12-23

