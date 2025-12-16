# 🔧 Solución: Error "policy already exists"

## ⚠️ Error

```
ERROR: 42710: policy "profiles_select_own_simple" for table "profiles" already exists
```

## 🔍 Causa

Este error ocurre cuando intentas aplicar la migración `003_fix_profiles_rls_recursion.sql` pero las políticas ya existen. Esto puede pasar si:

1. La migración se aplicó parcialmente antes
2. Las políticas se crearon manualmente
3. Hay políticas duplicadas

## ✅ Solución

### Opción 1: Usar la versión idempotente (Recomendado)

He creado una versión idempotente de la migración que puede ejecutarse múltiples veces sin errores:

**Archivo**: `migrations/003_fix_profiles_rls_recursion_idempotent.sql`

Esta versión:
- ✅ Elimina todas las políticas existentes antes de crear las nuevas
- ✅ Usa `DROP POLICY IF EXISTS` para evitar errores
- ✅ Puede ejecutarse múltiples veces sin problemas

**Pasos**:
1. Ve a Supabase Dashboard → SQL Editor
2. Copia el contenido de `migrations/003_fix_profiles_rls_recursion_idempotent.sql`
3. Pega y ejecuta

### Opción 2: Eliminar políticas manualmente primero

Si prefieres usar la migración original, primero elimina las políticas existentes:

```sql
-- Eliminar políticas existentes
DROP POLICY IF EXISTS "profiles_select_own_simple" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own_simple" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own_simple" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_own_simple" ON public.profiles;

-- Luego ejecuta la migración 003 original
```

### Opción 3: Verificar qué políticas existen

Primero verifica qué políticas tienes:

```sql
SELECT 
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'profiles'
ORDER BY policyname;
```

Luego elimina solo las que necesitas:

```sql
-- Eliminar políticas específicas que causan conflicto
DROP POLICY IF EXISTS "profiles_select_own_simple" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own_simple" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own_simple" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_own_simple" ON public.profiles;
```

## 📋 Orden Recomendado

Si estás aplicando todas las migraciones por primera vez:

1. ✅ **001** - `create_audit_logs_table.sql` (crea `is_admin()`)
2. ✅ **003** - `fix_profiles_rls_recursion_idempotent.sql` (versión idempotente)
3. ⚪ **002** - `create_quote_versions_table_final.sql` (opcional)
4. ✅ **004** - `create_notifications_table.sql`
5. ✅ **005** - `create_comments_table.sql`
6. ✅ **006** - `create_quote_templates_table.sql`
7. ✅ **007** - `create_user_preferences_table.sql`
8. ✅ **008** - `optimize_rls_performance.sql` (optimización)

## 🔍 Verificación Post-Migración

Después de aplicar la migración 003, verifica:

```sql
-- Verificar políticas de profiles
SELECT 
  policyname,
  cmd,
  CASE 
    WHEN qual LIKE '%auth.uid()%' THEN '✅ Simple (sin recursión)'
    WHEN qual LIKE '%is_admin()%' THEN '⚠️  Puede causar recursión'
    ELSE '❓ Revisar'
  END as status
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'profiles'
ORDER BY policyname;
```

Debes ver 4 políticas con el sufijo `_simple`:
- `profiles_select_own_simple`
- `profiles_insert_own_simple`
- `profiles_update_own_simple`
- `profiles_delete_own_simple`

Todas deben mostrar "✅ Simple (sin recursión)".

## 💡 Tip

**Siempre usa la versión idempotente** (`_idempotent.sql`) si:
- No estás seguro si la migración ya se aplicó
- Estás aplicando migraciones en producción
- Quieres evitar errores por políticas duplicadas

## 🚨 Si el Error Persiste

Si después de usar la versión idempotente sigues teniendo problemas:

1. **Verifica que no haya políticas con nombres similares**:
```sql
SELECT policyname 
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'profiles';
```

2. **Elimina todas las políticas manualmente**:
```sql
-- CUIDADO: Esto elimina TODAS las políticas de profiles
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'profiles'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.profiles', r.policyname);
  END LOOP;
END $$;
```

3. **Luego ejecuta la migración idempotente nuevamente**

---

**Última actualización**: $(date)

