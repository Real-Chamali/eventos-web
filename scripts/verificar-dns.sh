#!/bin/bash

# Script para verificar el estado del DNS
# Uso: ./scripts/verificar-dns.sh

DOMAIN="real-chamali-vercel.app"
VERCEL_IP="76.76.21.21"

echo "🔍 Verificando DNS para $DOMAIN"
echo "=================================="
echo ""

# Verificar con dig
if command -v dig &> /dev/null; then
    echo "📊 Verificando con dig..."
    RESULT=$(dig +short $DOMAIN A)
    if [ -z "$RESULT" ]; then
        echo "❌ No se encontraron registros A"
    else
        echo "✅ Registros A encontrados:"
        echo "$RESULT"
        if echo "$RESULT" | grep -q "$VERCEL_IP"; then
            echo "✅ ✅ El registro A apunta correctamente a $VERCEL_IP"
        else
            echo "⚠️  El registro A no apunta a $VERCEL_IP"
        fi
    fi
    echo ""
fi

# Verificar con nslookup
if command -v nslookup &> /dev/null; then
    echo "📊 Verificando con nslookup..."
    nslookup $DOMAIN
    echo ""
fi

# Verificar con curl
echo "🌐 Intentando conectar al dominio..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "https://$DOMAIN" 2>&1)
if [ "$HTTP_CODE" = "000" ]; then
    echo "❌ No se puede conectar al dominio (DNS no configurado)"
elif [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "301" ] || [ "$HTTP_CODE" = "302" ]; then
    echo "✅ El dominio responde (HTTP $HTTP_CODE)"
else
    echo "⚠️  El dominio responde pero con código HTTP $HTTP_CODE"
fi
echo ""

# Verificar en Vercel
echo "📋 Verificando estado en Vercel..."
vercel domains inspect $DOMAIN 2>&1 | grep -A 10 "Nameservers\|WARN\|Valid" || vercel domains inspect $DOMAIN 2>&1 | tail -20

echo ""
echo "✅ Verificación completada"
echo ""
echo "📝 Si el DNS no está configurado, necesitas:"
echo "   1. Ir a tu registrador de dominio"
echo "   2. Agregar registro A: @ → $VERCEL_IP"
echo "   3. Esperar propagación (5min - 24h)"

