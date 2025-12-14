#!/bin/bash

# Script para verificar que las variables de entorno de Supabase están configuradas

echo "🔍 Verificando variables de entorno de Supabase..."
echo ""

# Colores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Cargar variables de .env.local si existe
if [ -f .env.local ]; then
    export $(cat .env.local | grep -v '^#' | xargs)
fi

# Verificar NEXT_PUBLIC_SUPABASE_URL
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ]; then
    echo -e "${RED}❌ NEXT_PUBLIC_SUPABASE_URL no está configurada${NC}"
    ERROR=true
elif [[ "$NEXT_PUBLIC_SUPABASE_URL" == *"tu-proyecto"* ]] || [[ "$NEXT_PUBLIC_SUPABASE_URL" == *"ejemplo"* ]]; then
    echo -e "${YELLOW}⚠️  NEXT_PUBLIC_SUPABASE_URL parece ser un valor de ejemplo${NC}"
    echo "   Valor actual: $NEXT_PUBLIC_SUPABASE_URL"
    WARNING=true
else
    echo -e "${GREEN}✅ NEXT_PUBLIC_SUPABASE_URL está configurada${NC}"
    echo "   URL: $NEXT_PUBLIC_SUPABASE_URL"
fi

echo ""

# Verificar NEXT_PUBLIC_SUPABASE_ANON_KEY
if [ -z "$NEXT_PUBLIC_SUPABASE_ANON_KEY" ]; then
    echo -e "${RED}❌ NEXT_PUBLIC_SUPABASE_ANON_KEY no está configurada${NC}"
    ERROR=true
elif [[ "$NEXT_PUBLIC_SUPABASE_ANON_KEY" == *"tu_clave"* ]] || [[ "$NEXT_PUBLIC_SUPABASE_ANON_KEY" == *"ejemplo"* ]]; then
    echo -e "${YELLOW}⚠️  NEXT_PUBLIC_SUPABASE_ANON_KEY parece ser un valor de ejemplo${NC}"
    echo "   Valor actual: ${NEXT_PUBLIC_SUPABASE_ANON_KEY:0:20}..."
    WARNING=true
else
    echo -e "${GREEN}✅ NEXT_PUBLIC_SUPABASE_ANON_KEY está configurada${NC}"
    echo "   Key: ${NEXT_PUBLIC_SUPABASE_ANON_KEY:0:30}..."
fi

echo ""

# Resumen
if [ "$ERROR" = true ]; then
    echo -e "${RED}❌ Hay errores en la configuración${NC}"
    echo ""
    echo "Para solucionarlo:"
    echo "1. Ve a https://app.supabase.com"
    echo "2. Selecciona tu proyecto → Settings → API"
    echo "3. Copia Project URL y anon public key"
    echo "4. Edita .env.local y reemplaza los valores"
    exit 1
elif [ "$WARNING" = true ]; then
    echo -e "${YELLOW}⚠️  Las variables están configuradas pero parecen ser valores de ejemplo${NC}"
    echo "   Por favor, reemplázalas con tus credenciales reales de Supabase"
    exit 1
else
    echo -e "${GREEN}✅ Todas las variables de entorno están configuradas correctamente${NC}"
    exit 0
fi

