# 🔐 Guía: Aplicar Migración 015 - Correcciones de Seguridad

## 📋 Descripción

Esta guía explica cómo aplicar la migración 015 que corrige problemas críticos de seguridad en la base de datos.

---

## ⚠️ ¿Por qué es importante?

Esta migración corrige:
1. **Vista `event_financial_summary`** - Cambia de SECURITY DEFINER a SECURITY INVOKER
2. **RLS en tablas de historial** - Habilita Row Level Security en `quotes_history` y `quote_items_history`
3. **search_path en funciones** - Previene inyección SQL agregando `search_path` a todas las funciones
4. **Políticas RLS** - Asegura que servicios y perfiles solo sean accesibles por admins

---

## 📝 Pasos para Aplicar

### Paso 1: Verificar si ya está aplicada

Antes de aplicar, verifica si la migración ya está aplicada:

1. Ve a [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecciona tu proyecto
3. Ve a **SQL Editor**
4. Ejecuta esta query:

```sql
-- Verificar si la vista tiene SECURITY INVOKER
SELECT viewname, viewowner 
FROM pg_views 
WHERE viewname = 'event_financial_summary';

-- Verificar si RLS está habilitado en tablas de historial
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('quotes_history', 'quote_items_history');

-- Verificar si funciones tienen search_path
SELECT proname 
FROM pg_proc 
WHERE proname = 'is_admin' 
AND prosrc LIKE '%SET search_path%';
```

**Si la vista existe, RLS está habilitado, y las funciones tienen search_path, la migración ya está aplicada.** ✅

### Paso 2: Aplicar la Migración

Si la migración NO está aplicada:

1. Ve a **SQL Editor** en Supabase Dashboard
2. Crea una nueva query
3. Abre el archivo `migrations/015_fix_security_issues.sql` en tu editor
4. Copia TODO el contenido del archivo
5. Pega en el SQL Editor de Supabase
6. Haz clic en **"Run"** o presiona `Ctrl+Enter` (o `Cmd+Enter` en Mac)
7. Espera a que termine la ejecución
8. Verifica que no haya errores

### Paso 3: Verificar que se Aplicó Correctamente

Ejecuta estas queries para verificar:

```sql
-- 1. Verificar vista
SELECT viewname, viewowner 
FROM pg_views 
WHERE viewname = 'event_financial_summary';
-- Debe mostrar la vista

-- 2. Verificar RLS en quotes_history
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'quotes_history';
-- rowsecurity debe ser 'true'

-- 3. Verificar RLS en quote_items_history
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'quote_items_history';
-- rowsecurity debe ser 'true'

-- 4. Verificar políticas RLS
SELECT policyname, tablename 
FROM pg_policies 
WHERE tablename IN ('quotes_history', 'quote_items_history');
-- Debe mostrar políticas para ambas tablas

-- 5. Verificar search_path en función is_admin
SELECT proname, prosrc 
FROM pg_proc 
WHERE proname = 'is_admin' 
AND prosrc LIKE '%SET search_path%';
-- Debe mostrar la función con search_path
```

Si todas las verificaciones pasan, la migración se aplicó correctamente. ✅

---

## 🔍 Troubleshooting

### Error: "relation already exists"

**Causa**: La vista o función ya existe.

**Solución**: La migración usa `CREATE OR REPLACE`, así que debería funcionar. Si persiste, elimina manualmente y vuelve a ejecutar.

### Error: "permission denied"

**Causa**: No tienes permisos suficientes.

**Solución**: Asegúrate de estar usando el SQL Editor con permisos de administrador. Si usas Supabase Dashboard, deberías tener los permisos necesarios.

### Error: "function does not exist"

**Causa**: Alguna función que la migración intenta modificar no existe.

**Solución**: Esto es normal si no has aplicado todas las migraciones anteriores. La migración 015 es idempotente y solo modifica lo que existe. Puedes aplicar las migraciones anteriores primero o continuar (las funciones se crearán cuando sean necesarias).

### Error: "syntax error"

**Causa**: Puede haber un problema con el formato del SQL.

**Solución**: 
1. Verifica que copiaste todo el contenido
2. Asegúrate de que no haya caracteres extraños
3. Intenta ejecutar sección por sección (cada sección está marcada con comentarios)

---

## ✅ Checklist

- [ ] Verificado que la migración no está aplicada
- [ ] Archivo `015_fix_security_issues.sql` abierto
- [ ] Contenido copiado al SQL Editor
- [ ] Query ejecutada sin errores
- [ ] Verificaciones ejecutadas
- [ ] Todas las verificaciones pasaron

---

## 📚 Referencias

- **Archivo de migración**: `migrations/015_fix_security_issues.sql`
- **Documentación Supabase**: https://supabase.com/docs/guides/database
- **Estado de implementación**: Ver `ESTADO_IMPLEMENTACION_COMPLETA.md`

---

## ⚠️ Notas Importantes

1. **Backup**: Aunque esta migración es segura, siempre es recomendable hacer backup antes de aplicar migraciones en producción
2. **Idempotente**: Esta migración es idempotente, puedes ejecutarla múltiples veces sin problemas
3. **Tiempo**: La migración puede tardar unos minutos dependiendo del tamaño de tu base de datos
4. **Sin downtime**: Esta migración no causa downtime, puedes aplicarla en producción sin problemas

---

**Última actualización**: Diciembre 2024

