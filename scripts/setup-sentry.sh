#!/bin/bash

# Script para configurar Sentry en el proyecto
# Este script ayuda a configurar las variables de entorno de Sentry

echo "🔧 Configuración de Sentry para Error Tracking"
echo "=============================================="
echo ""

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}📋 Pasos para configurar Sentry:${NC}"
echo ""
echo "1. Crea una cuenta en https://sentry.io (si no tienes una)"
echo "2. Crea un nuevo proyecto:"
echo "   - Selecciona 'Next.js' como plataforma"
echo "   - Elige tu organización"
echo "3. Copia el DSN que Sentry te proporciona"
echo "4. (Opcional) Para source maps en producción:"
echo "   - Ve a Settings > Auth Tokens"
echo "   - Crea un token con permisos: project:releases"
echo ""
echo -e "${YELLOW}¿Tienes el DSN de Sentry? (s/n)${NC}"
read -r has_dsn

if [ "$has_dsn" != "s" ] && [ "$has_dsn" != "S" ]; then
    echo ""
    echo "Cuando tengas el DSN, ejecuta este script nuevamente o agrega manualmente:"
    echo "NEXT_PUBLIC_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx"
    echo ""
    echo "Documentación completa: docs/SENTRY_SETUP.md"
    exit 0
fi

echo ""
echo -e "${BLUE}Ingresa el DSN de Sentry:${NC}"
read -r sentry_dsn

# Validar formato básico del DSN
if [[ ! "$sentry_dsn" =~ ^https://.*@.*\.ingest\.sentry\.io/.*$ ]]; then
    echo -e "${YELLOW}⚠️  El formato del DSN parece incorrecto${NC}"
    echo "Formato esperado: https://xxx@xxx.ingest.sentry.io/xxx"
    echo -e "${YELLOW}¿Deseas continuar de todos modos? (s/n)${NC}"
    read -r continue_anyway
    if [ "$continue_anyway" != "s" ] && [ "$continue_anyway" != "S" ]; then
        exit 1
    fi
fi

echo ""
echo -e "${BLUE}¿Deseas configurar source maps para producción? (s/n)${NC}"
read -r setup_sourcemaps

if [ "$setup_sourcemaps" = "s" ] || [ "$setup_sourcemaps" = "S" ]; then
    echo ""
    echo -e "${BLUE}Ingresa el slug de tu organización en Sentry:${NC}"
    read -r sentry_org
    
    echo ""
    echo -e "${BLUE}Ingresa el slug de tu proyecto en Sentry:${NC}"
    read -r sentry_project
    
    echo ""
    echo -e "${BLUE}Ingresa tu Auth Token de Sentry (con permisos project:releases):${NC}"
    read -r sentry_token
fi

# Verificar si .env.local existe
if [ ! -f .env.local ]; then
    echo ""
    echo -e "${YELLOW}⚠️  .env.local no existe. Creando desde .env.local.example...${NC}"
    if [ -f .env.local.example ]; then
        cp .env.local.example .env.local
    else
        touch .env.local
    fi
fi

# Agregar o actualizar variables de Sentry
echo ""
echo -e "${BLUE}Actualizando .env.local...${NC}"

# Función para agregar o actualizar variable
update_env_var() {
    local var_name=$1
    local var_value=$2
    
    if grep -q "^${var_name}=" .env.local; then
        # Actualizar variable existente
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS
            sed -i '' "s|^${var_name}=.*|${var_name}=${var_value}|" .env.local
        else
            # Linux
            sed -i "s|^${var_name}=.*|${var_name}=${var_value}|" .env.local
        fi
    else
        # Agregar nueva variable
        echo "${var_name}=${var_value}" >> .env.local
    fi
}

# Actualizar DSN
update_env_var "NEXT_PUBLIC_SENTRY_DSN" "$sentry_dsn"

# Actualizar source maps si se configuraron
if [ "$setup_sourcemaps" = "s" ] || [ "$setup_sourcemaps" = "S" ]; then
    update_env_var "SENTRY_ORG" "$sentry_org"
    update_env_var "SENTRY_PROJECT" "$sentry_project"
    update_env_var "SENTRY_AUTH_TOKEN" "$sentry_token"
fi

# Agregar versión de app si no existe
if ! grep -q "^NEXT_PUBLIC_APP_VERSION=" .env.local; then
    echo "NEXT_PUBLIC_APP_VERSION=1.0.0" >> .env.local
fi

echo ""
echo -e "${GREEN}✅ Configuración de Sentry completada${NC}"
echo ""
echo "Variables agregadas a .env.local:"
echo "  - NEXT_PUBLIC_SENTRY_DSN"
if [ "$setup_sourcemaps" = "s" ] || [ "$setup_sourcemaps" = "S" ]; then
    echo "  - SENTRY_ORG"
    echo "  - SENTRY_PROJECT"
    echo "  - SENTRY_AUTH_TOKEN"
fi
echo ""
echo "Próximos pasos:"
echo "1. Reinicia el servidor de desarrollo: npm run dev"
echo "2. Prueba la integración ejecutando: npm run test:sentry"
echo "3. Revisa la documentación: docs/SENTRY_SETUP.md"
echo ""

