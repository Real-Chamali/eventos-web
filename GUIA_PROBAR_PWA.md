# 🧪 Guía para Probar la PWA

Esta guía te ayudará a verificar que la PWA funcione correctamente en los 3 aspectos principales.

---

## 1️⃣ Probar la Instalación

### En Chrome/Edge (Desktop)

1. **Abre la aplicación en el navegador**
   ```
   https://tu-dominio.vercel.app
   ```

2. **Busca el ícono de instalación**
   - En la barra de direcciones, deberías ver un ícono de instalación (➕ o 📥)
   - O espera el prompt automático de instalación

3. **Instala la app**
   - Haz clic en el ícono o en el prompt
   - Confirma la instalación
   - La app se instalará como aplicación nativa

4. **Verifica la instalación**
   - La app debería aparecer en tu escritorio/menú de inicio
   - Al abrirla, debería abrirse en modo standalone (sin barra de navegador)

### En Android (Chrome)

1. **Abre la aplicación en Chrome**
2. **Toca el menú** (3 puntos)
3. **Selecciona "Agregar a pantalla de inicio"**
4. **Confirma la instalación**
5. **Verifica** que el ícono aparezca en la pantalla de inicio

### En iOS (Safari)

1. **Abre la aplicación en Safari**
2. **Toca el botón Compartir** (cuadrado con flecha)
3. **Selecciona "Agregar a pantalla de inicio"**
4. **Confirma la instalación**
5. **Verifica** que el ícono aparezca en la pantalla de inicio

### Verificar en DevTools

1. **Abre DevTools** (F12)
2. **Ve a Application → Manifest**
   - Verifica que el manifest se cargue correctamente
   - Verifica que todos los íconos estén presentes
   - Verifica que no haya errores

3. **Ve a Application → Service Workers**
   - Verifica que el Service Worker esté **"activated and running"**
   - Verifica que el scope sea `/`
   - Verifica que no haya errores

---

## 2️⃣ Verificar Funcionamiento Offline

### Prueba Básica

1. **Abre la aplicación** y navega por algunas páginas
   - Ve al dashboard
   - Visita algunas rutas
   - Esto cacheará el contenido

2. **Abre DevTools** (F12)

3. **Ve a Network**
   - Marca la casilla **"Offline"**
   - Esto simula que no hay conexión a internet

4. **Recarga la página** (F5 o Ctrl+R)
   - La página debería cargar normalmente
   - El contenido cacheado debería estar disponible

5. **Navega a diferentes rutas**
   - Las rutas que visitaste antes deberían funcionar
   - Las rutas nuevas deberían mostrar la página offline

### Prueba Avanzada

1. **Abre DevTools → Application → Cache Storage**
   - Deberías ver varios caches:
     - `eventos-static-v3` (assets estáticos)
     - `eventos-runtime-v3` (contenido dinámico)

2. **Verifica el contenido cacheado**
   - Haz clic en cada cache
   - Verifica que haya recursos cacheados

3. **Prueba APIs offline**
   - Con Network → Offline activado
   - Intenta hacer una petición API
   - Debería retornar error 503 o usar caché si está disponible

### Verificar Página Offline

1. **Con Network → Offline activado**
2. **Navega a una ruta no cacheada**
3. **Deberías ver la página offline** (`/offline`)
   - Mensaje "Sin conexión"
   - Botón para reintentar
   - Botón para ir al inicio

---

## 3️⃣ Lighthouse - Auditoría PWA

### Ejecutar Lighthouse

1. **Abre la aplicación en Chrome/Edge**

2. **Abre DevTools** (F12)

3. **Ve a la pestaña "Lighthouse"**

4. **Configura la auditoría:**
   - ✅ Marca **"Progressive Web App"**
   - Opcional: Marca otras categorías (Performance, Accessibility, etc.)
   - Selecciona **"Desktop"** o **"Mobile"**
   - Opcional: Marca "Clear storage"

5. **Haz clic en "Analyze page load"**

6. **Espera a que termine** (30-60 segundos)

### Interpretar Resultados

#### ✅ PWA Score: 100/100

Deberías obtener **100 puntos** en PWA si todo está correcto:

- ✅ **Manifest**: Configurado correctamente
- ✅ **Service Worker**: Registrado y funcionando
- ✅ **HTTPS**: Habilitado (Vercel lo proporciona)
- ✅ **Íconos**: Presentes y en tamaños correctos
- ✅ **Viewport**: Configurado correctamente
- ✅ **Themed**: Colores de tema configurados

#### ⚠️ Problemas Comunes

**Service Worker no registrado:**
- Verifica que `/sw.js` sea accesible
- Verifica que no haya errores en la consola
- Verifica que estés en HTTPS

**Manifest inválido:**
- Verifica que `/manifest.json` sea JSON válido
- Verifica que todos los íconos estén presentes
- Verifica que los tamaños de íconos sean correctos

**Íconos faltantes:**
- Verifica que todos los íconos estén en `/public/`
- Verifica que las rutas en el manifest sean correctas

**HTTPS no habilitado:**
- En producción (Vercel), HTTPS está habilitado automáticamente
- En desarrollo local, esto es normal

### Mejores Prácticas

1. **Ejecuta Lighthouse en producción**
   - Los resultados pueden variar en desarrollo local
   - Vercel proporciona HTTPS automáticamente

2. **Prueba en diferentes dispositivos**
   - Desktop (Chrome, Edge)
   - Mobile (Android Chrome, iOS Safari)

3. **Verifica regularmente**
   - Después de cada deploy
   - Cuando agregues nuevas funcionalidades

---

## 🛠️ Script de Prueba Automática

Ejecuta el script para verificar rápidamente:

```bash
# Desarrollo local
./scripts/test-pwa.sh http://localhost:3000

# Producción
./scripts/test-pwa.sh https://tu-dominio.vercel.app
```

El script verifica:
- ✅ Manifest accesible y válido
- ✅ Service Worker accesible
- ✅ Íconos presentes
- ✅ HTTPS (en producción)
- ✅ Página offline accesible

---

## 📊 Checklist Completo

### Instalación
- [ ] Ícono de instalación visible en la barra de direcciones
- [ ] Prompt de instalación aparece automáticamente
- [ ] La app se instala correctamente
- [ ] La app abre en modo standalone
- [ ] El ícono aparece en escritorio/menú de inicio

### Offline
- [ ] Service Worker registrado y activo
- [ ] Contenido cacheado disponible offline
- [ ] Página offline se muestra cuando no hay conexión
- [ ] APIs manejan correctamente el modo offline
- [ ] Caches se crean correctamente

### Lighthouse
- [ ] PWA Score: 100/100
- [ ] Manifest válido
- [ ] Service Worker funcionando
- [ ] HTTPS habilitado
- [ ] Íconos presentes
- [ ] Viewport configurado
- [ ] Theme color configurado

---

## 🐛 Troubleshooting

### La app no se instala

1. **Verifica HTTPS**
   - PWA requiere HTTPS en producción
   - Vercel lo proporciona automáticamente

2. **Verifica Service Worker**
   - Debe estar activo y funcionando
   - No debe haber errores en la consola

3. **Verifica Manifest**
   - Debe ser JSON válido
   - Debe tener todos los campos requeridos

### No funciona offline

1. **Verifica Service Worker**
   - Debe estar activo
   - Debe haber cacheado contenido

2. **Verifica Caches**
   - Application → Cache Storage
   - Debe haber caches creados

3. **Verifica Estrategias**
   - Revisa `sw.js` para ver las estrategias de caché

### Lighthouse muestra errores

1. **Revisa cada error individualmente**
2. **Verifica que todos los recursos estén accesibles**
3. **Verifica que no haya errores en la consola**
4. **Ejecuta en producción, no en desarrollo local**

---

## ✅ Resultado Esperado

Después de completar las 3 pruebas:

1. ✅ **Instalación**: La app se instala correctamente en todos los dispositivos
2. ✅ **Offline**: La app funciona offline con contenido cacheado
3. ✅ **Lighthouse**: PWA Score de 100/100

**¡Tu PWA está lista para producción!** 🎉

