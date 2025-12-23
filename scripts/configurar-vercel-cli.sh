#!/bin/bash

# Script para configurar variables de entorno en Vercel usando CLI
# Requiere: vercel CLI instalado y autenticado

set -e

echo "🔐 Configurando Variables de Entorno en Vercel (CLI)"
echo "======================================================"
echo ""

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Verificar que vercel CLI está instalado
if ! command -v vercel &> /dev/null; then
    echo -e "${RED}❌ Vercel CLI no está instalado${NC}"
    echo "Instala con: npm i -g vercel"
    exit 1
fi

# Verificar que está autenticado
if ! vercel whoami &> /dev/null; then
    echo -e "${YELLOW}⚠️  No estás autenticado en Vercel${NC}"
    echo "Ejecuta: vercel login"
    exit 1
fi

echo -e "${GREEN}✅ Vercel CLI configurado correctamente${NC}"
echo ""

# Función para agregar variable usando Vercel CLI
add_var_cli() {
    local key=$1
    local value=$2
    local envs=${3:-production,preview,development}
    
    echo -e "${BLUE}📝 Agregando: ${key}${NC}"
    
    # Usar echo para pasar el valor a vercel env add
    echo "$value" | vercel env add "$key" "$envs" --yes 2>&1 | grep -v "Enter" || true
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ ${key} configurado${NC}"
    else
        echo -e "${YELLOW}⚠️  ${key} puede que ya exista o hubo un error${NC}"
    fi
    echo ""
}

# Variables públicas (NEXT_PUBLIC_*)
echo "📋 Configurando Variables Públicas..."
echo ""

# NEXT_PUBLIC_SENTRY_DSN
read -p "NEXT_PUBLIC_SENTRY_DSN (o Enter para usar valor por defecto): " SENTRY_DSN
SENTRY_DSN=${SENTRY_DSN:-"https://66e295a3c88588a96d03742182952e8b@o4510508203704320.ingest.us.sentry.io/4510508220088320"}
add_var_cli "NEXT_PUBLIC_SENTRY_DSN" "$SENTRY_DSN"

# NEXT_PUBLIC_APP_VERSION
read -p "NEXT_PUBLIC_APP_VERSION (o Enter para usar 1.0.0): " APP_VERSION
APP_VERSION=${APP_VERSION:-"1.0.0"}
add_var_cli "NEXT_PUBLIC_APP_VERSION" "$APP_VERSION"

# NEXT_PUBLIC_APP_URL
read -p "NEXT_PUBLIC_APP_URL (o Enter para usar https://eventos-web-lovat.vercel.app): " APP_URL
APP_URL=${APP_URL:-"https://eventos-web-lovat.vercel.app"}
add_var_cli "NEXT_PUBLIC_APP_URL" "$APP_URL"

# Variables privadas (secrets)
echo ""
echo "🔒 Configurando Variables Privadas..."
echo ""

echo -e "${YELLOW}⚠️  Necesitarás obtener estos valores de tus dashboards${NC}"
echo ""

# SUPABASE_URL
read -p "SUPABASE_URL: " SUPABASE_URL
if [ -z "$SUPABASE_URL" ]; then
    echo -e "${RED}❌ SUPABASE_URL es requerido${NC}"
    echo "Obtén el valor de: Supabase Dashboard → Settings → API → Project URL"
    exit 1
fi
add_var_cli "SUPABASE_URL" "$SUPABASE_URL"

# SUPABASE_ANON_KEY
read -p "SUPABASE_ANON_KEY: " SUPABASE_ANON_KEY
if [ -z "$SUPABASE_ANON_KEY" ]; then
    echo -e "${RED}❌ SUPABASE_ANON_KEY es requerido${NC}"
    echo "Obtén el valor de: Supabase Dashboard → Settings → API → Project API keys → anon public"
    exit 1
fi
add_var_cli "SUPABASE_ANON_KEY" "$SUPABASE_ANON_KEY"

# SUPABASE_SERVICE_ROLE_KEY
read -p "SUPABASE_SERVICE_ROLE_KEY: " SUPABASE_SERVICE_ROLE_KEY
if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo -e "${RED}❌ SUPABASE_SERVICE_ROLE_KEY es requerido${NC}"
    echo "Obtén el valor de: Supabase Dashboard → Settings → API → Project API keys → service_role secret"
    exit 1
fi
add_var_cli "SUPABASE_SERVICE_ROLE_KEY" "$SUPABASE_SERVICE_ROLE_KEY"

# ENCRYPTION_KEY
read -p "ENCRYPTION_KEY (o Enter para generar uno nuevo): " ENCRYPTION_KEY
if [ -z "$ENCRYPTION_KEY" ]; then
    if command -v openssl &> /dev/null; then
        ENCRYPTION_KEY=$(openssl rand -hex 32)
        echo -e "${GREEN}✅ Clave generada automáticamente: ${ENCRYPTION_KEY:0:20}...${NC}"
    else
        echo -e "${RED}❌ openssl no está instalado. Genera una clave manualmente con: openssl rand -hex 32${NC}"
        exit 1
    fi
fi
add_var_cli "ENCRYPTION_KEY" "$ENCRYPTION_KEY"

# RESEND_API_KEY (opcional)
read -p "RESEND_API_KEY (opcional, Enter para omitir): " RESEND_API_KEY
if [ ! -z "$RESEND_API_KEY" ]; then
    add_var_cli "RESEND_API_KEY" "$RESEND_API_KEY"
fi

# UPSTASH_REDIS_REST_URL (opcional)
read -p "UPSTASH_REDIS_REST_URL (opcional, Enter para omitir): " UPSTASH_REDIS_REST_URL
if [ ! -z "$UPSTASH_REDIS_REST_URL" ]; then
    add_var_cli "UPSTASH_REDIS_REST_URL" "$UPSTASH_REDIS_REST_URL"
fi

# UPSTASH_REDIS_REST_TOKEN (opcional)
read -p "UPSTASH_REDIS_REST_TOKEN (opcional, Enter para omitir): " UPSTASH_REDIS_REST_TOKEN
if [ ! -z "$UPSTASH_REDIS_REST_TOKEN" ]; then
    add_var_cli "UPSTASH_REDIS_REST_TOKEN" "$UPSTASH_REDIS_REST_TOKEN"
fi

# ALLOWED_ORIGINS
read -p "ALLOWED_ORIGINS (o Enter para usar valor por defecto): " ALLOWED_ORIGINS
ALLOWED_ORIGINS=${ALLOWED_ORIGINS:-"https://eventos-web-lovat.vercel.app,https://eventos-web.vercel.app"}
add_var_cli "ALLOWED_ORIGINS" "$ALLOWED_ORIGINS"

echo ""
echo -e "${GREEN}✅ Todas las variables configuradas${NC}"
echo ""
echo "🚀 Próximos pasos:"
echo "1. Verifica las variables en: https://vercel.com/dashboard"
echo "2. Redeploy con: vercel --prod"
echo ""

