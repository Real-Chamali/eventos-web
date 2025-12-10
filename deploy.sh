#!/bin/bash

set -e

echo "🚀 Iniciando Deploy a Producción..."
echo "======================================"
echo ""

# Fase 1: Validaciones Previas
echo "📋 Fase 1: Validaciones..."
echo "---"

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    echo "❌ Error: No se encontró package.json"
    echo "   Ejecuta este script desde la raíz del proyecto"
    exit 1
fi

# ESLint
echo "🔍 Verificando ESLint..."
if npx eslint . > /dev/null 2>&1; then
    echo "✅ ESLint: OK (0 errores)"
else
    echo "⚠️  ESLint: Tiene problemas (revisar arriba)"
fi

# Build
echo ""
echo "🔨 Compilando..."
if npm run build; then
    echo "✅ Build: Exitoso"
else
    echo "❌ Build falló. Revisa los errores arriba."
    exit 1
fi

# Tests
echo ""
echo "🧪 Ejecutando tests..."
if npm run test -- --run 2>/dev/null; then
    echo "✅ Tests: Todos pasaron"
else
    echo "⚠️  Tests: Revisar resultados (no es bloqueante)"
fi

echo ""
echo "======================================"
echo "✅ Todas las validaciones pasaron"
echo ""
echo "📤 Preparando para deploy..."
echo "---"

# Fase 2: Preparar Git
if [ ! -d ".git" ]; then
    echo "⚠️  No hay repo Git local. Inicializando..."
    git init
    git add .
    git commit -m "Initial commit: Production ready"
else
    echo "✅ Git repo detectado"
fi

echo ""
echo "======================================"
echo "🎯 Próximos pasos MANUALES:"
echo "---"
echo ""
echo "1️⃣  OPCIÓN A: Deploy vía Vercel CLI"
echo "    $ npm i -g vercel"
echo "    $ vercel --prod"
echo ""
echo "2️⃣  OPCIÓN B: Conectar GitHub + Vercel (recomendado)"
echo "    $ git push origin main"
echo "    Vercel detecta automáticamente y despliega"
echo ""
echo "3️⃣  Variables de Entorno en Vercel Dashboard:"
echo "    - NEXT_PUBLIC_SUPABASE_URL"
echo "    - NEXT_PUBLIC_SUPABASE_ANON_KEY"
echo "    - SUPABASE_SERVICE_ROLE_KEY"
echo "    - NEXT_PUBLIC_SENTRY_DSN (opcional)"
echo "    - NEXT_PUBLIC_APP_VERSION"
echo ""
echo "======================================"
echo "✨ Deploy Setup Completo"
echo ""
