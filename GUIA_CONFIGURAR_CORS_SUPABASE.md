# 🔧 Guía: Configurar CORS en Supabase

**Problema**: Error CORS al acceder a Supabase desde el navegador

```
Solicitud de origen cruzado bloqueada: La política de mismo origen no permite 
la lectura de recursos remotos en https://nmcrmgdnpzrrklpcgyzn.supabase.co/auth/v1/user.
```

---

## ✅ Solución 1: Configurar Dominios Permitidos en Supabase Dashboard

### Pasos:

1. **Ir a Supabase Dashboard**
   - URL: https://app.supabase.com
   - Seleccionar tu proyecto

2. **Ir a Authentication → URL Configuration**
   - En el menú lateral: `Authentication` → `URL Configuration`

3. **Agregar Dominios Permitidos**
   - **Site URL**: 
     - Desarrollo: `http://localhost:3000`
     - Producción: `https://tu-dominio.vercel.app` o tu dominio
   
   - **Redirect URLs**: Agregar todas las URLs donde se redirige después de login:
     ```
     http://localhost:3000/**
     https://tu-dominio.vercel.app/**
     https://tu-dominio.com/**
     ```

4. **Guardar Cambios**
   - Clic en "Save"

---

## ✅ Solución 2: Verificar Variables de Entorno

### En Vercel (Producción):

1. **Ir a Vercel Dashboard**
   - Seleccionar tu proyecto
   - Ir a `Settings` → `Environment Variables`

2. **Verificar Variables**:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://nmcrmgdnpzrrklpcgyzn.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_anon_aqui
   ```

3. **Redeploy después de cambiar variables**
   - Ir a `Deployments`
   - Clic en "Redeploy" en el último deployment

### En Desarrollo Local:

1. **Verificar archivo `.env.local`**:
   ```bash
   cat .env.local
   ```

2. **Debe contener**:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://nmcrmgdnpzrrklpcgyzn.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_anon_aqui
   ```

3. **Reiniciar servidor de desarrollo**:
   ```bash
   # Detener servidor (Ctrl+C)
   npm run dev
   ```

---

## ✅ Solución 3: Configurar CORS en Supabase (Avanzado)

Si el problema persiste, puedes configurar CORS directamente en Supabase:

### Opción A: Usar Supabase CLI

```bash
# Instalar Supabase CLI si no lo tienes
npm install -g supabase

# Login
supabase login

# Link tu proyecto
supabase link --project-ref nmcrmgdnpzrrklpcgyzn

# Configurar CORS (esto requiere acceso a configuración avanzada)
```

### Opción B: Contactar Soporte de Supabase

Si necesitas configuración CORS personalizada, contacta a soporte de Supabase.

---

## ✅ Solución 4: Verificar Configuración del Cliente

El código ya está configurado correctamente en:
- `utils/supabase/client.ts` - Cliente del navegador
- `utils/supabase/server.ts` - Cliente del servidor
- `utils/supabase/middleware.ts` - Middleware

**No necesitas cambiar nada aquí**, solo verificar que las variables de entorno estén correctas.

---

## 🔍 Verificación

### 1. Verificar en el Navegador:

Abre la consola del navegador (F12) y ejecuta:

```javascript
// Verificar que las variables estén disponibles
console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
console.log('Supabase Key:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20) + '...')
```

### 2. Verificar en Network Tab:

1. Abre DevTools → Network
2. Intenta iniciar sesión
3. Busca la solicitud a `/auth/v1/user`
4. Verifica los headers:
   - `Access-Control-Allow-Origin` debe incluir tu dominio
   - `Access-Control-Allow-Credentials` debe ser `true`

### 3. Verificar Cookies:

En DevTools → Application → Cookies:
- Debe haber cookies de Supabase (ej: `sb-*-auth-token`)
- Las cookies deben tener `SameSite=Lax` o `SameSite=None; Secure`

---

## 🚨 Problemas Comunes

### Problema 1: "CORS error" en desarrollo local

**Solución**: 
- Verificar que `Site URL` en Supabase incluya `http://localhost:3000`
- Limpiar cookies del navegador
- Reiniciar servidor de desarrollo

### Problema 2: "CORS error" en producción

**Solución**:
- Verificar que `Site URL` en Supabase incluya tu dominio de producción
- Verificar que las variables de entorno en Vercel estén correctas
- Redeploy la aplicación después de cambiar variables

### Problema 3: Cookies no se guardan

**Solución**:
- Verificar que el dominio en Supabase esté correcto
- Verificar que `Secure` esté habilitado solo en HTTPS
- Verificar que `SameSite` sea `Lax` o `None` (con `Secure`)

---

## 📋 Checklist

- [ ] Site URL configurado en Supabase Dashboard
- [ ] Redirect URLs configuradas en Supabase Dashboard
- [ ] Variables de entorno correctas en Vercel
- [ ] Variables de entorno correctas en `.env.local` (desarrollo)
- [ ] Servidor de desarrollo reiniciado (si cambiaste variables)
- [ ] Aplicación redeployada en Vercel (si cambiaste variables)
- [ ] Cookies del navegador limpiadas
- [ ] Verificado en Network Tab que los headers CORS estén presentes

---

## 🔗 Enlaces Útiles

- [Supabase Dashboard](https://app.supabase.com)
- [Documentación de Supabase Auth](https://supabase.com/docs/guides/auth)
- [Configuración de CORS en Supabase](https://supabase.com/docs/guides/auth/auth-helpers/nextjs)

---

**Nota**: Los cambios en Supabase Dashboard son inmediatos. Los cambios en variables de entorno requieren redeploy.

