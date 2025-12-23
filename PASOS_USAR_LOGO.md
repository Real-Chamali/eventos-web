# 🎨 Pasos para Usar tu Logo

## 📋 Instrucciones Rápidas

### Paso 1: Guarda tu Logo

Guarda la **primera imagen** (tu logo) en el proyecto con uno de estos nombres:

```
public/logo.png     ← Preferido (si es PNG)
public/logo.jpg     ← Si es JPG
public/logo.svg     ← Si es SVG
```

**O simplemente arrastra y suelta** la imagen del logo en la carpeta `public/` y renómbrala a `logo.png` (o `logo.jpg` si es JPG).

### Paso 2: Ejecuta el Script

Una vez que tengas el logo en `public/logo.png` (o `logo.jpg`), ejecuta:

```bash
./scripts/generar-iconos-con-logo.sh
```

El script:
- ✅ Buscará automáticamente tu logo
- ✅ Generará todos los tamaños necesarios (72, 96, 128, 144, 152, 192, 384, 512)
- ✅ Guardará los iconos en `public/icon-*.png`

### Paso 3: ¡Listo!

Los iconos estarán listos y la app será instalable como PWA. 🎉

---

## 🛠️ Si no tienes ImageMagick

Si el script te dice que falta ImageMagick, instálalo:

```bash
sudo apt-get update
sudo apt-get install imagemagick
```

O usa la herramienta online: https://www.pwabuilder.com/imageGenerator

---

## ✅ Verificación

Después de ejecutar el script, verifica que los iconos se crearon:

```bash
ls -lh public/icon-*.png
```

Deberías ver 8 archivos:
- icon-72.png
- icon-96.png
- icon-128.png
- icon-144.png
- icon-152.png
- icon-192.png
- icon-384.png
- icon-512.png

---

## 💡 Tips

- **Formato**: PNG funciona mejor, pero JPG y SVG también funcionan
- **Tamaño**: Mínimo 512x512 píxeles (mejor si es 1024x1024)
- **Forma**: Cuadrado (1:1) se ve mejor que rectangular
- **Fondo**: Si tu logo tiene fondo blanco, está bien. Si tiene transparencia, mejor.

---

**¿Listo? Coloca tu logo en `public/logo.png` y ejecuta el script!** 🚀

