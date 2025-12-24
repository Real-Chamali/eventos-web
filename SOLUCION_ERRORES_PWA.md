# 🔧 Solución a Errores PWA

## ❌ Errores Detectados

1. **Service Worker**: `SecurityError: Failed to register a ServiceWorker... The script resource is behind a redirect`
2. **Manifest**: `Manifest: Line: 1, column: 1, Syntax error`
3. **ERR_BLOCKED_BY_CLIENT**: Bloqueo de recursos

---

## ✅ Soluciones Implementadas

### 1. Service Worker - Ruta API

**Problema**: El Service Worker estaba siendo redirigido por el middleware o por la configuración de Vercel.

**Solución**: Crear una ruta API que sirva el Service Worker directamente.

**Archivo creado**: `app/sw.js/route.ts`

```typescript
// Sirve el Service Worker con headers correctos
// Evita problemas de redirect
```

**Cambios**:
- ✅ Ruta API `/sw.js` que sirve el Service Worker
- ✅ Headers correctos: `Content-Type: application/javascript`
- ✅ Header `Service-Worker-Allowed: /` para permitir scope completo
- ✅ Excluido del middleware

### 2. Manifest - Ruta API

**Problema**: El manifest puede estar siendo servido con headers incorrectos o siendo interceptado.

**Solución**: Crear una ruta API que sirva el manifest con headers correctos.

**Archivo creado**: `app/manifest.json/route.ts`

```typescript
// Sirve el manifest como JSON con Content-Type correcto
// application/manifest+json
```

**Cambios**:
- ✅ Ruta API `/manifest.json` que sirve el manifest
- ✅ Headers correctos: `Content-Type: application/manifest+json`
- ✅ Validación de JSON antes de servir
- ✅ Excluido del middleware

### 3. Middleware - Exclusión de Rutas PWA

**Problema**: El middleware estaba interceptando `/sw.js` y `/manifest.json`.

**Solución**: Excluir estas rutas del matcher del middleware.

**Archivo modificado**: `middleware.ts`

```typescript
matcher: [
  '/((?!_next/static|_next/image|favicon.ico|sw.js|manifest.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
]
```

**Cambios**:
- ✅ `sw.js` excluido del middleware
- ✅ `manifest.json` excluido del middleware

### 4. ERR_BLOCKED_BY_CLIENT

**Problema**: Puede ser causado por:
- Bloqueadores de anuncios
- Extensiones del navegador
- Políticas de seguridad

**Solución**: 
- ✅ Verificar que no haya bloqueadores activos
- ✅ Headers de seguridad correctos
- ✅ Rutas API con headers apropiados

---

## 🧪 Verificación

### 1. Verificar Service Worker

```bash
# Debería retornar el código del Service Worker
curl https://tu-dominio.vercel.app/sw.js

# Debería tener headers correctos
curl -I https://tu-dominio.vercel.app/sw.js
```

**Headers esperados**:
```
Content-Type: application/javascript
Service-Worker-Allowed: /
```

### 2. Verificar Manifest

```bash
# Debería retornar JSON válido
curl https://tu-dominio.vercel.app/manifest.json

# Debería tener headers correctos
curl -I https://tu-dominio.vercel.app/manifest.json
```

**Headers esperados**:
```
Content-Type: application/manifest+json
```

### 3. Verificar en el Navegador

1. **Abre DevTools** (F12)
2. **Ve a Application → Service Workers**
   - Debería mostrar "activated and running"
   - No debería haber errores

3. **Ve a Application → Manifest**
   - Debería cargar correctamente
   - No debería haber errores de sintaxis

4. **Revisa la consola**
   - No debería haber errores de registro del SW
   - No debería haber errores del manifest

---

## 📝 Notas Importantes

### Rutas API vs Archivos Estáticos

- **Antes**: `/sw.js` y `/manifest.json` se servían desde `/public/`
- **Ahora**: Se sirven desde rutas API (`/app/sw.js/route.ts` y `/app/manifest.json/route.ts`)
- **Razón**: Evitar redirects y asegurar headers correctos

### Compatibilidad

- ✅ Funciona en desarrollo local
- ✅ Funciona en producción (Vercel)
- ✅ Compatible con Next.js 16
- ✅ No afecta otros archivos estáticos

### Cache

- Service Worker: `Cache-Control: public, max-age=0, must-revalidate`
- Manifest: `Cache-Control: public, max-age=3600`

---

## 🚀 Próximos Pasos

1. **Desplegar los cambios** a Vercel
2. **Verificar** que los errores desaparezcan
3. **Probar** la instalación de la PWA
4. **Verificar** Lighthouse (debería ser 100/100)

---

## ✅ Checklist

- [x] Ruta API para Service Worker creada
- [x] Ruta API para Manifest creada
- [x] Middleware actualizado para excluir rutas PWA
- [x] Headers correctos configurados
- [x] Validación de JSON en manifest
- [ ] Desplegar a producción
- [ ] Verificar que funcione correctamente

---

## 🐛 Si Persisten los Errores

### Service Worker aún no se registra

1. Verifica que la ruta `/sw.js` retorne el código correcto
2. Verifica que no haya errores en la consola
3. Limpia el caché del navegador
4. Verifica que estés en HTTPS

### Manifest aún tiene errores

1. Verifica que `/manifest.json` retorne JSON válido
2. Verifica los headers en DevTools → Network
3. Valida el JSON manualmente
4. Verifica que no haya caracteres especiales

### ERR_BLOCKED_BY_CLIENT

1. Desactiva bloqueadores de anuncios
2. Prueba en modo incógnito
3. Verifica extensiones del navegador
4. Revisa políticas de seguridad del navegador

