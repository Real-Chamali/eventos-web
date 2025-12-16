# 🔧 Solución Definitiva: Error PGRST106 "The schema must be one of the following: graphql_public, api"

## 🎯 Problema

Error `PGRST106`: PostgREST está configurado para solo permitir acceso a los esquemas `graphql_public` y `api`, pero la tabla `profiles` está en el esquema `public`.

## 🔍 Causa Raíz

Este error indica que la configuración de PostgREST en Supabase está limitando los esquemas expuestos. Normalmente, Supabase expone el esquema `public` por defecto, pero en algunos casos la configuración puede estar restringida.

## ✅ Soluciones

### Solución 1: Verificar Configuración de PostgREST en Supabase Dashboard

1. Ve a [Supabase Dashboard](https://app.supabase.com)
2. Selecciona tu proyecto
3. Ve a **Settings** → **API**
4. Busca la sección **PostgREST** o **Database**
5. Verifica que el esquema `public` esté en la lista de esquemas expuestos
6. Si no está, agrega `public` a la lista

### Solución 2: Verificar Variables de Entorno

Asegúrate de que estás usando las credenciales correctas:

```bash
# Verificar variables de entorno
./scripts/verify-all-env.sh
```

Verifica que:
- ✅ `NEXT_PUBLIC_SUPABASE_URL` apunta a tu proyecto correcto
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY` es la clave anónima (no la service role key)

### Solución 3: Verificar que la Tabla Está en el Esquema Correcto

Ejecuta en el SQL Editor de Supabase:

```sql
-- Verificar esquema de la tabla
SELECT 
  table_schema,
  table_name
FROM information_schema.tables
WHERE table_name = 'profiles';
```

Debería mostrar `public` como esquema.

### Solución 4: Usar Service Role Key (Solo para Desarrollo/Testing)

⚠️ **ADVERTENCIA:** Solo para desarrollo local, nunca en producción.

Si el problema persiste, puedes temporalmente usar la Service Role Key para desarrollo:

1. Ve a Supabase Dashboard → Settings → API
2. Copia la **Service Role Key** (no la anónima)
3. Agrega a `.env.local`:
   ```bash
   SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key_aqui
   ```
4. Modifica `utils/supabase/server.ts` temporalmente para usar esta clave

**NOTA:** Esto bypassa RLS, así que solo úsalo para debugging.

### Solución 5: Contactar Soporte de Supabase

Si ninguna de las soluciones anteriores funciona:

1. Ve a [Supabase Support](https://supabase.com/support)
2. Reporta el error `PGRST106`
3. Menciona que el esquema `public` no está siendo expuesto por PostgREST
4. Proporciona tu Project ID

## 🔧 Código Mejorado

El código ahora maneja este error de forma más elegante:

- ✅ Usa `maybeSingle()` en lugar de `single()` para evitar errores
- ✅ Maneja el error `PGRST106` específicamente
- ✅ Usa rol por defecto (`vendor`) cuando hay errores de esquema
- ✅ Evita bucles de redirección
- ✅ Registra advertencias en lugar de errores para este caso específico

## 📝 Verificación

Después de aplicar las soluciones:

1. ✅ Reinicia el servidor: `npm run dev`
2. ✅ Verifica que no haya errores en la consola
3. ✅ Accede a `http://localhost:3000`
4. ✅ Las redirecciones deberían funcionar correctamente

## 🚨 Si el Problema Persiste

El código ahora está diseñado para funcionar incluso con este error:
- Usa rol por defecto cuando no puede acceder a `profiles`
- No causa bucles de redirección
- Permite que la aplicación funcione básicamente

Sin embargo, para una solución completa, necesitas verificar la configuración de PostgREST en Supabase Dashboard.

---

**Última actualización:** 16 de diciembre de 2025

