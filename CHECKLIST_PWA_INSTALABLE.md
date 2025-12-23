# ✅ Checklist: Hacer la App Instalable (PWA)

## 📋 Requisitos para PWA Instalable

### 1. ✅ Manifest.json
- [x] Archivo `/manifest.json` existe
- [x] `name` y `short_name` definidos
- [x] `start_url` configurado
- [x] `display: standalone` o `fullscreen`
- [x] `icons` con al menos 192x192 y 512x512
- [x] `theme_color` y `background_color` definidos

### 2. ✅ Service Worker
- [x] Archivo `/sw.js` existe
- [x] Service Worker registrado en `layout.tsx`
- [x] Cache de assets estáticos configurado
- [x] Estrategias de cache implementadas

### 3. ✅ Meta Tags
- [x] `<link rel="manifest" href="/manifest.json">`
- [x] `<meta name="theme-color">`
- [x] Meta tags para iOS (`apple-mobile-web-app-*`)
- [x] Meta tags para Android
- [x] Meta tags para Windows (`msapplication-*`)

### 4. ✅ Iconos
- [ ] `icon-72.png` (72x72)
- [ ] `icon-96.png` (96x96)
- [ ] `icon-128.png` (128x128)
- [ ] `icon-144.png` (144x144)
- [ ] `icon-152.png` (152x152)
- [ ] `icon-192.png` (192x192) ⭐ **CRÍTICO**
- [ ] `icon-384.png` (384x384)
- [ ] `icon-512.png` (512x512) ⭐ **CRÍTICO**

### 5. ✅ HTTPS
- [x] App servida sobre HTTPS (Vercel lo hace automáticamente)
- [x] Service Worker solo funciona en HTTPS

### 6. ✅ Componente de Instalación
- [x] `InstallPrompt` component creado
- [x] Componente incluido en `layout.tsx`
- [x] Manejo de evento `beforeinstallprompt`
- [x] Instrucciones para iOS

---

## 🚀 Pasos para Completar

### Paso 1: Generar Iconos Faltantes

```bash
# Si tienes logo:
./scripts/generar-iconos-con-logo.sh

# Si no tienes logo, el script creará iconos básicos automáticamente
```

### Paso 2: Verificar Iconos

```bash
ls -lh public/icon-*.png
```

Deberías ver 8 archivos:
- icon-72.png
- icon-96.png
- icon-128.png
- icon-144.png
- icon-152.png
- icon-192.png ⭐
- icon-384.png
- icon-512.png ⭐

### Paso 3: Verificar en Producción

1. **Abre la app en producción**: https://eventos-web-lovat.vercel.app
2. **Abre DevTools** → Application → Manifest
3. **Verifica**:
   - ✅ Manifest válido
   - ✅ Iconos cargados correctamente
   - ✅ Service Worker activo

### Paso 4: Probar Instalación

#### En Chrome/Edge (Desktop):
1. Abre la app
2. Busca el icono de instalación en la barra de direcciones
3. O ve a Menú → "Instalar Eventos CRM"

#### En Android:
1. Abre la app en Chrome
2. Aparecerá un banner de instalación
3. Toca "Instalar"

#### En iOS:
1. Abre la app en Safari
2. Toca el botón "Compartir"
3. Selecciona "Agregar a pantalla de inicio"

---

## 🔍 Verificación Técnica

### Verificar Manifest
```bash
curl https://eventos-web-lovat.vercel.app/manifest.json
```

### Verificar Service Worker
```bash
curl https://eventos-web-lovat.vercel.app/sw.js
```

### Verificar Iconos
```bash
curl -I https://eventos-web-lovat.vercel.app/icon-192.png
curl -I https://eventos-web-lovat.vercel.app/icon-512.png
```

---

## 🐛 Troubleshooting

### El prompt de instalación no aparece
1. Verifica que todos los iconos existan
2. Verifica que el manifest.json sea válido
3. Verifica que el service worker esté registrado
4. Limpia el cache del navegador
5. Verifica que estés en HTTPS

### Los iconos no se ven
1. Verifica que los archivos existan en `public/`
2. Verifica que las rutas en `manifest.json` sean correctas
3. Verifica que los tamaños sean correctos
4. Verifica los permisos de archivos

### Service Worker no se registra
1. Verifica que `/sw.js` sea accesible
2. Verifica la consola del navegador para errores
3. Verifica que estés en HTTPS
4. Verifica que el código de registro esté en `layout.tsx`

---

## ✅ Estado Actual

- ✅ Manifest.json: Configurado
- ✅ Service Worker: Configurado y registrado
- ✅ Meta Tags: Configurados
- ✅ InstallPrompt: Implementado
- ⚠️ Iconos: **FALTAN** (solo existe icon-72.png)

**Próximo paso**: Ejecutar `./scripts/generar-iconos-con-logo.sh` para generar todos los iconos faltantes.

