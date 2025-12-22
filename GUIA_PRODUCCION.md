# 🚀 Guía Completa para Desplegar a Producción

## 📋 Checklist Pre-Deploy

Antes de desplegar, verifica que todo esté listo:

- [ ] ✅ Código commiteado y pusheado a GitHub
- [ ] ✅ Build local funciona sin errores
- [ ] ✅ Tests pasan correctamente
- [ ] ✅ Migraciones SQL listas para aplicar
- [ ] ✅ Variables de entorno documentadas

---

## 🗄️ Paso 1: Aplicar Migraciones en Supabase

### 1.1 Migraciones Pendientes

⚠️ **IMPORTANTE**: Aplica estas migraciones en el orden exacto indicado. Algunas dependen de otras.

#### Migraciones CRÍTICAS (Aplicar Primero):

1. **001 - Sistema de Auditoría** (CRÍTICO - Crea función `is_admin()`):
   - Archivo: `migrations/001_create_audit_logs_table.sql`
   - **Por qué es crítica**: Crea la función `is_admin()` usada por todas las demás migraciones

2. **003 - Corrección RLS** (CRÍTICO - Idempotente):
   - Archivo: `migrations/003_fix_profiles_rls_recursion_idempotent.sql`
   - **Por qué es crítica**: Corrige problemas de recursión en políticas RLS
   - **Nota**: Es idempotente, puede ejecutarse múltiples veces sin problemas

3. **009 - Campo created_by en clients** (CRÍTICO - Requerido por 008):
   - Archivo: `migrations/009_add_created_by_to_clients.sql`
   - **Por qué es crítica**: Requerida antes de la migración 008

#### Migraciones Premium (Aplicar Después):

4. **004 - Sistema de Notificaciones**:
   - Archivo: `migrations/004_create_notifications_table.sql`
   - Requiere: 001, 003

5. **005 - Sistema de Comentarios**:
   - Archivo: `migrations/005_create_comments_table.sql`
   - Requiere: 001, 003

6. **006 - Plantillas de Cotizaciones**:
   - Archivo: `migrations/006_create_quote_templates_table.sql`
   - Requiere: 001, 003

7. **007 - Preferencias de Usuario**:
   - Archivo: `migrations/007_create_user_preferences_table.sql`
   - Requiere: 003

8. **008 - Optimización RLS** (Requiere 009):
   - Archivo: `migrations/008_optimize_rls_performance.sql`
   - Requiere: 009 (aplicar antes)

#### Migraciones de Seguridad y Funcionalidad:

9. **010 - Corrección Vista Services**:
   - Archivo: `migrations/010_fix_services_public_view_security.sql`
   - Corrige problema de seguridad en vista `services_public`

10. **011 - Prevenir Eventos Duplicados**:
    - Archivo: `migrations/011_prevent_duplicate_events.sql`
    - Previene eventos duplicados y solapamientos de fechas

11. **012 - Sistema de API Keys**:
    - Archivo: `migrations/012_create_api_keys_table.sql`
    - Crea tabla para gestionar API keys de usuarios

12. **013 - Pagos Parciales**:
    - Archivo: `migrations/013_create_partial_payments_table.sql`
    - Sistema premium de pagos parciales para cotizaciones

#### Migraciones Opcionales:

- **002 - Versiones de Cotizaciones** (Opcional):
  - Archivo: `migrations/002_create_quote_versions_table_final.sql`
  - Solo si necesitas versionado de cotizaciones

### 1.2 Cómo Aplicar Migraciones

**Opción A: Desde Supabase Dashboard (Recomendado)**

1. Ve a [https://app.supabase.com](https://app.supabase.com)
2. Selecciona tu proyecto
3. Ve a **SQL Editor** (menú lateral)
4. Crea una nueva query
5. Copia y pega el contenido del archivo de migración
6. Haz clic en **Run** o presiona `Ctrl+Enter`
7. Verifica que no haya errores

**Opción B: Desde Supabase CLI**

```bash
# Si tienes Supabase CLI instalado
supabase db push
```

### 1.3 Verificar Migraciones

Ejecuta estas queries en Supabase SQL Editor para verificar que las migraciones se aplicaron correctamente:

```sql
-- Verificar tablas creadas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'audit_logs',
  'notifications',
  'comments',
  'quote_templates',
  'user_preferences',
  'api_keys',
  'partial_payments'
)
ORDER BY table_name;

-- Verificar función is_admin() (CRÍTICO)
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'is_admin';

-- Verificar función prevent_overlapping_events
SELECT proname 
FROM pg_proc 
WHERE proname = 'prevent_overlapping_events';

-- Verificar trigger check_overlapping_events
SELECT tgname 
FROM pg_trigger 
WHERE tgname = 'check_overlapping_events';

-- Verificar columna created_by en clients
SELECT column_name 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'clients' 
AND column_name = 'created_by';

-- Verificar funciones de pagos parciales
SELECT proname 
FROM pg_proc 
WHERE proname IN ('get_total_paid', 'get_balance_due');
```

---

## 🔐 Paso 2: Configurar Variables de Entorno en Vercel

### 2.1 Acceder a Vercel

1. Ve a [https://vercel.com/dashboard](https://vercel.com/dashboard)
2. Inicia sesión o crea una cuenta
3. Si no tienes proyecto, conéctalo con GitHub

### 2.2 Agregar Variables de Entorno

⚠️ **IMPORTANTE DE SEGURIDAD**: Los secrets de Supabase **NO** deben estar hardcodeados en `vercel.json` ni en ningún archivo del repositorio. Deben configurarse exclusivamente en Vercel Dashboard.

1. Ve a tu proyecto en Vercel
2. Ve a **Settings** → **Environment Variables**
3. Agrega estas variables (marca todas para Production, Preview y Development):

#### Variables Obligatorias (CRÍTICAS):

```
NEXT_PUBLIC_SUPABASE_URL
```
**Valor:** `[OBTENER DE SUPABASE DASHBOARD -> Settings -> API]`
⚠️ **IMPORTANTE**: Esta URL es pública y puede estar en el código, pero es mejor usar variables de entorno.
- **Cómo obtener**: Supabase Dashboard → Settings → API → Project URL

```
NEXT_PUBLIC_SUPABASE_ANON_KEY
```
**Valor:** `[OBTENER DE SUPABASE DASHBOARD -> Settings -> API -> anon/public key]`
⚠️ **IMPORTANTE**: Esta key es pública pero debe estar en variables de entorno, **NUNCA hardcodeada**.
- **Cómo obtener**: Supabase Dashboard → Settings → API → anon/public key
- **Seguridad**: Aunque es pública, debe estar en variables de entorno para facilitar rotación

```
SUPABASE_SERVICE_ROLE_KEY
```
**Valor:** `[OBTENER DE SUPABASE DASHBOARD -> Settings -> API -> service_role key]`
🔒 **CRÍTICO**: Esta key tiene acceso TOTAL a la base de datos. 
- **Cómo obtener**: Supabase Dashboard → Settings → API → service_role key
- ⚠️ **NUNCA** compartir públicamente
- ⚠️ **NUNCA** commitear al repositorio
- ⚠️ **NUNCA** exponer en el frontend
- ⚠️ **NUNCA** hardcodear en `vercel.json` o cualquier archivo
- ✅ Solo usar en server-side (API routes, server components)
- ✅ Rotar periódicamente
- ✅ Configurar solo en Vercel Dashboard → Environment Variables

#### Variables Recomendadas:

```
NEXT_PUBLIC_APP_URL
```
**Valor:** `https://tu-dominio.vercel.app` (o tu dominio personalizado)

```
NEXT_PUBLIC_APP_VERSION
```
**Valor:** `1.0.0`

```
NODE_ENV
```
**Valor:** `production`

#### Variables Opcionales (pero recomendadas):

```
NEXT_PUBLIC_SENTRY_DSN
```
**Valor:** `https://66e295a3c88588a96d03742182952e8b@o4510508203704320.ingest.us.sentry.io/4510508220088320`

```
ENCRYPTION_KEY
```
**Valor:** Genera uno nuevo con: `openssl rand -base64 32`

#### Variables para Rate Limiting Distribuido (Opcional pero Recomendado):

```
UPSTASH_REDIS_REST_URL
```
**Valor:** `[OBTENER DE UPSTASH DASHBOARD]`
- **Cómo obtener**: 
  1. Crear cuenta en [Upstash](https://upstash.com) (gratis hasta 10K comandos/día)
  2. Crear una nueva base de datos Redis
  3. Copiar la "REST URL" desde el dashboard
- **Beneficios**: Rate limiting distribuido que funciona correctamente en entornos serverless
- **Sin esta variable**: El sistema usará rate limiting en memoria (funciona pero no es distribuido)

```
UPSTASH_REDIS_REST_TOKEN
```
**Valor:** `[OBTENER DE UPSTASH DASHBOARD]`
- **Cómo obtener**: 
  1. En el dashboard de Upstash, en tu base de datos Redis
  2. Copiar el "REST TOKEN" (token de autenticación)
- ⚠️ **IMPORTANTE**: No compartir públicamente ni commitear al repositorio

### 2.3 Importante

- ✅ **NO** uses comillas en los valores
- ✅ Marca todas las variables para **Production**, **Preview** y **Development**
- ✅ Guarda cada variable después de agregarla

---

## 🚀 Paso 3: Desplegar a Producción

### Opción A: Auto-Deploy con GitHub (Recomendado) ⭐

Si tu repositorio ya está conectado con Vercel:

1. **Haz push a la rama `main`**:
   ```bash
   git push origin main
   ```

2. **Vercel desplegará automáticamente** cuando detecte el push

3. **Monitorea el despliegue** en Vercel Dashboard → Deployments

### Opción B: Desplegar Manualmente con Vercel CLI

```bash
# Instalar Vercel CLI (si no lo tienes)
npm i -g vercel

# Login en Vercel
vercel login

# Desplegar a producción
vercel --prod
```

### Opción C: Desplegar desde Vercel Dashboard

1. Ve a tu proyecto en Vercel
2. Haz clic en **Deployments**
3. Haz clic en **Redeploy** en el último deployment
4. O haz clic en **Deploy** si es la primera vez

---

## ✅ Paso 4: Verificar Despliegue

### 4.1 Verificar Build

1. Ve a Vercel Dashboard → Deployments
2. Verifica que el build sea exitoso (debe mostrar ✅)
3. Si hay errores, revisa los logs

### 4.2 Verificar Funcionalidad

Una vez desplegado, verifica:

1. **Accede a tu URL de producción** (ej: `https://tu-proyecto.vercel.app`)

2. **Prueba funcionalidades críticas**:
   - [ ] Login funciona
   - [ ] Dashboard carga correctamente
   - [ ] Crear cotización funciona
   - [ ] Calendario muestra eventos
   - [ ] Navegación entre páginas funciona

3. **Verifica en consola del navegador**:
   - Abre DevTools (F12)
   - Ve a Console
   - No debe haber errores críticos

### 4.3 Verificar Variables de Entorno

Si algo no funciona, verifica que las variables estén configuradas:

1. Ve a Vercel → Settings → Environment Variables
2. Verifica que todas las variables estén presentes
3. Verifica que estén marcadas para Production

---

## 🔧 Paso 5: Configuraciones Adicionales (Opcional)

### 5.1 Dominio Personalizado

1. Ve a Vercel → Settings → Domains
2. Agrega tu dominio personalizado
3. Sigue las instrucciones para configurar DNS

### 5.2 Configurar Sentry (Error Tracking)

Si configuraste Sentry:

1. Verifica que `NEXT_PUBLIC_SENTRY_DSN` esté en variables de entorno
2. Los errores se reportarán automáticamente a Sentry

### 5.3 Configurar Rate Limiting Distribuido con Upstash (Recomendado)

El sistema ya tiene soporte para rate limiting distribuido usando Upstash Redis. Para habilitarlo:

1. **Crear cuenta en Upstash**:
   - Ve a [https://upstash.com](https://upstash.com)
   - Crea una cuenta (gratis hasta 10K comandos/día)
   - Crea una nueva base de datos Redis

2. **Obtener credenciales**:
   - En el dashboard de Upstash, selecciona tu base de datos
   - Copia la "REST URL" y el "REST TOKEN"

3. **Configurar en Vercel**:
   - Ve a Vercel Dashboard → Settings → Environment Variables
   - Agrega `UPSTASH_REDIS_REST_URL` con la REST URL
   - Agrega `UPSTASH_REDIS_REST_TOKEN` con el REST TOKEN
   - Marca ambas para Production, Preview y Development

4. **Verificar funcionamiento**:
   - El sistema automáticamente usará Upstash si las variables están configuradas
   - Si Upstash falla, automáticamente hace fallback a rate limiting en memoria
   - Revisa los logs para confirmar que está usando Redis

**Beneficios**:
- ✅ Rate limiting distribuido que funciona correctamente en múltiples instancias serverless
- ✅ Persistencia entre reinicios
- ✅ Mejor para aplicaciones con alto tráfico
- ✅ Tier gratuito suficiente para la mayoría de aplicaciones pequeñas/medianas

**Sin Upstash**: El sistema funciona con rate limiting en memoria, pero no es distribuido (cada instancia serverless tiene su propio contador).

### 5.4 Configurar Analytics

Si quieres Google Analytics:

1. Agrega variable `NEXT_PUBLIC_GA_ID` en Vercel
2. Configura el tracking en tu código

---

## 🐛 Solución de Problemas

### Error: "Missing Supabase environment variables"

**Solución:**
1. Verifica que las variables estén en Vercel
2. Verifica que estén marcadas para Production
3. Haz un redeploy después de agregar variables

### Error: "Database connection failed"

**Solución:**
1. Verifica que `NEXT_PUBLIC_SUPABASE_URL` sea correcta
2. Verifica que `NEXT_PUBLIC_SUPABASE_ANON_KEY` sea correcta
3. Verifica que Supabase esté activo

### Error: "Migration failed"

**Solución:**
1. Aplica las migraciones manualmente en Supabase SQL Editor
2. Verifica que no haya conflictos con migraciones anteriores

### Build falla en Vercel

**Solución:**
1. Revisa los logs de build en Vercel
2. Verifica que `package.json` tenga todos los scripts necesarios
3. Verifica que no haya errores de TypeScript

---

## 📊 Monitoreo Post-Deploy

### Verificar Logs

1. Ve a Vercel → Deployments → [Tu deployment] → Functions
2. Revisa los logs para errores

### Verificar Performance

1. Usa Vercel Analytics (si está habilitado)
2. Monitorea tiempos de respuesta
3. Verifica uso de recursos

### Verificar Errores

1. Si configuraste Sentry, revisa el dashboard
2. Revisa logs de Vercel para errores del servidor

---

## 🎯 Checklist Final

Antes de considerar el despliegue completo:

- [ ] ✅ Migraciones aplicadas en Supabase
- [ ] ✅ Variables de entorno configuradas en Vercel
- [ ] ✅ Build exitoso en Vercel
- [ ] ✅ Aplicación accesible en producción
- [ ] ✅ Login funciona
- [ ] ✅ Dashboard carga correctamente
- [ ] ✅ Crear cotización funciona
- [ ] ✅ No hay errores en consola
- [ ] ✅ Navegación funciona correctamente

---

## 🚀 Comandos Rápidos

```bash
# Verificar build local antes de desplegar
npm run build

# Ejecutar tests
npm test

# Verificar linting
npm run lint

# Desplegar con Vercel CLI
vercel --prod

# Ver logs de producción
vercel logs
```

---

## 📞 Soporte

Si tienes problemas:

1. Revisa los logs en Vercel Dashboard
2. Revisa la documentación de [Vercel](https://vercel.com/docs)
3. Revisa la documentación de [Supabase](https://supabase.com/docs)

---

## 🎯 Próximos Pasos Después del Despliegue

Una vez que tu aplicación esté desplegada en producción, considera estos pasos:

### 1. **Verificación Funcional Completa**
- [ ] Probar flujo completo: Login → Dashboard → Crear Cliente → Crear Cotización → Crear Evento
- [ ] Verificar permisos por rol (Admin, Vendor, Client)
- [ ] Probar sistema de notificaciones (si aplicaste migración 004)
- [ ] Probar sistema de comentarios (si aplicaste migración 005)
- [ ] Probar pagos parciales (si aplicaste migración 013)
- [ ] Verificar exportación PDF de cotizaciones

### 2. **Monitoreo y Observabilidad**
- [ ] Configurar alertas en Sentry para errores críticos
- [ ] Revisar logs de Vercel regularmente
- [ ] Monitorear métricas de performance en Vercel Analytics
- [ ] Configurar alertas de uptime (opcional)

### 3. **Optimizaciones Post-Producción**
- [ ] Revisar métricas de rendimiento
- [ ] Optimizar queries lentas si es necesario
- [ ] Implementar caching donde sea apropiado
- [ ] Revisar y optimizar imágenes/assets

### 4. **Seguridad**
- [ ] Verificar que todas las políticas RLS están activas
- [ ] Revisar logs de acceso sospechoso
- [ ] Rotar API keys si es necesario
- [ ] Verificar que las variables de entorno sensibles no están expuestas

### 5. **Documentación y Capacitación**
- [ ] Documentar procesos específicos de tu negocio
- [ ] Capacitar a usuarios finales
- [ ] Crear guías de uso para funciones premium
- [ ] Documentar flujos de trabajo comunes

### 6. **Mejoras Continuas**
- [ ] Recolectar feedback de usuarios
- [ ] Priorizar nuevas funcionalidades según necesidades
- [ ] Planificar iteraciones futuras
- [ ] Considerar integraciones adicionales (pagos, email, etc.)

---

## 📚 Recursos Adicionales

- **Guía de Migraciones**: `APLICAR_MIGRACIONES_AHORA.md`
- **Qué Sigue**: `QUE_SIGUE.md`
- **Documentación Completa**: `DOCUMENTATION_INDEX.md`
- **Solución de Problemas**: Ver sección "Solución de Problemas" arriba

---

**¡Tu aplicación está lista para producción! 🎉**

**Próximo paso recomendado**: Ejecuta `npm run dev` localmente para verificar que todo funciona antes de desplegar, o si ya desplegaste, realiza las verificaciones funcionales completas listadas arriba.




