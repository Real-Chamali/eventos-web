# 🔒 Configuración de Branch Protection Rules

**Fecha:** 14 de Diciembre de 2025  
**Repositorio:** https://github.com/Victhorrr/eventos-web

---

## 📋 Instrucciones Paso a Paso

### Paso 1: Acceder a Branch Protection Settings

1. Ve a: https://github.com/Victhorrr/eventos-web
2. Haz clic en **Settings** (en la barra superior del repositorio)
3. En el menú lateral izquierdo, haz clic en **Branches**
4. En la sección "Branch protection rules", haz clic en **Add rule**

---

## 🛡️ Configuración para Rama `main` (Producción)

### Configuración Básica

**Branch name pattern:** `main`

### Protecciones a Activar:

#### ✅ Require a pull request before merging
- ✅ **Require approvals:** `1` (o más si trabajas en equipo)
- ✅ **Dismiss stale pull request approvals when new commits are pushed**
- ✅ **Require review from Code Owners** (si tienes CODEOWNERS configurado)

#### ✅ Require status checks to pass before merging
- ✅ **Require branches to be up to date before merging**
- ✅ **Status checks requeridos:**
  - `test` (lint + unit tests)
  - `build`
  - `security` (npm audit)

#### ✅ Require conversation resolution before merging
- ✅ Activar esta opción

#### ✅ Require linear history (Opcional pero recomendado)
- ✅ Activar si quieres mantener un historial limpio

#### ✅ Do not allow bypassing the above settings
- ✅ **Restrict who can bypass:** Solo admins del repositorio

#### ❌ Allow force pushes
- ❌ **NO activar** - Desactivado

#### ❌ Allow deletions
- ❌ **NO activar** - Desactivado

### Guardar
Haz clic en **Create** o **Save changes**

---

## 🛡️ Configuración para Rama `develop` (Desarrollo)

### Configuración Básica

**Branch name pattern:** `develop`

### Protecciones a Activar:

#### ✅ Require a pull request before merging
- ✅ **Require approvals:** `0` (auto-merge permitido)
- ✅ **Dismiss stale pull request approvals when new commits are pushed**

#### ✅ Require status checks to pass before merging
- ✅ **Require branches to be up to date before merging**
- ✅ **Status checks requeridos:**
  - `test` (lint + unit tests)
  - `build`

#### ❌ Require conversation resolution before merging
- ❌ **NO activar** para develop (más flexible)

#### ❌ Require linear history
- ❌ **NO activar** para develop

#### ⚠️ Allow force pushes
- ⚠️ **Solo para admins** - Activar pero restringir a admins

#### ❌ Allow deletions
- ❌ **NO activar** - Desactivado

### Guardar
Haz clic en **Create** o **Save changes**

---

## 📊 Resumen de Configuración

| Protección | `main` | `develop` |
|------------|--------|-----------|
| PR Requerido | ✅ Sí (1 aprobación) | ✅ Sí (0 aprobaciones) |
| Status Checks | ✅ Sí (test, build, security) | ✅ Sí (test, build) |
| Force Push | ❌ No | ⚠️ Solo admins |
| Deletable | ❌ No | ❌ No |
| Linear History | ✅ Sí | ❌ No |
| Bypass | ❌ Solo admins | ⚠️ Permitido |

---

## ✅ Verificación

Después de configurar, verifica que:

1. ✅ No puedes hacer push directo a `main` sin PR
2. ✅ Los status checks se ejecutan en PRs
3. ✅ No puedes hacer force push a `main`
4. ✅ No puedes eliminar `main` o `develop`

---

## 🔗 Enlaces Útiles

- **Branch Protection Docs:** https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches
- **Status Checks:** https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches#require-status-checks-before-merging

---

**Nota:** Estas configuraciones se aplican automáticamente cuando creas Pull Requests hacia estas ramas protegidas.

