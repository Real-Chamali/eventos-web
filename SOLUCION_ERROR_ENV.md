# 🔧 Solución: Error de Variables de Entorno

## ❌ Error
```
Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set
```

## ✅ Solución Rápida

### Paso 1: Verificar que el archivo existe
```bash
ls -la .env.local
```

### Paso 2: Verificar el contenido
```bash
cat .env.local | grep NEXT_PUBLIC_SUPABASE
```

Deberías ver:
```
NEXT_PUBLIC_SUPABASE_URL=https://nmcrmgdnpzrrklpcgyzn.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_o8XYROf2taOIM55PstVQIw_Vpg2D9Wy
```

### Paso 3: Limpiar caché y reiniciar
```bash
# 1. Detén el servidor si está corriendo (Ctrl+C)

# 2. Limpia la caché de Next.js
rm -rf .next

# 3. Reinicia el servidor
npm run dev
```

## 🔍 Diagnóstico Automático

Ejecuta el script de diagnóstico:
```bash
./scripts/fix-env-issue.sh
```

Este script:
- ✅ Verifica que `.env.local` existe
- ✅ Verifica que las variables están presentes
- ✅ Detecta procesos de Next.js que necesitan reiniciarse
- ✅ Verifica el formato del archivo

## ⚠️ Causas Comunes

### 1. Servidor no reiniciado
**Problema:** Next.js carga las variables solo al iniciar. Si modificaste `.env.local` después de iniciar el servidor, necesitas reiniciarlo.

**Solución:**
```bash
# Detén el servidor (Ctrl+C)
# Luego reinicia:
npm run dev
```

### 2. Archivo en ubicación incorrecta
**Problema:** `.env.local` debe estar en la raíz del proyecto (mismo nivel que `package.json`).

**Verificar:**
```bash
pwd  # Debería mostrar: .../eventos-web
ls -la .env.local  # Debería existir
```

### 3. Formato incorrecto
**Problema:** Espacios alrededor del `=` o comentarios mal formateados.

**Formato correcto:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_aqui
```

**Formato incorrecto:**
```env
NEXT_PUBLIC_SUPABASE_URL = https://tu-proyecto.supabase.co  # ❌ Espacios
NEXT_PUBLIC_SUPABASE_ANON_KEY= tu_clave_aqui  # ❌ Espacio después del =
```

### 4. Caché de Next.js
**Problema:** A veces Next.js cachea las variables de entorno.

**Solución:**
```bash
rm -rf .next
npm run dev
```

## 🧪 Verificación

Después de reiniciar, verifica que funciona:

1. **En el navegador:**
   - Abre la consola (F12)
   - No deberías ver el error

2. **En el servidor:**
   - No deberías ver errores en la terminal

3. **Con el script:**
   ```bash
   ./scripts/verify-all-env.sh
   ```

## 📝 Notas Importantes

- ⚠️ **Las variables de entorno solo se cargan al iniciar el servidor**
- ⚠️ **Si modificas `.env.local`, siempre reinicia el servidor**
- ✅ **Las variables que comienzan con `NEXT_PUBLIC_` están disponibles en el cliente**
- ✅ **No subas `.env.local` a Git (ya está en `.gitignore`)**

## 🆘 Si el Problema Persiste

1. **Verifica que las variables son reales (no de ejemplo):**
   ```bash
   cat .env.local | grep -E "tu-proyecto|tu_clave|ejemplo"
   ```
   Si encuentras estos valores, reemplázalos con tus credenciales reales.

2. **Verifica la ubicación del archivo:**
   ```bash
   pwd
   ls -la .env.local
   ```

3. **Limpia todo y reinicia:**
   ```bash
   rm -rf .next node_modules/.cache
   npm run dev
   ```

4. **Verifica que Next.js está leyendo el archivo:**
   ```bash
   node -e "require('dotenv').config({ path: '.env.local' }); console.log('URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'OK' : 'MISSING');"
   ```

---

**Última actualización:** $(date)

