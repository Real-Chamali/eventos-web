#!/bin/bash

# Script para diagnosticar y resolver problemas con variables de entorno

echo "🔍 Diagnóstico de Variables de Entorno"
echo "======================================"
echo ""

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 1. Verificar que .env.local existe
echo -e "${BLUE}1. Verificando archivo .env.local...${NC}"
if [ -f .env.local ]; then
    echo -e "${GREEN}✅ Archivo .env.local encontrado${NC}"
else
    echo -e "${RED}❌ Archivo .env.local NO encontrado${NC}"
    echo ""
    echo "Solución:"
    echo "1. Copia .env.local.example a .env.local:"
    echo "   cp .env.local.example .env.local"
    echo "2. Edita .env.local con tus credenciales de Supabase"
    exit 1
fi

echo ""

# 2. Verificar contenido del archivo
echo -e "${BLUE}2. Verificando variables en .env.local...${NC}"
if grep -q "NEXT_PUBLIC_SUPABASE_URL" .env.local && grep -q "NEXT_PUBLIC_SUPABASE_ANON_KEY" .env.local; then
    echo -e "${GREEN}✅ Variables encontradas en .env.local${NC}"
    
    # Verificar que no sean valores de ejemplo
    if grep -q "tu-proyecto\|tu_clave\|ejemplo" .env.local; then
        echo -e "${YELLOW}⚠️  Advertencia: Parece que hay valores de ejemplo${NC}"
        echo "   Por favor, reemplázalos con tus credenciales reales de Supabase"
    fi
else
    echo -e "${RED}❌ Variables NO encontradas en .env.local${NC}"
    exit 1
fi

echo ""

# 3. Verificar procesos de Next.js
echo -e "${BLUE}3. Verificando procesos de Next.js...${NC}"
NEXT_PIDS=$(ps aux | grep -E "next dev|next-server" | grep -v grep | awk '{print $2}')

if [ -n "$NEXT_PIDS" ]; then
    echo -e "${YELLOW}⚠️  Procesos de Next.js encontrados:${NC}"
    echo "$NEXT_PIDS" | while read pid; do
        echo "   PID: $pid"
    done
    echo ""
    echo -e "${YELLOW}⚠️  IMPORTANTE: El servidor necesita reiniciarse para cargar las variables${NC}"
    echo ""
    echo "Para solucionarlo:"
    echo "1. Detén el servidor actual (Ctrl+C en la terminal donde corre)"
    echo "2. Reinicia el servidor:"
    echo "   npm run dev"
    echo ""
    read -p "¿Quieres que detenga los procesos automáticamente? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Deteniendo procesos..."
        echo "$NEXT_PIDS" | xargs kill -9 2>/dev/null
        sleep 2
        echo -e "${GREEN}✅ Procesos detenidos${NC}"
        echo ""
        echo "Ahora ejecuta: npm run dev"
    fi
else
    echo -e "${GREEN}✅ No hay procesos de Next.js corriendo${NC}"
    echo ""
    echo "Para iniciar el servidor:"
    echo "   npm run dev"
fi

echo ""

# 4. Verificar formato del archivo
echo -e "${BLUE}4. Verificando formato de .env.local...${NC}"
INVALID_LINES=$(grep -E "^[A-Z_]+[[:space:]]*=" .env.local | grep -v "^#" || true)
if [ -n "$INVALID_LINES" ]; then
    echo -e "${YELLOW}⚠️  Líneas con espacios alrededor del = detectadas:${NC}"
    echo "$INVALID_LINES" | head -3
    echo ""
    echo "Formato correcto: VARIABLE=valor"
    echo "Formato incorrecto: VARIABLE = valor (con espacios)"
else
    echo -e "${GREEN}✅ Formato correcto${NC}"
fi

echo ""
echo "======================================"
echo -e "${BLUE}📋 Resumen${NC}"
echo "======================================"
echo ""
echo "Si el problema persiste después de reiniciar:"
echo "1. Verifica que .env.local está en la raíz del proyecto (mismo nivel que package.json)"
echo "2. Verifica que no hay espacios alrededor del = en las variables"
echo "3. Verifica que las variables comienzan con NEXT_PUBLIC_"
echo "4. Limpia la caché de Next.js:"
echo "   rm -rf .next"
echo "   npm run dev"
echo ""

