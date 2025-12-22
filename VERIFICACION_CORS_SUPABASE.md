# 🔍 Verificación de Configuración CORS en Supabase

**Fecha**: Diciembre 2024

---

## 📋 Información del Proyecto Supabase

### URL del Proyecto:
```
https://nmcrmgdnpzrrklpcgyzn.supabase.co
```

### Project Reference:
```
nmcrmgdnpzrrklpcgyzn
```

---

## ✅ Verificación Requerida en Supabase Dashboard

### Pasos para Verificar:

1. **Ir a Supabase Dashboard**
   - URL: https://app.supabase.com
   - Iniciar sesión
   - Seleccionar proyecto: `nmcrmgdnpzrrklpcgyzn`

2. **Ir a Authentication → URL Configuration**
   - Menú lateral izquierdo
   - `Authentication` → `URL Configuration`

3. **Verificar Site URL**
   - Debe incluir:
     - Desarrollo: `http://localhost:3000`
     - Producción: `https://eventos-web-lovat.vercel.app` (o tu dominio de producción)

4. **Verificar Redirect URLs**
   - Debe incluir (una por línea):
     ```
     http://localhost:3000/**
     https://eventos-web-lovat.vercel.app/**
     ```

---

## 🔍 Cómo Verificar la Configuración

### Opción 1: Desde Supabase Dashboard

1. Ir a: https://app.supabase.com/project/nmcrmgdnpzrrklpcgyzn/auth/url-configuration
2. Verificar que:
   - **Site URL** esté configurado
   - **Redirect URLs** incluyan todas las URLs necesarias

### Opción 2: Desde el Navegador (Verificación Práctica)

1. **Abrir DevTools** (F12)
2. **Ir a la pestaña Network**
3. **Intentar iniciar sesión**
4. **Buscar solicitud a `/auth/v1/user`**
5. **Verificar**:
   - ✅ No debe haber errores CORS
   - ✅ Headers de respuesta deben incluir `Access-Control-Allow-Origin`
   - ✅ Cookies de Supabase deben guardarse correctamente

### Opción 3: Verificar Logs de Auth

Los logs de autenticación pueden mostrar errores relacionados con CORS si la configuración no está correcta.

---

## 🚨 Problemas Comunes y Soluciones

### Problema 1: Error "CORS policy" en consola

**Causa**: Site URL o Redirect URLs no configuradas correctamente

**Solución**:
1. Ir a Supabase Dashboard → Authentication → URL Configuration
2. Agregar todas las URLs necesarias
3. Guardar cambios
4. Limpiar cookies del navegador
5. Reiniciar servidor de desarrollo

### Problema 2: Cookies no se guardan

**Causa**: Dominio no coincide con Site URL configurado

**Solución**:
1. Verificar que el dominio en la URL del navegador coincida exactamente con Site URL
2. En desarrollo: debe ser `http://localhost:3000` (no `127.0.0.1`)
3. En producción: debe coincidir exactamente con el dominio configurado

### Problema 3: Redirect después de login no funciona

**Causa**: Redirect URL no está en la lista de Redirect URLs permitidas

**Solución**:
1. Agregar el patrón `/**` al final de las URLs en Redirect URLs
2. Ejemplo: `https://tu-dominio.vercel.app/**` (no solo `https://tu-dominio.vercel.app`)

---

## 📝 Checklist de Verificación

- [ ] Site URL configurado en Supabase Dashboard
- [ ] Redirect URLs configuradas en Supabase Dashboard
- [ ] URLs incluyen patrón `/**` para permitir todas las rutas
- [ ] URLs de desarrollo y producción configuradas
- [ ] Cambios guardados en Supabase Dashboard
- [ ] Cookies del navegador limpiadas
- [ ] Servidor de desarrollo reiniciado (si aplica)
- [ ] Verificado en Network Tab que no hay errores CORS
- [ ] Cookies de Supabase se guardan correctamente

---

## 🔗 Enlaces Directos

- **Supabase Dashboard**: https://app.supabase.com/project/nmcrmgdnpzrrklpcgyzn
- **URL Configuration**: https://app.supabase.com/project/nmcrmgdnpzrrklpcgyzn/auth/url-configuration
- **API Settings**: https://app.supabase.com/project/nmcrmgdnpzrrklpcgyzn/settings/api

---

## 📊 Estado Actual

| Configuración | Estado | Notas |
|--------------|--------|-------|
| Site URL | ⚠️ Requiere verificación manual | Verificar en Dashboard |
| Redirect URLs | ⚠️ Requiere verificación manual | Verificar en Dashboard |
| Headers CORS en código | ✅ Configurado | Ya aplicado |
| Cliente Supabase | ✅ Configurado | Ya aplicado |
| Middleware cookies | ✅ Configurado | Ya aplicado |

---

## 🎯 Próximos Pasos

1. **Verificar manualmente en Supabase Dashboard**:
   - Ir a Authentication → URL Configuration
   - Verificar Site URL y Redirect URLs
   - Agregar URLs faltantes si es necesario

2. **Probar la aplicación**:
   - Limpiar cookies
   - Reiniciar servidor
   - Intentar iniciar sesión
   - Verificar que no haya errores CORS

3. **Si hay problemas**:
   - Revisar logs de auth en Supabase Dashboard
   - Verificar Network Tab en DevTools
   - Consultar `CONFIGURACION_CORS_COMPLETA.md` para troubleshooting

---

**Nota**: La configuración en Supabase Dashboard no se puede verificar automáticamente desde el código. Debes verificar manualmente en el Dashboard.

