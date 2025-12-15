# 🔧 Solución: "Required status checks cannot be empty"

**Problema:** GitHub requiere que agregues al menos un status check, pero aún no hay checks disponibles porque el CI/CD no se ha ejecutado.

---

## ✅ Solución Rápida (Recomendada)

### Opción 1: Deshabilitar Temporalmente los Status Checks

**Para `main`:**
1. En la página de Branch Protection, cuando veas el error:
2. **Desmarca temporalmente** la opción:
   - ❌ "Require status checks to pass before merging"
3. **Marca las otras opciones:**
   - ✅ Require a pull request before merging
   - ✅ Require 1 approval
   - ✅ Require conversation resolution
   - ✅ Do not allow bypassing
   - ❌ Allow force pushes
   - ❌ Allow deletions
4. **Haz clic en "Create"**
5. **Después de crear el PR y que se ejecute el CI/CD, vuelve y activa los status checks**

**Para `develop`:**
- Mismo proceso, pero puedes dejar los status checks deshabilitados si prefieres

---

### Opción 2: Crear el PR Primero y Luego Configurar los Checks

**Pasos:**

1. **Primero, crea el Pull Request** (sin branch protection aún):
   - Ve a: https://github.com/Real-Chamali/eventos-web/compare/main...2025-12-14-jy0q
   - Crea el PR normalmente

2. **Espera a que se ejecute el CI/CD** (2-5 minutos):
   - Los workflows se ejecutarán automáticamente
   - Verás checks como: `test`, `build`, `security`

3. **Luego configura Branch Protection:**
   - Ve a: https://github.com/Real-Chamali/eventos-web/settings/branches
   - Ahora cuando marques "Require status checks", verás la lista de checks disponibles
   - Selecciona los checks que quieras requerir

---

## 📋 Instrucciones Detalladas para Opción 1

### Configurar `main` SIN Status Checks (Temporalmente)

1. **Ve a:** https://github.com/Real-Chamali/eventos-web/settings/branches

2. **Haz clic en "Add rule"**

3. **Branch name pattern:** `main`

4. **Marca SOLO estas opciones:**
   - ✅ **Require a pull request before merging**
     - Require approvals: `1`
     - ✅ Dismiss stale pull request approvals when new commits are pushed
   
   - ❌ **Require status checks to pass before merging** ← **NO MARQUES ESTA**
   
   - ✅ **Require conversation resolution before merging**
   
   - ✅ **Do not allow bypassing the above settings**
   
   - ❌ **Allow force pushes** ← NO marcar
   
   - ❌ **Allow deletions** ← NO marcar

5. **Haz clic en "Create"**

6. **Verás la regla creada sin el error**

### Configurar `develop` SIN Status Checks

1. **Haz clic en "Add rule" otra vez**

2. **Branch name pattern:** `develop`

3. **Marca estas opciones:**
   - ✅ **Require a pull request before merging**
     - Require approvals: `0`
   
   - ❌ **Require status checks** ← NO marcar por ahora
   
   - ⚠️ **Allow force pushes** → Solo para admins
   
   - ❌ **Allow deletions** ← NO marcar

4. **Haz clic en "Create"**

---

## 🔄 Después de Crear el PR: Activar Status Checks

Una vez que hayas creado el PR y los workflows se ejecuten:

1. **Ve a:** https://github.com/Real-Chamali/eventos-web/settings/branches

2. **Haz clic en la regla de `main`** (para editarla)

3. **Ahora marca:**
   - ✅ **Require status checks to pass before merging**
   - ✅ **Require branches to be up to date before merging**
   - En la lista de checks, marca:
     - `test` (o `ci / test`)
     - `build` (o `ci / build`)
     - `security` (si aparece)

4. **Haz clic en "Save changes"**

---

## 🎯 Recomendación

**Para empezar rápido:**
1. ✅ Usa la **Opción 1** (deshabilitar status checks temporalmente)
2. ✅ Crea el PR
3. ✅ Espera a que se ejecute el CI/CD
4. ✅ Luego vuelve y activa los status checks

**Esto te permite avanzar sin bloqueos y configurar los checks después.**

---

## 📝 Checklist Alternativo

### Configuración Mínima (Sin Status Checks)

**Para `main`:**
- ✅ Require pull request
- ✅ Require 1 approval
- ✅ Require conversation resolution
- ✅ Do not allow bypassing
- ❌ NO force pushes
- ❌ NO deletions

**Para `develop`:**
- ✅ Require pull request
- ✅ Require 0 approvals
- ⚠️ Force pushes solo para admins
- ❌ NO deletions

**Status checks:** Se activan después de crear el primer PR

---

## ✅ Verificación

Después de seguir estos pasos:
- ✅ No deberías ver el error de "status checks cannot be empty"
- ✅ Las reglas se crearán exitosamente
- ✅ Podrás crear el PR sin problemas
- ✅ Los checks se activarán automáticamente cuando se ejecute el CI/CD

---

**¿Necesitas ayuda con algún paso específico?** La guía completa está en `GUIA_PASO_A_PASO_COMPLETA.md`


