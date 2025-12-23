# 🔍 Diagnóstico: Error 500 en /api/admin/vendors

## ⚠️ Problema

La API `/api/admin/vendors` está devolviendo **500 Internal Server Error**.

## 🔍 Posibles Causas

### 1. Variable de Entorno No Disponible en Runtime

**Síntoma**: Error 500 sin detalles específicos

**Causa**: `SUPABASE_SERVICE_ROLE_KEY` no está disponible en el runtime de Vercel

**Solución**:
1. Ve a Vercel Dashboard → Settings → Environment Variables
2. Verifica que `SUPABASE_SERVICE_ROLE_KEY` esté configurada
3. Verifica que esté marcada para **Production**
4. **Redespliega** después de verificar

### 2. Error al Llamar a Supabase Admin API

**Síntoma**: Error 500 con mensaje específico sobre Supabase

**Causa**: Problema al llamar a `adminClient.auth.admin.listUsers()`

**Solución**: Revisar los logs de Vercel para ver el error específico

### 3. Problema de Autenticación

**Síntoma**: Error 500 pero el usuario está autenticado

**Causa**: Problema al verificar el rol de admin

**Solución**: Verificar que el usuario tenga `role = 'admin'` en Supabase

## 🔧 Pasos para Diagnosticar

### Paso 1: Ver Logs en Vercel

1. Ve a: https://vercel.com/dashboard
2. Selecciona tu proyecto: **eventos-web-lovat**
3. Ve a **Deployments** → Último deployment
4. Click en **Functions**
5. Busca `/api/admin/vendors`
6. Revisa los **logs** para ver el error específico

### Paso 2: Verificar Variables de Entorno

1. En Vercel Dashboard → Settings → Environment Variables
2. Verifica que existan:
   - ✅ `NEXT_PUBLIC_SUPABASE_URL`
   - ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - ✅ `SUPABASE_SERVICE_ROLE_KEY` ⚠️ **CRÍTICO**
3. Verifica que estén marcadas para **Production**

### Paso 3: Probar la API Directamente

Abre en el navegador (con sesión activa):
```
https://eventos-web-lovat.vercel.app/api/admin/vendors
```

Copia el JSON completo de la respuesta. Debería incluir:
- `error`: Mensaje general
- `message`: Detalles del error

### Paso 4: Verificar Rol de Usuario

1. Ve a Supabase Dashboard → Table Editor → `profiles`
2. Busca tu usuario
3. Verifica que tenga `role = 'admin'`
4. Si eres `admin@chamali.com`, deberías tener bypass automático

## 🐛 Errores Comunes

### Error: "SUPABASE_SERVICE_ROLE_KEY not set"

**Solución**:
1. Agrega la variable en Vercel
2. Redespliega

### Error: "Error listing users"

**Solución**:
1. Verifica que el service role key sea válido
2. Verifica que no haya expirado
3. Obtén uno nuevo de Supabase Dashboard si es necesario

### Error: "Unauthorized" o "Forbidden"

**Solución**:
1. Verifica que estés autenticado
2. Verifica que tu usuario sea admin en Supabase

## 📋 Checklist

- [ ] Variables de entorno configuradas en Vercel
- [ ] Variables marcadas para Production
- [ ] Aplicación redesplegada después de agregar variables
- [ ] Usuario tiene `role = 'admin'` en Supabase
- [ ] Logs de Vercel revisados para ver error específico

## 🔗 Enlaces Útiles

- **Vercel Dashboard**: https://vercel.com/dashboard
- **Supabase Dashboard**: https://app.supabase.com
- **Logs de Vercel**: Deployments → [Deployment] → Functions → `/api/admin/vendors`

---

**Próximo paso**: Revisa los logs de Vercel para ver el error específico y compártelo.

