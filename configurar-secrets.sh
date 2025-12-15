#!/bin/bash

# Script para configurar secrets de GitHub usando GitHub CLI
# Requiere: gh CLI instalado y autenticado

set -e

echo "🔐 Configurando secrets de GitHub para CI/CD"
echo ""

# Verificar que gh está instalado
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI (gh) no está instalado."
    echo ""
    echo "Para instalar:"
    echo "  curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg"
    echo "  sudo chmod go+r /usr/share/keyrings/githubcli-archive-keyring.gpg"
    echo "  echo 'deb [arch=\$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main' | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null"
    echo "  sudo apt update && sudo apt install gh -y"
    echo ""
    echo "Luego autentica:"
    echo "  gh auth login"
    echo ""
    exit 1
fi

# Verificar autenticación
if ! gh auth status &> /dev/null; then
    echo "❌ No estás autenticado con GitHub CLI."
    echo ""
    echo "Ejecuta: gh auth login"
    echo ""
    exit 1
fi

echo "✅ GitHub CLI está instalado y autenticado"
echo ""

# Valores de los secrets
SUPABASE_URL="https://nmcrmgdnpzrrklpcgyzn.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5tY3JtZ2RucHpycmtscGNneXpuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUxNTE5NzIsImV4cCI6MjA4MDcyNzk3Mn0.fZ_1rRr6PK3HSzqZFtXOx6jpAxAhGPC9qz-cTxWr2PE"
REPO="Real-Chamali/eventos-web"

echo "📝 Configurando secrets..."
echo ""

# Configurar NEXT_PUBLIC_SUPABASE_URL
echo "1️⃣ Configurando NEXT_PUBLIC_SUPABASE_URL..."
if gh secret set NEXT_PUBLIC_SUPABASE_URL --repo "$REPO" --body "$SUPABASE_URL" 2>&1; then
    echo "   ✅ NEXT_PUBLIC_SUPABASE_URL configurado"
else
    echo "   ❌ Error al configurar NEXT_PUBLIC_SUPABASE_URL"
    exit 1
fi

echo ""

# Configurar NEXT_PUBLIC_SUPABASE_ANON_KEY
echo "2️⃣ Configurando NEXT_PUBLIC_SUPABASE_ANON_KEY..."
if gh secret set NEXT_PUBLIC_SUPABASE_ANON_KEY --repo "$REPO" --body "$SUPABASE_ANON_KEY" 2>&1; then
    echo "   ✅ NEXT_PUBLIC_SUPABASE_ANON_KEY configurado"
else
    echo "   ❌ Error al configurar NEXT_PUBLIC_SUPABASE_ANON_KEY"
    exit 1
fi

echo ""
echo "✅ ¡Secrets configurados correctamente!"
echo ""
echo "📋 Verificación:"
gh secret list --repo "$REPO" | grep -E "NEXT_PUBLIC_SUPABASE"
echo ""
echo "🚀 El próximo push o PR activará el workflow con estos secrets."

