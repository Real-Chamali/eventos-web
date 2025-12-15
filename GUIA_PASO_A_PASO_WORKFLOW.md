# 📝 Guía Paso a Paso: Actualizar Workflow en GitHub

## 🎯 Objetivo
Actualizar el workflow de CI/CD para que use Jest en lugar de Vitest y limpie el caché de npm.

---

## 📋 PASO 1: Abrir el archivo del workflow

1. **Abre tu navegador** y ve a:
   ```
   https://github.com/Real-Chamali/eventos-web
   ```

2. **Verifica que estés en la rama correcta:**
   - En la parte superior izquierda, debería decir: `2025-12-14-jy0q`
   - Si dice otra cosa (como `main`), haz clic y selecciona `2025-12-14-jy0q`

3. **Navega al archivo del workflow:**
   - Haz clic en la carpeta `.github`
   - Luego haz clic en la carpeta `workflows`
   - Finalmente haz clic en `ci-cd.yml`

4. **Abre el archivo para editar:**
   - Haz clic en el ícono de **lápiz** (✏️) que está en la parte superior derecha del archivo
   - O presiona la tecla `e` (modo edición rápida)

---

## 📋 PASO 2: Copiar el contenido nuevo

1. **Abre el archivo local `WORKFLOW_CONTENT.txt`** en tu editor
   - Está en la raíz de tu proyecto: `/home/voldemort/StudioProjects/eventos-web/WORKFLOW_CONTENT.txt`

2. **Selecciona TODO el contenido:**
   - Presiona `Ctrl+A` (o `Cmd+A` en Mac)
   - O arrastra el mouse desde el inicio hasta el final

3. **Copia el contenido:**
   - Presiona `Ctrl+C` (o `Cmd+C` en Mac)
   - O clic derecho → Copiar

---

## 📋 PASO 3: Pegar en GitHub

1. **Vuelve a la pestaña del navegador** con GitHub abierto

2. **Selecciona TODO el contenido actual:**
   - Haz clic dentro del editor de texto
   - Presiona `Ctrl+A` (o `Cmd+A` en Mac) para seleccionar todo

3. **Borra el contenido antiguo:**
   - Presiona `Delete` o `Backspace`
   - O simplemente pega el nuevo contenido (sobrescribirá el anterior)

4. **Pega el contenido nuevo:**
   - Presiona `Ctrl+V` (o `Cmd+V` en Mac)
   - O clic derecho → Pegar

5. **Verifica que se haya pegado correctamente:**
   - Deberías ver el contenido completo del workflow
   - Busca las líneas que dicen "Clear npm cache" y "Verify Jest installation"

---

## 📋 PASO 4: Hacer commit

1. **Desplázate hacia abajo** en la página de GitHub

2. **En la sección "Commit changes":**
   - **Título del commit:** Escribe:
     ```
     fix: actualizar CI/CD para usar Jest y limpiar caché
     ```
   
   - **Descripción (opcional):** Puedes agregar:
     ```
     - Limpiar caché de npm antes de instalar dependencias
     - Verificar que Jest esté instalado y Vitest no
     - Prevenir errores de caché en CI/CD
     ```

3. **Selecciona dónde hacer commit:**
   - ✅ Asegúrate de que esté seleccionado: **"Commit directly to the 2025-12-14-jy0q branch"**
   - ❌ NO selecciones "Create a new branch"

4. **Haz clic en el botón verde:** **"Commit changes"**

---

## 📋 PASO 5: Verificar

1. **Después de hacer commit**, deberías ver un mensaje de confirmación

2. **El archivo debería mostrar:**
   - El commit nuevo en el historial
   - El contenido actualizado del workflow

3. **Verifica que el workflow tenga estos cambios:**
   - ✅ Línea 26-27: `Clear npm cache`
   - ✅ Línea 32-44: `Verify Jest installation`
   - ✅ Línea 50: `npm run test:coverage`

---

## ✅ Resultado Esperado

Después de completar estos pasos:

1. **El workflow estará actualizado** en GitHub
2. **El próximo push o PR** ejecutará el workflow nuevo
3. **CI/CD debería:**
   - ✅ Limpiar el caché de npm
   - ✅ Verificar que Jest esté instalado
   - ✅ Verificar que Vitest NO esté instalado
   - ✅ Ejecutar los tests con Jest correctamente

---

## 🆘 Si algo sale mal

### Si no puedes editar el archivo:
- Verifica que tengas permisos de escritura en el repositorio
- Asegúrate de estar en la rama `2025-12-14-jy0q`

### Si el contenido no se pega correctamente:
- Intenta pegar sección por sección
- O copia el contenido del archivo `WORKFLOW_CONTENT.txt` línea por línea

### Si necesitas ayuda:
- El archivo `WORKFLOW_CONTENT.txt` tiene el contenido completo
- Puedes comparar línea por línea con lo que ves en GitHub

---

## 📞 Siguiente Paso

Una vez que hayas hecho commit del workflow:
1. El próximo push activará el workflow actualizado
2. CI/CD debería funcionar correctamente con Jest
3. Los tests deberían pasar sin errores de Vitest

¡Listo para empezar! 🚀

