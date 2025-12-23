#!/bin/bash

# ============================================================================
# Script: Agregar SUPABASE_SERVICE_ROLE_KEY a Vercel y Redesplegar
# ============================================================================

set -e

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Configurando Variables de Entorno en Vercel${NC}"
echo "=========================================="
echo ""

# Verificar que Vercel CLI está instalado
if ! command -v vercel &> /dev/null; then
    echo -e "${RED}❌ Vercel CLI no está instalado${NC}"
    echo "Instala con: npm install -g vercel"
    exit 1
fi

# Verificar autenticación
echo -e "${BLUE}🔐 Verificando autenticación...${NC}"
if ! vercel whoami &> /dev/null; then
    echo -e "${RED}❌ No estás autenticado en Vercel CLI${NC}"
    echo ""
    echo "Ejecuta: vercel login"
    exit 1
fi

USER=$(vercel whoami 2>/dev/null | head -1)
echo -e "${GREEN}✅ Autenticado como: ${USER}${NC}"
echo ""

# Leer SUPABASE_SERVICE_ROLE_KEY de .env.local
if [ ! -f .env.local ]; then
    echo -e "${RED}❌ No se encontró .env.local${NC}"
    exit 1
fi

SERVICE_ROLE_KEY=$(grep "^SUPABASE_SERVICE_ROLE_KEY=" .env.local | cut -d'=' -f2- | tr -d '"' | tr -d "'" | xargs)

if [ -z "$SERVICE_ROLE_KEY" ] || [ "$SERVICE_ROLE_KEY" = "NOT_FOUND" ]; then
    echo -e "${RED}❌ No se encontró SUPABASE_SERVICE_ROLE_KEY en .env.local${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Service Role Key encontrado (${#SERVICE_ROLE_KEY} caracteres)${NC}"
echo ""

# Agregar variable a Production
echo -e "${BLUE}🔧 Agregando SUPABASE_SERVICE_ROLE_KEY a Production...${NC}"
echo "$SERVICE_ROLE_KEY" | vercel env add SUPABASE_SERVICE_ROLE_KEY production

# Agregar variable a Preview
echo -e "${BLUE}🔧 Agregando SUPABASE_SERVICE_ROLE_KEY a Preview...${NC}"
echo "$SERVICE_ROLE_KEY" | vercel env add SUPABASE_SERVICE_ROLE_KEY preview

# Agregar variable a Development
echo -e "${BLUE}🔧 Agregando SUPABASE_SERVICE_ROLE_KEY a Development...${NC}"
echo "$SERVICE_ROLE_KEY" | vercel env add SUPABASE_SERVICE_ROLE_KEY development

echo ""
echo -e "${GREEN}✅ Variable agregada a todos los ambientes${NC}"
echo ""

# Verificar variables
echo -e "${BLUE}📋 Variables de entorno configuradas:${NC}"
vercel env ls production | grep -E "SUPABASE|NEXT_PUBLIC" || true
echo ""

# Redesplegar
echo -e "${BLUE}🚀 Redesplegando en producción...${NC}"
vercel --prod --yes

echo ""
echo -e "${GREEN}✅ ¡Completado!${NC}"
echo ""
echo "Prueba la API:"
echo "  https://eventos-web-lovat.vercel.app/api/admin/vendors"
echo ""

