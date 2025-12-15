#!/bin/bash

# Script para reiniciar el servidor asegurando que las variables de entorno se carguen

echo "🔄 Reiniciando servidor con variables de entorno..."
echo ""

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 1. Verificar que .env.local existe
if [ ! -f .env.local ]; then
    echo -e "${RED}❌ Error: .env.local no encontrado${NC}"
    echo ""
    echo "Solución:"
    echo "1. Copia .env.local.example a .env.local:"
    echo "   cp .env.local.example .env.local"
    echo "2. Edita .env.local con tus credenciales"
    exit 1
fi

echo -e "${GREEN}✅ .env.local encontrado${NC}"

# 2. Verificar variables
echo ""
echo -e "${BLUE}Verificando variables...${NC}"
if grep -q "NEXT_PUBLIC_SUPABASE_URL" .env.local && grep -q "NEXT_PUBLIC_SUPABASE_ANON_KEY" .env.local; then
    echo -e "${GREEN}✅ Variables encontradas${NC}"
else
    echo -e "${RED}❌ Variables faltantes en .env.local${NC}"
    exit 1
fi

# 3. Detener procesos de Next.js
echo ""
echo -e "${BLUE}Deteniendo procesos de Next.js...${NC}"
NEXT_PIDS=$(ps aux | grep -E "next dev|next-server" | grep -v grep | awk '{print $2}')

if [ -n "$NEXT_PIDS" ]; then
    echo "Procesos encontrados: $NEXT_PIDS"
    echo "$NEXT_PIDS" | xargs kill -9 2>/dev/null
    sleep 2
    echo -e "${GREEN}✅ Procesos detenidos${NC}"
else
    echo -e "${YELLOW}ℹ️  No hay procesos de Next.js corriendo${NC}"
fi

# 4. Limpiar caché
echo ""
echo -e "${BLUE}Limpiando caché de Next.js...${NC}"
if [ -d .next ]; then
    rm -rf .next
    echo -e "${GREEN}✅ Caché limpiada${NC}"
else
    echo -e "${YELLOW}ℹ️  No hay caché para limpiar${NC}"
fi

# 5. Verificar que las variables se pueden leer
echo ""
echo -e "${BLUE}Verificando que las variables se pueden leer...${NC}"
export $(cat .env.local | grep -v '^#' | xargs)
if [ -n "$NEXT_PUBLIC_SUPABASE_URL" ] && [ -n "$NEXT_PUBLIC_SUPABASE_ANON_KEY" ]; then
    echo -e "${GREEN}✅ Variables se pueden leer correctamente${NC}"
    echo "   URL: ${NEXT_PUBLIC_SUPABASE_URL:0:40}..."
    echo "   Key: ${NEXT_PUBLIC_SUPABASE_ANON_KEY:0:40}..."
else
    echo -e "${RED}❌ Error: No se pueden leer las variables${NC}"
    exit 1
fi

# 6. Instrucciones finales
echo ""
echo "=========================================="
echo -e "${GREEN}✅ Preparación completada${NC}"
echo "=========================================="
echo ""
echo "Ahora ejecuta:"
echo -e "${BLUE}npm run dev${NC}"
echo ""
echo "⚠️  IMPORTANTE:"
echo "   - Asegúrate de ejecutar 'npm run dev' en esta misma terminal"
echo "   - O en una nueva terminal en el mismo directorio"
echo "   - Las variables se cargarán automáticamente al iniciar"
echo ""

