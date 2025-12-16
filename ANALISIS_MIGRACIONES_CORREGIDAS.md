# 🔍 Análisis y Correcciones de Migraciones SQL

## 📋 Resumen de Correcciones

Se han analizado y corregido **todas las migraciones** para asegurar:
- ✅ Sin recursión infinita en RLS
- ✅ Uso consistente de `is_admin()`
- ✅ Referencias correctas a `profiles.id` (no `profiles.user_id`)
- ✅ Índices optimizados
- ✅ Constraints apropiados
- ✅ Documentación completa

---

## 🔧 Problemas Encontrados y Corregidos

### 1. ❌ Problema: Recursión en RLS Policies

**Migración afectada**: `001_create_audit_logs_table.sql`

**Problema original**:
```sql
-- INCORRECTO: Consulta profiles directamente en RLS
EXISTS (
  SELECT 1 FROM public.profiles
  WHERE profiles.user_id = auth.uid()  -- ❌ Error: debería ser profiles.id
  AND profiles.role = 'admin'
)
```

**Corrección aplicada**:
```sql
-- CORRECTO: Usa función is_admin() que evita recursión
USING (public.is_admin());
```

### 2. ❌ Problema: Referencia incorrecta a profiles

**Migraciones afectadas**: `001`, `004`, `005`, `006`

**Problema**: Uso de `profiles.user_id` cuando debería ser `profiles.id`

**Corrección**: Todas las referencias ahora usan `profiles.id = auth.uid()`

### 3. ❌ Problema: Repetición de código para verificar admin

**Migraciones afectadas**: `004`, `005`, `006`

**Problema**: Código repetido en múltiples lugares:
```sql
EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
```

**Corrección**: Todas usan ahora `public.is_admin()` que:
- Primero intenta usar JWT (más rápido)
- Hace fallback a consulta de profiles solo si es necesario
- Evita recursión cuando se usa correctamente

### 4. ❌ Problema: Falta de validación de datos

**Migraciones afectadas**: `005`, `006`

**Corrección agregada**:
- `comments.content`: `CHECK (LENGTH(content) > 0)` - No permite comentarios vacíos
- `quote_templates.name`: `CHECK (LENGTH(name) > 0)` - No permite nombres vacíos

### 5. ❌ Problema: Índices no optimizados

**Migraciones afectadas**: `004`, `005`, `006`

**Correcciones**:
- `notifications`: Índice parcial `WHERE read = FALSE` para notificaciones no leídas
- `comments`: Índice GIN para búsqueda en array `mentions`
- `quote_templates`: Índice parcial `WHERE is_public = TRUE` para plantillas públicas

### 6. ❌ Problema: Funciones sin SECURITY DEFINER

**Migraciones afectadas**: `001`, `004`

**Corrección**: Funciones helper ahora tienen `SECURITY DEFINER` para poder insertar datos que requieren permisos especiales.

### 7. ❌ Problema: Falta de validación en funciones

**Migración afectada**: `004`

**Corrección agregada**:
```sql
-- Validar tipo de notificación
IF p_type NOT IN ('quote', 'event', 'payment', 'reminder', 'system') THEN
  RAISE EXCEPTION 'Invalid notification type: %', p_type;
END IF;
```

---

## ✅ Migraciones Corregidas

### Migración 001: `create_audit_logs_table.sql`
- ✅ Usa `is_admin()` en lugar de consultar profiles directamente
- ✅ Función `is_admin()` creada con fallback seguro
- ✅ Funciones helper con `SECURITY DEFINER`
- ✅ Referencias corregidas a `profiles.id`

### Migración 004: `create_notifications_table.sql`
- ✅ Usa `is_admin()` consistentemente
- ✅ Función `create_notification()` con validación
- ✅ Índices optimizados (parcial para `read = FALSE`)
- ✅ Documentación completa

### Migración 005: `create_comments_table.sql`
- ✅ Usa `is_admin()` en todas las políticas
- ✅ Constraint para contenido no vacío
- ✅ Índice GIN para array `mentions`
- ✅ Políticas RLS simplificadas

### Migración 006: `create_quote_templates_table.sql`
- ✅ Usa `is_admin()` consistentemente
- ✅ Constraint para nombre no vacío
- ✅ Índices parciales para plantillas públicas
- ✅ Validación de datos mejorada

### Migración 007: `create_user_preferences_table.sql`
- ✅ Políticas RLS simples (solo verifica `auth.uid()`)
- ✅ No necesita `is_admin()` (cada usuario solo ve sus preferencias)
- ✅ Constraints apropiados para theme y language

---

## 📊 Orden de Aplicación Recomendado

1. ✅ **001** - `create_audit_logs_table.sql` (crea `is_admin()`)
2. ✅ **003** - `fix_profiles_rls_recursion.sql` (corrige profiles, mejora `is_admin()`)
3. ✅ **004** - `create_notifications_table.sql` (usa `is_admin()`)
4. ✅ **005** - `create_comments_table.sql` (usa `is_admin()`)
5. ✅ **006** - `create_quote_templates_table.sql` (usa `is_admin()`)
6. ✅ **007** - `create_user_preferences_table.sql` (no necesita `is_admin()`)

---

## 🔒 Mejoras de Seguridad

### 1. Función `is_admin()` Mejorada

```sql
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT COALESCE(
    (auth.jwt() ->> 'user_role') = 'admin',  -- Primero intenta JWT (rápido)
    EXISTS (                                 -- Fallback a DB si es necesario
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );
$$;
```

**Ventajas**:
- ✅ Usa JWT primero (más rápido, sin consulta DB)
- ✅ Fallback seguro a consulta de profiles
- ✅ `SECURITY DEFINER` para permisos apropiados
- ✅ `STABLE` para optimización de queries

### 2. Políticas RLS Simplificadas

Todas las políticas ahora:
- ✅ Usan `is_admin()` en lugar de consultas directas
- ✅ Evitan recursión infinita
- ✅ Son más legibles y mantenibles

### 3. Validación de Datos

- ✅ Constraints CHECK para campos requeridos
- ✅ Validación en funciones (ej: `create_notification`)
- ✅ Tipos de datos apropiados

---

## 📈 Mejoras de Performance

### Índices Optimizados

1. **Notificaciones**:
   ```sql
   -- Índice parcial para notificaciones no leídas (más común)
   CREATE INDEX idx_notifications_user_read 
   ON notifications(user_id, read) 
   WHERE read = FALSE;
   ```

2. **Comentarios**:
   ```sql
   -- Índice GIN para búsqueda en array
   CREATE INDEX idx_comments_mentions 
   ON comments USING GIN(mentions);
   ```

3. **Plantillas**:
   ```sql
   -- Índice parcial para plantillas públicas
   CREATE INDEX idx_quote_templates_public_type 
   ON quote_templates(is_public, event_type) 
   WHERE is_public = TRUE;
   ```

---

## ✅ Checklist de Verificación

Antes de aplicar en producción, verifica:

- [ ] ✅ Todas las migraciones usan `is_admin()` (no consultas directas a profiles)
- [ ] ✅ Todas las referencias a profiles usan `profiles.id` (no `profiles.user_id`)
- [ ] ✅ Todas las funciones tienen `SECURITY DEFINER` cuando es necesario
- [ ] ✅ Todos los índices están optimizados
- [ ] ✅ Todas las constraints están aplicadas
- [ ] ✅ Todas las políticas RLS están documentadas
- [ ] ✅ No hay recursión infinita en RLS

---

## 🚀 Próximos Pasos

1. **Aplicar migraciones en orden** (ver `GUIA_APLICAR_MIGRACIONES.md`)
2. **Verificar que no hay errores** en Supabase SQL Editor
3. **Probar funcionalidades** después de cada migración
4. **Habilitar Realtime** para `notifications` y `comments`

---

**Fecha de corrección**: $(date)
**Versión**: 3.0.1 (Migraciones Corregidas)

