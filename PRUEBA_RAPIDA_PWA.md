# ⚡ Prueba Rápida PWA - 3 Pasos

## 🚀 Pasos Rápidos

### 1️⃣ Probar Instalación (2 minutos)

1. **Abre la app en Chrome/Edge**
   ```
   https://tu-dominio.vercel.app
   ```

2. **Busca el ícono de instalación** en la barra de direcciones (➕ o 📥)

3. **Haz clic e instala**

4. **Verifica**: La app debería abrirse en modo standalone

**✅ Listo si**: La app se instala y abre sin barra de navegador

---

### 2️⃣ Probar Offline (3 minutos)

1. **Abre DevTools** (F12)

2. **Ve a Network** → Marca **"Offline"**

3. **Recarga la página** (F5)

4. **Navega** a diferentes rutas

**✅ Listo si**: 
- La página carga normalmente
- El contenido cacheado está disponible
- Las rutas nuevas muestran página offline

---

### 3️⃣ Lighthouse (5 minutos)

1. **Abre DevTools** (F12)

2. **Pestaña "Lighthouse"**

3. **Marca "Progressive Web App"**

4. **Clic en "Analyze page load"**

5. **Espera** (30-60 segundos)

**✅ Listo si**: PWA Score = **100/100**

---

## 🎯 Resultado Esperado

- ✅ **Instalación**: Funciona
- ✅ **Offline**: Funciona
- ✅ **Lighthouse**: 100/100

**¡PWA lista!** 🎉

---

## 📝 Notas

- **HTTPS**: Requerido en producción (Vercel lo proporciona)
- **Service Worker**: Debe estar activo (verificar en DevTools → Application)
- **Manifest**: Debe ser válido (verificar en DevTools → Application → Manifest)

Para más detalles, ver `GUIA_PROBAR_PWA.md`

