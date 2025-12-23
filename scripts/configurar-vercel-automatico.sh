#!/bin/bash

# Script para configurar variables de Vercel automáticamente desde .env.local
# Si no existe .env.local, pedirá los valores interactivamente

set -e

echo "🔐 Configuración Automática de Variables en Vercel"
echo "===================================================="
echo ""

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Verificar Vercel CLI
if ! command -v vercel &> /dev/null; then
    echo -e "${RED}❌ Vercel CLI no está instalado${NC}"
    echo "Instala con: npm i -g vercel"
    exit 1
fi

if ! vercel whoami &> /dev/null; then
    echo -e "${YELLOW}⚠️  No estás autenticado${NC}"
    echo "Ejecuta: vercel login"
    exit 1
fi

echo -e "${GREEN}✅ Vercel CLI listo${NC}"
echo ""

# Función para agregar variable
add_var() {
    local key=$1
    local value=$2
    local envs=${3:-production,preview,development}
    
    if [ -z "$value" ]; then
        echo -e "${YELLOW}⚠️  ${key} está vacío, omitiendo...${NC}"
        return
    fi
    
    echo -e "${BLUE}📝 Agregando: ${key}${NC}"
    echo "$value" | vercel env add "$key" "$envs" --yes > /dev/null 2>&1
    echo -e "${GREEN}✅ ${key} configurado${NC}"
}

# Cargar .env.local si existe
if [ -f .env.local ]; then
    echo -e "${BLUE}📄 Cargando variables desde .env.local...${NC}"
    set -a
    source .env.local
    set +a
    echo -e "${GREEN}✅ Variables cargadas${NC}"
    echo ""
fi

# Variables públicas
echo "📋 Configurando Variables Públicas..."
add_var "NEXT_PUBLIC_SENTRY_DSN" "${NEXT_PUBLIC_SENTRY_DSN:-https://66e295a3c88588a96d03742182952e8b@o4510508203704320.ingest.us.sentry.io/4510508220088320}"
add_var "NEXT_PUBLIC_APP_VERSION" "${NEXT_PUBLIC_APP_VERSION:-1.0.0}"
add_var "NEXT_PUBLIC_APP_URL" "${NEXT_PUBLIC_APP_URL:-https://eventos-web-lovat.vercel.app}"

# Variables privadas
echo ""
echo "🔒 Configurando Variables Privadas..."

# Si no están en .env.local, pedirlas
if [ -z "$SUPABASE_URL" ]; then
    read -p "SUPABASE_URL: " SUPABASE_URL
fi
add_var "SUPABASE_URL" "$SUPABASE_URL"

if [ -z "$SUPABASE_ANON_KEY" ]; then
    read -p "SUPABASE_ANON_KEY: " SUPABASE_ANON_KEY
fi
add_var "SUPABASE_ANON_KEY" "$SUPABASE_ANON_KEY"

if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    read -p "SUPABASE_SERVICE_ROLE_KEY: " SUPABASE_SERVICE_ROLE_KEY
fi
add_var "SUPABASE_SERVICE_ROLE_KEY" "$SUPABASE_SERVICE_ROLE_KEY"

if [ -z "$ENCRYPTION_KEY" ]; then
    if command -v openssl &> /dev/null; then
        ENCRYPTION_KEY=$(openssl rand -hex 32)
        echo -e "${GREEN}✅ ENCRYPTION_KEY generada automáticamente${NC}"
    else
        read -p "ENCRYPTION_KEY (genera con: openssl rand -hex 32): " ENCRYPTION_KEY
    fi
fi
add_var "ENCRYPTION_KEY" "$ENCRYPTION_KEY"

# Opcionales
add_var "RESEND_API_KEY" "$RESEND_API_KEY"
add_var "UPSTASH_REDIS_REST_URL" "$UPSTASH_REDIS_REST_URL"
add_var "UPSTASH_REDIS_REST_TOKEN" "$UPSTASH_REDIS_REST_TOKEN"
add_var "ALLOWED_ORIGINS" "${ALLOWED_ORIGINS:-https://eventos-web-lovat.vercel.app,https://eventos-web.vercel.app}"

echo ""
echo -e "${GREEN}✅ Configuración completada${NC}"
echo ""
echo "🚀 Redeploy con: vercel --prod"

