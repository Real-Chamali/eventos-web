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
    echo ""
    echo "Instala con: npm install -g vercel"
    exit 1
fi

# Verificar autenticación
echo -e "${BLUE}🔐 Verificando autenticación en Vercel...${NC}"
if ! vercel whoami &> /dev/null; then
    echo -e "${YELLOW}⚠️  No estás autenticado en Vercel CLI${NC}"
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
    echo ""
    echo "Crea el archivo .env.local con:"
    echo "  SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key_aqui"
    exit 1
fi

SERVICE_ROLE_KEY=$(grep -E "^SUPABASE_SERVICE_ROLE_KEY=" .env.local | cut -d'=' -f2- | tr -d '"' | tr -d "'")

if [ -z "$SERVICE_ROLE_KEY" ]; then
    echo -e "${RED}❌ No se encontró SUPABASE_SERVICE_ROLE_KEY en .env.local${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Service Role Key encontrado (${#SERVICE_ROLE_KEY} caracteres)${NC}"
echo ""

# Obtener el proyecto actual
echo -e "${BLUE}📦 Obteniendo información del proyecto...${NC}"
PROJECT_NAME=$(vercel ls 2>/dev/null | grep -E "eventos-web" | head -1 | awk '{print $1}' || echo "")

if [ -z "$PROJECT_NAME" ]; then
    echo -e "${YELLOW}⚠️  No se pudo detectar el proyecto automáticamente${NC}"
    echo ""
    read -p "Ingresa el nombre del proyecto en Vercel (o presiona Enter para usar 'eventos-web-lovat'): " PROJECT_NAME
    PROJECT_NAME=${PROJECT_NAME:-eventos-web-lovat}
fi

echo -e "${GREEN}✅ Proyecto: ${PROJECT_NAME}${NC}"
echo ""

# Agregar variable de entorno
echo -e "${BLUE}🔧 Agregando SUPABASE_SERVICE_ROLE_KEY a Vercel...${NC}"
echo ""

# Intentar agregar la variable usando la CLI
# Nota: La CLI de Vercel no tiene un comando directo para agregar env vars
# Necesitamos usar la API o el dashboard. Por ahora, mostraremos instrucciones.

echo -e "${YELLOW}⚠️  La CLI de Vercel no permite agregar variables de entorno directamente${NC}"
echo ""
echo -e "${BLUE}📝 Opción 1: Usar Dashboard (Recomendado)${NC}"
echo ""
echo "1. Ve a: https://vercel.com/dashboard"
echo "2. Selecciona tu proyecto: ${PROJECT_NAME}"
echo "3. Ve a Settings → Environment Variables"
echo "4. Click en 'Add New'"
echo "5. Name: SUPABASE_SERVICE_ROLE_KEY"
echo "6. Value: (el valor está en tu .env.local)"
echo "7. Marca: ✅ Production, ✅ Preview, ✅ Development"
echo "8. Click Save"
echo ""
echo -e "${BLUE}📝 Opción 2: Usar este script para mostrar el valor${NC}"
echo ""
read -p "¿Quieres ver el valor del SERVICE_ROLE_KEY para copiarlo? (s/N): " SHOW_KEY

if [[ "$SHOW_KEY" =~ ^[Ss]$ ]]; then
    echo ""
    echo -e "${GREEN}Valor de SUPABASE_SERVICE_ROLE_KEY:${NC}"
    echo "$SERVICE_ROLE_KEY"
    echo ""
    echo -e "${YELLOW}⚠️  Copia este valor y pégalo en Vercel Dashboard${NC}"
    echo ""
fi

# Después de agregar la variable, hacer redeploy
echo -e "${BLUE}🔄 Para redesplegar después de agregar la variable:${NC}"
echo ""
echo "Opción A: Desde Dashboard"
echo "  1. Ve a Deployments"
echo "  2. Click en los 3 puntos (...) del último deployment"
echo "  3. Selecciona 'Redeploy'"
echo ""
echo "Opción B: Desde CLI"
echo "  vercel --prod"
echo ""

# Preguntar si quiere hacer redeploy ahora
read -p "¿Ya agregaste la variable en Vercel Dashboard y quieres hacer redeploy ahora? (s/N): " REDEPLOY

if [[ "$REDEPLOY" =~ ^[Ss]$ ]]; then
    echo ""
    echo -e "${BLUE}🚀 Redesplegando en producción...${NC}"
    vercel --prod --yes
    echo ""
    echo -e "${GREEN}✅ Redespliegue completado${NC}"
    echo ""
    echo "Prueba la API:"
    echo "  https://eventos-web-lovat.vercel.app/api/admin/vendors"
    echo ""
else
    echo ""
    echo -e "${YELLOW}⚠️  Recuerda redesplegar después de agregar la variable${NC}"
    echo ""
fi

echo -e "${GREEN}✅ Proceso completado${NC}"
echo ""

