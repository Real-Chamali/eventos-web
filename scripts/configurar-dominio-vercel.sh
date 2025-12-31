#!/bin/bash

# Script para configurar dominio personalizado en Vercel usando CLI
# Requiere: vercel CLI instalado y autenticado

set -e

echo "🌐 Configuración de Dominio Personalizado en Vercel"
echo "====================================================="
echo ""

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Verificar que vercel CLI está instalado
if ! command -v vercel &> /dev/null; then
    echo -e "${RED}❌ Vercel CLI no está instalado${NC}"
    echo "Instala con: npm i -g vercel"
    exit 1
fi

# Verificar que está autenticado
if ! vercel whoami &> /dev/null; then
    echo -e "${YELLOW}⚠️  No estás autenticado en Vercel${NC}"
    echo "Ejecuta: vercel login"
    exit 1
fi

echo -e "${GREEN}✅ Vercel CLI configurado correctamente${NC}"
echo ""

# Obtener información del proyecto actual
echo -e "${BLUE}📋 Información del Proyecto${NC}"
echo "----------------------------------------"

# Intentar obtener el proyecto desde el directorio actual
if [ -f ".vercel/project.json" ]; then
    PROJECT_NAME=$(cat .vercel/project.json | grep -o '"name":"[^"]*"' | cut -d'"' -f4 2>/dev/null || echo "")
    if [ ! -z "$PROJECT_NAME" ]; then
        echo -e "${GREEN}Proyecto detectado desde .vercel/project.json: ${PROJECT_NAME}${NC}"
    fi
fi

# Si no se encontró, intentar listar proyectos
if [ -z "$PROJECT_NAME" ]; then
    echo -e "${YELLOW}Listando proyectos disponibles...${NC}"
    vercel ls 2>/dev/null | head -10 || echo "No se pudieron listar proyectos"
    echo ""
    read -p "Nombre del proyecto en Vercel (o Enter para usar el del directorio actual): " PROJECT_NAME
fi

# Si aún no hay nombre, usar el nombre del directorio
if [ -z "$PROJECT_NAME" ]; then
    PROJECT_NAME=$(basename "$(pwd)")
    echo -e "${BLUE}Usando nombre del directorio: ${PROJECT_NAME}${NC}"
fi
echo ""

# Pedir dominio personalizado
echo -e "${BLUE}🌐 Configuración de Dominio${NC}"
echo "----------------------------------------"
read -p "Ingresa tu dominio personalizado (ej: eventos-web.com): " DOMAIN

if [ -z "$DOMAIN" ]; then
    echo -e "${RED}❌ Dominio no puede estar vacío${NC}"
    exit 1
fi

# Limpiar dominio (remover http://, https://, www.)
DOMAIN=$(echo "$DOMAIN" | sed -e 's|^[^/]*//||' -e 's|^www\.||' -e 's|/.*$||')

echo ""
echo -e "${YELLOW}📝 Configurando dominio: ${DOMAIN}${NC}"
echo ""

# Agregar dominio
echo -e "${BLUE}1. Agregando dominio a Vercel...${NC}"
if vercel domains add "$DOMAIN" 2>&1; then
    echo -e "${GREEN}✅ Dominio agregado exitosamente${NC}"
else
    echo -e "${YELLOW}⚠️  El dominio podría ya estar agregado o hubo un error${NC}"
fi
echo ""

# Mostrar instrucciones de DNS
echo -e "${BLUE}2. Configuración de DNS${NC}"
echo "----------------------------------------"
echo -e "${YELLOW}Ahora necesitas configurar los registros DNS en tu proveedor de dominio:${NC}"
echo ""

# Obtener registros DNS necesarios
echo -e "${GREEN}Registros DNS requeridos:${NC}"
echo ""
echo -e "${BLUE}Opción 1: CNAME (Recomendado)${NC}"
echo "   Tipo: CNAME"
echo "   Nombre: @ (o tu subdominio)"
echo "   Valor: cname.vercel-dns.com"
echo ""
echo -e "${BLUE}Opción 2: A Record${NC}"
echo "   Tipo: A"
echo "   Nombre: @ (o tu subdominio)"
echo "   Valor: 76.76.21.21"
echo ""

# Verificar si hay registros DNS específicos de Vercel
echo -e "${YELLOW}Para obtener los registros DNS exactos de Vercel:${NC}"
echo "   vercel domains inspect $DOMAIN"
echo ""

# Verificar estado del dominio
echo -e "${BLUE}3. Verificando estado del dominio...${NC}"
vercel domains ls
echo ""

# Mostrar próximos pasos
echo -e "${GREEN}✅ Configuración completada${NC}"
echo ""
echo -e "${BLUE}📋 Próximos pasos:${NC}"
echo "1. Configura los registros DNS en tu proveedor de dominio"
echo "2. Espera la propagación DNS (puede tardar hasta 48 horas)"
echo "3. Verifica el estado con: vercel domains inspect $DOMAIN"
echo "4. Una vez configurado, Vercel emitirá un certificado SSL automáticamente"
echo ""
echo -e "${YELLOW}💡 Comandos útiles:${NC}"
echo "   vercel domains ls                    # Listar todos los dominios"
echo "   vercel domains inspect $DOMAIN       # Ver detalles del dominio"
echo "   vercel domains rm $DOMAIN            # Eliminar dominio"
echo ""

