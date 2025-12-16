# 🚀 Guía Completa de Despliegue a Producción

## 📋 Tabla de Contenidos

1. [Preparación](#preparación)
2. [Aplicar Migraciones SQL](#aplicar-migraciones-sql)
3. [Configurar Variables de Entorno](#configurar-variables-de-entorno)
4. [Configurar Servicios Externos](#configurar-servicios-externos)
5. [Desplegar en Vercel](#desplegar-en-vercel)
6. [Configurar Dominio](#configurar-dominio)
7. [Verificaciones Post-Despliegue](#verificaciones-post-despliegue)
8. [Solución de Problemas](#solución-de-problemas)

---

## 📦 Preparación

### 1. Verificar que el código esté listo

```bash
# Asegúrate de estar en la rama main
git checkout main
git pull origin main

# Verificar que el build funciona localmente
npm run build

# Si hay errores, corrígelos antes de continuar
```

### 2. Verificar que todas las migraciones estén creadas

Asegúrate de tener estos archivos en `migrations/`:
- ✅ `001_create_audit_logs_table.sql` - Sistema de auditoría (CRÍTICO: crea función is_admin())
- ✅ `002_create_quote_versions_table_final.sql` - Versiones de cotizaciones (opcional)
- ✅ `003_fix_profiles_rls_recursion_idempotent.sql` - Corrección de RLS (CRÍTICO: versión idempotente)
- ✅ `004_create_notifications_table.sql` - Notificaciones en tiempo real
- ✅ `005_create_comments_table.sql` - Sistema de comentarios
- ✅ `006_create_quote_templates_table.sql` - Plantillas de cotizaciones
- ✅ `007_create_user_preferences_table.sql` - Preferencias de usuario
- ✅ `008_optimize_rls_performance.sql` - Optimización de políticas RLS
- ✅ `009_add_created_by_to_clients.sql` - Agregar columna created_by a clients (CRÍTICO: aplicar antes de 008)

---

## 🗄️ Aplicar Migraciones SQL

### Paso 1: Acceder a Supabase Dashboard

1. Ve a [https://app.supabase.com](https://app.supabase.com)
2. Selecciona tu proyecto
3. Ve a **SQL Editor** en el menú lateral

### Paso 2: Aplicar cada migración en orden

**IMPORTANTE**: Aplica las migraciones en este orden exacto. **NO saltes ninguna**:

#### Migración 1: Sistema de Auditoría (CRÍTICO)

```sql
-- migrations/001_create_audit_logs_table.sql
```

**Por qué es crítica**: Crea la función `is_admin()` que es usada por todas las demás migraciones.

1. Abre el archivo `migrations/001_create_audit_logs_table.sql`
2. Copia TODO el contenido
3. Pégalo en el SQL Editor de Supabase
4. Haz clic en **RUN** o presiona `Ctrl+Enter`
5. Verifica que aparezca "Success. No rows returned"

#### Migración 2: Corrección de RLS (CRÍTICO)

```sql
-- migrations/003_fix_profiles_rls_recursion_idempotent.sql
```

**Por qué es crítica**: Corrige problemas de recursión infinita en RLS que afectan a todas las demás tablas.

1. Abre el archivo `migrations/003_fix_profiles_rls_recursion_idempotent.sql` (versión idempotente)
2. Copia TODO el contenido
3. Pégalo en el SQL Editor de Supabase
4. Haz clic en **RUN**
5. Verifica que se ejecutó correctamente

**NOTA**: La migración 002 (quote_versions) es opcional. Si no la necesitas, puedes saltarla.

#### Migración 2.5: Agregar created_by a clients (CRÍTICO - Antes de 008)

```sql
-- migrations/009_add_created_by_to_clients.sql
```

**Por qué es crítica**: La migración 008 necesita esta columna para las políticas RLS.

1. Abre el archivo `migrations/009_add_created_by_to_clients.sql`
2. Copia TODO el contenido
3. Pégalo en el SQL Editor de Supabase
4. Haz clic en **RUN**
5. Verifica que se ejecutó correctamente

#### Migración 3: Notificaciones

```sql
-- migrations/004_create_notifications_table.sql
```

1. Abre el archivo `migrations/004_create_notifications_table.sql`
2. Copia TODO el contenido
3. Pégalo en el SQL Editor de Supabase
4. Haz clic en **RUN**
5. Verifica que aparezca "Success. No rows returned"

#### Migración 4: Comentarios

```sql
-- migrations/005_create_comments_table.sql
```

Repite el mismo proceso.

#### Migración 5: Plantillas de Cotizaciones

```sql
-- migrations/006_create_quote_templates_table.sql
```

Repite el mismo proceso.

#### Migración 6: Preferencias de Usuario

```sql
-- migrations/007_create_user_preferences_table.sql
```

Repite el mismo proceso.

#### Migración 7: Agregar created_by a clients (CRÍTICO - Antes de 008)

```sql
-- migrations/009_add_created_by_to_clients.sql
```

**IMPORTANTE**: Esta migración debe aplicarse **ANTES** de la migración 008.

1. Abre el archivo `migrations/009_add_created_by_to_clients.sql`
2. Copia TODO el contenido
3. Pégalo en el SQL Editor de Supabase
4. Haz clic en **RUN**
5. Verifica que se ejecutó correctamente

#### Migración 8: Optimización de RLS

```sql
-- migrations/008_optimize_rls_performance.sql
```

**IMPORTANTE**: Requiere que la migración 009 ya esté aplicada.

1. Abre el archivo `migrations/008_optimize_rls_performance.sql`
2. Copia TODO el contenido
3. Pégalo en el SQL Editor de Supabase
4. Haz clic en **RUN**
5. Verifica que se ejecutó correctamente

### Paso 3: Habilitar Realtime (CRÍTICO)

Después de aplicar las migraciones, habilita Realtime para que las notificaciones y comentarios funcionen:

1. Ve a **Database** → **Replication** en Supabase
2. O ejecuta este SQL:

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE comments;
```

### Paso 4: Verificar que todo se creó correctamente

Ejecuta este SQL para verificar:

```sql
-- Verificar tablas creadas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'audit_logs',           -- Migración 001
  'notifications',        -- Migración 004
  'comments',             -- Migración 005
  'quote_templates',      -- Migración 006
  'user_preferences'      -- Migración 007
);

-- Debe retornar 5 filas (o 6 si aplicaste quote_versions)

-- Verificar columna created_by en clients (Migración 009)
SELECT column_name 
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'clients'
AND column_name = 'created_by';

-- Debe retornar 1 fila
```

**Verificar función is_admin()**:
```sql
-- Verificar que la función is_admin() existe
SELECT proname, prosrc 
FROM pg_proc 
WHERE proname = 'is_admin';

-- Debe retornar 1 fila
```

---

## 🔐 Configurar Variables de Entorno

### Paso 1: Obtener credenciales de Supabase

1. Ve a **Settings** → **API** en Supabase
2. Copia estos valores:
   - **Project URL** (ej: `https://xxxxx.supabase.co`)
   - **anon/public key** (la clave pública)

### Paso 2: Configurar en Vercel (o tu plataforma)

#### Si usas Vercel:

1. Ve a tu proyecto en [Vercel Dashboard](https://vercel.com/dashboard)
2. Ve a **Settings** → **Environment Variables**
3. Agrega estas variables:

```
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_anon_aqui
```

**IMPORTANTE**: 
- ✅ Marca ambas como disponibles en **Production**, **Preview**, y **Development**
- ✅ No uses comillas en los valores

#### Si usas otra plataforma:

Agrega las mismas variables de entorno en tu plataforma de hosting.

### Paso 3: Variables opcionales (recomendadas)

Para funcionalidades avanzadas, agrega:

```
# Sentry (Error Tracking)
NEXT_PUBLIC_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
SENTRY_AUTH_TOKEN=tu_token_aqui
SENTRY_ORG=tu_org
SENTRY_PROJECT=tu_proyecto

# Email Service (si configuraste SendGrid/Resend)
SENDGRID_API_KEY=tu_api_key
# O
RESEND_API_KEY=tu_api_key
```

---

## 📧 Configurar Servicios Externos

### 1. Email Service (Opcional pero Recomendado)

#### Opción A: SendGrid

1. Crea cuenta en [SendGrid](https://sendgrid.com)
2. Crea un API Key con permisos de "Mail Send"
3. Agrega la variable `SENDGRID_API_KEY` en Vercel
4. Actualiza `/app/api/email/send/route.ts`:

```typescript
import sgMail from '@sendgrid/mail'

sgMail.setApiKey(process.env.SENDGRID_API_KEY!)

// En el handler POST:
await sgMail.send({
  to,
  from: 'noreply@tudominio.com', // Debe estar verificado en SendGrid
  subject,
  html,
})
```

#### Opción B: Resend (Más fácil)

1. Crea cuenta en [Resend](https://resend.com)
2. Obtén tu API Key
3. Agrega `RESEND_API_KEY` en Vercel
4. Actualiza `/app/api/email/send/route.ts`:

```typescript
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

// En el handler POST:
await resend.emails.send({
  from: 'noreply@tudominio.com',
  to,
  subject,
  html,
})
```

### 2. Sentry (Error Tracking)

1. Crea cuenta en [Sentry](https://sentry.io)
2. Crea un proyecto Next.js
3. Copia el DSN
4. Agrega las variables de entorno en Vercel
5. El código ya está configurado en `sentry.config.ts`

---

## 🚀 Desplegar en Vercel

### Opción 1: Desde GitHub (Recomendado)

1. **Conectar repositorio**:
   - Ve a [Vercel Dashboard](https://vercel.com/dashboard)
   - Haz clic en **Add New Project**
   - Conecta tu repositorio de GitHub
   - Selecciona el repositorio `eventos-web`

2. **Configurar proyecto**:
   - **Framework Preset**: Next.js (debe detectarse automáticamente)
   - **Root Directory**: `./` (raíz)
   - **Build Command**: `npm run build` (por defecto)
   - **Output Directory**: `.next` (por defecto)

3. **Agregar variables de entorno**:
   - En la pantalla de configuración, agrega:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Marca todas las opciones (Production, Preview, Development)

4. **Desplegar**:
   - Haz clic en **Deploy**
   - Espera a que termine el build (2-5 minutos)
   - Verás la URL de producción (ej: `eventos-web.vercel.app`)

### Opción 2: Desde CLI

```bash
# Instalar Vercel CLI
npm i -g vercel

# Login
vercel login

# Desplegar
vercel --prod

# Seguir las instrucciones en pantalla
```

---

## 🌐 Configurar Dominio Personalizado

### Paso 1: Agregar dominio en Vercel

1. Ve a tu proyecto en Vercel
2. Ve a **Settings** → **Domains**
3. Agrega tu dominio (ej: `app.tudominio.com`)
4. Sigue las instrucciones para configurar DNS

### Paso 2: Configurar DNS

Agrega estos registros en tu proveedor de DNS:

**Para dominio raíz** (`tudominio.com`):
```
Tipo: A
Nombre: @
Valor: 76.76.21.21
```

**Para subdominio** (`app.tudominio.com`):
```
Tipo: CNAME
Nombre: app
Valor: cname.vercel-dns.com
```

### Paso 3: Actualizar variables de entorno

Si cambiaste el dominio, actualiza:

```
NEXT_PUBLIC_APP_URL=https://app.tudominio.com
```

---

## ✅ Verificaciones Post-Despliegue

### 1. Verificar que la app carga

1. Visita tu URL de producción
2. Debe cargar sin errores
3. Debe mostrar la página de login

### 2. Probar autenticación

1. Intenta iniciar sesión
2. Verifica que redirige correctamente
3. Verifica que el dashboard carga

### 3. Probar funcionalidades premium

#### Notificaciones
1. Crea una cotización
2. Verifica que aparece en el centro de notificaciones
3. Marca como leída

#### Comentarios
1. Ve a una cotización
2. Agrega un comentario
3. Verifica que se guarda y aparece

#### Plantillas
1. Ve a "Nueva Cotización"
2. Verifica que aparece el selector de plantillas
3. Crea una plantilla de prueba

#### Analytics
1. Ve a `/dashboard/analytics`
2. Verifica que carga los gráficos
3. Verifica que muestra datos

#### Settings
1. Ve a `/dashboard/settings`
2. Cambia preferencias
3. Verifica que se guardan

### 4. Verificar Realtime

1. Abre la app en dos navegadores diferentes
2. En uno, agrega un comentario
3. En el otro, debe aparecer automáticamente (sin refrescar)

### 5. Verificar PWA

1. En móvil, visita la app
2. Debe aparecer opción "Agregar a pantalla de inicio"
3. Al agregar, debe funcionar como app nativa

---

## 🔧 Solución de Problemas

### Error: "Missing Supabase environment variables"

**Solución**:
1. Verifica que las variables estén en Vercel
2. Verifica que estén marcadas para "Production"
3. Redespliega después de agregar variables

### Error: "Table does not exist"

**Solución**:
1. Verifica que aplicaste todas las migraciones SQL
2. Ejecuta el SQL de verificación
3. Asegúrate de estar en el proyecto correcto de Supabase

### Notificaciones no funcionan en tiempo real

**Solución**:
1. Verifica que habilitaste Realtime:
   ```sql
   ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
   ```
2. Verifica en Supabase Dashboard → Database → Replication
3. Debe aparecer `notifications` en la lista

### Comentarios no aparecen

**Solución**:
1. Verifica que aplicaste `005_create_comments_table.sql`
2. Verifica que habilitaste Realtime para `comments`
3. Revisa la consola del navegador para errores

### Build falla en Vercel

**Solución**:
1. Revisa los logs de build en Vercel
2. Verifica que `package.json` tiene todas las dependencias
3. Verifica que no hay errores de TypeScript localmente:
   ```bash
   npm run build
   ```

### Error 500 en producción

**Solución**:
1. Revisa los logs en Vercel → Functions
2. Verifica variables de entorno
3. Revisa Sentry (si está configurado) para errores

---

## 📊 Checklist Final de Producción

Antes de considerar que está en producción, verifica:

- [ ] ✅ Todas las migraciones SQL aplicadas
- [ ] ✅ Realtime habilitado para `notifications` y `comments`
- [ ] ✅ Variables de entorno configuradas en Vercel
- [ ] ✅ Build exitoso en Vercel
- [ ] ✅ Dominio configurado (opcional)
- [ ] ✅ Autenticación funciona
- [ ] ✅ Notificaciones funcionan en tiempo real
- [ ] ✅ Comentarios funcionan
- [ ] ✅ Analytics carga correctamente
- [ ] ✅ Settings guarda preferencias
- [ ] ✅ PWA funciona (opcional)
- [ ] ✅ Email service configurado (opcional)
- [ ] ✅ Sentry configurado (opcional)
- [ ] ✅ SSL/HTTPS activo (automático en Vercel)

---

## 🎉 ¡Listo!

Tu aplicación está en producción. Los usuarios pueden:

- ✅ Iniciar sesión
- ✅ Crear cotizaciones con plantillas
- ✅ Comentar y colaborar
- ✅ Ver analytics avanzados
- ✅ Recibir notificaciones en tiempo real
- ✅ Personalizar su experiencia
- ✅ Usar la app como PWA

---

## 📞 Soporte

Si encuentras problemas:

1. Revisa los logs en Vercel
2. Revisa Sentry para errores
3. Verifica las migraciones SQL
4. Revisa la consola del navegador
5. Consulta la documentación de Supabase y Vercel

---

**Última actualización**: $(date)
**Versión**: 3.0.0 Enterprise Premium

