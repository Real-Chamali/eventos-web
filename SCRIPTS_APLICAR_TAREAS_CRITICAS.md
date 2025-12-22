# 🚀 Scripts para Aplicar las 3 Tareas Críticas

**Tiempo estimado**: 50 minutos  
**Dificultad**: Fácil (solo copiar y pegar)

---

## ✅ TAREA 1: Aplicar Migración 015 - Seguridad (15 min)

### Paso 1: Verificar si ya está aplicada (2 min)

1. Ve a [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecciona tu proyecto
3. Ve a **SQL Editor** (menú lateral izquierdo)
4. Crea una nueva query
5. Copia y pega este script de verificación:

```sql
-- ============================================================================
-- SCRIPT DE VERIFICACIÓN - Migración 015
-- ============================================================================

-- 1. Verificar vista event_financial_summary
SELECT 
  viewname, 
  viewowner,
  CASE 
    WHEN viewname = 'event_financial_summary' THEN '✅ Vista existe'
    ELSE '❌ Vista no existe'
  END as estado
FROM pg_views 
WHERE viewname = 'event_financial_summary';

-- 2. Verificar RLS en quotes_history
SELECT 
  tablename, 
  rowsecurity,
  CASE 
    WHEN rowsecurity = true THEN '✅ RLS habilitado'
    ELSE '❌ RLS NO habilitado'
  END as estado
FROM pg_tables 
WHERE tablename = 'quotes_history' 
AND schemaname = 'public';

-- 3. Verificar RLS en quote_items_history
SELECT 
  tablename, 
  rowsecurity,
  CASE 
    WHEN rowsecurity = true THEN '✅ RLS habilitado'
    ELSE '❌ RLS NO habilitado'
  END as estado
FROM pg_tables 
WHERE tablename = 'quote_items_history' 
AND schemaname = 'public';

-- 4. Verificar search_path en función is_admin
SELECT 
  proname,
  CASE 
    WHEN prosrc LIKE '%SET search_path%' THEN '✅ search_path configurado'
    ELSE '❌ search_path NO configurado'
  END as estado
FROM pg_proc 
WHERE proname = 'is_admin' 
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');
```

6. Haz clic en **"Run"** o presiona `Ctrl+Enter`
7. **Si todos muestran ✅**, la migración ya está aplicada. **SALTA al paso 3**.
8. **Si alguno muestra ❌**, continúa con el paso 2.

### Paso 2: Aplicar la Migración (10 min)

1. En el mismo SQL Editor, crea una **nueva query**
2. Abre el archivo `migrations/015_fix_security_issues.sql` en tu editor
3. **Copia TODO el contenido** del archivo (desde la primera línea hasta la última)
4. Pega en el SQL Editor de Supabase
5. Haz clic en **"Run"** o presiona `Ctrl+Enter`
6. Espera a que termine (puede tardar 1-2 minutos)
7. Verifica que no haya errores en rojo
8. Deberías ver mensajes como "CREATE VIEW", "ALTER TABLE", etc.

### Paso 3: Verificar que se Aplicó Correctamente (3 min)

1. Ejecuta el script de verificación del Paso 1 nuevamente
2. **Todos deben mostrar ✅**
3. Si hay algún ❌, revisa los errores y vuelve a ejecutar la parte correspondiente

**✅ TAREA 1 COMPLETADA**

---

## ✅ TAREA 2: Habilitar Protección de Contraseñas (5 min)

### Paso 1: Acceder a Configuración (1 min)

1. En Supabase Dashboard, ve a **Authentication** (menú lateral)
2. Haz clic en **"Policies"** o **"Settings"** o **"Configuration"**
3. Busca la sección **"Password Security"** o **"Password Requirements"**

**Nota**: La ubicación exacta puede variar. Si no encuentras "Password Security", busca en:
- Authentication → Settings → Password
- Authentication → Configuration → Password Security

### Paso 2: Habilitar Protección (2 min)

1. Busca la opción **"Leaked Password Protection"** o **"Check for compromised passwords"**
2. **Activa el toggle/switch** ✅
3. (Opcional pero recomendado) Configura requisitos mínimos:
   - **Minimum password length**: `8` caracteres
   - **Require uppercase**: ✅ Activar
   - **Require lowercase**: ✅ Activar
   - **Require numbers**: ✅ Activar
   - **Require special characters**: ✅ Activar (opcional)

### Paso 3: Guardar (1 min)

1. Haz clic en **"Save"** o **"Update"**
2. Espera confirmación de que se guardó
3. Verifica que el toggle siga activado

### Paso 4: Verificar (1 min) - OPCIONAL

1. Intenta crear un usuario de prueba con contraseña común: `password123`
2. Debería rechazarse si la protección está activa
3. Elimina el usuario de prueba después

**✅ TAREA 2 COMPLETADA**

---

## ✅ TAREA 3: Configurar Resend - Email Real (30 min)

### Paso 1: Crear Cuenta en Resend (5 min)

1. Ve a [https://resend.com](https://resend.com)
2. Haz clic en **"Sign Up"** o **"Get Started"**
3. Elige método de registro:
   - **Opción A**: Con GitHub (recomendado, más rápido)
   - **Opción B**: Con Google
   - **Opción C**: Con email (necesitarás verificar)
4. Completa el registro
5. Verifica tu email si es necesario

### Paso 2: Obtener API Key (5 min)

1. Una vez dentro del dashboard de Resend
2. Ve a **"API Keys"** en el menú lateral izquierdo
3. Haz clic en **"Create API Key"** (botón azul)
4. Completa el formulario:
   - **Name**: `Eventos Web Production`
   - **Permission**: Selecciona **"Sending access"** (suficiente)
5. Haz clic en **"Add"** o **"Create"**
6. **⚠️ IMPORTANTE**: Copia la API key **INMEDIATAMENTE**
   - Formato: `re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
   - **Solo se muestra una vez**
   - Guárdala en un lugar seguro temporalmente

### Paso 3: Configurar Dominio (10 min) - OPCIONAL pero RECOMENDADO

**Si tienes un dominio propio** (ej: `tudominio.com`):

1. En Resend Dashboard, ve a **"Domains"**
2. Haz clic en **"Add Domain"**
3. Ingresa tu dominio: `tudominio.com` (sin www)
4. Resend te mostrará registros DNS a agregar:
   - **SPF Record**
   - **DKIM Record** (puede haber varios)
   - **DMARC Record** (opcional)
5. Ve a tu proveedor de DNS (donde compraste el dominio):
   - Cloudflare, GoDaddy, Namecheap, etc.
6. Agrega los registros DNS que Resend te dio
7. Vuelve a Resend y haz clic en **"Verify"**
8. Espera verificación (puede tardar hasta 48 horas, pero usualmente es más rápido)

**Si NO tienes dominio**:
- Puedes usar el dominio de prueba de Resend temporalmente
- Los emails pueden ir a spam, pero funcionará para testing

### Paso 4: Configurar en Vercel (10 min)

1. Ve a [Vercel Dashboard](https://vercel.com/dashboard)
2. Selecciona tu proyecto **"eventos-web"**
3. Ve a **Settings** (en el menú superior)
4. Haz clic en **"Environment Variables"** (menú lateral)
5. Agrega las siguientes variables:

#### Variable 1: RESEND_API_KEY

1. Haz clic en **"Add New"** o **"Add"**
2. Completa:
   - **Key**: `RESEND_API_KEY`
   - **Value**: Pega tu API key de Resend (la que copiaste en Paso 2)
   - **Environment**: Marca las 3 opciones:
     - ✅ Production
     - ✅ Preview  
     - ✅ Development
3. Haz clic en **"Save"**

#### Variable 2: RESEND_FROM_EMAIL (Opcional)

1. Haz clic en **"Add New"** nuevamente
2. Completa:
   - **Key**: `RESEND_FROM_EMAIL`
   - **Value**: 
     - Si configuraste dominio: `Eventos Web <noreply@tudominio.com>`
     - Si NO configuraste dominio: `Eventos Web <noreply@eventos-web.com>`
   - **Environment**: Marca las 3 opciones:
     - ✅ Production
     - ✅ Preview
     - ✅ Development
3. Haz clic en **"Save"**

### Paso 5: Redeploy en Vercel (2 min)

1. En Vercel Dashboard, ve a **Deployments**
2. Encuentra el último deployment
3. Haz clic en los **3 puntos** (⋯) a la derecha
4. Selecciona **"Redeploy"**
5. Confirma el redeploy
6. Espera a que termine (1-2 minutos)

### Paso 6: Verificar que Funciona (3 min)

#### Opción A: Probar desde la Aplicación

1. Ve a tu aplicación en producción: `https://eventos-web.vercel.app`
2. Inicia sesión
3. Crea una cotización nueva
4. Si está configurado para enviar emails automáticamente, debería enviar uno

#### Opción B: Probar desde API

```bash
curl -X POST https://eventos-web.vercel.app/api/email/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_JWT_TOKEN" \
  -d '{
    "to": "tu-email@ejemplo.com",
    "subject": "Test Email",
    "html": "<h1>Test</h1><p>Este es un email de prueba desde Eventos Web</p>"
  }'
```

#### Opción C: Verificar en Resend Dashboard

1. Ve a Resend Dashboard → **"Emails"**
2. Deberías ver el historial de emails enviados
3. Si hay errores, aparecerán aquí con detalles

**✅ TAREA 3 COMPLETADA**

---

## 🎉 VERIFICACIÓN FINAL

Ejecuta este checklist rápido:

- [ ] Migración 015 aplicada (todos los checks ✅)
- [ ] Protección de contraseñas habilitada
- [ ] Resend API key configurada en Vercel
- [ ] Resend FROM email configurada (opcional)
- [ ] Redeploy en Vercel completado
- [ ] Email de prueba enviado exitosamente

---

## ⚠️ Troubleshooting

### Error al aplicar migración 015

**Problema**: "relation already exists"  
**Solución**: Es normal, la migración usa `CREATE OR REPLACE`. Continúa.

**Problema**: "permission denied"  
**Solución**: Asegúrate de estar en Supabase Dashboard con permisos de admin.

**Problema**: "syntax error"  
**Solución**: Verifica que copiaste TODO el contenido del archivo sin cortar.

### Error al configurar Resend

**Problema**: "Invalid API key"  
**Solución**: 
- Verifica que copiaste la key completa
- Asegúrate de que no haya espacios al inicio/final
- Verifica que esté en el ambiente correcto (Production)

**Problema**: Emails no se envían  
**Solución**:
- Verifica que `RESEND_API_KEY` esté configurada
- Revisa logs en Vercel Dashboard → Deployments → Functions
- Verifica logs en Resend Dashboard → Emails

**Problema**: Emails van a spam  
**Solución**: Configura tu propio dominio en Resend (Paso 3 de Tarea 3)

---

## 📞 Soporte

Si tienes problemas:

1. Revisa los logs en Vercel Dashboard
2. Revisa los logs en Resend Dashboard (si aplica)
3. Revisa la documentación:
   - `GUIA_APLICAR_MIGRACION_015.md`
   - `GUIA_CONFIGURAR_RESEND.md`
   - `GUIA_HABILITAR_PROTECCION_CONTRASEÑAS.md`

---

**Tiempo total estimado**: 50 minutos  
**Dificultad**: Fácil (solo seguir pasos)

¡Éxito! 🚀

