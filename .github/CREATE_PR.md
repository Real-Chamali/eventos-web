# 📝 Crear Pull Request desde `2025-12-14-jy0q` → `main`

**Fecha:** 14 de Diciembre de 2025

---

## 🚀 Pasos para Crear el PR

### Opción 1: Desde GitHub Web (Recomendado)

1. **Ve a tu repositorio:**
   https://github.com/Real-Chamali/eventos-web

2. **Haz clic en "Pull requests"** (en la barra superior)

3. **Haz clic en "New pull request"**

4. **Configura el PR:**
   - **Base:** `main` ← **Compare:** `2025-12-14-jy0q`
   - Verifica que los cambios se muestren correctamente

5. **Título del PR:**
   ```
   fix: optimización y corrección de errores
   ```

6. **Descripción del PR:**
   ```markdown
   ## 🎯 Resumen
   
   Este PR incluye optimizaciones y correcciones de errores para mejorar la calidad del código.
   
   ## ✅ Cambios Realizados
   
   - ✅ Corregir warning de eslint en instrumentation.ts
   - ✅ Mejorar manejo de promesas: convertir .then() a async/await en QuoteDetailPage
   - ✅ Corregir configuración de next.config.ts (eliminar turbo config inválido)
   - ✅ Mejorar manejo de errores en AdminLayout y DashboardLayout
   - ✅ Corregir ErrorBoundary para usar window.location.assign
   
   ## 🧪 Verificaciones
   
   - ✅ Build compila sin errores
   - ✅ Linting: 0 errores, 0 warnings
   - ✅ TypeScript: 0 errores
   - ✅ Tests: 6/6 pasando
   
   ## 📁 Archivos Modificados
   
   - `app/admin/layout.tsx`
   - `app/dashboard/layout.tsx`
   - `app/dashboard/quotes/[id]/page.tsx`
   - `components/ErrorBoundary.tsx`
   - `instrumentation.ts`
   - `next.config.ts`
   
   ## 🔍 Revisión
   
   Por favor, revisar:
   - [ ] Los cambios no rompen funcionalidad existente
   - [ ] El código sigue las convenciones del proyecto
   - [ ] Los tests pasan correctamente
   ```

7. **Haz clic en "Create pull request"**

8. **Espera a que los checks de CI/CD se ejecuten:**
   - ✅ test (lint + unit tests)
   - ✅ build
   - ✅ security

9. **Una vez que todos los checks pasen, puedes hacer merge**

---

### Opción 2: Desde la Terminal (GitHub CLI)

Si tienes GitHub CLI instalado:

```bash
gh pr create \
  --base main \
  --head 2025-12-14-jy0q \
  --title "fix: optimización y corrección de errores" \
  --body "Este PR incluye optimizaciones y correcciones de errores para mejorar la calidad del código."
```

---

## 🔗 Enlace Directo

Puedes usar este enlace directo para crear el PR:

https://github.com/Real-Chamali/eventos-web/compare/main...2025-12-14-jy0q

---

## ✅ Checklist Pre-Merge

Antes de hacer merge, verifica:

- [ ] Todos los checks de CI/CD pasan (✅ verde)
- [ ] El código ha sido revisado (si trabajas en equipo)
- [ ] No hay conflictos con `main`
- [ ] Los tests pasan localmente
- [ ] El build compila correctamente

---

## 🎯 Después del Merge

Una vez que el PR sea mergeado a `main`:

1. El workflow de CI/CD ejecutará el deploy automático
2. Los cambios estarán en producción
3. Puedes eliminar la rama `2025-12-14-jy0q` (opcional)

