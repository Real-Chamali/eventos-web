# Instrucciones para Actualizar el Workflow en GitHub

## Problema
El push del workflow falló porque el token de acceso no tiene permisos de `workflow`. Necesitas actualizar el archivo manualmente en GitHub.

## Solución Rápida

### Opción 1: Actualizar desde la Web de GitHub (Recomendado)

1. **Abre el archivo en GitHub:**
   - Ve a: https://github.com/Real-Chamali/eventos-web
   - Navega a: `.github/workflows/ci-cd.yml`
   - Haz clic en el botón **"Edit"** (lápiz) en la parte superior derecha

2. **Copia el contenido:**
   - Abre el archivo `WORKFLOW_PARA_COPIAR.txt` en tu proyecto local
   - Copia TODO el contenido

3. **Pega y reemplaza:**
   - En GitHub, selecciona todo el contenido del archivo (Ctrl+A / Cmd+A)
   - Pega el nuevo contenido (Ctrl+V / Cmd+V)

4. **Guarda los cambios:**
   - Haz scroll hacia abajo
   - Escribe un mensaje de commit: `fix: corregir workflow con variables de entorno de Supabase`
   - Selecciona **"Commit directly to the 2025-12-14-jy0q branch"**
   - Haz clic en **"Commit changes"**

### Opción 2: Configurar Token con Permisos de Workflow

Si prefieres hacer push desde la terminal:

1. **Crear un nuevo Personal Access Token (PAT):**
   - Ve a: https://github.com/settings/tokens
   - Haz clic en **"Generate new token"** → **"Generate new token (classic)"**
   - Nombre: `eventos-web-workflow`
   - Expiración: Elige una fecha (ej: 90 días)
   - **Permisos requeridos:**
     - ✅ `repo` (todos los subpermisos)
     - ✅ `workflow` (CRÍTICO - permite modificar workflows)

2. **Configurar el token localmente:**
   ```bash
   git remote set-url origin https://TU_TOKEN@github.com/Real-Chamali/eventos-web.git
   ```
   Reemplaza `TU_TOKEN` con el token que acabas de crear.

3. **Hacer push:**
   ```bash
   git push
   ```

## Verificación

Después de actualizar el workflow:

1. **Verifica que el archivo esté correcto:**
   - Las líneas 101-104 deben tener:
     ```yaml
     env:
       NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
       NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}
     ```

2. **Verifica que los secrets estén configurados:**
   - Ve a: https://github.com/Real-Chamali/eventos-web/settings/secrets/actions
   - Debes tener:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

3. **Ejecuta el workflow:**
   - Haz un push a la rama `main` o `develop`
   - O ve a la pestaña "Actions" y ejecuta el workflow manualmente

## Notas Importantes

- El workflow ahora incluye:
  - ✅ Variables de entorno de Supabase en los jobs `test` y `deploy`
  - ✅ Timeouts para evitar cancelaciones
  - ✅ Caché de Next.js para builds más rápidos
  - ✅ Node.js 20.x (requerido por Next.js)
  - ✅ Verificación de Jest (no Vitest)

- Los cambios locales ya están commiteados, solo falta actualizar el archivo en GitHub.

