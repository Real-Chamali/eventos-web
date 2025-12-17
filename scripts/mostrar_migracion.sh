#!/bin/bash

# Script para mostrar migraciones SQL sin headers de editor
# Uso: ./scripts/mostrar_migracion.sh 001

if [ -z "$1" ]; then
    echo "Uso: ./scripts/mostrar_migracion.sh <número_migración>"
    echo "Ejemplo: ./scripts/mostrar_migracion.sh 001"
    exit 1
fi

MIGRATION_NUM=$1
MIGRATION_FILE="migrations/${MIGRATION_NUM}_*.sql"

# Buscar el archivo de migración
FILE=$(ls $MIGRATION_FILE 2>/dev/null | head -1)

if [ -z "$FILE" ]; then
    echo "❌ No se encontró migración con número $MIGRATION_NUM"
    echo "Archivos disponibles:"
    ls migrations/*.sql 2>/dev/null | sed 's/.*\//  - /'
    exit 1
fi

echo "📄 Mostrando: $FILE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Mostrar el contenido
cat "$FILE"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✅ Contenido listo para copiar y pegar en Supabase SQL Editor"
echo ""
echo "💡 Tip: Puedes copiar directamente con:"
echo "   cat $FILE | xclip -selection clipboard  # Linux"
echo "   cat $FILE | pbcopy                        # Mac"

