# 🔧 Solución: No Puedo Entrar al Panel

## 🔍 Diagnóstico Rápido

### 1. Verificar Variables de Entorno en Vercel

Las variables de entorno **DEBEN** estar configuradas en Vercel Dashboard:

1. Ve a [Vercel Dashboard](https://vercel.com/dashboard)
2. Selecciona tu proyecto `eventos-web`
3. Ve a **Settings** → **Environment Variables**
4. Verifica que existan:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (opcional pero recomendado)

### 2. Endpoint de Debug

He creado un endpoint de debug para verificar el estado:

```bash
# Habilitar debug temporalmente
# En Vercel Dashboard → Environment Variables, agrega:
ENABLE_DEBUG_ENDPOINTS=true

# Luego accede a:
https://tu-dominio.vercel.app/api/debug/auth
```

Esto te mostrará:
- ✅ Si las variables de entorno están configuradas
- ✅ Si hay un usuario autenticado
- ✅ Estado de las cookies
- ✅ Errores específicos

### 3. Verificar en el Navegador

1. **Abre DevTools** (F12)
2. **Ve a Console** - Busca errores
3. **Ve a Network** - Verifica peticiones fallidas
4. **Ve a Application** → **Cookies** - Verifica que haya cookies de Supabase

### 4. Problemas Comunes

#### ❌ Error: "Missing Supabase environment variables"

**Solución**: Configurar variables en Vercel Dashboard

#### ❌ Redirección infinita a /login

**Causa**: Las cookies no se están estableciendo correctamente

**Solución**:
1. Limpia cookies del navegador
2. Intenta en modo incógnito
3. Verifica que estés en HTTPS (Vercel lo proporciona automáticamente)

#### ❌ Error 500 en el servidor

**Causa**: Variables de entorno faltantes o incorrectas

**Solución**: Verificar variables en Vercel Dashboard

#### ❌ "Unauthorized" al intentar acceder

**Causa**: No hay sesión activa

**Solución**: 
1. Ve a `/login`
2. Inicia sesión
3. Verifica que las cookies se establezcan

---

## 🛠️ Pasos para Solucionar

### Paso 1: Verificar Variables de Entorno

```bash
# En Vercel Dashboard, verifica que existan:
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc... (opcional)
```

### Paso 2: Habilitar Debug Temporalmente

1. En Vercel Dashboard → Environment Variables
2. Agrega: `ENABLE_DEBUG_ENDPOINTS=true`
3. Guarda y redeploy
4. Accede a: `https://tu-dominio.vercel.app/api/debug/auth`
5. Revisa la respuesta JSON

### Paso 3: Limpiar y Reintentar

1. **Limpia cookies del navegador**
   - Chrome: DevTools → Application → Cookies → Clear All
   - O usa modo incógnito

2. **Intenta acceder de nuevo**
   - Ve a: `https://tu-dominio.vercel.app/login`
   - Inicia sesión
   - Verifica que redirija correctamente

### Paso 4: Verificar Logs

```bash
# Ver logs en tiempo real
vercel logs eventos-web-lovat.vercel.app
```

Busca errores relacionados con:
- "Missing Supabase environment variables"
- "Error getting user"
- "Unauthorized"

---

## 📝 Checklist de Verificación

- [ ] Variables de entorno configuradas en Vercel
- [ ] Variables tienen valores correctos (no vacíos)
- [ ] Cookies del navegador limpiadas
- [ ] Probado en modo incógnito
- [ ] Endpoint de debug accesible (si está habilitado)
- [ ] No hay errores en la consola del navegador
- [ ] No hay errores en los logs de Vercel

---

## 🚨 Si Nada Funciona

1. **Verifica las variables de entorno manualmente**:
   ```bash
   # En Vercel Dashboard, copia los valores y verifica que sean correctos
   ```

2. **Redeploy la aplicación**:
   ```bash
   vercel --prod
   ```

3. **Contacta soporte** con:
   - URL de la aplicación
   - Mensaje de error exacto
   - Screenshot de la consola del navegador
   - Resultado del endpoint de debug (si está habilitado)

---

## 🔗 Enlaces Útiles

- [Vercel Dashboard](https://vercel.com/dashboard)
- [Supabase Dashboard](https://supabase.com/dashboard)
- [Documentación de Supabase Auth](https://supabase.com/docs/guides/auth)

