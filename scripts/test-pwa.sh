#!/bin/bash

# Script para probar la PWA
# Uso: ./scripts/test-pwa.sh [url]

URL="${1:-http://localhost:3000}"
BASE_URL=$(echo $URL | sed 's|https\?://||' | cut -d'/' -f1)

echo "🧪 Probando PWA en: $URL"
echo ""

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Verificar Manifest
echo "1️⃣ Verificando Manifest..."
MANIFEST_URL="$URL/manifest.json"
MANIFEST_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$MANIFEST_URL")

if [ "$MANIFEST_STATUS" = "200" ]; then
    echo -e "${GREEN}✅ Manifest accesible: $MANIFEST_URL${NC}"
    curl -s "$MANIFEST_URL" | jq '.' > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Manifest es JSON válido${NC}"
    else
        echo -e "${RED}❌ Manifest no es JSON válido${NC}"
    fi
else
    echo -e "${RED}❌ Manifest no accesible (Status: $MANIFEST_STATUS)${NC}"
fi
echo ""

# 2. Verificar Service Worker
echo "2️⃣ Verificando Service Worker..."
SW_URL="$URL/sw.js"
SW_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$SW_URL")

if [ "$SW_STATUS" = "200" ]; then
    echo -e "${GREEN}✅ Service Worker accesible: $SW_URL${NC}"
    SW_CONTENT=$(curl -s "$SW_URL")
    if echo "$SW_CONTENT" | grep -q "Service Worker"; then
        echo -e "${GREEN}✅ Service Worker contiene código válido${NC}"
    else
        echo -e "${YELLOW}⚠️  Service Worker puede estar vacío${NC}"
    fi
else
    echo -e "${RED}❌ Service Worker no accesible (Status: $SW_STATUS)${NC}"
fi
echo ""

# 3. Verificar Íconos
echo "3️⃣ Verificando Íconos..."
ICONS=("icon-192.png" "icon-512.png")
ALL_ICONS_OK=true

for icon in "${ICONS[@]}"; do
    ICON_URL="$URL/$icon"
    ICON_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$ICON_URL")
    if [ "$ICON_STATUS" = "200" ]; then
        echo -e "${GREEN}✅ $icon accesible${NC}"
    else
        echo -e "${RED}❌ $icon no accesible (Status: $ICON_STATUS)${NC}"
        ALL_ICONS_OK=false
    fi
done

if [ "$ALL_ICONS_OK" = true ]; then
    echo -e "${GREEN}✅ Todos los íconos están accesibles${NC}"
else
    echo -e "${YELLOW}⚠️  Algunos íconos no están accesibles${NC}"
fi
echo ""

# 4. Verificar HTTPS (requerido para PWA)
echo "4️⃣ Verificando HTTPS..."
if [[ "$URL" == https://* ]]; then
    echo -e "${GREEN}✅ URL usa HTTPS${NC}"
else
    echo -e "${YELLOW}⚠️  URL no usa HTTPS (requerido para PWA en producción)${NC}"
    echo "   Nota: En desarrollo local, esto es normal"
fi
echo ""

# 5. Verificar Página Offline
echo "5️⃣ Verificando Página Offline..."
OFFLINE_URL="$URL/offline"
OFFLINE_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$OFFLINE_URL")

if [ "$OFFLINE_STATUS" = "200" ]; then
    echo -e "${GREEN}✅ Página offline accesible: $OFFLINE_URL${NC}"
else
    echo -e "${YELLOW}⚠️  Página offline no accesible (Status: $OFFLINE_STATUS)${NC}"
    echo "   Nota: Esto puede ser normal si la ruta requiere autenticación"
fi
echo ""

# Resumen
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Resumen de Pruebas PWA"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Para probar manualmente:"
echo ""
echo "1. Abre la app en Chrome/Edge: $URL"
echo "2. Abre DevTools (F12) → Application → Service Workers"
echo "3. Verifica que el Service Worker esté 'activated and running'"
echo "4. Ve a Application → Manifest y verifica que se cargue correctamente"
echo "5. Ve a Application → Cache Storage y verifica que haya caches creados"
echo ""
echo "Para probar instalación:"
echo "1. Busca el ícono de instalación en la barra de direcciones"
echo "2. O espera el prompt de instalación automático"
echo ""
echo "Para probar offline:"
echo "1. DevTools → Network → Marca 'Offline'"
echo "2. Recarga la página"
echo "3. Verifica que la app funcione con contenido cacheado"
echo ""
echo "Para Lighthouse:"
echo "1. DevTools → Lighthouse"
echo "2. Selecciona 'Progressive Web App'"
echo "3. Ejecuta auditoría"
echo ""

