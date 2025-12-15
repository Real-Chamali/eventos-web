# 🔧 Configurar Secrets de GitHub Automáticamente

## ⚠️ IMPORTANTE: Seguridad

**NO** debemos hardcodear las credenciales directamente en el workflow. Los secrets de GitHub son la forma segura y correcta.

## ✅ Solución: Configurar Secrets en GitHub

### Opción 1: Usando GitHub CLI (Recomendado)

Si tienes GitHub CLI instalado:

```bash
# Configurar el primer secret
gh secret set NEXT_PUBLIC_SUPABASE_URL --repo Real-Chamali/eventos-web --body "https://nmcrmgdnpzrrklpcgyzn.supabase.co"

# Configurar el segundo secret
gh secret set NEXT_PUBLIC_SUPABASE_ANON_KEY --repo Real-Chamali/eventos-web --body "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5tY3JtZ2RucHpycmtscGNneXpuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUxNTE5NzIsImV4cCI6MjA4MDcyNzk3Mn0.fZ_1rRr6PK3HSzqZFtXOx6jpAxAhGPC9qz-cTxWr2PE"
```

### Opción 2: Manual desde GitHub Web

1. Ve a: https://github.com/Real-Chamali/eventos-web/settings/secrets/actions
2. Haz clic en "New repository secret"
3. Agrega:

**Secret 1:**
- Nombre: `NEXT_PUBLIC_SUPABASE_URL`
- Valor: `https://nmcrmgdnpzrrklpcgyzn.supabase.co`

**Secret 2:**
- Nombre: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Valor: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5tY3JtZ2RucHpycmtscGNneXpuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUxNTE5NzIsImV4cCI6MjA4MDcyNzk3Mn0.fZ_1rRr6PK3HSzqZFtXOx6jpAxAhGPC9qz-cTxWr2PE`

## ✅ Verificación

Después de configurar, el workflow debería funcionar correctamente.

