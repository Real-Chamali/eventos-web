# 🔧 Solución: Error 500 al Cargar Vendedores

## 📋 Problema

La API `/api/admin/vendors` está devolviendo un error 500.

## 🔍 Diagnóstico

### Paso 1: Verificar la Respuesta del Error

Abre en el navegador:
```
https://eventos-web-lovat.vercel.app/api/admin/vendors
```

O en desarrollo:
```
http://localhost:3000/api/admin/vendors
```

**Revisa el contenido de la respuesta JSON**. Debería incluir:
- `error`: Mensaje de error general
- `message`: Detalles del error
- `details`: (solo en desarrollo) Más información

### Paso 2: Verificar Variables de Entorno

El error 500 más común es que falta `SUPABASE_SERVICE_ROLE_KEY`.

**En Vercel**:
1. Ve a tu proyecto en Vercel Dashboard
2. Settings → Environment Variables
3. Verifica que existe `SUPABASE_SERVICE_ROLE_KEY`
4. Si no existe, agrégalo desde Supabase Dashboard:
   - Supabase Dashboard → Settings → API
   - Copia el "service_role" key (⚠️ SECRETO, no el anon key)
   - Agrégalo en Vercel como `SUPABASE_SERVICE_ROLE_KEY`

**En desarrollo local**:
1. Verifica que existe `.env.local`
2. Verifica que contiene:
   ```
   SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key_aqui
   ```
3. Reinicia el servidor: `npm run dev`

### Paso 3: Verificar Logs

**En Vercel**:
1. Ve a Deployments → Latest Deployment → Functions
2. Busca logs de `/api/admin/vendors`
3. Revisa el error específico

**En desarrollo local**:
Revisa la terminal donde corre `npm run dev` para ver los logs.

## 🐛 Causas Comunes y Soluciones

### 1. ❌ Falta `SUPABASE_SERVICE_ROLE_KEY`

**Síntoma**: Error 500 con mensaje "Server configuration error"

**Solución**:
1. Obtén el Service Role Key de Supabase:
   - Dashboard → Settings → API
   - Copia "service_role" key (⚠️ es secreto)
2. Agrégalo en Vercel:
   - Settings → Environment Variables
   - `SUPABASE_SERVICE_ROLE_KEY` = (pega el key)
3. Redespliega la aplicación

### 2. ❌ Error en `listUsers` de Supabase

**Síntoma**: Error 500 con mensaje "Error al obtener usuarios de Supabase"

**Posibles causas**:
- El Service Role Key es inválido
- Problemas de red con Supabase
- Límite de rate limiting alcanzado

**Solución**:
1. Verifica que el Service Role Key sea correcto
2. Verifica en Supabase Dashboard que el proyecto esté activo
3. Espera unos minutos y vuelve a intentar (rate limiting)

### 3. ❌ Usuario no es Admin

**Síntoma**: Debería ser 403, pero si hay un error en `checkAdmin` puede ser 500

**Solución**:
1. Verifica en Supabase que tu usuario tenga `role = 'admin'` en `profiles`
2. Si no, actualízalo:
   ```sql
   UPDATE profiles 
   SET role = 'admin' 
   WHERE id = 'TU_USER_ID';
   ```

### 4. ❌ Error en Procesamiento de Datos

**Síntoma**: Error 500 después de obtener usuarios

**Solución**:
- Revisa los logs para ver el error específico
- Puede ser un problema con la estructura de datos de algún usuario

## 🔧 Solución Rápida

### Si estás en Vercel:

1. **Verifica variables de entorno**:
   ```
   SUPABASE_SERVICE_ROLE_KEY debe estar configurado
   ```

2. **Si falta, agrégalo**:
   - Ve a Vercel Dashboard → Tu Proyecto → Settings → Environment Variables
   - Agrega `SUPABASE_SERVICE_ROLE_KEY` con el valor de Supabase
   - Redespliega

3. **Verifica que el usuario sea admin**:
   - En Supabase Dashboard → Table Editor → `profiles`
   - Verifica que tu usuario tenga `role = 'admin'`

### Si estás en desarrollo local:

1. **Verifica `.env.local`**:
   ```bash
   cat .env.local | grep SUPABASE_SERVICE_ROLE_KEY
   ```

2. **Si falta, agrégalo**:
   ```bash
   echo "SUPABASE_SERVICE_ROLE_KEY=tu_key_aqui" >> .env.local
   ```

3. **Reinicia el servidor**:
   ```bash
   # Detén (Ctrl+C)
   npm run dev
   ```

## 📝 Información Necesaria para Diagnosticar

Si el error persiste, comparte:

1. **El contenido completo de la respuesta JSON** cuando abres `/api/admin/vendors`
2. **Los logs del servidor** (Vercel Functions o terminal local)
3. **Si tienes `SUPABASE_SERVICE_ROLE_KEY` configurado** (solo confirma, no compartas el valor)

## ✅ Mejoras Implementadas

- ✅ Mejor manejo de errores con más detalles
- ✅ Mensajes de error más específicos
- ✅ Logging mejorado para diagnóstico
- ✅ Información adicional en desarrollo

---

**Próximo paso**: Verifica las variables de entorno y comparte el mensaje de error específico que aparece en la respuesta JSON.

