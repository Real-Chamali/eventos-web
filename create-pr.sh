#!/bin/bash

# Script para crear Pull Request
# Este script proporciona el enlace directo y la descripción

echo "📝 CREAR PULL REQUEST"
echo "===================="
echo ""

echo "🔗 ENLACE DIRECTO PARA CREAR EL PR:"
echo "-----------------------------------"
echo ""
echo "https://github.com/Victhorrr/eventos-web/compare/main...2025-12-14-jy0q"
echo ""

echo "📋 PASOS:"
echo "--------"
echo ""
echo "1. Abre el enlace de arriba en tu navegador"
echo ""
echo "2. Verifica que:"
echo "   - Base: main"
echo "   - Compare: 2025-12-14-jy0q"
echo ""
echo "3. Título del PR:"
echo "   fix: optimización y corrección de errores"
echo ""
echo "4. Descripción del PR (copia desde PR_DESCRIPTION.md):"
echo ""
cat PR_DESCRIPTION.md
echo ""
echo "5. Haz clic en 'Create pull request'"
echo ""
echo "6. Espera a que los checks de CI/CD se ejecuten"
echo ""
echo "7. Una vez que todos los checks pasen (✅ verde), puedes hacer merge"
echo ""

echo "✅ ¡PR creado!"
echo ""

