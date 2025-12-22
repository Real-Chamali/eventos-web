# ✅ Configuración Completa de CORS

**Fecha**: Diciembre 2024  
**Estado**: Configuración mejorada y lista para usar

---

## 🔧 Cambios Aplicados en el Código

### 1. ✅ `next.config.ts` - Headers CORS Mejorados

**Cambios**:
- Headers CORS configurados para todas las rutas `/api/*`
- `Access-Control-Allow-Methods`: GET, POST, PUT, DELETE, PATCH, OPTIONS
- `Access-Control-Allow-Headers`: Content-Type, Authorization, x-api-key, Accept
- `Access-Control-Allow-Credentials`: true
- `Access-Control-Max-Age`: 86400 (24 horas)

**Nota**: El header `Access-Control-Allow-Origin` se maneja dinámicamente en las rutas API para mayor seguridad.

---

### 2. ✅ `utils/supabase/client.ts` - Cliente Mejorado

**Mejoras**:
- `persistSession: true` - Persistir sesión en localStorage
- `autoRefreshToken: true` - Refrescar tokens automáticamente
- `detectSessionInUrl: true` - Detectar sesión en URL (para callbacks OAuth)
- `flowType: 'pkce'` - Usar PKCE para mayor seguridad
- `storage: window.localStorage` - Usar localStorage del navegador
- `storageKey: 'sb-auth-token'` - Clave específica para almacenamiento
- `debug: true` en desarrollo - Para debugging

---

### 3. ✅ `utils/supabase/middleware.ts` - Cookies Mejoradas

**Mejoras**:
- `sameSite: 'lax'` - Compatible con la mayoría de casos
- `secure: true` en HTTPS - Solo en producción con HTTPS
- `maxAge: 7 días` - Persistencia de cookies
- Detección automática de HTTPS
- Configuración correcta de dominio y path

---

## 📋 Configuración en Supabase Dashboard

### Pasos Detallados:

1. **Ir a Supabase Dashboard**
   - URL: https://app.supabase.com
   - Iniciar sesión
   - Seleccionar tu proyecto

2. **Ir a Authentication → URL Configuration**
   - Menú lateral izquierdo
   - `Authentication` → `URL Configuration`

3. **Configurar Site URL**
   ```
   Desarrollo: http://localhost:3000
   Producción: https://tu-dominio.vercel.app
   ```

4. **Configurar Redirect URLs**
   Agregar todas estas líneas (una por línea):
   ```
   http://localhost:3000/**
   https://tu-dominio.vercel.app/**
   https://tu-dominio.com/**
   ```

5. **Guardar Cambios**
   - Clic en botón "Save"
   - Los cambios son inmediatos

---

## 🚀 Script de Ayuda

Ejecuta el script para ver las URLs que necesitas configurar:

```bash
./scripts/configurar-cors-supabase.sh
```

Este script mostrará:
- Las URLs de desarrollo y producción
- Las URLs de redirect necesarias
- Instrucciones paso a paso

---

## 🔍 Verificación

### 1. Verificar en el Navegador

Abre DevTools (F12) → Network:

1. **Intentar iniciar sesión**
2. **Buscar solicitud a `/auth/v1/user`**
3. **Verificar headers de respuesta**:
   - `Access-Control-Allow-Origin` debe incluir tu dominio
   - `Access-Control-Allow-Credentials: true`
   - No debe haber errores CORS en la consola

### 2. Verificar Cookies

DevTools → Application → Cookies:

- Debe haber cookies de Supabase (ej: `sb-*-auth-token`)
- `SameSite` debe ser `Lax` o `None` (con `Secure`)
- `Secure` debe ser `true` solo en HTTPS

### 3. Verificar Variables de Entorno

```bash
# Verificar que las variables estén configuradas
cat .env.local | grep SUPABASE
```

Debe mostrar:
```
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_anon
```

---

## 🚨 Solución de Problemas

### Problema 1: "CORS error" persiste después de configurar

**Solución**:
1. Limpiar cookies del navegador
2. Reiniciar servidor de desarrollo
3. Verificar que las URLs en Supabase Dashboard sean exactas (sin espacios)
4. Verificar que el dominio en producción coincida exactamente

### Problema 2: Cookies no se guardan

**Solución**:
1. Verificar que `Secure` solo esté en HTTPS
2. Verificar que `SameSite` sea `Lax` (no `Strict`)
3. Verificar que el dominio sea correcto
4. Limpiar cookies y probar nuevamente

### Problema 3: Error en producción pero funciona en desarrollo

**Solución**:
1. Verificar que la URL de producción esté en Supabase Dashboard
2. Verificar que las variables de entorno en Vercel sean correctas
3. Redeploy la aplicación después de cambiar variables
4. Verificar que el dominio use HTTPS

---

## 📊 Estado de Configuración

| Componente | Estado | Detalles |
|------------|--------|----------|
| Headers CORS en next.config.ts | ✅ | Configurado para todas las rutas API |
| Cliente Supabase | ✅ | Configuración mejorada con PKCE |
| Middleware cookies | ✅ | Cookies configuradas correctamente |
| Rutas API | ✅ | Manejo dinámico de CORS |
| Supabase Dashboard | ⚠️ | **Requiere configuración manual** |

---

## ✅ Checklist Final

- [ ] Headers CORS configurados en `next.config.ts`
- [ ] Cliente Supabase mejorado con opciones de auth
- [ ] Cookies configuradas correctamente en middleware
- [ ] Site URL configurado en Supabase Dashboard
- [ ] Redirect URLs configuradas en Supabase Dashboard
- [ ] Variables de entorno correctas en Vercel
- [ ] Variables de entorno correctas en `.env.local`
- [ ] Servidor de desarrollo reiniciado
- [ ] Aplicación redeployada en Vercel (si cambiaste variables)
- [ ] Cookies del navegador limpiadas
- [ ] Verificado en Network Tab que no hay errores CORS

---

## 🔗 Enlaces Útiles

- [Supabase Dashboard](https://app.supabase.com)
- [Documentación de Supabase Auth](https://supabase.com/docs/guides/auth)
- [Configuración de CORS en Supabase](https://supabase.com/docs/guides/auth/auth-helpers/nextjs)
- [Next.js CORS Headers](https://nextjs.org/docs/api-routes/request-helpers)

---

## 📝 Notas Importantes

1. **Los cambios en Supabase Dashboard son inmediatos** - No requieren redeploy
2. **Los cambios en variables de entorno requieren redeploy** - En Vercel, redeploy después de cambiar variables
3. **Las cookies deben limpiarse** - Después de cambiar configuración, limpiar cookies del navegador
4. **HTTPS es requerido en producción** - Las cookies `Secure` solo funcionan en HTTPS

---

**Última actualización**: Diciembre 2024

