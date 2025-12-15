#!/bin/bash

# Script completo para verificar todas las variables de entorno en la aplicación

echo "🔍 Verificando TODAS las variables de entorno de la aplicación..."
echo "=========================================="
echo ""

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Cargar variables de .env.local si existe
if [ -f .env.local ]; then
    export $(cat .env.local | grep -v '^#' | xargs)
    echo -e "${BLUE}📄 Archivo .env.local encontrado${NC}"
else
    echo -e "${RED}❌ Archivo .env.local NO encontrado${NC}"
    exit 1
fi

echo ""
ERROR_COUNT=0
WARNING_COUNT=0
OK_COUNT=0

# Función para verificar variable
check_var() {
    local var_name=$1
    local required=$2  # "required" o "optional"
    local description=$3
    local example_pattern=$4  # Patrón para detectar valores de ejemplo
    
    local value="${!var_name}"
    
    if [ -z "$value" ]; then
        if [ "$required" = "required" ]; then
            echo -e "${RED}❌ $var_name${NC} - ${description}"
            echo "   Estado: FALTANTE (REQUERIDA)"
            ((ERROR_COUNT++))
        else
            echo -e "${YELLOW}⚠️  $var_name${NC} - ${description}"
            echo "   Estado: No configurada (Opcional)"
            ((WARNING_COUNT++))
        fi
    elif [ -n "$example_pattern" ] && [[ "$value" == *"$example_pattern"* ]]; then
        echo -e "${YELLOW}⚠️  $var_name${NC} - ${description}"
        echo "   Estado: Valor de ejemplo detectado"
        echo "   Valor: ${value:0:50}..."
        ((WARNING_COUNT++))
    else
        echo -e "${GREEN}✅ $var_name${NC} - ${description}"
        if [ "$var_name" == *"KEY"* ] || [ "$var_name" == *"TOKEN"* ] || [ "$var_name" == *"SECRET"* ]; then
            echo "   Valor: ${value:0:30}... (oculto por seguridad)"
        else
            echo "   Valor: $value"
        fi
        ((OK_COUNT++))
    fi
    echo ""
}

echo -e "${BLUE}=== VARIABLES REQUERIDAS ===${NC}"
echo ""

# Variables REQUERIDAS
check_var "NEXT_PUBLIC_SUPABASE_URL" "required" "URL del proyecto Supabase" "tu-proyecto"
check_var "NEXT_PUBLIC_SUPABASE_ANON_KEY" "required" "Clave anónima pública de Supabase" "tu_clave"

echo -e "${BLUE}=== VARIABLES OPCIONALES (Recomendadas) ===${NC}"
echo ""

# Variables OPCIONALES pero recomendadas
check_var "SUPABASE_SERVICE_ROLE_KEY" "optional" "Clave de servicio de Supabase (para operaciones del servidor)"
check_var "NEXT_PUBLIC_APP_URL" "optional" "URL base de la aplicación"
check_var "NEXT_PUBLIC_APP_VERSION" "optional" "Versión de la aplicación"

echo -e "${BLUE}=== VARIABLES OPCIONALES (Sentry) ===${NC}"
echo ""

check_var "NEXT_PUBLIC_SENTRY_DSN" "optional" "DSN de Sentry para error tracking"
check_var "SENTRY_ORG" "optional" "Organización de Sentry"
check_var "SENTRY_PROJECT" "optional" "Proyecto de Sentry"
check_var "SENTRY_AUTH_TOKEN" "optional" "Token de autenticación de Sentry"

echo -e "${BLUE}=== VARIABLES OPCIONALES (Analytics) ===${NC}"
echo ""

check_var "NEXT_PUBLIC_GA_ID" "optional" "ID de Google Analytics"

echo -e "${BLUE}=== VARIABLES OPCIONALES (Seguridad) ===${NC}"
echo ""

check_var "ENCRYPTION_KEY" "optional" "Clave de encriptación (usa 'default' si no está configurada)"

echo ""
echo "=========================================="
echo -e "${BLUE}📊 RESUMEN${NC}"
echo "=========================================="
echo -e "${GREEN}✅ Correctas: $OK_COUNT${NC}"
echo -e "${YELLOW}⚠️  Advertencias: $WARNING_COUNT${NC}"
echo -e "${RED}❌ Errores: $ERROR_COUNT${NC}"
echo ""

if [ $ERROR_COUNT -gt 0 ]; then
    echo -e "${RED}❌ HAY ERRORES CRÍTICOS - La aplicación no funcionará correctamente${NC}"
    echo ""
    echo "Para solucionarlo:"
    echo "1. Edita .env.local y configura las variables requeridas"
    echo "2. Obtén las credenciales en: https://app.supabase.com → Settings → API"
    exit 1
elif [ $WARNING_COUNT -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Hay variables opcionales sin configurar${NC}"
    echo "   La aplicación funcionará, pero algunas características pueden estar deshabilitadas"
    exit 0
else
    echo -e "${GREEN}✅ Todas las variables están configuradas correctamente${NC}"
    exit 0
fi

