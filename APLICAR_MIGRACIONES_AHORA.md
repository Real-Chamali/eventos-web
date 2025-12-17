# 🗄️ Aplicar Migraciones SQL - Guía Paso a Paso

## 📋 Migraciones Disponibles

Tienes las siguientes migraciones en `migrations/`:

1. ✅ `001_create_audit_logs_table.sql` - Sistema de auditoría (CRÍTICO)
2. ⚪ `002_create_quote_versions_table_final.sql` - Versiones de cotizaciones (OPCIONAL)
3. ✅ `003_fix_profiles_rls_recursion_idempotent.sql` - Corrección RLS (CRÍTICO)
4. ⚪ `004_create_notifications_table.sql` - Notificaciones en tiempo real
5. ⚪ `005_create_comments_table.sql` - Sistema de comentarios
6. ⚪ `006_create_quote_templates_table.sql` - Plantillas de cotizaciones
7. ⚪ `007_create_user_preferences_table.sql` - Preferencias de usuario
8. ⚪ `008_optimize_rls_performance.sql` - Optimización RLS (requiere 009)
9. ✅ `009_add_created_by_to_clients.sql` - Campo created_by (CRÍTICO, aplicar antes de 008)

---

## 🎯 Orden de Aplicación (IMPORTANTE)

**Aplica en este orden exacto:**

1. **001** - Sistema de auditoría (crea `is_admin()`)
2. **003** - Corrección RLS (idempotente, puede ejecutarse múltiples veces)
3. **009** - Campo `created_by` en clients (requerido por 008)
4. **004** - Notificaciones (opcional, pero recomendado)
5. **005** - Comentarios (opcional, pero recomendado)
6. **006** - Plantillas (opcional)
7. **007** - Preferencias (opcional)
8. **008** - Optimización RLS (requiere 009)
9. **002** - Versiones de cotizaciones (opcional)

---

## 🚀 Pasos para Aplicar

### Paso 1: Acceder a Supabase

1. Ve a [https://app.supabase.com](https://app.supabase.com)
2. Inicia sesión
3. Selecciona tu proyecto
4. Ve a **SQL Editor** en el menú lateral izquierdo

### Paso 2: Aplicar Migración 001 (CRÍTICO)

**Archivo**: `migrations/001_create_audit_logs_table.sql`

**Cómo copiar correctamente:**
```bash
# Opción 1: Desde terminal (Linux)
cat migrations/001_create_audit_logs_table.sql | xclip -selection clipboard

# Opción 2: Desde terminal (Mac)
cat migrations/001_create_audit_logs_table.sql | pbcopy

# Opción 3: Abrir en editor y copiar todo (Ctrl+A, Ctrl+C)
```

**En Supabase:**
1. Pega el contenido en el SQL Editor
2. Haz clic en **RUN** o presiona `Ctrl+Enter`
3. Verifica que aparezca: **"Success. No rows returned"**

**⚠️ IMPORTANTE**: Si ves un error, lee el mensaje y corrígelo antes de continuar.

---

### Paso 3: Aplicar Migración 003 (CRÍTICO)

**Archivo**: `migrations/003_fix_profiles_rls_recursion_idempotent.sql`

**Nota**: Esta migración es **idempotente**, puede ejecutarse múltiples veces sin problemas.

**Cómo aplicar:**
1. Copia el contenido del archivo
2. Pega en Supabase SQL Editor
3. Ejecuta (RUN)
4. Verifica éxito

---

### Paso 4: Aplicar Migración 009 (CRÍTICO - Antes de 008)

**Archivo**: `migrations/009_add_created_by_to_clients.sql`

**⚠️ IMPORTANTE**: Debe aplicarse ANTES de la migración 008.

**Cómo aplicar:**
1. Copia el contenido del archivo
2. Pega en Supabase SQL Editor
3. Ejecuta (RUN)
4. Verifica éxito

---

### Paso 5: Aplicar Migraciones Opcionales (Recomendadas)

#### Migración 004: Notificaciones
**Archivo**: `migrations/004_create_notifications_table.sql`

**Funcionalidad**: Sistema de notificaciones en tiempo real

#### Migración 005: Comentarios
**Archivo**: `migrations/005_create_comments_table.sql`

**Funcionalidad**: Sistema de comentarios y colaboración

#### Migración 006: Plantillas
**Archivo**: `migrations/006_create_quote_templates_table.sql`

**Funcionalidad**: Plantillas reutilizables de cotizaciones

#### Migración 007: Preferencias
**Archivo**: `migrations/007_create_user_preferences_table.sql`

**Funcionalidad**: Preferencias de usuario (tema, idioma, etc.)

---

### Paso 6: Aplicar Migración 008 (Requiere 009)

**Archivo**: `migrations/008_optimize_rls_performance.sql`

**⚠️ IMPORTANTE**: Solo aplicar DESPUÉS de la migración 009.

**Cómo aplicar:**
1. Verifica que la migración 009 ya fue aplicada
2. Copia el contenido del archivo
3. Pega en Supabase SQL Editor
4. Ejecuta (RUN)
5. Verifica éxito

---

### Paso 7: Aplicar Migración 002 (Opcional)

**Archivo**: `migrations/002_create_quote_versions_table_final.sql`

**Funcionalidad**: Sistema de versionado de cotizaciones

---

## ✅ Verificación Post-Migración

### Verificar Tablas Creadas

Ejecuta en Supabase SQL Editor:

```sql
-- Verificar que las tablas existen
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
```

### Verificar Función is_admin()

```sql
-- Verificar que la función existe
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'is_admin';
```

### Verificar Columna created_by

```sql
-- Verificar que la columna existe en clients
SELECT column_name 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'clients' 
AND column_name = 'created_by';
```

---

## 🐛 Solución de Problemas

### Error: "function is_admin() does not exist"
**Solución**: Aplica primero la migración 001

### Error: "column created_by does not exist"
**Solución**: Aplica la migración 009 antes de la 008

### Error: "policy already exists"
**Solución**: La migración 003 es idempotente, puede ejecutarse múltiples veces

### Error: "syntax error at or near GNU"
**Solución**: No copies el header del editor. Solo copia el contenido SQL.

---

## 📝 Checklist de Aplicación

- [ ] Migración 001 aplicada
- [ ] Migración 003 aplicada
- [ ] Migración 009 aplicada
- [ ] Migración 004 aplicada (opcional)
- [ ] Migración 005 aplicada (opcional)
- [ ] Migración 006 aplicada (opcional)
- [ ] Migración 007 aplicada (opcional)
- [ ] Migración 008 aplicada (después de 009)
- [ ] Migración 002 aplicada (opcional)
- [ ] Verificaciones post-migración completadas

---

## 🎯 Resultado Esperado

Después de aplicar las migraciones:

- ✅ Sistema de auditoría funcionando
- ✅ RLS corregido y optimizado
- ✅ Notificaciones en tiempo real (si aplicaste 004)
- ✅ Comentarios funcionando (si aplicaste 005)
- ✅ Plantillas disponibles (si aplicaste 006)
- ✅ Preferencias de usuario (si aplicaste 007)

---

## 🚀 Próximo Paso

Una vez aplicadas las migraciones:

1. Verifica que la aplicación funciona correctamente
2. Prueba las nuevas funcionalidades (notificaciones, comentarios, etc.)
3. Prepara para despliegue a producción

---

**¡Buena suerte con las migraciones!** 🗄️

