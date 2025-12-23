# 🔍 Cómo Ver el Error 500 Específico

## 📋 Pasos para Obtener el Mensaje de Error

### Opción 1: Desde el Navegador (Más Fácil)

1. **Abre las DevTools** (F12 o Click derecho → Inspeccionar)
2. Ve a la pestaña **Network** (Red)
3. Recarga la página `/admin/vendors`
4. Busca la petición a `/api/admin/vendors`
5. Click en ella
6. Ve a la pestaña **Response** (Respuesta)
7. **Copia todo el JSON** que aparece ahí

El JSON debería verse así:
```json
{
  "error": "...",
  "message": "..."
}
```

### Opción 2: Abrir la API Directamente

1. **Inicia sesión** en: https://eventos-web-lovat.vercel.app/login
2. Abre esta URL en el navegador:
   ```
   https://eventos-web-lovat.vercel.app/api/admin/vendors
   ```
3. **Copia todo el JSON** que aparece en la página

### Opción 3: Desde la Consola del Navegador

1. Abre las **DevTools** (F12)
2. Ve a la pestaña **Console** (Consola)
3. Ejecuta este comando:
   ```javascript
   fetch('/api/admin/vendors')
     .then(r => r.json())
     .then(console.log)
     .catch(console.error)
   ```
4. **Copia el resultado** que aparece en la consola

## 📝 Qué Buscar

El error puede ser uno de estos:

### 1. "SUPABASE_SERVICE_ROLE_KEY no está configurado"
```json
{
  "error": "Server configuration error",
  "message": "SUPABASE_SERVICE_ROLE_KEY no está configurado. Verifica las variables de entorno."
}
```
**Solución**: Agregar la variable en Vercel y redesplegar

### 2. "Error al obtener usuarios de Supabase"
```json
{
  "error": "Error al obtener usuarios de Supabase",
  "message": "..."
}
```
**Solución**: El service role key puede ser inválido o expirado

### 3. "Internal server error"
```json
{
  "error": "Internal server error",
  "message": "..."
}
```
**Solución**: Revisar los logs de Vercel para más detalles

## 🔧 Si No Puedes Ver el Error

1. Ve a **Vercel Dashboard**: https://vercel.com/dashboard
2. Selecciona tu proyecto: **eventos-web-lovat**
3. Ve a **Deployments** → Último deployment
4. Click en **Functions**
5. Busca `/api/admin/vendors`
6. Revisa los **logs** para ver el error

---

**Por favor, comparte el JSON completo del error para poder ayudarte mejor.**

