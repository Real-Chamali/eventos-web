# 🔒 Solución: "Su conexión a este sitio no es privada"

## 🎯 Problema

Firefox muestra el error: **"Su conexión a este sitio no es privada"** o **"Your connection is not private"**.

## ✅ Soluciones Rápidas

### Solución 1: Usar HTTP en lugar de HTTPS (Desarrollo Local)

**En desarrollo local, Next.js usa HTTP, no HTTPS.**

✅ **URL Correcta:**
```
http://localhost:3000
```

❌ **URL Incorrecta:**
```
https://localhost:3000
```

**Pasos:**
1. Asegúrate de usar `http://` (no `https://`)
2. Limpia el caché del navegador
3. Intenta de nuevo

---

### Solución 2: Limpiar Cookies y Caché en Firefox

1. Presiona `Ctrl+Shift+Delete` (o `Cmd+Shift+Delete` en Mac)
2. Selecciona:
   - ✅ Cookies y datos del sitio
   - ✅ Caché
3. Período: "Última hora" o "Todo"
4. Haz clic en "Limpiar ahora"
5. Reinicia Firefox

---

### Solución 3: Verificar Configuración de Cookies en Firefox

1. Ve a `about:preferences#privacy` en la barra de direcciones
2. En la sección **"Cookies y datos del sitio"**:
   - ✅ Asegúrate de que **"Aceptar cookies y datos del sitio"** esté seleccionado
   - ✅ Desmarca **"Eliminar cookies y datos del sitio al cerrar Firefox"** (si está marcado)
3. Haz clic en **"Gestionar excepciones..."**
4. Agrega `http://localhost:3000` como excepción si es necesario

---

### Solución 4: Usar Modo Privado para Probar

1. Presiona `Ctrl+Shift+P` (o `Cmd+Shift+P` en Mac)
2. Abre una ventana privada
3. Ve a `http://localhost:3000`
4. Si funciona en modo privado, el problema es con las cookies/caché

---

### Solución 5: Verificar Variables de Entorno

Asegúrate de que las variables de entorno estén configuradas correctamente:

```bash
# Ejecutar script de verificación
./scripts/verify-all-env.sh
```

Verifica que:
- ✅ `NEXT_PUBLIC_SUPABASE_URL` esté configurado
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY` esté configurado
- ✅ La URL de Supabase use `https://` (Supabase siempre usa HTTPS)

---

### Solución 6: Reiniciar el Servidor de Desarrollo

1. Detén el servidor (`Ctrl+C`)
2. Limpia el caché de Next.js:
   ```bash
   rm -rf .next
   ```
3. Reinicia el servidor:
   ```bash
   npm run dev
   ```
4. Intenta acceder nuevamente a `http://localhost:3000`

---

## 🔍 Diagnóstico

### Verificar en qué URL estás accediendo

**En la barra de direcciones de Firefox, verifica:**

✅ **Correcto:**
```
http://localhost:3000/login
```

❌ **Incorrecto:**
```
https://localhost:3000/login
```

### Verificar en la Consola del Navegador

1. Presiona `F12` para abrir las herramientas de desarrollador
2. Ve a la pestaña **"Consola"**
3. Busca errores relacionados con:
   - `NET::ERR_CERT_AUTHORITY_INVALID`
   - `SSL`
   - `HTTPS`
   - `Mixed Content`

---

## 🚨 Si el Problema Persiste

### Opción A: Deshabilitar Verificación SSL en Firefox (Solo para Desarrollo)

⚠️ **ADVERTENCIA:** Solo haz esto en desarrollo local, nunca en producción.

1. Ve a `about:config` en la barra de direcciones
2. Acepta el riesgo
3. Busca: `security.tls.insecure_fallback_hosts`
4. Haz doble clic y agrega: `localhost`
5. Reinicia Firefox

### Opción B: Usar Chrome/Edge para Desarrollo

Si Firefox sigue dando problemas, puedes usar Chrome o Edge temporalmente para desarrollo:

```bash
# Chrome
google-chrome http://localhost:3000

# Edge
microsoft-edge http://localhost:3000
```

---

## 📝 Notas Importantes

1. **En desarrollo local:** Siempre usa `http://localhost:3000` (HTTP)
2. **En producción:** Se usará HTTPS automáticamente (Vercel, etc.)
3. **Supabase:** Siempre usa HTTPS para sus APIs (esto es normal y seguro)
4. **Cookies:** Firefox puede ser más estricto con las cookies que otros navegadores

---

## ✅ Verificación Final

Después de aplicar las soluciones:

1. ✅ Accede a `http://localhost:3000` (con HTTP)
2. ✅ Deberías ver la página de login sin errores
3. ✅ Las cookies deberían funcionar correctamente
4. ✅ No deberías ver advertencias de seguridad

---

**¿Sigue sin funcionar?** Comparte:
- La URL exacta que estás usando
- El mensaje de error completo
- Capturas de pantalla si es posible

