# ✅ Checklist Interactivo - 3 Tareas Críticas

**Fecha**: Diciembre 2024  
**Tiempo estimado total**: ~35 minutos

---

## 📊 Estado General

- ✅ **TAREA 1**: Migración 015 - COMPLETADA AUTOMÁTICAMENTE
- ⚠️ **TAREA 2**: Protección de Contraseñas - PENDIENTE (5 min)
- ⚠️ **TAREA 3**: Configurar Resend - PENDIENTE (30 min)

---

## ✅ TAREA 1: Migración 015 - COMPLETADA

### Estado: ✅ COMPLETADA AUTOMÁTICAMENTE

Esta tarea ya fue completada automáticamente. No requiere acción adicional.

**Verificación**:
- [x] Migración 015 aplicada
- [x] Migración 019 aplicada (bonus)
- [x] Todas las funciones con `search_path`
- [x] Todas las políticas RLS activas

**Script de verificación**: Ejecuta esta query en Supabase SQL Editor:

```sql
-- Verificar estado de seguridad
SELECT 
  'Vista event_financial_summary' as check_item,
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_views WHERE viewname = 'event_financial_summary') THEN '✅ Existe'
    ELSE '❌ No existe'
  END as estado
UNION ALL
SELECT 
  'RLS quotes_history' as check_item,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_tables 
      WHERE tablename = 'quotes_history' 
      AND schemaname = 'public' 
      AND rowsecurity = true
    ) THEN '✅ Habilitado'
    ELSE '❌ No habilitado'
  END as estado
UNION ALL
SELECT 
  'RLS quote_items_history' as check_item,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_tables 
      WHERE tablename = 'quote_items_history' 
      AND schemaname = 'public' 
      AND rowsecurity = true
    ) THEN '✅ Habilitado'
    ELSE '❌ No habilitado'
  END as estado;
```

**Todos deben mostrar ✅**

---

## ⚠️ TAREA 2: Habilitar Protección de Contraseñas

### Estado: ⚠️ PENDIENTE

**Tiempo estimado**: 5 minutos

### Checklist Paso a Paso:

#### Paso 1: Acceder a Supabase Dashboard
- [ ] Abrir navegador
- [ ] Ir a: https://supabase.com/dashboard/project/nmcrmgdnpzrrklpcgyzn
- [ ] Iniciar sesión si es necesario

#### Paso 2: Navegar a Authentication Settings
- [ ] Menú lateral → **Authentication**
- [ ] Submenú → **Settings** o **Configuration**
- [ ] Buscar sección: **"Password Security"** o **"Password Requirements"**

**💡 Si no encuentras la sección**:
- Busca en: Authentication → Settings → Password
- O en: Authentication → Configuration → Password Security

#### Paso 3: Habilitar Protección
- [ ] Buscar opción: **"Leaked Password Protection"** o **"Check for compromised passwords"**
- [ ] Activar el toggle/switch ✅
- [ ] (Opcional) Configurar requisitos mínimos:
  - [ ] Minimum length: 8 caracteres
  - [ ] Require uppercase: ✅
  - [ ] Require lowercase: ✅
  - [ ] Require numbers: ✅
  - [ ] Require special characters: ✅ (opcional)

#### Paso 4: Guardar
- [ ] Haz clic en **"Save"** o **"Update"**
- [ ] Confirmar que se guardó correctamente

#### Paso 5: Verificar
- [ ] Ejecutar script de verificación: Ver `VERIFICACION_PROTECCION_CONTRASEÑAS.md`
- [ ] O verificar en Supabase Advisor: https://supabase.com/dashboard/project/nmcrmgdnpzrrklpcgyzn/advisors/security
- [ ] El warning "Leaked Password Protection Disabled" debe desaparecer

**✅ TAREA 2 COMPLETADA cuando:**
- [ ] Toggle activado en Supabase Dashboard
- [ ] Supabase Advisor ya no muestra el warning
- [ ] Prueba funcional exitosa (intentar crear usuario con `password123` debe fallar)

**Guía detallada**: `GUIA_HABILITAR_PROTECCION_CONTRASEÑAS.md`

---

## ⚠️ TAREA 3: Configurar Resend

### Estado: ⚠️ PENDIENTE

**Tiempo estimado**: 30 minutos

### Checklist Paso a Paso:

#### Parte A: Crear Cuenta en Resend (5 min)
- [ ] Abrir navegador
- [ ] Ir a: https://resend.com
- [ ] Clic en **"Sign Up"** o **"Get Started"**
- [ ] Crear cuenta (GitHub/Google/Email)
- [ ] Verificar email si es necesario
- [ ] Confirmar acceso al dashboard

#### Parte B: Obtener API Key (5 min)
- [ ] En Resend Dashboard, ir a **"API Keys"** (menú lateral)
- [ ] Clic en **"Create API Key"**
- [ ] Completar formulario:
  - [ ] Name: `Eventos Web Production`
  - [ ] Permission: **Sending access** ✅
- [ ] Clic en **"Add"** o **"Create"**
- [ ] **⚠️ IMPORTANTE**: Copiar API key inmediatamente (solo se muestra una vez)
  - Formato: `re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
- [ ] Guardar API key en lugar seguro temporalmente
- [ ] Clic en **"Done"** o **"Close"**

#### Parte C: Configurar Dominio (10 min) - OPCIONAL pero RECOMENDADO

**Si tienes dominio propio**:
- [ ] En Resend Dashboard, ir a **"Domains"**
- [ ] Clic en **"Add Domain"**
- [ ] Ingresar dominio: `tudominio.com` (sin www, sin http://)
- [ ] Clic en **"Add"**
- [ ] Copiar registros DNS que Resend proporciona:
  - [ ] Registro SPF
  - [ ] Registros DKIM (puede haber varios)
  - [ ] Registro DMARC (opcional)
- [ ] Ir a proveedor de DNS (Cloudflare, GoDaddy, Namecheap, etc.)
- [ ] Agregar cada registro DNS
- [ ] Volver a Resend y clic en **"Verify"**
- [ ] Esperar verificación (puede tardar hasta 48 horas)

**Si NO tienes dominio**:
- [ ] Saltar esta parte
- [ ] Usarás dominio de prueba de Resend temporalmente
- [ ] Los emails pueden ir a spam, pero funcionará para testing

#### Parte D: Configurar en Vercel (10 min)
- [ ] Abrir navegador
- [ ] Ir a: https://vercel.com/dashboard
- [ ] Seleccionar proyecto: `eventos-web`
- [ ] Ir a: **Settings** → **Environment Variables**
- [ ] Clic en **"Add New"** o **"Add"**
- [ ] Agregar primera variable:
  - [ ] Key: `RESEND_API_KEY` (exactamente así, sin espacios)
  - [ ] Value: Pegar API key copiada (`re_xxxxxxxxxxxxx`)
  - [ ] Marcar casillas: ✅ Production, ✅ Preview, ✅ Development
  - [ ] Clic en **"Save"**
- [ ] (Opcional) Agregar segunda variable:
  - [ ] Clic en **"Add New"** nuevamente
  - [ ] Key: `RESEND_FROM_EMAIL`
  - [ ] Value: 
    - Si configuraste dominio: `Eventos Web <noreply@tudominio.com>`
    - Si NO configuraste dominio: `Eventos Web <noreply@eventos-web.com>`
  - [ ] Marcar casillas: ✅ Production, ✅ Preview, ✅ Development
  - [ ] Clic en **"Save"**

#### Parte E: Redeploy (2 min)
- [ ] En Vercel Dashboard, ir a **"Deployments"**
- [ ] Encontrar último deployment (el más reciente)
- [ ] A la derecha del deployment, clic en los **3 puntos** (⋯)
- [ ] Seleccionar **"Redeploy"**
- [ ] Confirmar redeploy
- [ ] Esperar 1-2 minutos a que termine

#### Parte F: Verificar (3 min)
- [ ] Opción A: Desde la aplicación
  - [ ] Ir a tu aplicación: `https://eventos-web.vercel.app`
  - [ ] Iniciar sesión
  - [ ] Crear cotización nueva
  - [ ] Si está configurado para enviar emails, debería enviar uno
- [ ] Opción B: Desde Resend Dashboard
  - [ ] Ir a Resend Dashboard → **"Emails"**
  - [ ] Deberías ver historial de emails enviados
  - [ ] Si hay errores, aparecerán aquí con detalles
- [ ] Opción C: Desde API (avanzado)
  - [ ] Usar curl o Postman para enviar email de prueba
  - [ ] Ver `VERIFICACION_RESEND.md` para ejemplos

**✅ TAREA 3 COMPLETADA cuando:**
- [ ] Cuenta creada en Resend
- [ ] API key obtenida y guardada
- [ ] `RESEND_API_KEY` configurada en Vercel
- [ ] Redeploy completado
- [ ] Email de prueba enviado exitosamente
- [ ] Email recibido en bandeja de entrada

**Guía detallada**: `GUIA_CONFIGURAR_RESEND.md`  
**Script de verificación**: `VERIFICACION_RESEND.md`

---

## 📊 Resumen de Progreso

### Completado:
- ✅ TAREA 1: Migración 015 (automático)

### Pendiente:
- ⚠️ TAREA 2: Protección de Contraseñas (5 min)
- ⚠️ TAREA 3: Configurar Resend (30 min)

**Tiempo restante**: ~35 minutos

---

## 🎯 Próximos Pasos Después de Completar

Una vez que completes las 3 tareas:

1. ✅ Ejecutar scripts de verificación
2. ✅ Probar funcionalidades
3. ✅ Revisar logs para confirmar que todo funciona
4. ✅ Documentar cualquier problema encontrado

---

## 📚 Recursos Adicionales

### Guías:
- `COMO_APLICAR_3_TAREAS.md` - Guía paso a paso completa
- `GUIA_HABILITAR_PROTECCION_CONTRASEÑAS.md` - Guía específica Tarea 2
- `GUIA_CONFIGURAR_RESEND.md` - Guía específica Tarea 3

### Scripts de Verificación:
- `VERIFICACION_PROTECCION_CONTRASEÑAS.md` - Verificar Tarea 2
- `VERIFICACION_RESEND.md` - Verificar Tarea 3

### Resúmenes:
- `ESTADO_FINAL_TAREAS.md` - Estado completo de todas las tareas
- `TAREAS_COMPLETADAS_AUTOMATICAMENTE.md` - Lo que se hizo automáticamente

---

## 💡 Consejos

1. **Empieza con la Tarea 2** (5 min) - Es la más rápida y te da momentum
2. **Haz la Tarea 3 cuando tengas tiempo** (30 min) - Requiere más concentración
3. **Usa los scripts de verificación** después de cada tarea para confirmar
4. **Guarda los enlaces directos** en favoritos para acceso rápido

---

**¡Éxito!** 🚀

Marca cada checkbox conforme completes los pasos. Esto te ayudará a mantener el progreso y no olvidar ningún paso.

