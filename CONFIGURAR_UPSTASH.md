# 🚀 Configurar Upstash para Rate Limiting Distribuido

## 📋 ¿Qué es Upstash?

**Upstash** es un servicio de Redis serverless que permite:
- ✅ Rate limiting distribuido entre múltiples instancias serverless
- ✅ Caché distribuido
- ✅ Contadores y estadísticas en tiempo real
- ✅ Plan gratuito hasta 10,000 comandos/día

---

## 🎯 ¿Por qué Upstash?

En entornos serverless (como Vercel), cada función puede ejecutarse en una instancia diferente. El rate limiting en memoria **no funciona** porque cada instancia tiene su propio contador.

**Con Upstash**:
- ✅ Rate limiting compartido entre todas las instancias
- ✅ Prevención efectiva de abuso de API
- ✅ Escalable y confiable

---

## 📝 Pasos para Configurar

### 1. Crear Cuenta en Upstash

1. Ve a: https://upstash.com
2. Crea una cuenta (gratis)
3. Verifica tu email

### 2. Crear Base de Datos Redis

1. En el dashboard de Upstash, click en **"Create Database"**
2. Configuración:
   - **Name**: `eventos-web-rate-limit` (o el nombre que prefieras)
   - **Type**: Redis
   - **Region**: Selecciona la región más cercana a tus usuarios
   - **TLS**: Enabled (recomendado)
   - **Plan**: Free (hasta 10K comandos/día)

3. Click en **"Create"**

### 3. Obtener Credenciales REST API

1. En el dashboard de Upstash, selecciona tu base de datos
2. Ve a la pestaña **"REST API"**
3. Copia:
   - **REST URL**: `https://xxxxx.upstash.io`
   - **REST TOKEN**: `xxxxx...`

### 4. Configurar en Vercel

1. Ve a: https://vercel.com/dashboard
2. Selecciona tu proyecto: **eventos-web**
3. Ve a: **Settings** → **Environment Variables**

4. Agregar variables:

   **Variable 1:**
   - **Key**: `UPSTASH_REDIS_REST_URL`
   - **Value**: `https://xxxxx.upstash.io` (la REST URL que copiaste)
   - **Environments**: Production, Preview, Development

   **Variable 2:**
   - **Key**: `UPSTASH_REDIS_REST_TOKEN`
   - **Value**: `xxxxx...` (el REST TOKEN que copiaste)
   - **Environments**: Production, Preview, Development

5. Click en **"Save"** para cada variable

### 5. Redeploy

Después de agregar las variables:

```bash
vercel --prod
```

O desde el dashboard:
- Vercel → Deployments → Click en "..." → Redeploy

---

## ✅ Verificación

### 1. Verificar en Logs

Después del redeploy, verifica los logs:

```bash
vercel logs --follow
```

O en el dashboard:
- Vercel → Deployments → Seleccionar deployment → Logs

**Busca**:
- ✅ No debe haber errores de conexión a Upstash
- ✅ Si hay warnings de "Redis rate limiting failed, falling back to memory", significa que Upstash no está configurado correctamente

### 2. Probar Rate Limiting

1. **Hacer múltiples requests** a un endpoint API:
   ```bash
   # Ejemplo: hacer 100 requests rápidas
   for i in {1..100}; do
     curl -H "Authorization: Bearer YOUR_TOKEN" \
          https://eventos-web-lovat.vercel.app/api/quotes
   done
   ```

2. **Verificar**:
   - Los primeros requests deben funcionar
   - Después del límite (ej: 100 requests/minuto), debe retornar `429 Too Many Requests`

### 3. Verificar en Upstash Dashboard

1. Ve a: Upstash Dashboard → Tu base de datos
2. Click en **"Data Browser"**
3. Busca keys que empiecen con `ratelimit:`
4. Deberías ver keys como:
   - `ratelimit:quote-get-USER_ID`
   - `ratelimit:service-get-USER_ID`
   - etc.

---

## 🔧 Configuración Avanzada

### Límites por Endpoint

Los límites actuales están configurados en cada ruta API:

```typescript
// Ejemplo: app/api/quotes/route.ts
const rateLimitAllowed = await checkRateLimitAsync(
  `quote-get-${auth.userId}`,  // Key única por usuario
  100,                          // Máximo 100 requests
  60000                         // Por minuto (60,000 ms)
)
```

**Límites actuales**:
- `GET /api/quotes`: 100 requests/minuto
- `POST /api/quotes`: 20 requests/minuto
- `GET /api/services`: 100 requests/minuto
- `POST /api/services`: 10 requests/minuto
- `GET /api/finance`: 30 requests/minuto

### Ajustar Límites

Para cambiar los límites, edita el archivo de la ruta API correspondiente:

```typescript
// Cambiar de 100 a 200 requests/minuto
const rateLimitAllowed = await checkRateLimitAsync(
  `quote-get-${auth.userId}`,
  200,  // Nuevo límite
  60000
)
```

---

## 🐛 Troubleshooting

### Error: "Redis rate limiting failed, falling back to memory"

**Causa**: Upstash no está configurado o las credenciales son incorrectas.

**Solución**:
1. Verificar que `UPSTASH_REDIS_REST_URL` y `UPSTASH_REDIS_REST_TOKEN` estén configuradas en Vercel
2. Verificar que las credenciales sean correctas (copiar exactamente desde Upstash)
3. Verificar que la base de datos esté activa en Upstash
4. Redeploy la aplicación

### Error: "Too many requests" incluso con pocos requests

**Causa**: El límite está muy bajo o hay múltiples usuarios compartiendo la misma key.

**Solución**:
1. Verificar que la key de rate limiting sea única por usuario
2. Aumentar el límite en la ruta API correspondiente
3. Verificar en Upstash Dashboard si hay keys antiguas que no se han limpiado

### Rate limiting no funciona (permite demasiados requests)

**Causa**: Upstash no está siendo usado (fallback a memoria).

**Solución**:
1. Verificar logs para ver si hay errores de conexión
2. Verificar que las variables de entorno estén configuradas
3. Verificar que `checkRateLimitAsync` esté siendo usado (no `checkRateLimit`)

---

## 📊 Monitoreo

### Ver Uso en Upstash

1. Ve a: Upstash Dashboard → Tu base de datos
2. Click en **"Metrics"**
3. Verás:
   - Comandos por día
   - Latencia
   - Errores

### Ver Límites en Código

Busca en el código:

```bash
grep -r "checkRateLimitAsync" app/api/
```

Esto mostrará todos los lugares donde se usa rate limiting distribuido.

---

## 💰 Costos

**Plan Gratuito**:
- ✅ 10,000 comandos/día
- ✅ Suficiente para la mayoría de aplicaciones pequeñas/medianas

**Si necesitas más**:
- Plan Pay-as-you-go: $0.20 por 100K comandos
- Muy económico para la mayoría de casos

---

## 🔗 Enlaces Útiles

- **Upstash Dashboard**: https://console.upstash.com
- **Documentación**: https://docs.upstash.com/redis
- **Pricing**: https://upstash.com/pricing

---

**Estado**: ✅ Configuración lista para aplicar
**Última actualización**: 2025-12-23

