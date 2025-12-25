# 🚀 GUÍA DE DEPLOYMENT A PRODUCCIÓN
## Sistema SaaS para Gestión de Salones de Fiestas

**Fecha:** 2025-01-XX  
**Versión:** Con todas las mejoras implementadas

---

## ⚠️ PASOS CRÍTICOS ANTES DE PRODUCCIÓN

### 1. ✅ APLICAR MIGRACIÓN CRÍTICA (OBLIGATORIO)

**Migración:** `033_critical_validations.sql`

Esta migración es **CRÍTICA** y debe aplicarse antes de que el código nuevo esté en producción.

**Contenido:**
- Trigger de validación de suma de pagos
- Validación de fechas pasadas en eventos
- Máquina de estados para cotizaciones
- Constraints adicionales de integridad
- Índices optimizados

**Cómo aplicar:**

#### Opción A: Supabase Dashboard
1. Ir a Supabase Dashboard → SQL Editor
2. Copiar el contenido de `migrations/033_critical_validations.sql`
3. Ejecutar el SQL
4. Verificar que no hay errores

#### Opción B: Supabase CLI
```bash
# Si tienes Supabase CLI configurado
supabase db push

# O aplicar manualmente
supabase migration up 033_critical_validations
```

#### Opción C: SQL Directo
```sql
-- Copiar y ejecutar el contenido completo de:
-- migrations/033_critical_validations.sql
```

**⚠️ IMPORTANTE:** Esta migración debe aplicarse **ANTES** del deployment del código.

---

### 2. ✅ VERIFICAR VARIABLES DE ENTORNO

Asegúrate de que estas variables estén configuradas en producción:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=tu_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_key

# Opcional: Rate Limiting con Redis
UPSTASH_REDIS_REST_URL=tu_url (opcional)
UPSTASH_REDIS_REST_TOKEN=tu_token (opcional)

# Sentry (si usas)
NEXT_PUBLIC_SENTRY_DSN=tu_dsn (opcional)
```

---

### 3. ✅ VERIFICAR BUILD

El build ya está verificado localmente:
```bash
npm run build
# ✅ Build exitoso
```

---

### 4. ✅ DEPLOYMENT EN VERCEL

Si usas Vercel, el deployment debería ser automático después del push:

1. **Verificar que el push se completó:**
   ```bash
   git log --oneline -1
   # Debe mostrar: d316fa6 fix: Corregir error de sintaxis...
   ```

2. **Verificar en Vercel Dashboard:**
   - Ir a https://vercel.com/dashboard
   - Verificar que el deployment se inició
   - Revisar logs del build

3. **Verificar deployment exitoso:**
   - Build debe completarse sin errores
   - Todas las rutas deben funcionar
   - Verificar que no hay errores en runtime

---

## 🔍 VERIFICACIÓN POST-DEPLOYMENT

### Checklist de Verificación

#### 1. Verificar Migración Aplicada
```sql
-- En Supabase SQL Editor, ejecutar:
SELECT EXISTS (
  SELECT 1 FROM pg_trigger 
  WHERE tgname = 'validate_payment_total_trigger'
) AS payment_validation_exists;

SELECT EXISTS (
  SELECT 1 FROM pg_trigger 
  WHERE tgname = 'validate_quote_status_transition_trigger'
) AS status_validation_exists;

SELECT EXISTS (
  SELECT 1 FROM pg_trigger 
  WHERE tgname = 'check_overlapping_events'
) AS events_validation_exists;
```

Todos deben retornar `true`.

#### 2. Verificar Funcionalidad
- [ ] Crear una cotización nueva
- [ ] Intentar crear pago que exceda total (debe fallar)
- [ ] Cambiar estado de cotización (validar transiciones)
- [ ] Crear evento (validar fechas pasadas)
- [ ] Verificar que audit logs se registran

#### 3. Verificar Performance
- [ ] Dashboard carga correctamente
- [ ] Lista de cotizaciones carga con paginación
- [ ] Formularios funcionan correctamente
- [ ] Auto-save funciona en formularios

#### 4. Verificar Seguridad
- [ ] Rate limiting funciona
- [ ] RLS policies funcionan
- [ ] Validaciones en BD funcionan

---

## 📊 MONITOREO POST-DEPLOYMENT

### Logs a Revisar

1. **Supabase Logs:**
   - Revisar errores de triggers
   - Verificar que las validaciones funcionan
   - Monitorear performance de queries

2. **Vercel Logs:**
   - Revisar errores de build
   - Verificar errores de runtime
   - Monitorear performance

3. **Audit Logs:**
   ```sql
   -- Verificar que se están registrando acciones críticas
   SELECT * FROM audit_logs 
   WHERE action IN ('UPDATE', 'DELETE')
   ORDER BY created_at DESC 
   LIMIT 10;
   ```

---

## 🚨 ROLLBACK (Si es Necesario)

Si algo sale mal, puedes hacer rollback:

### Rollback de Código (Vercel)
1. Ir a Vercel Dashboard
2. Seleccionar deployment anterior
3. Hacer "Redeploy"

### Rollback de Migración (Supabase)
```sql
-- Eliminar triggers
DROP TRIGGER IF EXISTS validate_payment_total_trigger ON partial_payments;
DROP TRIGGER IF EXISTS validate_quote_status_transition_trigger ON quotes;
DROP TRIGGER IF EXISTS check_overlapping_events ON events;

-- Eliminar funciones (opcional)
DROP FUNCTION IF EXISTS validate_payment_total();
DROP FUNCTION IF EXISTS validate_quote_status_transition();
-- NO eliminar prevent_overlapping_events (ya existía)
```

---

## ✅ CHECKLIST FINAL DE PRODUCCIÓN

### Pre-Deployment
- [x] Código commiteado y pusheado
- [x] Build verificado localmente
- [x] Migración 033 lista para aplicar
- [x] Variables de entorno verificadas

### Deployment
- [ ] Migración 033 aplicada en producción
- [ ] Deployment en Vercel iniciado
- [ ] Build completado exitosamente

### Post-Deployment
- [ ] Verificar que triggers existen
- [ ] Probar funcionalidades críticas
- [ ] Verificar audit logs
- [ ] Monitorear errores

---

## 📝 NOTAS IMPORTANTES

### Orden de Deployment
1. **PRIMERO:** Aplicar migración 033 en Supabase
2. **DESPUÉS:** Deployment del código en Vercel

### Por qué este orden
- El código nuevo depende de los triggers en BD
- Si el código se deploya primero, las validaciones fallarán
- Aplicar la migración primero asegura que todo funcione

### Testing en Producción
Después del deployment, probar:
1. Crear cotización → Debe funcionar
2. Intentar pago que exceda total → Debe fallar con mensaje claro
3. Cambiar estado inválido → Debe fallar con mensaje claro
4. Crear evento en fecha pasada → Debe fallar con mensaje claro

---

## 🎯 RESUMEN

**Estado Actual:**
- ✅ Código listo (commiteado y pusheado)
- ✅ Build verificado
- ⚠️ **PENDIENTE:** Aplicar migración 033 en producción

**Próximo Paso:**
1. Aplicar migración 033 en Supabase Dashboard
2. Verificar que Vercel deployó automáticamente
3. Verificar funcionalidad en producción

---

**Última actualización:** 2025-01-XX  
**Listo para producción:** ✅ SÍ (después de aplicar migración)

