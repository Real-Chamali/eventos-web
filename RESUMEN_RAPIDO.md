# ⚡ Resumen Rápido - Pasos Esenciales

**Para la guía completa, ver:** `GUIA_PASO_A_PASO_COMPLETA.md`

---

## 🎯 4 Pasos Principales

### 1️⃣ Configurar Branch Protection (5 min)

**URL:** https://github.com/Real-Chamali/eventos-web/settings/branches

**Para `main`:**
- ✅ Require pull request
- ✅ Require 1 approval
- ✅ Require status checks (test, build, security)
- ✅ Require conversation resolution
- ❌ NO force pushes
- ❌ NO deletions

**Para `develop`:**
- ✅ Require pull request
- ✅ Require 0 approvals
- ✅ Require status checks (test, build)
- ⚠️ Force pushes solo para admins
- ❌ NO deletions

---

### 2️⃣ Crear Pull Request (2 min)

**URL:** https://github.com/Real-Chamali/eventos-web/compare/main...2025-12-14-jy0q

**Título:**
```
fix: optimización y corrección de errores
```

**Descripción:** Copia desde `PR_DESCRIPTION.md`

---

### 3️⃣ Mergear PR (2 min)

1. Espera a que los checks pasen (✅ verde)
2. Haz clic en "Merge pull request"
3. Selecciona "Create a merge commit"
4. Confirma el merge

---

### 4️⃣ Probar Aplicación (5 min)

```bash
npm run dev
# Abre http://localhost:3000
# Prueba login, dashboard, crear cotización
```

---

## 🔗 Enlaces Directos

- **Branch Protection:** https://github.com/Real-Chamali/eventos-web/settings/branches
- **Crear PR:** https://github.com/Real-Chamali/eventos-web/compare/main...2025-12-14-jy0q
- **Repositorio:** https://github.com/Real-Chamali/eventos-web

---

**Para instrucciones detalladas, ver:** `GUIA_PASO_A_PASO_COMPLETA.md`


