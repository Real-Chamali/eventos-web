#!/bin/bash

# Script para configurar TODAS las variables de Vercel usando CLI
# Lee valores desde .env.local si existe

set -e

echo "🔐 Configuración Completa de Variables en Vercel (CLI)"
echo "========================================================"
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

USER=$(vercel whoami 2>/dev/null)
echo -e "${GREEN}✅ Autenticado como: ${USER}${NC}"
echo ""

# Función para agregar/actualizar variable
add_var() {
    local key=$1
    local value=$2
    local envs=${3:-production,preview,development}
    
    if [ -z "$value" ]; then
        echo -e "${YELLOW}⚠️  ${key} está vacío, omitiendo...${NC}"
        return 0
    fi
    
    echo -e "${BLUE}📝 Configurando: ${key}${NC}"
    
    # Agregar variable (si ya existe, vercel la actualiza)
    echo "$value" | vercel env add "$key" "$envs" --yes 2>&1 | grep -v "Enter" > /dev/null || true
    
    echo -e "${GREEN}✅ ${key} configurado${NC}"
}

# Cargar .env.local si existe
if [ -f .env.local ]; then
    echo -e "${BLUE}📄 Cargando variables desde .env.local...${NC}"
    # Cargar variables sin exportar (para no contaminar el entorno)
    while IFS='=' read -r key value; do
        # Ignorar comentarios y líneas vacías
        [[ "$key" =~ ^#.*$ ]] && continue
        [[ -z "$key" ]] && continue
        
        # Remover comillas si existen
        value=$(echo "$value" | sed -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//")
        
        # Asignar variable
        eval "${key}='${value}'"
    done < <(grep -v '^#' .env.local | grep -v '^$')
    echo -e "${GREEN}✅ Variables cargadas${NC}"
    echo ""
fi

# Variables públicas
echo "📋 Configurando Variables Públicas (NEXT_PUBLIC_*)..."
echo ""

add_var "NEXT_PUBLIC_SENTRY_DSN" "${NEXT_PUBLIC_SENTRY_DSN:-https://66e295a3c88588a96d03742182952e8b@o4510508203704320.ingest.us.sentry.io/4510508220088320}"
add_var "NEXT_PUBLIC_APP_VERSION" "${NEXT_PUBLIC_APP_VERSION:-1.0.0}"
add_var "NEXT_PUBLIC_APP_URL" "${NEXT_PUBLIC_APP_URL:-https://eventos-web-lovat.vercel.app}"

# Variables privadas
echo ""
echo "🔒 Configurando Variables Privadas..."
echo ""

# Si no están cargadas, pedirlas
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

# Opcionales (solo si están definidas)
if [ ! -z "$RESEND_API_KEY" ]; then
    add_var "RESEND_API_KEY" "$RESEND_API_KEY"
fi

if [ ! -z "$UPSTASH_REDIS_REST_URL" ]; then
    add_var "UPSTASH_REDIS_REST_URL" "$UPSTASH_REDIS_REST_URL"
fi

if [ ! -z "$UPSTASH_REDIS_REST_TOKEN" ]; then
    add_var "UPSTASH_REDIS_REST_TOKEN" "$UPSTASH_REDIS_REST_TOKEN"
fi

add_var "ALLOWED_ORIGINS" "${ALLOWED_ORIGINS:-https://eventos-web-lovat.vercel.app,https://eventos-web.vercel.app}"

echo ""
echo -e "${GREEN}✅ Configuración completada${NC}"
echo ""
echo "📋 Verificar variables:"
echo "   vercel env ls"
echo ""
echo "🚀 Redeploy con:"
echo "   vercel --prod"
echo ""

