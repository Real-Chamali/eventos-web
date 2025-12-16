# 📋 Guía para Aplicar Migraciones SQL

## 🎯 Migraciones a Aplicar

Se han creado 4 migraciones SQL que deben aplicarse en Supabase para habilitar todas las características premium:

### 1. Sistema de Notificaciones
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

### 2. Sistema de Comentarios
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

### 3. Plantillas de Cotizaciones
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

### 4. Preferencias de Usuario
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

## 📝 Orden Recomendado de Aplicación

1. ✅ `004_create_notifications_table.sql`
2. ✅ `005_create_comments_table.sql`
3. ✅ `006_create_quote_templates_table.sql`
4. ✅ `007_create_user_preferences_table.sql`
5. ✅ Habilitar Realtime (opcional)

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

