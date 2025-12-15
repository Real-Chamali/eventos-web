# 🔐 Configurar Secrets en GitHub - Guía Rápida

## Opción 1: Usando GitHub CLI (Recomendado)

### Paso 1: Instalar GitHub CLI

```bash
# En Ubuntu/Debian
curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
sudo chmod go+r /usr/share/keyrings/githubcli-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
sudo apt update && sudo apt install gh -y
```

### Paso 2: Autenticarse

```bash
gh auth login
```

Sigue las instrucciones en pantalla.

### Paso 3: Ejecutar el script

```bash
chmod +x configurar-secrets.sh
./configurar-secrets.sh
```

O ejecuta los comandos manualmente:

```bash
gh secret set NEXT_PUBLIC_SUPABASE_URL --repo Real-Chamali/eventos-web --body "https://nmcrmgdnpzrrklpcgyzn.supabase.co"

gh secret set NEXT_PUBLIC_SUPABASE_ANON_KEY --repo Real-Chamali/eventos-web --body "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5tY3JtZ2RucHpycmtscGNneXpuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUxNTE5NzIsImV4cCI6MjA4MDcyNzk3Mn0.fZ_1rRr6PK3HSzqZFtXOx6jpAxAhGPC9qz-cTxWr2PE"
```

---

## Opción 2: Desde la Web de GitHub (Más Fácil)

### Paso 1: Ir a Secrets

Abre en tu navegador:
**https://github.com/Real-Chamali/eventos-web/settings/secrets/actions**

### Paso 2: Agregar Primer Secret

1. Haz clic en **"New repository secret"**
2. **Name:** `NEXT_PUBLIC_SUPABASE_URL`
3. **Secret:** `https://nmcrmgdnpzrrklpcgyzn.supabase.co`
4. Haz clic en **"Add secret"**

### Paso 3: Agregar Segundo Secret

1. Haz clic en **"New repository secret"** otra vez
2. **Name:** `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. **Secret:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5tY3JtZ2RucHpycmtscGNneXpuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUxNTE5NzIsImV4cCI6MjA4MDcyNzk3Mn0.fZ_1rRr6PK3HSzqZFtXOx6jpAxAhGPC9qz-cTxWr2PE`
4. Haz clic en **"Add secret"**

### Paso 4: Verificar

Deberías ver dos secrets en la lista:
- ✅ `NEXT_PUBLIC_SUPABASE_URL`
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## ✅ Después de Configurar

1. El workflow usará estos secrets automáticamente
2. El build en CI/CD tendrá acceso a las variables
3. Los tests y el build deberían pasar correctamente

---

## 🚀 Probar

Haz un push a `main` o `develop` y verifica en la pestaña "Actions" que el workflow pase correctamente.

