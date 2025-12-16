#!/bin/bash

# Script para probar la integración de Sentry
# Este script verifica que Sentry esté configurado correctamente

echo "🧪 Prueba de Integración de Sentry"
echo "==================================="
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
    echo "Ejecuta primero: ./scripts/setup-sentry.sh"
    exit 1
fi

echo ""

# Verificar DSN
if [ -z "$NEXT_PUBLIC_SENTRY_DSN" ]; then
    echo -e "${RED}❌ NEXT_PUBLIC_SENTRY_DSN no está configurado${NC}"
    echo "Ejecuta: ./scripts/setup-sentry.sh"
    exit 1
fi

echo -e "${GREEN}✅ NEXT_PUBLIC_SENTRY_DSN configurado${NC}"
echo "   DSN: ${NEXT_PUBLIC_SENTRY_DSN:0:30}..."

# Verificar formato del DSN
if [[ "$NEXT_PUBLIC_SENTRY_DSN" =~ ^https://.*@.*\.ingest\.sentry\.io/.*$ ]]; then
    echo -e "${GREEN}✅ Formato del DSN correcto${NC}"
else
    echo -e "${YELLOW}⚠️  El formato del DSN parece incorrecto${NC}"
    echo "   Formato esperado: https://xxx@xxx.ingest.sentry.io/xxx"
fi

echo ""

# Verificar variables opcionales
if [ -n "$SENTRY_ORG" ] && [ -n "$SENTRY_PROJECT" ] && [ -n "$SENTRY_AUTH_TOKEN" ]; then
    echo -e "${GREEN}✅ Source maps configurados para producción${NC}"
    echo "   Org: $SENTRY_ORG"
    echo "   Project: $SENTRY_PROJECT"
else
    echo -e "${YELLOW}⚠️  Source maps no configurados (opcional)${NC}"
    echo "   Para configurarlos: ./scripts/setup-sentry.sh"
fi

echo ""
echo -e "${BLUE}📋 Para probar Sentry manualmente:${NC}"
echo ""
echo "1. Inicia el servidor: npm run dev"
echo "2. Abre la aplicación en el navegador"
echo "3. Abre la consola del navegador (F12)"
echo "4. Ejecuta este código en la consola:"
echo ""
echo "   import('@/sentry.config').then(m => {"
echo "     m.reportErrorToSentry("
echo "       new Error('Test Sentry Integration'),"
echo "       'TestScript',"
echo "       { timestamp: new Date() }"
echo "     )"
echo "   })"
echo ""
echo "5. Verifica en https://sentry.io que el error aparezca"
echo ""
echo -e "${GREEN}✅ Verificación completada${NC}"

