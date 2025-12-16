# 📖 Guía Paso a Paso Completa - Configuración Final

**Fecha:** 14 de Diciembre de 2025  
**Tiempo Estimado:** 10-15 minutos  
**Dificultad:** Fácil (solo seguir pasos)

---

## 🎯 Objetivo

Configurar la protección de ramas en GitHub y crear un Pull Request para mergear tus cambios a la rama principal.

---

## 📋 Índice

1. [Paso 1: Configurar Branch Protection Rules](#paso-1-configurar-branch-protection-rules)
2. [Paso 2: Crear Pull Request](#paso-2-crear-pull-request)
3. [Paso 3: Verificar y Mergear](#paso-3-verificar-y-mergear)
4. [Paso 4: Probar la Aplicación](#paso-4-probar-la-aplicación)
5. [Solución de Problemas](#solución-de-problemas)

---

## 🔒 Paso 1: Configurar Branch Protection Rules

**Tiempo:** 5 minutos  
**Dificultad:** Fácil

### 1.1. Abrir la Página de Configuración

1. **Abre tu navegador** (Chrome, Firefox, Edge, etc.)

2. **Ve a esta URL exacta:**
   ```
   https://github.com/Real-Chamali/eventos-web/settings/branches
   ```

3. **Si no estás logueado:**
   - Haz clic en "Sign in" (arriba a la derecha)
   - Ingresa tus credenciales de GitHub
   - Serás redirigido automáticamente

4. **Verás una página que dice:**
   - Título: "Branches" (en la barra lateral izquierda)
   - Sección: "Branch protection rules"
   - Botón: "Add rule" (o "Add branch protection rule")

### 1.2. Configurar Protección para `main`

1. **Haz clic en el botón "Add rule"** (botón verde/azul)

2. **En el campo "Branch name pattern":**
   - Escribe exactamente: `main`
   - Sin espacios, sin mayúsculas adicionales
   - Solo la palabra: `main`

3. **Activa estas opciones (marca las casillas):**

   #### ✅ Require a pull request before merging
   - Marca esta casilla
   - Aparecerán opciones adicionales:
     - ✅ **Require approvals:** Cambia el número a `1` (o déjalo en 1 si ya está)
     - ✅ **Dismiss stale pull request approvals when new commits are pushed**
       - Marca esta casilla también

   #### ✅ Require status checks to pass before merging
   - Marca esta casilla
   - Aparecerán opciones adicionales:
     - ✅ **Require branches to be up to date before merging**
       - Marca esta casilla
     - En "Status checks that are required":
       - Si aparece una lista, busca y marca:
         - `test`
         - `build`
         - `security`
       - Si no aparece lista aún, está bien, se llenará después

   #### ✅ Require conversation resolution before merging
   - Marca esta casilla

   #### ✅ Do not allow bypassing the above settings
   - Marca esta casilla
   - Si aparece "Restrict who can bypass":
     - Selecciona "Admins" o "No one"

   #### ❌ Allow force pushes
   - **NO marques esta casilla** (debe estar desmarcada)

   #### ❌ Allow deletions
   - **NO marques esta casilla** (debe estar desmarcada)

4. **Haz clic en el botón "Create"** (o "Save changes" si es un botón verde/azul al final)

5. **Verás un mensaje de confirmación** o la regla aparecerá en la lista

### 1.3. Configurar Protección para `develop`

1. **Haz clic en "Add rule" otra vez** (mismo botón de antes)

2. **En el campo "Branch name pattern":**
   - Escribe exactamente: `develop`

3. **Activa estas opciones:**

   #### ✅ Require a pull request before merging
   - Marca esta casilla
   - En "Require approvals": Cambia a `0` (cero)

   #### ✅ Require status checks to pass before merging
   - Marca esta casilla
   - ✅ **Require branches to be up to date before merging**
     - Marca esta casilla
   - En "Status checks":
     - Marca: `test` y `build`

   #### ⚠️ Allow force pushes
   - Marca esta casilla
   - Si aparece una opción, selecciona "Admins only" o "Specify who can force push" → "Admins"

   #### ❌ Allow deletions
   - **NO marques esta casilla**

4. **Haz clic en "Create"**

5. **Verifica que aparezcan 2 reglas en la lista:**
   - Una para `main`
   - Una para `develop`

### ✅ Verificación del Paso 1

Deberías ver en la página:
- ✅ Regla para `main` con todas las protecciones activas
- ✅ Regla para `develop` con protecciones básicas

**Si algo no funciona:**
- Asegúrate de estar en la URL correcta
- Verifica que tengas permisos de administrador en el repositorio
- Intenta refrescar la página (F5)

---

## 📝 Paso 2: Crear Pull Request

**Tiempo:** 2-3 minutos  
**Dificultad:** Fácil

### 2.1. Abrir la Página de Comparación

1. **Abre esta URL en tu navegador:**
   ```
   https://github.com/Real-Chamali/eventos-web/compare/main...2025-12-14-jy0q
   ```

2. **Verás una página que muestra:**
   - Título: "Comparing changes"
   - Base: `main` (a la izquierda)
   - Compare: `2025-12-14-jy0q` (a la derecha)
   - Una lista de archivos modificados
   - Estadísticas de cambios (inserciones, eliminaciones)

### 2.2. Verificar los Cambios

1. **Revisa que la comparación sea correcta:**
   - **Base:** Debe decir `main` (si dice otra cosa, haz clic y selecciona `main`)
   - **Compare:** Debe decir `2025-12-14-jy0q` (si dice otra cosa, haz clic y selecciona `2025-12-14-jy0q`)

2. **Desplázate hacia abajo** para ver:
   - Lista de archivos modificados
   - Estadísticas: "X files changed", "Y insertions", "Z deletions"
   - Deberías ver aproximadamente 10-15 archivos modificados

3. **Si todo se ve bien, continúa al siguiente paso**

### 2.3. Crear el Pull Request

1. **Haz clic en el botón verde "Create pull request"** (arriba a la derecha)

2. **Se abrirá un formulario con dos campos:**

   #### Campo 1: Título (Title)
   - **Borra** cualquier texto que aparezca
   - **Escribe exactamente:**
     ```
     fix: optimización y corrección de errores
     ```

   #### Campo 2: Descripción (Description)
   - **Borra** cualquier texto que aparezca
   - **Abre el archivo** `PR_DESCRIPTION.md` en tu editor
   - **Copia TODO el contenido** del archivo (Ctrl+A, Ctrl+C)
   - **Pega** el contenido en el campo de descripción (Ctrl+V)

   **O si prefieres, copia esta descripción:**

   ```markdown
   ## 🎯 Resumen

   Este PR incluye optimizaciones y correcciones de errores para mejorar la calidad del código.

   ## ✅ Cambios Realizados

   - ✅ Corregir warning de eslint en instrumentation.ts
   - ✅ Mejorar manejo de promesas: convertir .then() a async/await en QuoteDetailPage
   - ✅ Corregir configuración de next.config.ts (eliminar turbo config inválido)
   - ✅ Mejorar manejo de errores en AdminLayout y DashboardLayout
   - ✅ Corregir ErrorBoundary para usar window.location.assign
   - ✅ Agregar estrategia de branching y documentación de branch protection

   ## 🧪 Verificaciones

   - ✅ Build compila sin errores
   - ✅ Linting: 0 errores, 0 warnings
   - ✅ TypeScript: 0 errores
   - ✅ Tests: 6/6 pasando

   ## 📁 Archivos Modificados

   - `app/admin/layout.tsx` - Mejor manejo de errores
   - `app/dashboard/layout.tsx` - Mejor manejo de errores
   - `app/dashboard/quotes/[id]/page.tsx` - Async/await mejorado
   - `components/ErrorBoundary.tsx` - Corrección de navegación
   - `instrumentation.ts` - Warning corregido
   - `next.config.ts` - Configuración optimizada
   - `.github/BRANCH_PROTECTION_SETUP.md` - Nueva documentación
   - `.github/CREATE_PR.md` - Nueva documentación
   - `BRANCH_STRATEGY.md` - Nueva documentación

   ## 🔍 Revisión

   Por favor, revisar:
   - [ ] Los cambios no rompen funcionalidad existente
   - [ ] El código sigue las convenciones del proyecto
   - [ ] Los tests pasan correctamente
   - [ ] La documentación es clara y útil

   ## 📊 Commits Incluidos

   Este PR incluye 11 commits con mejoras y correcciones.
   ```

3. **Revisa que el título y la descripción estén correctos**

4. **Haz clic en el botón verde "Create pull request"** (abajo a la derecha del formulario)

### 2.4. Confirmación

1. **Serás redirigido a la página del Pull Request**

2. **Verás:**
   - El número del PR (ej: #1, #2, etc.)
   - El título que pusiste
   - La descripción
   - Una sección que dice "Checks" o "Status checks"

3. **Espera a que aparezcan los checks de CI/CD:**
   - Verás iconos de "loading" o "pending"
   - Los checks pueden tardar 2-5 minutos
   - Deberías ver:
     - ✅ `test` (o similar)
     - ✅ `build` (o similar)
     - ✅ `security` (o similar)

### ✅ Verificación del Paso 2

Deberías ver:
- ✅ PR creado con un número
- ✅ Checks de CI/CD ejecutándose (iconos amarillos/naranjas)
- ✅ Todos los archivos listados correctamente

**Si algo no funciona:**
- Verifica que la rama `2025-12-14-jy0q` exista
- Asegúrate de estar en la URL correcta
- Intenta crear el PR de nuevo

---

## ✅ Paso 3: Verificar y Mergear

**Tiempo:** 2-3 minutos (más tiempo de espera para checks)  
**Dificultad:** Fácil

### 3.1. Esperar a que los Checks Pasen

1. **En la página del PR, busca la sección "Checks" o "Status checks"**

2. **Espera hasta que todos los checks muestren ✅ (checkmark verde):**
   - Esto puede tardar 2-5 minutos
   - Los iconos cambiarán de ⏳ (pending) a ✅ (passed) o ❌ (failed)

3. **Si todos los checks pasan (✅ verde):**
   - Continúa al siguiente paso

4. **Si algún check falla (❌ rojo):**
   - Haz clic en el check fallido para ver detalles
   - Revisa el error
   - Si es un error menor, puedes continuar
   - Si es crítico, necesitarás corregirlo antes de mergear

### 3.2. Hacer Merge del Pull Request

1. **Una vez que todos los checks pasen, verás un botón verde "Merge pull request"**

2. **Haz clic en "Merge pull request"**

3. **Aparecerá un menú desplegable con opciones:**
   - **Selecciona:** "Create a merge commit" (recomendado)
   - O "Squash and merge" si prefieres combinar todos los commits en uno

4. **Haz clic en el botón "Confirm merge"** (o similar)

5. **Verás un mensaje de confirmación:**
   - "Pull request successfully merged"
   - O "Merged #X into main"

6. **Opcional: Eliminar la rama**
   - Aparecerá un botón "Delete branch"
   - Puedes hacer clic para eliminar `2025-12-14-jy0q` (ya no es necesaria)
   - O dejarla si quieres conservarla

### ✅ Verificación del Paso 3

Deberías ver:
- ✅ PR mergeado exitosamente
- ✅ Mensaje de confirmación
- ✅ Los cambios ahora están en la rama `main`

---

## 🧪 Paso 4: Probar la Aplicación

**Tiempo:** 5 minutos  
**Dificultad:** Fácil

### 4.1. Iniciar el Servidor de Desarrollo

1. **Abre tu terminal** (en Linux: Terminal, en Windows: PowerShell o CMD)

2. **Navega al directorio del proyecto:**
   ```bash
   cd /home/voldemort/StudioProjects/eventos-web
   ```

3. **Inicia el servidor:**
   ```bash
   npm run dev
   ```

4. **Espera a que aparezca:**
   ```
   ✓ Ready in X seconds
   ○ Local:        http://localhost:3000
   ```

### 4.2. Abrir la Aplicación en el Navegador

1. **Abre tu navegador**

2. **Ve a:**
   ```
   http://localhost:3000
   ```

3. **Deberías ver:**
   - La página de login
   - O la página principal si no hay autenticación requerida

### 4.3. Probar Funcionalidades

#### Probar Login

1. **Ingresa tus credenciales:**
   - Email: (tu email de Supabase)
   - Contraseña: (tu contraseña)

2. **Haz clic en "Iniciar Sesión"**

3. **Verifica:**
   - ✅ No aparecen errores en la consola (F12 → Console)
   - ✅ Eres redirigido según tu rol:
     - Si eres admin → `/admin`
     - Si eres vendor → `/dashboard`

#### Probar Dashboard

1. **Si eres vendor, deberías ver:**
   - El dashboard con opciones de cotizaciones
   - Menú lateral funcionando
   - Sin errores en consola

2. **Si eres admin, deberías ver:**
   - El panel de administración
   - Opciones de servicios, finanzas, etc.

#### Probar Crear Cotización

1. **Haz clic en "Nueva Cotización"** (o similar)

2. **Llena el formulario:**
   - Selecciona un cliente
   - Agrega servicios
   - Completa los campos

3. **Haz clic en "Guardar"**

4. **Verifica:**
   - ✅ Se muestra un mensaje de éxito (toast)
   - ✅ No hay errores en consola
   - ✅ La cotización se guarda correctamente

### 4.4. Verificar Consola del Navegador

1. **Abre las herramientas de desarrollador:**
   - Presiona `F12` o `Ctrl+Shift+I`
   - O clic derecho → "Inspeccionar"

2. **Ve a la pestaña "Console"**

3. **Verifica que:**
   - ✅ No hay errores en rojo
   - ✅ Solo hay mensajes informativos (si los hay)
   - ✅ No hay warnings críticos

### ✅ Verificación del Paso 4

Deberías poder:
- ✅ Iniciar sesión sin errores
- ✅ Navegar por el dashboard
- ✅ Crear cotizaciones
- ✅ Ver que todo funciona correctamente

**Si encuentras errores:**
- Revisa la consola del navegador (F12)
- Revisa la consola del servidor (terminal donde corre `npm run dev`)
- Verifica que las variables de entorno estén configuradas

---

## 🔧 Solución de Problemas

### Problema 1: No puedo acceder a la página de Branch Protection

**Solución:**
1. Verifica que estés logueado en GitHub
2. Verifica que tengas permisos de administrador en el repositorio
3. Intenta esta URL: `https://github.com/Real-Chamali/eventos-web/settings`
4. Luego haz clic en "Branches" en el menú lateral

### Problema 2: No puedo crear el Pull Request

**Solución:**
1. Verifica que la rama `2025-12-14-jy0q` exista:
   - Ve a: `https://github.com/Real-Chamali/eventos-web/branches`
   - Busca `2025-12-14-jy0q` en la lista

2. Si no existe, verifica en tu terminal:
   ```bash
   git branch -a
   ```
   - Deberías ver `2025-12-14-jy0q` en la lista

3. Si no está, haz push:
   ```bash
   git push origin 2025-12-14-jy0q
   ```

### Problema 3: Los checks de CI/CD fallan

**Solución:**
1. Haz clic en el check que falló para ver detalles
2. Revisa el error específico
3. Si es un error de linting, ejecuta localmente:
   ```bash
   npm run lint
   ```
4. Si es un error de tests, ejecuta:
   ```bash
   npm run test
   ```
5. Corrige los errores y haz commit:
   ```bash
   git add .
   git commit -m "fix: corregir errores de CI"
   git push
   ```

### Problema 4: No puedo hacer merge del PR

**Solución:**
1. Verifica que todos los checks hayan pasado (✅ verde)
2. Verifica que no haya conflictos (debería decir "This branch has no conflicts")
3. Si hay conflictos, necesitarás resolverlos primero
4. Verifica que tengas permisos para hacer merge

### Problema 5: La aplicación no inicia

**Solución:**
1. Verifica que estés en el directorio correcto:
   ```bash
   pwd
   # Debería mostrar: /home/voldemort/StudioProjects/eventos-web
   ```

2. Verifica que las dependencias estén instaladas:
   ```bash
   npm install
   ```

3. Verifica que el archivo `.env.local` exista:
   ```bash
   ls -la .env.local
   ```

4. Si no existe, créalo:
   ```bash
   cp .env.local.example .env.local
   # Luego edita .env.local con tus credenciales
   ```

### Problema 6: Error al hacer login

**Solución:**
1. Verifica que las variables de entorno estén configuradas:
   ```bash
   cat .env.local | grep SUPABASE
   ```

2. Verifica que las credenciales sean correctas
3. Reinicia el servidor:
   ```bash
   # Detén el servidor (Ctrl+C)
   npm run dev
   ```

---

## 📞 Ayuda Adicional

### Archivos de Referencia

- **Guía de Branch Protection:** `.github/BRANCH_PROTECTION_SETUP.md`
- **Guía de Crear PR:** `.github/CREATE_PR.md`
- **Estrategia de Branching:** `BRANCH_STRATEGY.md`
- **Reporte Final:** `REPORTE_FINAL_PROFESIONAL.md`

### Comandos Útiles

```bash
# Ver estado de git
git status

# Ver ramas
git branch -a

# Ver commits
git log --oneline -10

# Verificar linting
npm run lint

# Ejecutar tests
npm run test

# Compilar
npm run build
```

---

## ✅ Checklist Final

Antes de considerar todo completado, verifica:

- [ ] Branch protection configurado para `main`
- [ ] Branch protection configurado para `develop`
- [ ] Pull Request creado
- [ ] Todos los checks de CI/CD pasaron
- [ ] Pull Request mergeado exitosamente
- [ ] Aplicación inicia sin errores (`npm run dev`)
- [ ] Login funciona correctamente
- [ ] Dashboard carga sin errores
- [ ] No hay errores en la consola del navegador

---

## 🎉 ¡Felicitaciones!

Si completaste todos los pasos, tu aplicación está:
- ✅ Configurada profesionalmente
- ✅ Protegida con branch protection
- ✅ Lista para desarrollo colaborativo
- ✅ Funcionando correctamente

**¡Tu sistema está listo para producción!**

---

**Última actualización:** 14 de Diciembre de 2025  
**Versión de la Guía:** 1.0



