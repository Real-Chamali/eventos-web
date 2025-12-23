#!/bin/bash

# ============================================================================
# Script: Generar Iconos PWA con tu Logo
# ============================================================================
# Este script genera todos los iconos PWA necesarios a partir de tu logo
# ============================================================================

set -e

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🎨 Generador de Iconos PWA con tu Logo${NC}"
echo "=========================================="
echo ""

# Verificar si ImageMagick está instalado
if ! command -v convert &> /dev/null; then
    echo -e "${RED}❌ ImageMagick no está instalado${NC}"
    echo ""
    echo "Instala ImageMagick con:"
    echo "  Ubuntu/Debian: sudo apt-get install imagemagick"
    echo "  macOS: brew install imagemagick"
    echo ""
    exit 1
fi

echo -e "${GREEN}✅ ImageMagick encontrado${NC}"
echo ""

# Buscar logo en diferentes ubicaciones
LOGO_CANDIDATES=(
    "public/logo.png"
    "public/logo.jpg"
    "public/logo.jpeg"
    "public/logo.svg"
    "public/icon.png"
    "public/favicon.png"
    "logo.png"
    "logo.jpg"
    "logo.jpeg"
    "logo.svg"
    "icon.png"
)

LOGO_FILE=""
for candidate in "${LOGO_CANDIDATES[@]}"; do
    if [ -f "$candidate" ]; then
        LOGO_FILE="$candidate"
        echo -e "${GREEN}✅ Logo encontrado: $LOGO_FILE${NC}"
        break
    fi
done

# Si no se encuentra, pedir al usuario
if [ -z "$LOGO_FILE" ]; then
    echo -e "${YELLOW}⚠️  No se encontró un logo automáticamente${NC}"
    echo ""
    echo "Por favor, proporciona la ruta a tu logo:"
    echo "  - Puede ser PNG, SVG, JPG, etc."
    echo "  - Recomendado: mínimo 512x512 píxeles"
    echo ""
    read -p "Ruta del logo (o presiona Enter para usar generador básico): " user_logo
    
    if [ -n "$user_logo" ] && [ -f "$user_logo" ]; then
        LOGO_FILE="$user_logo"
        echo -e "${GREEN}✅ Usando: $LOGO_FILE${NC}"
    else
        echo -e "${YELLOW}⚠️  Usando generador básico (sin logo)${NC}"
        LOGO_FILE=""
    fi
fi

# Tamaños de iconos requeridos
SIZES=(72 96 128 144 152 192 384 512)

echo ""
echo -e "${BLUE}📐 Generando iconos en los siguientes tamaños:${NC}"
echo "   ${SIZES[*]}"
echo ""

# Función para generar icono desde logo
generate_from_logo() {
    local size=$1
    local output="public/icon-${size}.png"
    
    if [ -n "$LOGO_FILE" ]; then
        # Si es SVG, convertir primero
        if [[ "$LOGO_FILE" == *.svg ]]; then
            # Convertir SVG a PNG temporal
            convert -background none -size "${size}x${size}" "$LOGO_FILE" "public/icon-${size}.png" 2>/dev/null || {
                echo -e "${YELLOW}⚠️  Error con SVG, usando método alternativo${NC}"
                # Método alternativo: crear desde cero con gradiente
                create_basic_icon "$size"
            }
        else
            # Redimensionar imagen existente (PNG, JPG, etc.)
            # Primero redimensionar manteniendo aspecto, luego recortar/extender a cuadrado
            convert "$LOGO_FILE" \
                -resize "${size}x${size}^" \
                -gravity center \
                -background transparent \
                -extent "${size}x${size}" \
                "$output" 2>/dev/null || {
                echo -e "${YELLOW}⚠️  Error redimensionando, usando método básico${NC}"
                create_basic_icon "$size"
            }
        fi
    else
        create_basic_icon "$size"
    fi
}

# Función para crear icono básico (fallback)
create_basic_icon() {
    local size=$1
    local output="public/icon-${size}.png"
    
    # Crear icono con gradiente y texto "EC"
    convert -size "${size}x${size}" \
        gradient:'#6366f1-#8b5cf6' \
        -draw "fill rgba(255,255,255,0.2) circle $((size/2)),$((size/2)) $((size/2)),$((size*2/5))" \
        -pointsize $((size*3/10)) \
        -fill white \
        -gravity center \
        -font Arial-Bold \
        -annotate +0+0 'EC' \
        "$output"
}

# Generar todos los iconos
SUCCESS=0
FAILED=0

for size in "${SIZES[@]}"; do
    output="public/icon-${size}.png"
    
    if generate_from_logo "$size"; then
        echo -e "${GREEN}✅ Generado: icon-${size}.png${NC}"
        ((SUCCESS++))
    else
        echo -e "${RED}❌ Error generando: icon-${size}.png${NC}"
        ((FAILED++))
    fi
done

echo ""
echo "=========================================="
echo -e "${GREEN}✅ Iconos generados exitosamente: ${SUCCESS}/${#SIZES[@]}${NC}"

if [ $FAILED -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Fallos: ${FAILED}${NC}"
fi

echo ""
echo -e "${BLUE}📝 Próximos pasos:${NC}"
echo "1. Verifica los iconos en: public/icon-*.png"
echo "2. Si no te gustan, reemplaza public/icon-512.png con tu logo"
echo "3. Ejecuta este script nuevamente para regenerar todos los tamaños"
echo "4. La PWA estará lista para instalar!"
echo ""

