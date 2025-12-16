# 📋 Guía para Aplicar Migraciones SQL

## 🎯 Migraciones a Aplicar

Se han creado **7 migraciones SQL** que deben aplicarse en Supabase. **IMPORTANTE**: Aplica en el orden indicado.

## ⚠️ ORDEN CRÍTICO DE APLICACIÓN

**NO saltes ninguna migración**. El orden es importante porque:
- La **001** crea la función `is_admin()` usada por las demás
- La **003** corrige problemas de RLS que afectan a todas las tablas
- Las **004-007** dependen de las anteriores

### 1. Sistema de Auditoría (CRÍTICO - APLICAR PRIMERO)
**Archivo**: `migrations/001_create_audit_logs_table.sql`

**Qué hace:**
- Crea tabla `audit_logs` para rastrear todos los cambios
- **Crea la función `is_admin()`** que es usada por todas las demás migraciones
- Configura RLS policies
- Crea funciones helper para consultas de auditoría

**Por qué es crítica**: Sin esta migración, las migraciones 004-007 fallarán porque no existe `is_admin()`.

**Cómo aplicar:**
1. Ve a Supabase Dashboard → SQL Editor
2. Copia el contenido de `migrations/001_create_audit_logs_table.sql`
3. Pega y ejecuta el SQL
4. Verifica que la tabla y función se crearon correctamente

### 2. Corrección de RLS (CRÍTICO - APLICAR SEGUNDO)
**Archivo**: `migrations/003_fix_profiles_rls_recursion.sql`

**Qué hace:**
- Corrige problemas de recursión infinita en políticas RLS de `profiles`
- Mejora la función `is_admin()` para evitar recursión
- Crea políticas RLS simples y seguras

**Por qué es crítica**: Sin esta migración, las políticas RLS de otras tablas pueden causar errores de recursión.

**Cómo aplicar:**
1. Ve a Supabase Dashboard → SQL Editor
2. Copia el contenido de `migrations/003_fix_profiles_rls_recursion.sql`
3. Pega y ejecuta el SQL
4. Verifica que no hay errores

**NOTA**: La migración 002 (quote_versions) es opcional. Puedes saltarla si no necesitas versionado de cotizaciones.

### 3. Sistema de Notificaciones
**Archivo**: `migrations/004_create_notifications_table.sql`

**Qué hace:**
- Crea tabla `notifications` para notificaciones en tiempo real
- Configura RLS policies
- Crea función helper `create_notification()`

**Cómo aplicar:**
1. Ve a Supabase Dashboard → SQL Editor
2. Copia el contenido de `migrations/004_create_notifications_table.sql`
3. Pega y ejecuta el SQL
4. Verifica que la tabla se creó correctamente

### 4. Sistema de Comentarios
**Archivo**: `migrations/005_create_comments_table.sql`

**Qué hace:**
- Crea tabla `comments` para comentarios y colaboración
- Configura RLS policies por tipo de entidad
- Soporta @mentions

**Cómo aplicar:**
1. Ve a Supabase Dashboard → SQL Editor
2. Copia el contenido de `migrations/005_create_comments_table.sql`
3. Pega y ejecuta el SQL
4. Verifica que la tabla se creó correctamente

### 5. Plantillas de Cotizaciones
**Archivo**: `migrations/006_create_quote_templates_table.sql`

**Qué hace:**
- Crea tabla `quote_templates` para plantillas reutilizables
- Configura RLS para plantillas públicas/privadas
- Permite servicios pre-configurados

**Cómo aplicar:**
1. Ve a Supabase Dashboard → SQL Editor
2. Copia el contenido de `migrations/006_create_quote_templates_table.sql`
3. Pega y ejecuta el SQL
4. Verifica que la tabla se creó correctamente

### 6. Preferencias de Usuario
**Archivo**: `migrations/007_create_user_preferences_table.sql`

**Qué hace:**
- Crea tabla `user_preferences` para configuración de usuario
- Almacena tema, idioma, zona horaria, notificaciones
- Configura RLS policies

**Cómo aplicar:**
1. Ve a Supabase Dashboard → SQL Editor
2. Copia el contenido de `migrations/007_create_user_preferences_table.sql`
3. Pega y ejecuta el SQL
4. Verifica que la tabla se creó correctamente

## ✅ Verificación Post-Migración

Después de aplicar cada migración, verifica:

```sql
-- Verificar tabla de auditoría
SELECT COUNT(*) FROM audit_logs;

-- Verificar función is_admin()
SELECT proname FROM pg_proc WHERE proname = 'is_admin';
-- Debe retornar 1 fila

-- Verificar tabla de notificaciones
SELECT COUNT(*) FROM notifications;

-- Verificar tabla de comentarios
SELECT COUNT(*) FROM comments;

-- Verificar tabla de plantillas
SELECT COUNT(*) FROM quote_templates;

-- Verificar tabla de preferencias
SELECT COUNT(*) FROM user_preferences;
```

## 🔧 Habilitar Realtime (Opcional pero Recomendado)

Para que las notificaciones y comentarios funcionen en tiempo real:

1. Ve a Supabase Dashboard → Database → Replication
2. Habilita Realtime para las tablas:
   - `notifications`
   - `comments`

O ejecuta este SQL:

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE comments;
```

## 🚨 Solución de Problemas

### Error: "relation already exists"
- La tabla ya existe, puedes omitir esa migración o usar `CREATE TABLE IF NOT EXISTS`

### Error: "permission denied"
- Asegúrate de estar usando el SQL Editor con permisos de admin
- Verifica que tienes acceso al proyecto

### Error: "function already exists"
- La función ya existe, puedes omitirla o usar `CREATE OR REPLACE FUNCTION`

## 📝 Orden CRÍTICO de Aplicación

**IMPORTANTE**: Aplica en este orden exacto. NO saltes ninguna:

1. ✅ **`001_create_audit_logs_table.sql`** (CRÍTICO - Crea is_admin())
2. ✅ **`003_fix_profiles_rls_recursion.sql`** (CRÍTICO - Corrige RLS)
3. ⚪ `002_create_quote_versions_table_final.sql` (OPCIONAL - Solo si necesitas versionado)
4. ✅ `004_create_notifications_table.sql` (Requiere 001 y 003)
5. ✅ `005_create_comments_table.sql` (Requiere 001 y 003)
6. ✅ `006_create_quote_templates_table.sql` (Requiere 001 y 003)
7. ✅ `007_create_user_preferences_table.sql` (Requiere 003)
8. ✅ Habilitar Realtime (opcional pero recomendado)

## ✨ Después de Aplicar

Una vez aplicadas todas las migraciones:

1. **Reinicia el servidor de desarrollo**: `npm run dev`
2. **Prueba las funcionalidades**:
   - Crear una notificación
   - Agregar un comentario
   - Crear una plantilla
   - Cambiar preferencias de usuario

---

**¿Necesitas ayuda?** Revisa los logs de Supabase o contacta al equipo de desarrollo.

