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

Aplica estas migraciones en orden en Supabase:

1. **Migración de eventos duplicados** (si no está aplicada):
   - Archivo: `migrations/011_prevent_duplicate_events.sql`
   - Aplicar en: Supabase Dashboard → SQL Editor

2. **Migración de API Keys** (si no está aplicada):
   - Archivo: `migrations/012_create_api_keys_table.sql`
   - Aplicar en: Supabase Dashboard → SQL Editor

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

Ejecuta estas queries en Supabase SQL Editor para verificar:

```sql
-- Verificar tabla api_keys
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'api_keys';

-- Verificar función prevent_overlapping_events
SELECT proname 
FROM pg_proc 
WHERE proname = 'prevent_overlapping_events';

-- Verificar trigger check_overlapping_events
SELECT tgname 
FROM pg_trigger 
WHERE tgname = 'check_overlapping_events';
```

---

## 🔐 Paso 2: Configurar Variables de Entorno en Vercel

### 2.1 Acceder a Vercel

1. Ve a [https://vercel.com/dashboard](https://vercel.com/dashboard)
2. Inicia sesión o crea una cuenta
3. Si no tienes proyecto, conéctalo con GitHub

### 2.2 Agregar Variables de Entorno

1. Ve a tu proyecto en Vercel
2. Ve a **Settings** → **Environment Variables**
3. Agrega estas variables (marca todas para Production, Preview y Development):

#### Variables Obligatorias:

```
NEXT_PUBLIC_SUPABASE_URL
```
**Valor:** `https://nmcrmgdnpzrrklpcgyzn.supabase.co`

```
NEXT_PUBLIC_SUPABASE_ANON_KEY
```
**Valor:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5tY3JtZ2RucHpycmtscGNneXpuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUxNTE5NzIsImV4cCI6MjA4MDcyNzk3Mn0.fZ_1rRr6PK3HSzqZFtXOx6jpAxAhGPC9qz-cTxWr2PE`

```
SUPABASE_SERVICE_ROLE_KEY
```
**Valor:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5tY3JtZ2RucHpycmtscGNneXpuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTE1MTk3MiwiZXhwIjoyMDgwNzI3OTcyfQ.5B95jmZmS-DYZ8PsR1psPitb814gtzT1x9nhVUHTeTs`

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

### 5.3 Configurar Analytics

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

**¡Tu aplicación está lista para producción! 🎉**




