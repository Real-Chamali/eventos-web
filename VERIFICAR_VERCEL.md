# 🔧 Verificar Configuración en Vercel

## 📋 Variables de Entorno Requeridas en Vercel

Para que la aplicación funcione correctamente en producción, necesitas estas variables de entorno en Vercel:

### Variables Obligatorias:

1. **`NEXT_PUBLIC_SUPABASE_URL`**
   - Valor: Tu URL de Supabase (ej: `https://xxxxx.supabase.co`)
   - Dónde obtenerlo: Supabase Dashboard → Settings → API → Project URL

2. **`NEXT_PUBLIC_SUPABASE_ANON_KEY`**
   - Valor: Tu Anon/Public Key de Supabase
   - Dónde obtenerlo: Supabase Dashboard → Settings → API → anon public key

3. **`SUPABASE_SERVICE_ROLE_KEY`** ⚠️ **CRÍTICO PARA ADMIN**
   - Valor: Tu Service Role Key de Supabase (⚠️ SECRETO)
   - Dónde obtenerlo: Supabase Dashboard → Settings → API → service_role key
   - **Este es el que probablemente falta y causa el error 500**

### Variables Opcionales (pero recomendadas):

4. **`NEXT_PUBLIC_APP_URL`**
   - Valor: `https://eventos-web-lovat.vercel.app`
   - Para URLs absolutas y CORS

5. **`ALLOWED_ORIGINS`**
   - Valor: `https://eventos-web-lovat.vercel.app,https://eventos-web-lovat.vercel.app`
   - Para CORS

## 🔍 Cómo Verificar en Vercel

### Paso 1: Ir a Vercel Dashboard

1. Ve a https://vercel.com
2. Inicia sesión
3. Selecciona tu proyecto `eventos-web-lovat`

### Paso 2: Verificar Variables de Entorno

1. Ve a **Settings** → **Environment Variables**
2. Verifica que existan todas las variables listadas arriba
3. **Especialmente verifica `SUPABASE_SERVICE_ROLE_KEY`**

### Paso 3: Si Falta `SUPABASE_SERVICE_ROLE_KEY`

1. Ve a **Supabase Dashboard** → Tu Proyecto
2. **Settings** → **API**
3. Busca **"service_role"** key (⚠️ es secreto, no lo compartas)
4. Copia el valor completo
5. En Vercel:
   - **Settings** → **Environment Variables**
   - Click en **"Add New"**
   - Name: `SUPABASE_SERVICE_ROLE_KEY`
   - Value: (pega el service_role key)
   - Environment: Selecciona **Production**, **Preview**, y **Development**
   - Click **Save**
6. **Redespliega** la aplicación:
   - Ve a **Deployments**
   - Click en los 3 puntos (...) del último deployment
   - **Redeploy**

## 🐛 Diagnóstico del Error 500

### Si el error 500 persiste después de agregar las variables:

1. **Verifica los logs en Vercel**:
   - Ve a **Deployments** → Último deployment
   - Click en **Functions**
   - Busca `/api/admin/vendors`
   - Revisa los logs para ver el error específico

2. **Prueba la API directamente**:
   - Abre: `https://eventos-web-lovat.vercel.app/api/admin/vendors`
   - Revisa el JSON de respuesta para ver el mensaje de error

3. **Verifica que el usuario sea admin**:
   - En Supabase Dashboard → Table Editor → `profiles`
   - Verifica que tu usuario tenga `role = 'admin'`

## ✅ Checklist Rápido

- [ ] `NEXT_PUBLIC_SUPABASE_URL` configurado en Vercel
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` configurado en Vercel
- [ ] `SUPABASE_SERVICE_ROLE_KEY` configurado en Vercel ⚠️ **CRÍTICO**
- [ ] Variables aplicadas a Production, Preview y Development
- [ ] Aplicación redesplegada después de agregar variables
- [ ] Usuario tiene `role = 'admin'` en tabla `profiles`

## 🔧 Comando para Verificar Variables (Local)

Si quieres verificar qué variables tienes localmente (para comparar):

```bash
# Ver variables de entorno (sin mostrar valores)
cat .env.local | grep -E "SUPABASE|NEXT_PUBLIC" | cut -d'=' -f1
```

---

**Nota**: Después de agregar `SUPABASE_SERVICE_ROLE_KEY` en Vercel, **DEBES redesplegar** para que los cambios surtan efecto.

