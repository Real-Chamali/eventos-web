# 🚀 Configurar Variables de Entorno en Vercel (Producción)

## ⚠️ Problema Actual

La aplicación está en producción en: **https://eventos-web-lovat.vercel.app/**

El error 500 al cargar vendedores probablemente se debe a que falta `SUPABASE_SERVICE_ROLE_KEY` en las variables de entorno de Vercel.

## 🔧 Solución: Agregar Variables en Vercel

### Paso 1: Ir a Vercel Dashboard

1. Ve a: https://vercel.com/dashboard
2. Inicia sesión
3. Selecciona tu proyecto: **eventos-web-lovat**

### Paso 2: Agregar Variables de Entorno

1. Ve a **Settings** → **Environment Variables**
2. Verifica si existen estas variables:

#### ✅ Variables OBLIGATORIAS:

**1. `NEXT_PUBLIC_SUPABASE_URL`**
- Valor: `https://nmcrmgdnpzrrklpcgyzn.supabase.co` (o tu URL de Supabase)
- Cómo obtener: Supabase Dashboard → Settings → API → Project URL

**2. `NEXT_PUBLIC_SUPABASE_ANON_KEY`**
- Valor: Tu anon/public key de Supabase
- Cómo obtener: Supabase Dashboard → Settings → API → anon public key

**3. `SUPABASE_SERVICE_ROLE_KEY`** ⚠️ **ESTA ES LA CRÍTICA**
- Valor: Tu service_role key de Supabase (⚠️ SECRETO)
- Cómo obtener: Supabase Dashboard → Settings → API → service_role key
- **Esta es la que probablemente falta y causa el error 500**

### Paso 3: Agregar `SUPABASE_SERVICE_ROLE_KEY` (Si Falta)

1. Ve a **Supabase Dashboard** → Tu Proyecto
2. **Settings** → **API**
3. Busca la sección **"service_role"** key
4. Copia el valor completo (es largo, empieza con `eyJ...`)
5. En Vercel:
   - **Settings** → **Environment Variables**
   - Click en **"Add New"**
   - **Name**: `SUPABASE_SERVICE_ROLE_KEY`
   - **Value**: (pega el service_role key completo)
   - **Environment**: Marca ✅ **Production**, ✅ **Preview**, ✅ **Development**
   - Click **Save**

### Paso 4: Redesplegar

**IMPORTANTE**: Después de agregar/modificar variables, DEBES redesplegar:

1. Ve a **Deployments**
2. Click en los **3 puntos (...)** del último deployment
3. Selecciona **"Redeploy"**
4. Espera a que termine el despliegue

## 🔍 Verificar que Funciona

### 1. Verificar Variables Configuradas

En Vercel Dashboard → Settings → Environment Variables, deberías ver:

- ✅ `NEXT_PUBLIC_SUPABASE_URL`
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- ✅ `SUPABASE_SERVICE_ROLE_KEY` ⚠️ **Esta es la crítica**

### 2. Probar la API

Después de redesplegar, prueba:
```
https://eventos-web-lovat.vercel.app/api/admin/vendors
```

Deberías ver:
- ✅ Status 200 con `{"data": [...]}`
- ❌ O un error específico (no 500 genérico)

### 3. Verificar Logs

1. Ve a **Deployments** → Último deployment
2. **Functions** → Busca `/api/admin/vendors`
3. Revisa los logs para ver si hay errores

## 🐛 Si el Error 500 Persiste

### Ver el Error Específico

Abre en el navegador:
```
https://eventos-web-lovat.vercel.app/api/admin/vendors
```

Copia el JSON completo de la respuesta y compártelo. Debería incluir:
- `error`: Mensaje general
- `message`: Detalles del error

### Posibles Causas

1. **Service Role Key incorrecto**
   - Verifica que copiaste el key completo
   - No debe tener espacios ni saltos de línea
   - Debe empezar con `eyJ...`

2. **Variables no aplicadas a Production**
   - Verifica que marcas ✅ **Production** al agregar variables
   - Si ya existían, edítalas y marca Production

3. **No redesplegaste después de agregar variables**
   - Las variables solo se aplican en nuevos deployments
   - **DEBES redesplegar** después de agregar/modificar variables

4. **Usuario no es admin**
   - Verifica en Supabase que tu usuario tenga `role = 'admin'` en `profiles`

## 📋 Checklist Rápido

- [ ] `NEXT_PUBLIC_SUPABASE_URL` configurado en Vercel
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` configurado en Vercel
- [ ] `SUPABASE_SERVICE_ROLE_KEY` configurado en Vercel ⚠️ **CRÍTICO**
- [ ] Variables marcadas para **Production**
- [ ] Aplicación **redesplegada** después de agregar variables
- [ ] Probado `/api/admin/vendors` y devuelve 200 o error específico (no 500 genérico)

## 🔗 Enlaces Útiles

- **Vercel Dashboard**: https://vercel.com/dashboard
- **Supabase Dashboard**: https://app.supabase.com
- **Tu App**: https://eventos-web-lovat.vercel.app

---

**Próximo paso**: Agrega `SUPABASE_SERVICE_ROLE_KEY` en Vercel y redespliega. Luego prueba `/api/admin/vendors` y comparte el resultado.

