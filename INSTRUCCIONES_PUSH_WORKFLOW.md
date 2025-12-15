# 🚀 Instrucciones para Actualizar el Workflow en GitHub

## Problema Actual
CI/CD está ejecutando Vitest en lugar de Jest porque el workflow actualizado no está en el repositorio remoto.

## ✅ Solución: Editar desde GitHub Web

### Paso 1: Abrir el archivo del workflow
1. Ve a: https://github.com/Real-Chamali/eventos-web
2. Cambia a la rama: `2025-12-14-jy0q`
3. Navega a: `.github/workflows/ci-cd.yml`
4. Haz clic en el ícono de **lápiz** (Edit)

### Paso 2: Reemplazar el contenido
1. **Selecciona TODO el contenido** del archivo (Ctrl+A o Cmd+A)
2. **Borra** el contenido actual
3. **Copia** el contenido completo del archivo `WORKFLOW_CONTENT.txt` que está en tu proyecto local
4. **Pega** el contenido nuevo

### Paso 3: Hacer commit
1. Desplázate hacia abajo
2. En "Commit changes", escribe:
   ```
   fix: actualizar CI/CD para usar Jest y limpiar caché
   ```
3. Selecciona: **"Commit directly to the 2025-12-14-jy0q branch"**
4. Haz clic en **"Commit changes"**

## ✅ Verificación

Después de hacer commit, el próximo push o PR debería:
- ✅ Limpiar el caché de npm
- ✅ Verificar que Jest esté instalado
- ✅ Verificar que Vitest NO esté instalado
- ✅ Ejecutar `npm run test:coverage` que usa Jest

## 📋 Cambios Clave en el Workflow

El workflow actualizado incluye:

1. **Limpieza de caché:**
   ```yaml
   - name: Clear npm cache
     run: npm cache clean --force
   ```

2. **Verificación de Jest:**
   ```yaml
   - name: Verify Jest installation
     run: |
       if npm list vitest 2>/dev/null; then
         echo "ERROR: Vitest todavía está instalado"
         exit 1
       fi
       if ! npm list jest 2>/dev/null; then
         echo "ERROR: Jest no está instalado"
         exit 1
       fi
   ```

3. **Ejecución de tests:**
   ```yaml
   - name: Run unit tests
     run: npm run test:coverage
   ```

## 🎯 Resultado Esperado

Después de actualizar el workflow, CI/CD debería:
- ✅ Instalar Jest correctamente
- ✅ Ejecutar los tests con Jest
- ✅ Generar coverage correctamente
- ✅ No intentar ejecutar Vitest

