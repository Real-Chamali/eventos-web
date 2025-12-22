#!/bin/bash

# Script para ayudar a configurar CORS en Supabase Dashboard
# Este script muestra las URLs que necesitas agregar en Supabase

echo "🔧 Configuración de CORS para Supabase"
echo "======================================"
echo ""

# Obtener variables de entorno
if [ -f .env.local ]; then
  source .env.local
fi

SUPABASE_URL="${NEXT_PUBLIC_SUPABASE_URL:-no-configurado}"
APP_URL="${NEXT_PUBLIC_APP_URL:-http://localhost:3000}"
VERCEL_URL="${VERCEL_URL:-}"

echo "📋 URLs que debes configurar en Supabase Dashboard:"
echo ""
echo "1. Site URL:"
if [ "$VERCEL_URL" != "" ]; then
  echo "   Producción: https://$VERCEL_URL"
fi
echo "   Desarrollo: http://localhost:3000"
echo ""

echo "2. Redirect URLs (agregar todas estas líneas):"
echo "   http://localhost:3000/**"
if [ "$VERCEL_URL" != "" ]; then
  echo "   https://$VERCEL_URL/**"
fi
if [ "$APP_URL" != "http://localhost:3000" ]; then
  echo "   $APP_URL/**"
fi
echo ""

echo "📝 Pasos para configurar:"
echo "1. Ir a https://app.supabase.com"
echo "2. Seleccionar tu proyecto"
echo "3. Ir a Authentication → URL Configuration"
echo "4. Agregar las URLs mostradas arriba"
echo "5. Guardar cambios"
echo ""

echo "🔍 Verificar configuración actual:"
echo "   Supabase URL: $SUPABASE_URL"
echo "   App URL: $APP_URL"
if [ "$VERCEL_URL" != "" ]; then
  echo "   Vercel URL: https://$VERCEL_URL"
fi
echo ""

echo "✅ Después de configurar, reinicia tu servidor de desarrollo:"
echo "   npm run dev"
echo ""

