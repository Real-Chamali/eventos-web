# 🌳 Estrategia de Branching - Eventos Web

**Fecha:** 14 de Diciembre de 2025  
**Repositorio:** https://github.com/Victhorrr/eventos-web

---

## 📊 Estructura de Ramas

```
main (producción)
  │
  ├─ develop (desarrollo)
  │   │
  │   ├─ feature/2025-12-14-jy0q
  │   ├─ feature/nombre-feature
  │   ├─ fix/nombre-bug
  │   └─ refactor/nombre-refactor
  │
  └─ hotfix/nombre-urgente (directo desde main)
```

---

## 🎯 Tipos de Ramas

### 1. `main` - Producción
- **Propósito:** Código en producción
- **Protección:** Máxima (ver `.github/BRANCH_PROTECTION_SETUP.md`)
- **Merge desde:** `develop` o `hotfix/*`
- **Deploy:** Automático al hacer merge

### 2. `develop` - Desarrollo
- **Propósito:** Integración de features
- **Protección:** Media (ver `.github/BRANCH_PROTECTION_SETUP.md`)
- **Merge desde:** `feature/*`, `fix/*`, `refactor/*`
- **Deploy:** Staging (si está configurado)

### 3. `feature/*` - Nuevas Funcionalidades
- **Propósito:** Desarrollo de nuevas features
- **Protección:** Ninguna
- **Merge a:** `develop` o `main` (según el caso)
- **Ejemplo:** `feature/2025-12-14-jy0q`, `feature/nueva-cotizacion`

### 4. `fix/*` - Corrección de Bugs
- **Propósito:** Corrección de bugs
- **Protección:** Ninguna
- **Merge a:** `develop` o `main`
- **Ejemplo:** `fix/corregir-login-error`, `fix/validacion-cotizacion`

### 5. `hotfix/*` - Fixes Urgentes
- **Propósito:** Correcciones urgentes en producción
- **Protección:** Ninguna
- **Merge a:** `main` directamente
- **Ejemplo:** `hotfix/seguridad-critica`, `hotfix/caida-servicio`

### 6. `refactor/*` - Refactorización
- **Propósito:** Mejoras de código sin cambiar funcionalidad
- **Protección:** Ninguna
- **Merge a:** `develop`
- **Ejemplo:** `refactor/mejorar-middleware`, `refactor/optimizar-queries`

---

## 🔄 Workflow de Desarrollo

### Flujo Normal (Feature)

```bash
# 1. Crear feature branch desde develop
git checkout develop
git pull origin develop
git checkout -b feature/mi-nueva-feature

# 2. Desarrollar
git add .
git commit -m "feat: descripción"
git push origin feature/mi-nueva-feature

# 3. Crear PR a develop
# (Ver .github/CREATE_PR.md)

# 4. Después del merge, actualizar develop
git checkout develop
git pull origin develop
```

### Flujo de Hotfix (Urgente)

```bash
# 1. Crear hotfix desde main
git checkout main
git pull origin main
git checkout -b hotfix/fix-urgente

# 2. Hacer fix
git add .
git commit -m "fix: descripción del fix urgente"
git push origin hotfix/fix-urgente

# 3. Crear PR a main
# Merge inmediato después de revisión

# 4. Merge también a develop
git checkout develop
git merge main
git push origin develop
```

---

## 📝 Convención de Commits

Usar [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: nueva funcionalidad
fix: corrección de bug
docs: cambios en documentación
style: formato, sin cambios lógicos
refactor: mejora de código
test: agregar o mejorar tests
perf: mejoras de rendimiento
chore: tareas de mantenimiento
```

**Ejemplos:**
- `feat: agregar exportación a PDF`
- `fix: corregir error en login`
- `refactor: optimizar middleware de autenticación`

---

## 🛡️ Branch Protection Rules

Ver: `.github/BRANCH_PROTECTION_SETUP.md`

**Resumen:**
- `main`: Protección máxima, requiere PR + aprobación + checks
- `develop`: Protección media, requiere PR + checks
- `feature/*`, `fix/*`, etc.: Sin protección

---

## ✅ Checklist para PRs

Antes de crear un PR:

- [ ] Código compila sin errores (`npm run build`)
- [ ] Linting pasa (`npm run lint`)
- [ ] Tests pasan (`npm run test`)
- [ ] Commits siguen la convención
- [ ] Descripción del PR es clara
- [ ] No hay conflictos con la rama base

---

## 🔗 Enlaces Útiles

- **Branch Protection Setup:** `.github/BRANCH_PROTECTION_SETUP.md`
- **Crear PR:** `.github/CREATE_PR.md`
- **CI/CD Workflow:** `.github/workflows/ci-cd.yml`

---

**Última actualización:** 14 de Diciembre de 2025

