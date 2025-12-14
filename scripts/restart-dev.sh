#!/bin/bash

# Script para reiniciar el servidor de desarrollo de Next.js

echo "🔄 Reiniciando servidor de desarrollo..."

# Buscar procesos de Next.js
NEXT_PIDS=$(ps aux | grep -E "next dev|next-server" | grep -v grep | awk '{print $2}')

if [ -n "$NEXT_PIDS" ]; then
    echo "Deteniendo procesos de Next.js existentes..."
    echo "$NEXT_PIDS" | xargs kill -9 2>/dev/null
    sleep 2
    echo "✅ Procesos detenidos"
else
    echo "ℹ️  No se encontraron procesos de Next.js en ejecución"
fi

echo ""
echo "📋 Verificando variables de entorno..."
if [ -f .env.local ]; then
    export $(cat .env.local | grep -v '^#' | xargs)
    if [ -n "$NEXT_PUBLIC_SUPABASE_URL" ] && [ -n "$NEXT_PUBLIC_SUPABASE_ANON_KEY" ]; then
        echo "✅ Variables de entorno encontradas"
    else
        echo "⚠️  Advertencia: Algunas variables pueden estar faltando"
    fi
else
    echo "❌ Archivo .env.local no encontrado"
    exit 1
fi

echo ""
echo "🚀 Iniciando servidor de desarrollo..."
echo "   Ejecuta: npm run dev"
echo ""
echo "💡 Si el error persiste después de reiniciar:"
echo "   1. Verifica que .env.local tiene valores reales (no de ejemplo)"
echo "   2. Asegúrate de que las variables comienzan con NEXT_PUBLIC_"
echo "   3. No dejes espacios alrededor del signo = en .env.local"

