# 🔐 Configurar Secrets de GitHub para CI/CD

## Problema
El build falla porque faltan las variables de entorno de Supabase en CI/CD.

## ✅ Solución: Agregar Secrets en GitHub

### Paso 1: Ir a la configuración de Secrets

1. Ve a tu repositorio: https://github.com/Real-Chamali/eventos-web
2. Haz clic en **Settings** (Configuración)
3. En el menú lateral izquierdo, haz clic en **Secrets and variables** → **Actions**
4. Haz clic en **New repository secret** (Nuevo secreto del repositorio)

### Paso 2: Agregar el primer secret

**Nombre del secret:**
```
NEXT_PUBLIC_SUPABASE_URL
```

**Valor:**
```
https://nmcrmgdnpzrrklpcgyzn.supabase.co
```

(O tu URL de Supabase si es diferente)

Haz clic en **Add secret**

### Paso 3: Agregar el segundo secret

Haz clic en **New repository secret** otra vez

**Nombre del secret:**
```
NEXT_PUBLIC_SUPABASE_ANON_KEY
```

**Valor:**
```
sb_publishable_o8XYROf2taOIM55PstVQIw_Vpg2D9Wy
```

(O tu clave anónima de Supabase si es diferente)

Haz clic en **Add secret**

### Paso 4: Verificar

Deberías ver dos secrets en la lista:
- ✅ `NEXT_PUBLIC_SUPABASE_URL`
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 📋 Obtener tus credenciales de Supabase

Si no tienes las credenciales:

1. Ve a: https://app.supabase.com
2. Selecciona tu proyecto
3. Ve a **Settings** → **API**
4. Copia:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## ✅ Resultado

Después de configurar los secrets:
- ✅ El build en CI/CD tendrá acceso a las variables de entorno
- ✅ Next.js podrá prerender las páginas correctamente
- ✅ El build debería completarse sin errores

## 🔒 Seguridad

- ✅ Los secrets están encriptados en GitHub
- ✅ Solo son visibles durante la ejecución del workflow
- ✅ No se muestran en los logs (a menos que los imprimas explícitamente)
- ✅ Solo usuarios con permisos pueden ver/editar los secrets

## 📝 Nota

El workflow ya está configurado para usar estos secrets. Solo necesitas agregarlos en GitHub.

