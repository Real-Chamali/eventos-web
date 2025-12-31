# 📊 Configuración de Google Analytics

## ✅ Implementación Completada

Google Analytics está **completamente integrado** en la aplicación. El tracking automático está configurado para:

- ✅ Creación de cotizaciones
- ✅ Aprobación/rechazo de cotizaciones
- ✅ Registro de pagos
- ✅ Exportación de PDF/CSV
- ✅ Visualización de cotizaciones
- ✅ Errores de aplicación

---

## 🔧 Configuración Requerida

### 1. Crear Cuenta de Google Analytics

1. Ve a [Google Analytics](https://analytics.google.com/)
2. Crea una cuenta o inicia sesión
3. Crea una nueva propiedad para tu aplicación
4. Obtén tu **Measurement ID** (formato: `G-XXXXXXXXXX`)

### 2. Configurar Variable de Entorno

Agrega esta variable en tu archivo `.env.local` y en Vercel:

```bash
# Google Analytics
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

**En Vercel:**
```bash
vercel env add NEXT_PUBLIC_GA_ID
# Ingresa: G-XXXXXXXXXX
```

**Nota:** El prefijo `NEXT_PUBLIC_` es necesario para que la variable esté disponible en el cliente.

---

## 📈 Eventos Trackeados

### Cotizaciones

- **`quote_created`**: Cuando se crea una nueva cotización
  - Parámetros: `quote_id`, `total_price`
  
- **`quote_closed`**: Cuando se aprueba una cotización
  - Parámetros: `quote_id`, `total_price`
  
- **`quote_viewed`**: Cuando un usuario visualiza una cotización
  - Parámetros: `quote_id`

### Usuarios

- **`user_signup`**: Cuando un nuevo usuario se registra
  - Parámetros: `user_id`
  
- **`user_login`**: Cuando un usuario inicia sesión
  - Parámetros: `user_id`
  
- **`user_logout`**: Cuando un usuario cierra sesión

### Exportaciones

- **`export_pdf`**: Cuando se exporta un PDF
  - Parámetros: `file_name`
  
- **`export_csv`**: Cuando se exporta un CSV
  - Parámetros: `file_name`

### Errores

- **`app_error`**: Cuando ocurre un error en la aplicación
  - Parámetros: `error_message`, `context`

---

## 🧪 Verificar que Funciona

### 1. Verificar en Google Analytics

1. Ve a tu propiedad de Google Analytics
2. Ve a **Realtime** > **Events**
3. Realiza una acción en la app (crear cotización, etc.)
4. Deberías ver el evento aparecer en tiempo real

### 2. Verificar en la Consola del Navegador

Abre la consola del navegador y ejecuta:

```javascript
// Verificar que gtag está disponible
console.log(typeof window.gtag) // Debe ser "function"

// Verificar que el ID está configurado
console.log(process.env.NEXT_PUBLIC_GA_ID) // Debe mostrar tu ID
```

### 3. Usar Google Analytics DebugView

1. Instala la extensión [Google Analytics Debugger](https://chrome.google.com/webstore/detail/google-analytics-debugger/jnkmfdileelhofjcijamephohjechhna)
2. Actívala
3. Abre la consola del navegador
4. Deberías ver los eventos siendo enviados

---

## 🔍 Troubleshooting

### No aparecen eventos en Google Analytics

1. **Verifica que la variable de entorno esté configurada:**
   ```bash
   echo $NEXT_PUBLIC_GA_ID
   ```

2. **Verifica que el script de Google Analytics se esté cargando:**
   - Abre las DevTools > Network
   - Busca requests a `googletagmanager.com`
   - Deberías ver requests a `gtag/js?id=G-XXXXXXXXXX`

3. **Verifica que no haya bloqueadores de anuncios:**
   - Algunos bloqueadores bloquean Google Analytics
   - Desactívalos temporalmente para probar

4. **Verifica la consola del navegador:**
   - Busca errores relacionados con `gtag` o `analytics`

### Los eventos no se están trackeando

1. **Verifica que las funciones de tracking se estén llamando:**
   - Revisa los logs del servidor
   - Busca mensajes de "Error tracking analytics"

2. **Verifica que el código de tracking esté presente:**
   - Busca `trackingEvents.quoteCreated` en el código
   - Asegúrate de que se esté llamando después de las acciones

---

## 📚 Recursos

- [Google Analytics Documentation](https://developers.google.com/analytics)
- [Google Analytics 4 Events](https://developers.google.com/analytics/devguides/collection/ga4/events)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)

---

## ✅ Checklist de Configuración

- [ ] Cuenta de Google Analytics creada
- [ ] Measurement ID obtenido
- [ ] Variable `NEXT_PUBLIC_GA_ID` configurada (local y Vercel)
- [ ] App desplegada con la variable configurada
- [ ] Eventos apareciendo en Google Analytics Realtime
- [ ] Verificado que los eventos se están trackeando correctamente

---

**Última actualización:** 2025-01-XX  
**Estado:** ✅ Implementación completa

