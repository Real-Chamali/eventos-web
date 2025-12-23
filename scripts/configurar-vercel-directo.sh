#!/bin/bash

# Script para configurar variables de Vercel directamente usando CLI
# Lee desde .env.local y configura automáticamente

set -e

echo "🔐 Configuración de Variables en Vercel (CLI Directo)"
echo "======================================================="
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
    exit 1
fi

if ! vercel whoami &> /dev/null; then
    echo -e "${RED}❌ No estás autenticado. Ejecuta: vercel login${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Vercel CLI listo${NC}"
echo ""

# Función para leer valor de .env.local
get_env_value() {
    local key=$1
    if [ -f .env.local ]; then
        grep "^${key}=" .env.local 2>/dev/null | cut -d '=' -f2- | sed -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//" | head -1
    fi
}

# Función para agregar variable (sin input interactivo)
add_var() {
    local key=$1
    local value=$2
    local envs=${3:-production,preview,development}
    
    if [ -z "$value" ]; then
        return 0
    fi
    
    echo -e "${BLUE}📝 ${key}${NC}"
    
    # Usar printf para pasar el valor desde stdin
    # Para múltiples ambientes, necesitamos agregar a cada uno
    IFS=',' read -ra ENVS_ARRAY <<< "$envs"
    for env in "${ENVS_ARRAY[@]}"; do
        printf '%s' "$value" | vercel env add "$key" "$env" 2>&1 | grep -v "Enter\|Retrieving\|Vercel CLI" || true
    done
    
    if [ ${PIPESTATUS[0]} -eq 0 ] || [ $? -eq 0 ]; then
        echo -e "${GREEN}   ✅ Configurado${NC}"
    else
        echo -e "${YELLOW}   ⚠️  Puede que ya exista${NC}"
    fi
}

# Variables públicas
echo "📋 Variables Públicas..."

SENTRY_DSN=$(get_env_value "NEXT_PUBLIC_SENTRY_DSN")
SENTRY_DSN=${SENTRY_DSN:-"https://66e295a3c88588a96d03742182952e8b@o4510508203704320.ingest.us.sentry.io/4510508220088320"}
add_var "NEXT_PUBLIC_SENTRY_DSN" "$SENTRY_DSN"

APP_VERSION=$(get_env_value "NEXT_PUBLIC_APP_VERSION")
APP_VERSION=${APP_VERSION:-"1.0.0"}
add_var "NEXT_PUBLIC_APP_VERSION" "$APP_VERSION"

APP_URL=$(get_env_value "NEXT_PUBLIC_APP_URL")
APP_URL=${APP_URL:-"https://eventos-web-lovat.vercel.app"}
add_var "NEXT_PUBLIC_APP_URL" "$APP_URL"

# Variables privadas
echo ""
echo "🔒 Variables Privadas..."

SUPABASE_URL=$(get_env_value "SUPABASE_URL")
if [ -z "$SUPABASE_URL" ]; then
    SUPABASE_URL=$(get_env_value "NEXT_PUBLIC_SUPABASE_URL")
fi
if [ ! -z "$SUPABASE_URL" ]; then
    add_var "SUPABASE_URL" "$SUPABASE_URL"
else
    echo -e "${YELLOW}⚠️  SUPABASE_URL no encontrado en .env.local${NC}"
fi

SUPABASE_ANON_KEY=$(get_env_value "SUPABASE_ANON_KEY")
if [ -z "$SUPABASE_ANON_KEY" ]; then
    SUPABASE_ANON_KEY=$(get_env_value "NEXT_PUBLIC_SUPABASE_ANON_KEY")
fi
if [ ! -z "$SUPABASE_ANON_KEY" ]; then
    add_var "SUPABASE_ANON_KEY" "$SUPABASE_ANON_KEY"
else
    echo -e "${YELLOW}⚠️  SUPABASE_ANON_KEY no encontrado en .env.local${NC}"
fi

SUPABASE_SERVICE_ROLE_KEY=$(get_env_value "SUPABASE_SERVICE_ROLE_KEY")
if [ ! -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    add_var "SUPABASE_SERVICE_ROLE_KEY" "$SUPABASE_SERVICE_ROLE_KEY"
else
    echo -e "${YELLOW}⚠️  SUPABASE_SERVICE_ROLE_KEY no encontrado en .env.local${NC}"
fi

ENCRYPTION_KEY=$(get_env_value "ENCRYPTION_KEY")
if [ -z "$ENCRYPTION_KEY" ]; then
    if command -v openssl &> /dev/null; then
        ENCRYPTION_KEY=$(openssl rand -hex 32)
        echo -e "${GREEN}✅ ENCRYPTION_KEY generada automáticamente${NC}"
        add_var "ENCRYPTION_KEY" "$ENCRYPTION_KEY"
    else
        echo -e "${YELLOW}⚠️  ENCRYPTION_KEY no encontrado. Genera con: openssl rand -hex 32${NC}"
    fi
else
    add_var "ENCRYPTION_KEY" "$ENCRYPTION_KEY"
fi

RESEND_API_KEY=$(get_env_value "RESEND_API_KEY")
if [ ! -z "$RESEND_API_KEY" ]; then
    add_var "RESEND_API_KEY" "$RESEND_API_KEY"
fi

UPSTASH_REDIS_REST_URL=$(get_env_value "UPSTASH_REDIS_REST_URL")
if [ ! -z "$UPSTASH_REDIS_REST_URL" ]; then
    add_var "UPSTASH_REDIS_REST_URL" "$UPSTASH_REDIS_REST_URL"
fi

UPSTASH_REDIS_REST_TOKEN=$(get_env_value "UPSTASH_REDIS_REST_TOKEN")
if [ ! -z "$UPSTASH_REDIS_REST_TOKEN" ]; then
    add_var "UPSTASH_REDIS_REST_TOKEN" "$UPSTASH_REDIS_REST_TOKEN"
fi

ALLOWED_ORIGINS=$(get_env_value "ALLOWED_ORIGINS")
ALLOWED_ORIGINS=${ALLOWED_ORIGINS:-"https://eventos-web-lovat.vercel.app,https://eventos-web.vercel.app"}
add_var "ALLOWED_ORIGINS" "$ALLOWED_ORIGINS"

echo ""
echo -e "${GREEN}✅ Configuración completada${NC}"
echo ""
echo "📋 Verificar variables:"
echo "   vercel env ls"
echo ""
echo "🚀 Redeploy:"
echo "   vercel --prod"
echo ""

