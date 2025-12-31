#!/bin/bash

# Script simplificado para agregar dominio en Vercel
# Uso: ./scripts/configurar-dominio-simple.sh tu-dominio.com

set -e

DOMAIN=$1

if [ -z "$DOMAIN" ]; then
    echo "❌ Error: Debes proporcionar un dominio"
    echo ""
    echo "Uso: ./scripts/configurar-dominio-simple.sh tu-dominio.com"
    echo ""
    echo "Ejemplo:"
    echo "  ./scripts/configurar-dominio-simple.sh eventos-web.com"
    exit 1
fi

# Limpiar dominio
DOMAIN=$(echo "$DOMAIN" | sed -e 's|^[^/]*//||' -e 's|^www\.||' -e 's|/.*$||')

echo "🌐 Configurando dominio: $DOMAIN"
echo ""

# Verificar autenticación
if ! vercel whoami &> /dev/null; then
    echo "❌ No estás autenticado. Ejecuta: vercel login"
    exit 1
fi

# Agregar dominio
echo "📝 Agregando dominio a Vercel..."
if vercel domains add "$DOMAIN"; then
    echo ""
    echo "✅ Dominio agregado exitosamente"
    echo ""
    echo "📋 Próximos pasos:"
    echo "1. Ver registros DNS necesarios:"
    echo "   vercel domains inspect $DOMAIN"
    echo ""
    echo "2. Configura los registros DNS en tu proveedor de dominio"
    echo ""
    echo "3. Verifica el estado:"
    echo "   vercel domains ls"
    echo ""
else
    echo ""
    echo "⚠️  Hubo un error al agregar el dominio"
    echo "Verifica que:"
    echo "  - El dominio sea válido"
    echo "  - No esté ya agregado (verifica con: vercel domains ls)"
    echo "  - Tengas permisos en el proyecto"
    exit 1
fi

