#!/bin/bash

# Script para generar iconos PWA
# Requiere ImageMagick: sudo apt-get install imagemagick

echo "🎨 Generando iconos PWA..."

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verificar si ImageMagick está instalado
if ! command -v convert &> /dev/null; then
    echo -e "${YELLOW}⚠️  ImageMagick no está instalado${NC}"
    echo "Instala con: sudo apt-get install imagemagick"
    echo ""
    echo "O crea los iconos manualmente:"
    echo "  - icon-72.png (72x72)"
    echo "  - icon-96.png (96x96)"
    echo "  - icon-128.png (128x128)"
    echo "  - icon-144.png (144x144)"
    echo "  - icon-152.png (152x152)"
    echo "  - icon-192.png (192x192)"
    echo "  - icon-384.png (384x384)"
    echo "  - icon-512.png (512x512)"
    exit 1
fi

# Verificar si existe un icono base
ICON_BASE="public/icon-base.png"
if [ ! -f "$ICON_BASE" ]; then
    echo -e "${YELLOW}⚠️  No se encontró icon-base.png${NC}"
    echo "Creando un icono temporal con gradiente..."
    
    # Crear icono base temporal (512x512)
    convert -size 512x512 \
        gradient:'#6366f1-#8b5cf6' \
        -draw "fill white circle 256,256 256,100" \
        -draw "fill '#6366f1' text 180,300 'EC'" \
        -font Arial-Bold -pointsize 120 \
        "$ICON_BASE"
fi

# Tamaños de iconos
SIZES=(72 96 128 144 152 192 384 512)

echo -e "${GREEN}Generando iconos...${NC}"

for size in "${SIZES[@]}"; do
    output="public/icon-${size}.png"
    convert "$ICON_BASE" -resize "${size}x${size}" "$output"
    echo "✅ Generado: $output"
done

echo ""
echo -e "${GREEN}✅ Todos los iconos generados exitosamente${NC}"
echo ""
echo "📝 Próximos pasos:"
echo "1. Reemplaza icon-base.png con tu logo real"
echo "2. Ejecuta este script nuevamente para regenerar los iconos"
echo "3. Los iconos están listos en public/"

