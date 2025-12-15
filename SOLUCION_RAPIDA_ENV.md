# ✅ Solución Rápida: Variables de Entorno

## 📋 Estado Actual

✅ **Archivo `.env.local` existe y está configurado correctamente:**
- `NEXT_PUBLIC_SUPABASE_URL=https://nmcrmgdnpzrrklpcgyzn.supabase.co` ✅
- `NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...` ✅

## 🚀 Pasos para Resolver

### Paso 1: Verificar que el servidor esté corriendo

```bash
# Verificar procesos de Next.js
ps aux | grep "next dev"
```

Si **NO** hay procesos corriendo, continúa al Paso 2.

### Paso 2: Iniciar el servidor de desarrollo

```bash
# Desde la raíz del proyecto
npm run dev
```

### Paso 3: Verificar que funciona

Abre tu navegador en: http://localhost:3000

## ⚠️ Si el Error Persiste

### Opción A: Limpiar caché y reiniciar

```bash
# 1. Detén el servidor (Ctrl+C si está corriendo)

# 2. Limpia la caché de Next.js
rm -rf .next

# 3. Reinicia el servidor
npm run dev
```

### Opción B: Verificar formato del archivo

Asegúrate de que `.env.local` tenga este formato exacto (sin espacios alrededor del `=`):

```env
NEXT_PUBLIC_SUPABASE_URL=https://nmcrmgdnpzrrklpcgyzn.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5tY3JtZ2RucHpycmtscGNneXpuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUxNTE5NzIsImV4cCI6MjA4MDcyNzk3Mn0.fZ_1rRr6PK3HSzqZFtXOx6jpAxAhGPC9qz-cTxWr2PE
```

## 📝 Nota Importante

- ✅ Las variables están correctas en `.env.local`
- ✅ El archivo existe en la raíz del proyecto
- ⚠️ **El servidor necesita estar corriendo** para que Next.js cargue las variables

## 🔍 Verificación Rápida

Ejecuta este comando para verificar todo:

```bash
./scripts/verify-all-env.sh
```

O manualmente:

```bash
# Verificar archivo
test -f .env.local && echo "✅ .env.local existe" || echo "❌ .env.local NO existe"

# Verificar variables
grep -q "NEXT_PUBLIC_SUPABASE_URL" .env.local && echo "✅ URL configurada" || echo "❌ URL faltante"
grep -q "NEXT_PUBLIC_SUPABASE_ANON_KEY" .env.local && echo "✅ Key configurada" || echo "❌ Key faltante"
```

