# 🔍 Diagnóstico: Vendedores No Se Muestran

## 📋 Problema Reportado

1. No se muestran los vendedores en la aplicación
2. Se agregó un vendedor en Supabase pero no aparece en la app

## ✅ Cambios Realizados

### 1. Mejoras en el Frontend (`app/admin/vendors/page.tsx`)

- ✅ Agregado botón de **Recargar** para forzar actualización
- ✅ Mejorado logging para diagnóstico
- ✅ Agregado `cache: 'no-store'` para evitar caché
- ✅ Mejor manejo de errores con más detalles

### 2. Mejoras en el Backend (`app/api/admin/vendors/route.ts`)

- ✅ Agregado logging detallado en cada paso
- ✅ Validaciones mejoradas de datos
- ✅ Mejor manejo de errores

## 🔍 Pasos para Diagnosticar

### Paso 1: Verificar en el Navegador

1. **Abre la consola del navegador** (F12 → Console)
2. **Abre la pestaña Network** (F12 → Network)
3. **Recarga la página** o haz clic en "Recargar"
4. **Busca la petición** a `/api/admin/vendors`
5. **Revisa**:
   - Status code (200, 401, 403, 500?)
   - Response (¿qué devuelve?)
   - Headers (¿hay errores?)

### Paso 2: Verificar la Respuesta de la API

Abre directamente en el navegador:
```
http://localhost:3000/api/admin/vendors
```

O en producción:
```
https://tu-dominio.vercel.app/api/admin/vendors
```

**Deberías ver**:
- Si hay error: `{"error": "..."}`
- Si funciona: `{"data": [...]}`

### Paso 3: Verificar Logs del Servidor

Revisa los logs en la terminal donde corre `npm run dev`:

Busca mensajes como:
- `API /admin/vendors - Fetching users from Supabase Admin API`
- `API /admin/vendors - Users fetched successfully`
- `API /admin/vendors - Error listing users`

### Paso 4: Verificar en Supabase

1. **Ve a Supabase Dashboard** → Authentication → Users
2. **Verifica** que los usuarios existen
3. **Verifica** que tienen perfiles en la tabla `profiles`

## 🐛 Posibles Causas

### 1. Error de Autenticación (401)
- El usuario no está autenticado
- La sesión expiró
- **Solución**: Cierra sesión y vuelve a iniciar

### 2. Error de Permisos (403)
- El usuario no es admin
- **Solución**: Verifica que el usuario tenga `role = 'admin'` en la tabla `profiles`

### 3. Error de Configuración (500)
- Falta `SUPABASE_SERVICE_ROLE_KEY`
- **Solución**: Verifica variables de entorno en `.env.local`

### 4. Error de API de Supabase
- `listUsers` está fallando
- **Solución**: Revisa logs del servidor para ver el error específico

### 5. Array Vacío
- La API funciona pero devuelve `[]`
- Los usuarios no tienen perfiles
- **Solución**: Verifica que cada usuario tenga un registro en `profiles`

## 🔧 Soluciones Rápidas

### Si la API devuelve 401 o 403:

1. **Cierra sesión** y vuelve a iniciar
2. **Verifica** que estés usando la cuenta de admin
3. **Verifica** en Supabase que tu usuario tenga `role = 'admin'` en `profiles`

### Si la API devuelve 500:

1. **Revisa** los logs del servidor
2. **Verifica** que `SUPABASE_SERVICE_ROLE_KEY` esté configurado
3. **Reinicia** el servidor de desarrollo

### Si la API devuelve `{"data": []}`:

1. **Verifica** en Supabase Dashboard que hay usuarios
2. **Verifica** que cada usuario tenga un perfil en `profiles`
3. **Crea** perfiles para usuarios que no los tengan:

```sql
-- Ver usuarios sin perfil
SELECT au.id, au.email 
FROM auth.users au
LEFT JOIN profiles p ON p.id = au.id
WHERE p.id IS NULL;

-- Crear perfil para un usuario (reemplaza USER_ID)
INSERT INTO profiles (id, role, full_name)
VALUES ('USER_ID', 'vendor', 'Nombre del Usuario');
```

## 📝 Próximos Pasos

1. **Ejecuta los pasos de diagnóstico** arriba
2. **Comparte**:
   - El status code de la petición
   - El contenido de la respuesta
   - Los logs del servidor
3. **Con esa información** podremos identificar el problema exacto

## ✅ Mejoras Implementadas

- ✅ Botón de recarga manual
- ✅ Cache-busting para evitar datos obsoletos
- ✅ Logging mejorado para diagnóstico
- ✅ Mejor manejo de errores

---

**Nota**: Si después de estos pasos aún no funciona, comparte los detalles del diagnóstico y podremos solucionarlo específicamente.

