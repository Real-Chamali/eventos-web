#!/bin/bash

# Script para configurar variables de entorno fácilmente

echo "🔐 Configuración de Variables de Entorno"
echo "=========================================="
echo ""

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Verificar si .env.local existe
if [ -f .env.local ]; then
    echo -e "${YELLOW}⚠️  El archivo .env.local ya existe${NC}"
    echo ""
    read -p "¿Deseas sobrescribirlo? (s/N): " overwrite
    if [[ ! $overwrite =~ ^[Ss]$ ]]; then
        echo "Operación cancelada."
        exit 0
    fi
fi

# Copiar .env.example a .env.local
if [ -f .env.example ]; then
    cp .env.example .env.local
    echo -e "${GREEN}✅ Archivo .env.local creado desde .env.example${NC}"
else
    echo -e "${YELLOW}⚠️  Archivo .env.example no encontrado, creando .env.local básico${NC}"
    cat > .env.local << 'EOF'
# Variables de entorno locales
# Reemplaza los valores con tus credenciales reales

NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
EOF
fi

echo ""
echo -e "${BLUE}📝 Ahora necesitas editar .env.local y agregar tus credenciales${NC}"
echo ""
echo "Obtén tus credenciales de Supabase en:"
echo "  https://app.supabase.com → Tu Proyecto → Settings → API"
echo ""
echo "Variables requeridas:"
echo "  1. NEXT_PUBLIC_SUPABASE_URL (Project URL)"
echo "  2. NEXT_PUBLIC_SUPABASE_ANON_KEY (anon public key)"
echo ""
read -p "¿Deseas abrir .env.local ahora? (S/n): " open_file

if [[ ! $open_file =~ ^[Nn]$ ]]; then
    if command -v code &> /dev/null; then
        code .env.local
    elif command -v nano &> /dev/null; then
        nano .env.local
    elif command -v vim &> /dev/null; then
        vim .env.local
    else
        echo "Abre .env.local manualmente con tu editor favorito"
    fi
fi

echo ""
echo -e "${GREEN}✅ Configuración completada${NC}"
echo ""
echo "Próximos pasos:"
echo "  1. Edita .env.local y agrega tus credenciales"
echo "  2. Ejecuta: ./scripts/verify-all-env.sh para verificar"
echo "  3. Reinicia el servidor: npm run dev"

