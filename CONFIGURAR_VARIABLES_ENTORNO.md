# 🔐 Guía de Configuración de Variables de Entorno

## 📋 Resumen

Esta guía te ayudará a configurar todas las variables de entorno necesarias para que la aplicación funcione correctamente.

---

## 🚀 Inicio Rápido

### Paso 1: Crear archivo de variables de entorno

```bash
# Copia el archivo de ejemplo
cp .env.example .env.local
```

### Paso 2: Editar .env.local

Abre `.env.local` y reemplaza los valores de ejemplo con tus credenciales reales.

---

## ✅ Variables Requeridas (Obligatorias)

### 1. NEXT_PUBLIC_SUPABASE_URL

**Descripción**: URL del proyecto Supabase

**Cómo obtenerla**:
1. Ve a [https://app.supabase.com](https://app.supabase.com)
2. Selecciona tu proyecto
3. Ve a **Settings** → **API**
4. Copia el valor de **Project URL**

**Formato**: `https://xxxxx.supabase.co`

**Ejemplo**:
```env
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
```

---

### 2. NEXT_PUBLIC_SUPABASE_ANON_KEY

**Descripción**: Clave anónima pública de Supabase

**Cómo obtenerla**:
1. Ve a [https://app.supabase.com](https://app.supabase.com)
2. Selecciona tu proyecto
3. Ve a **Settings** → **API**
4. Copia el valor de **anon public** key

**Formato**: Una cadena larga de caracteres

**Ejemplo**:
```env
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYxNjIzOTAyMiwiZXhwIjoxOTMxODE1MDIyfQ...
```

---

## 🔧 Variables Opcionales (Recomendadas)

### 3. SUPABASE_SERVICE_ROLE_KEY

**Descripción**: Clave de servicio de Supabase (solo servidor)

**Cómo obtenerla**:
1. Ve a [https://app.supabase.com](https://app.supabase.com)
2. Selecciona tu proyecto
3. Ve a **Settings** → **API**
4. Copia el valor de **service_role** key

**⚠️ IMPORTANTE**: 
- Esta clave es **SECRETA**
- **NUNCA** la expongas en el cliente
- Solo úsala en código del servidor

**Ejemplo**:
```env
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

### 4. NEXT_PUBLIC_APP_URL

**Descripción**: URL base de la aplicación

**Cuándo usarla**: Para generar links en emails y notificaciones

**Ejemplos**:
```env
# Desarrollo
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Producción
NEXT_PUBLIC_APP_URL=https://tu-dominio.com
```

---

### 5. NEXT_PUBLIC_APP_VERSION

**Descripción**: Versión de la aplicación

**Ejemplo**:
```env
NEXT_PUBLIC_APP_VERSION=2.0.0
```

---

## 🔍 Sentry (Error Tracking) - Opcional

### 6. NEXT_PUBLIC_SENTRY_DSN

**Descripción**: DSN de Sentry para monitoreo de errores

**Cómo obtenerla**:
1. Ve a [https://sentry.io](https://sentry.io)
2. Crea un proyecto o selecciona uno existente
3. Ve a **Settings** → **Client Keys (DSN)**
4. Copia el **DSN**

**Formato**: `https://xxx@xxx.ingest.sentry.io/xxx`

**Ejemplo**:
```env
NEXT_PUBLIC_SENTRY_DSN=https://abc123@o123456.ingest.sentry.io/123456
```

---

### 7. SENTRY_ORG

**Descripción**: Nombre de la organización en Sentry

**Ejemplo**:
```env
SENTRY_ORG=mi-organizacion
```

---

### 8. SENTRY_PROJECT

**Descripción**: Nombre del proyecto en Sentry

**Ejemplo**:
```env
SENTRY_PROJECT=eventos-web
```

---

### 9. SENTRY_AUTH_TOKEN

**Descripción**: Token de autenticación de Sentry (para upload de source maps)

**Cómo obtenerlo**:
1. Ve a [https://sentry.io/settings/account/api/auth-tokens/](https://sentry.io/settings/account/api/auth-tokens/)
2. Crea un nuevo token con permisos de `project:releases`
3. Copia el token

**Ejemplo**:
```env
SENTRY_AUTH_TOKEN=abc123def456...
```

---

## 📧 Email Service - Opcional

### 10. SENDGRID_API_KEY (Opción 1)

**Descripción**: API Key de SendGrid para enviar emails

**Cómo obtenerla**:
1. Ve a [https://sendgrid.com](https://sendgrid.com)
2. Crea una cuenta o inicia sesión
3. Ve a **Settings** → **API Keys**
4. Crea un nuevo API Key con permisos de "Mail Send"
5. Copia el API Key

**Ejemplo**:
```env
SENDGRID_API_KEY=SG.abc123def456...
```

---

### 11. RESEND_API_KEY (Opción 2)

**Descripción**: API Key de Resend para enviar emails

**Cómo obtenerla**:
1. Ve a [https://resend.com](https://resend.com)
2. Crea una cuenta o inicia sesión
3. Ve a **API Keys**
4. Crea un nuevo API Key
5. Copia el API Key

**Ejemplo**:
```env
RESEND_API_KEY=re_abc123def456...
```

---

## 📊 Analytics - Opcional

### 12. NEXT_PUBLIC_GA_ID

**Descripción**: ID de Google Analytics

**Formato**: `G-XXXXXXXXXX`

**Ejemplo**:
```env
NEXT_PUBLIC_GA_ID=G-ABCDEFGHIJ
```

---

## 🔒 Seguridad - Opcional

### 13. ENCRYPTION_KEY

**Descripción**: Clave de encriptación para datos sensibles

**Cómo generarla**:
```bash
openssl rand -base64 32
```

**Ejemplo**:
```env
ENCRYPTION_KEY=abc123def456ghi789jkl012mno345pqr678stu901vwx234yz
```

**Nota**: Si no está configurada, se usa 'default' (menos seguro, solo para desarrollo)

---

## ✅ Verificación

### Verificar que las variables están configuradas

```bash
# Ejecutar script de verificación
./scripts/verify-all-env.sh
```

O manualmente:

```bash
# Verificar variables requeridas
./scripts/check-env.sh
```

---

## 🔄 Reiniciar Servidor

**IMPORTANTE**: Después de cambiar variables de entorno, **debes reiniciar el servidor**:

```bash
# Detener el servidor (Ctrl+C)
# Luego reiniciar
npm run dev
```

---

## 📝 Checklist de Configuración

### Mínimo Requerido
- [ ] `NEXT_PUBLIC_SUPABASE_URL` configurada
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` configurada
- [ ] Servidor reiniciado después de configurar

### Recomendado
- [ ] `SUPABASE_SERVICE_ROLE_KEY` configurada
- [ ] `NEXT_PUBLIC_APP_URL` configurada
- [ ] `NEXT_PUBLIC_APP_VERSION` configurada

### Opcional (Mejora experiencia)
- [ ] Sentry configurado (error tracking)
- [ ] Email service configurado (notificaciones)
- [ ] Google Analytics configurado (analytics)
- [ ] `ENCRYPTION_KEY` generada (seguridad)

---

## 🚨 Problemas Comunes

### Error: "Missing Supabase environment variables"

**Solución**:
1. Verifica que `.env.local` existe en la raíz del proyecto
2. Verifica que contiene `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Reinicia el servidor (`npm run dev`)

### Variables no se cargan

**Solución**:
1. Asegúrate de que el archivo se llama `.env.local` (no `.env`)
2. Reinicia el servidor completamente
3. Verifica que no hay espacios alrededor del `=` en las variables

### Variables expuestas en el cliente

**⚠️ IMPORTANTE**: 
- Variables con `NEXT_PUBLIC_` son accesibles en el cliente
- **NUNCA** pongas información sensible en estas variables
- Usa variables sin `NEXT_PUBLIC_` para información sensible

---

## 📚 Recursos Adicionales

- [Documentación de Next.js - Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [Documentación de Supabase](https://supabase.com/docs)
- [Documentación de Sentry](https://docs.sentry.io/)

---

**Última actualización**: Diciembre 2024

