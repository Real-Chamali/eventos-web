# 🔧 Solución: Push del Workflow de CI/CD

## Problema
El push del workflow fue rechazado porque el token de GitHub no tiene permisos de `workflow`.

## ✅ Soluciones

### Opción 1: Actualizar Token de GitHub (Recomendado)

1. **Ir a GitHub Settings:**
   - Ve a: https://github.com/settings/tokens
   - O: Tu perfil → Settings → Developer settings → Personal access tokens

2. **Crear/Actualizar Token:**
   - Si tienes un token existente, edítalo
   - Si no, crea uno nuevo: "Generate new token (classic)"

3. **Permisos Necesarios:**
   - ✅ `repo` (acceso completo al repositorio)
   - ✅ `workflow` (actualizar workflows de GitHub Actions)
   - ✅ `write:packages` (opcional, para publicar paquetes)

4. **Actualizar el Token:**
   ```bash
   # Si usas HTTPS:
   git remote set-url origin https://TU_TOKEN@github.com/Real-Chamali/eventos-web.git
   
   # O actualizar la configuración de git:
   git config --global credential.helper store
   # Luego al hacer push, ingresa tu usuario y el token como contraseña
   ```

### Opción 2: Push Manual desde GitHub Web (Más Fácil)

1. **Ir al repositorio:**
   - https://github.com/Real-Chamali/eventos-web

2. **Ir a la rama:**
   - Cambia a la rama `2025-12-14-jy0q`

3. **Editar el archivo:**
   - Ve a `.github/workflows/ci-cd.yml`
   - Haz clic en "Edit" (lápiz)
   - Copia el contenido del archivo local

4. **Pegar y commitear:**
   - Pega el contenido actualizado
   - Haz commit directamente desde la web
   - Esto evitará el problema de permisos

### Opción 3: Usar SSH en lugar de HTTPS

1. **Configurar SSH:**
   ```bash
   # Verificar si tienes clave SSH
   ls -la ~/.ssh/id_rsa.pub
   
   # Si no tienes, generar una:
   ssh-keygen -t ed25519 -C "tu_email@example.com"
   
   # Agregar a GitHub:
   cat ~/.ssh/id_rsa.pub
   # Copiar y agregar en: https://github.com/settings/keys
   ```

2. **Cambiar remote a SSH:**
   ```bash
   git remote set-url origin git@github.com:Real-Chamali/eventos-web.git
   git push
   ```

### Opción 4: El Workflow Funcionará Sin Cambios

**Nota importante:** El workflow debería funcionar con el commit anterior (`43d142f`) que ya tiene Jest configurado. El problema puede ser solo caché.

**Para verificar:**
- Espera a que CI/CD ejecute el siguiente push
- Si falla, entonces necesitas hacer push del workflow actualizado

## 🚀 Pasos Rápidos (Recomendado)

**Opción más rápida: Push Manual desde GitHub Web**

1. Abre: https://github.com/Real-Chamali/eventos-web/blob/2025-12-14-jy0q/.github/workflows/ci-cd.yml
2. Haz clic en el ícono de lápiz (Edit)
3. Copia el contenido del archivo local `.github/workflows/ci-cd.yml`
4. Pega y haz commit desde la web

## 📋 Contenido del Workflow Actualizado

El archivo `.github/workflows/ci-cd.yml` ahora incluye:
- Limpieza de caché de npm antes de instalar
- Verificación de que Jest esté instalado
- Verificación de que Vitest NO esté instalado

Esto asegura que CI/CD use Jest correctamente.

