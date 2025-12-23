# 🎨 Cómo Usar tu Logo para los Iconos PWA

## 🚀 Pasos Rápidos

### Paso 1: Coloca tu Logo

Coloca tu logo en una de estas ubicaciones (el script lo buscará automáticamente):

```
public/logo.png     ← Preferido
public/logo.svg     ← También funciona
public/icon.png     ← Alternativa
```

**Requisitos del logo**:
- ✅ Formato: PNG, SVG, o JPG
- ✅ Tamaño: Mínimo 512x512 píxeles (mejor si es 1024x1024)
- ✅ Forma: Cuadrado (1:1) funciona mejor
- ✅ Fondo: Transparente o sólido

### Paso 2: Ejecuta el Script

```bash
./scripts/generar-iconos-con-logo.sh
```

El script:
1. ✅ Buscará tu logo automáticamente
2. ✅ Generará todos los tamaños necesarios (72, 96, 128, 144, 152, 192, 384, 512)
3. ✅ Guardará los iconos en `public/icon-*.png`

### Paso 3: ¡Listo!

Los iconos estarán listos y la app será instalable. 🎉

---

## 📝 Si el Script no Encuentra tu Logo

Si el script no encuentra tu logo automáticamente, te pedirá la ruta. Simplemente escribe la ruta completa:

```
Ruta del logo: /ruta/a/tu/logo.png
```

---

## 🛠️ Instalar ImageMagick (si no lo tienes)

El script requiere ImageMagick para redimensionar tu logo:

```bash
# Ubuntu/Debian:
sudo apt-get update
sudo apt-get install imagemagick

# macOS:
brew install imagemagick

# Verificar instalación:
convert --version
```

---

## 🎨 Alternativa: Sin ImageMagick

Si no puedes instalar ImageMagick, puedes:

1. **Usar herramienta online**: https://www.pwabuilder.com/imageGenerator
   - Sube tu logo
   - Descarga el ZIP con todos los tamaños
   - Extrae a `public/`

2. **Crear manualmente**: Usa cualquier editor de imágenes (GIMP, Photoshop, etc.)
   - Crea 8 versiones de tu logo en los tamaños: 72, 96, 128, 144, 152, 192, 384, 512
   - Guárdalos como `public/icon-{tamaño}.png`

---

## ✅ Verificación

Después de generar los iconos:

```bash
# Verificar que todos los iconos estén creados:
ls -lh public/icon-*.png

# Deberías ver:
# icon-72.png, icon-96.png, icon-128.png, icon-144.png,
# icon-152.png, icon-192.png, icon-384.png, icon-512.png
```

---

## 🎯 Ejemplo de Uso

```bash
# 1. Coloca tu logo:
cp /ruta/a/tu/logo.png public/logo.png

# 2. Ejecuta el script:
./scripts/generar-iconos-con-logo.sh

# 3. Verifica:
ls public/icon-*.png

# 4. Prueba la app:
npm run dev
# Abre en Chrome/Edge y busca el icono de instalación
```

---

## 💡 Tips

- **Logo cuadrado**: Funciona mejor que rectangular
- **Fondo transparente**: Se ve mejor en diferentes fondos
- **Colores vibrantes**: Se distinguen mejor en tamaños pequeños
- **Texto legible**: Si tu logo tiene texto, asegúrate de que sea legible en 72x72

¿Listo para generar los iconos? ¡Ejecuta el script! 🚀

