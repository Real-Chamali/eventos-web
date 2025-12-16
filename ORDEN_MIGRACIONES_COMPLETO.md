# 📋 Orden Completo de Migraciones SQL

## ⚠️ IMPORTANTE: Orden de Aplicación

Las migraciones **DEBEN** aplicarse en este orden exacto. Algunas dependen de otras.

---

## 🔴 Migraciones CRÍTICAS (Aplicar Primero)

### 1. Migración 001: Sistema de Auditoría
**Archivo**: `migrations/001_create_audit_logs_table.sql`

**Por qué es crítica**:
- ✅ Crea la función `is_admin()` que es usada por TODAS las demás migraciones
- ✅ Sin esta función, las migraciones 004-007 fallarán

**Qué crea**:
- Tabla `audit_logs`
- Función `is_admin()`
- Funciones helper: `get_record_audit_trail()`, `get_user_activity()`

**Dependencias**: Ninguna (es la primera)

---

### 2. Migración 003: Corrección de RLS
**Archivo**: `migrations/003_fix_profiles_rls_recursion.sql`

**Por qué es crítica**:
- ✅ Corrige problemas de recursión infinita en políticas RLS
- ✅ Mejora la función `is_admin()` para evitar recursión
- ✅ Sin esta migración, las políticas RLS pueden causar errores

**Qué hace**:
- Elimina políticas RLS problemáticas de `profiles`
- Crea políticas RLS simples y seguras
- Mejora `is_admin()` para usar JWT primero

**Dependencias**: 
- Requiere que la migración 001 ya esté aplicada (usa `is_admin()`)

---

## ⚪ Migración Opcional

### 3. Migración 002: Versiones de Cotizaciones (OPCIONAL)
**Archivo**: `migrations/002_create_quote_versions_table_final.sql`

**Por qué es opcional**:
- Solo necesaria si quieres versionado de cotizaciones
- No es requerida para las características premium básicas

**Dependencias**: 
- Requiere migración 001 (usa `is_admin()`)

---

## 🟢 Migraciones Premium (Aplicar Después)

### 4. Migración 004: Notificaciones
**Archivo**: `migrations/004_create_notifications_table.sql`

**Dependencias**:
- ✅ Requiere migración 001 (usa `is_admin()`)
- ✅ Requiere migración 003 (políticas RLS corregidas)

**Qué crea**:
- Tabla `notifications`
- Función `create_notification()`
- Índices optimizados

---

### 5. Migración 005: Comentarios
**Archivo**: `migrations/005_create_comments_table.sql`

**Dependencias**:
- ✅ Requiere migración 001 (usa `is_admin()`)
- ✅ Requiere migración 003 (políticas RLS corregidas)

**Qué crea**:
- Tabla `comments`
- Soporte para @mentions
- Índice GIN para búsqueda en arrays

---

### 6. Migración 006: Plantillas de Cotizaciones
**Archivo**: `migrations/006_create_quote_templates_table.sql`

**Dependencias**:
- ✅ Requiere migración 001 (usa `is_admin()`)
- ✅ Requiere migración 003 (políticas RLS corregidas)

**Qué crea**:
- Tabla `quote_templates`
- Soporte para plantillas públicas/privadas
- Índices parciales optimizados

---

### 7. Migración 007: Preferencias de Usuario
**Archivo**: `migrations/007_create_user_preferences_table.sql`

**Dependencias**:
- ✅ Requiere migración 003 (políticas RLS corregidas)
- ⚪ No requiere migración 001 (no usa `is_admin()`)

**Qué crea**:
- Tabla `user_preferences`
- Configuración de tema, idioma, zona horaria

---

## 📊 Diagrama de Dependencias

```
001 (audit_logs + is_admin())
  │
  ├─→ 003 (fix RLS) ──┐
  │                   │
  └─→ 002 (opcional)  │
                      │
                      ├─→ 004 (notifications)
                      ├─→ 005 (comments)
                      ├─→ 006 (templates)
                      └─→ 007 (preferences)
```

---

## ✅ Orden Recomendado de Aplicación

### Para Producción Completa:

1. ✅ **001** - `create_audit_logs_table.sql` (CRÍTICO)
2. ✅ **003** - `fix_profiles_rls_recursion.sql` (CRÍTICO)
3. ⚪ **002** - `create_quote_versions_table_final.sql` (OPCIONAL)
4. ✅ **004** - `create_notifications_table.sql`
5. ✅ **005** - `create_comments_table.sql`
6. ✅ **006** - `create_quote_templates_table.sql`
7. ✅ **007** - `create_user_preferences_table.sql`
8. ✅ Habilitar Realtime para `notifications` y `comments`

### Para Solo Características Premium (sin auditoría):

Si ya tienes un sistema de auditoría o no lo necesitas:

1. ✅ **003** - `fix_profiles_rls_recursion.sql` (CRÍTICO)
2. ✅ **004** - `create_notifications_table.sql`
3. ✅ **005** - `create_comments_table.sql`
4. ✅ **006** - `create_quote_templates_table.sql`
5. ✅ **007** - `create_user_preferences_table.sql`

**NOTA**: Si saltas la 001, necesitarás crear manualmente la función `is_admin()` o las migraciones 004-006 fallarán.

---

## 🔍 Verificación Post-Migración

Después de aplicar todas las migraciones, ejecuta:

```sql
-- Verificar función is_admin()
SELECT proname, prosrc 
FROM pg_proc 
WHERE proname = 'is_admin';
-- Debe retornar 1 fila

-- Verificar todas las tablas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'audit_logs',
  'notifications',
  'comments',
  'quote_templates',
  'user_preferences'
)
ORDER BY table_name;
-- Debe retornar 5 filas (o 6 si aplicaste quote_versions)

-- Verificar políticas RLS
SELECT tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename IN ('notifications', 'comments', 'quote_templates', 'user_preferences')
ORDER BY tablename, policyname;
```

---

## 🚨 Errores Comunes

### Error: "function is_admin() does not exist"

**Causa**: Aplicaste migraciones 004-007 antes de la 001.

**Solución**: Aplica primero la migración 001.

### Error: "infinite recursion detected in policy"

**Causa**: No aplicaste la migración 003.

**Solución**: Aplica la migración 003 antes de las 004-007.

### Error: "relation already exists"

**Causa**: La tabla ya existe (migración aplicada previamente).

**Solución**: Puedes omitir esa migración o usar `DROP TABLE IF EXISTS` antes.

---

## 📝 Resumen

- **001 y 003 son CRÍTICAS** - Aplícalas primero
- **002 es OPCIONAL** - Solo si necesitas versionado
- **004-007 son PREMIUM** - Requieren 001 y 003
- **Orden importa** - No saltes ninguna migración crítica

---

**Última actualización**: $(date)

