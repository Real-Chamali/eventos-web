# 🔐 Instrucciones Finales: Configurar Secrets en GitHub

## ✅ Workflow Corregido

El workflow ya está corregido y usa los nombres correctos de secrets:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 🚀 Configurar Secrets en GitHub

### Paso 1: Ir a Secrets

1. Ve a: https://github.com/Real-Chamali/eventos-web/settings/secrets/actions
2. Haz clic en **"New repository secret"**

### Paso 2: Agregar Primer Secret

**Nombre:**
```
NEXT_PUBLIC_SUPABASE_URL
```

**Valor:**
```
https://nmcrmgdnpzrrklpcgyzn.supabase.co
```

Haz clic en **"Add secret"**

### Paso 3: Agregar Segundo Secret

Haz clic en **"New repository secret"** otra vez

**Nombre:**
```
NEXT_PUBLIC_SUPABASE_ANON_KEY
```

**Valor:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5tY3JtZ2RucHpycmtscGNneXpuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUxNTE5NzIsImV4cCI6MjA4MDcyNzk3Mn0.fZ_1rRr6PK3HSzqZFtXOx6jpAxAhGPC9qz-cTxWr2PE
```

Haz clic en **"Add secret"**

### Paso 4: Verificar

Deberías ver dos secrets en la lista:
- ✅ `NEXT_PUBLIC_SUPABASE_URL`
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## ✅ Después de Configurar

1. El workflow usará estos secrets automáticamente
2. El build en CI/CD tendrá acceso a las variables
3. Los tests y el build deberían pasar correctamente

## 🔧 Alternativa: Usar GitHub CLI

Si tienes GitHub CLI instalado:

```bash
gh secret set NEXT_PUBLIC_SUPABASE_URL --repo Real-Chamali/eventos-web --body "https://nmcrmgdnpzrrklpcgyzn.supabase.co"

gh secret set NEXT_PUBLIC_SUPABASE_ANON_KEY --repo Real-Chamali/eventos-web --body "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5tY3JtZ2RucHpycmtscGNneXpuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUxNTE5NzIsImV4cCI6MjA4MDcyNzk3Mn0.fZ_1rRr6PK3HSzqZFtXOx6jpAxAhGPC9qz-cTxWr2PE"
```

## 📋 Resumen

- ✅ Workflow corregido localmente
- ⚠️ **Necesitas:** Agregar secrets en GitHub
- ✅ Después: CI/CD funcionará correctamente

