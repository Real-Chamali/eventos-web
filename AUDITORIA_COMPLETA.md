# 🔍 AUDITORÍA COMPLETA - Eventos Web
## Arquitecto Senior / Tech Lead / Auditor de Seguridad

**Fecha**: 2025-01-XX  
**Versión de la App**: 0.1.0  
**Stack**: Next.js 16, React 19, Supabase, PostgreSQL, Vercel

---

## 📊 RESUMEN EJECUTIVO

### Estadísticas de Hallazgos
- 🔴 **CRÍTICOS**: 8
- 🟠 **ALTOS**: 12
- 🟡 **MEDIOS**: 15
- 🟢 **BAJOS**: 8

### Estado General
⚠️ **REQUIERE ATENCIÓN INMEDIATA** - Varios problemas críticos de seguridad y arquitectura detectados.

---

## 🔴 PROBLEMAS CRÍTICOS (Prioridad 1 - Resolver INMEDIATAMENTE)

### 1. ❌ ENDPOINT DE DEBUG EXPUESTO EN PRODUCCIÓN

**📍 Dónde está**: `app/api/admin/debug-role/route.ts`

**💥 Impacto Real**:
- Expone información sensible de TODOS los usuarios (línea 61-63)
- Revela estructura interna de roles y perfiles
- Puede ser explotado para enumeración de usuarios
- Hardcoded user ID específico (línea 51, 57) - violación de privacidad

**✅ Solución**:
```typescript
// ELIMINAR COMPLETAMENTE este endpoint en producción
// O agregar protección adicional:

// 1. Verificar variable de entorno
if (process.env.NODE_ENV === 'production') {
  return NextResponse.json({ error: 'Not found' }, { status: 404 })
}

// 2. Agregar rate limiting agresivo
if (!checkRateLimit(`debug-${user.id}`, 1, 3600000)) { // 1 request por hora
  return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
}

// 3. Logging de acceso
logger.warn('API /admin/debug-role', 'Debug endpoint accessed', {
  userId: user.id,
  timestamp: new Date().toISOString(),
})
```

**🧩 Código Corregido**:
```typescript
export async function GET() {
  // BLOQUEAR EN PRODUCCIÓN
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  
  // ... resto del código
}
```

**🚀 Mejora Extra**: Crear un sistema de feature flags para habilitar/deshabilitar endpoints de debug.

---

### 2. ❌ SECRETOS HARDCODEADOS EN DOCUMENTACIÓN

**📍 Dónde está**: `GUIA_PRODUCCION.md` (líneas 171, 181)

**💥 Impacto Real**:
- Service Role Key expuesta públicamente en el repositorio
- Anon Key también expuesta
- Cualquiera con acceso al repo puede comprometer la base de datos completa
- **RIESGO MÁXIMO**: Acceso total a la base de datos

**✅ Solución**:
```bash
# 1. INMEDIATAMENTE: Rotar las keys en Supabase Dashboard
# 2. Eliminar las keys del archivo
# 3. Usar variables de entorno o secretos gestionados
```

**🧩 Código Corregido**:
```markdown
# GUIA_PRODUCCION.md - REEMPLAZAR con:

NEXT_PUBLIC_SUPABASE_URL
**Valor:** `[OBTENER DE SUPABASE DASHBOARD]`

NEXT_PUBLIC_SUPABASE_ANON_KEY
**Valor:** `[OBTENER DE SUPABASE DASHBOARD -> Settings -> API]`

SUPABASE_SERVICE_ROLE_KEY
**Valor:** `[OBTENER DE SUPABASE DASHBOARD -> Settings -> API]`
⚠️ NUNCA compartir esta key públicamente
```

**🚀 Mejora Extra**: 
- Usar Vercel Secrets Manager
- Implementar rotación automática de keys
- Agregar pre-commit hook para detectar secrets

---

### 3. ❌ VALIDACIÓN INSUFICIENTE EN API v1/quotes POST

**📍 Dónde está**: `app/api/v1/quotes/route.ts` (líneas 158-190)

**💥 Impacto Real**:
- No valida formato UUID de `client_id`
- No valida estructura de `services` array
- Permite inyección de datos malformados
- No valida que `service_id` exista antes de usarlo
- Permite precios negativos o cero (línea 188)
- No valida longitud de `notes`

**✅ Solución**:
```typescript
import { z } from 'zod'

const CreateQuoteV1Schema = z.object({
  client_id: z.string().uuid('client_id must be a valid UUID'),
  services: z.array(
    z.object({
      service_id: z.string().uuid('service_id must be a valid UUID'),
      quantity: z.number().int().min(1).max(1000),
      price: z.number().positive().optional(), // Solo si se permite override
    })
  ).min(1).max(50), // Límite razonable
  notes: z.string().max(5000).optional(),
})

export async function POST(request: NextRequest) {
  // ... autenticación ...
  
  const body = await request.json()
  const validation = CreateQuoteV1Schema.safeParse(body)
  
  if (!validation.success) {
    return NextResponse.json(
      { 
        error: 'Validation failed',
        details: validation.error.issues.map(i => ({
          path: i.path.join('.'),
          message: i.message,
        }))
      },
      { status: 400 }
    )
  }
  
  const { client_id, services, notes } = validation.data
  
  // Validar que el cliente existe
  const { data: client, error: clientError } = await supabase
    .from('clients')
    .select('id')
    .eq('id', client_id)
    .single()
  
  if (clientError || !client) {
    return NextResponse.json(
      { error: 'Client not found' },
      { status: 404 }
    )
  }
  
  // Validar que todos los servicios existen
  const serviceIds = services.map(s => s.service_id)
  const { data: servicesData, error: servicesError } = await supabase
    .from('services')
    .select('id, base_price')
    .in('id', serviceIds)
  
  if (servicesError || !servicesData || servicesData.length !== serviceIds.length) {
    return NextResponse.json(
      { error: 'One or more services not found' },
      { status: 404 }
    )
  }
  
  // ... resto del código ...
}
```

**🚀 Mejora Extra**: 
- Agregar validación de límites de negocio (ej: máximo de servicios por cotización)
- Implementar sanitización de `notes` para prevenir XSS

---

### 4. ❌ RATE LIMITING IN-MEMORY (NO ESCALABLE)

**📍 Dónde está**: `lib/api/middleware.ts` (líneas 137-158)

**💥 Impacto Real**:
- Rate limiting solo funciona en una instancia
- En Vercel (serverless), cada función puede tener su propio Map
- Permite bypass del rate limiting fácilmente
- No persiste entre reinicios
- Vulnerable a ataques distribuidos

**✅ Solución**:
```typescript
// Usar Redis o Vercel Edge Config para rate limiting distribuido
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

export async function checkRateLimit(
  key: string,
  maxRequests: number = 60,
  windowMs: number = 60000
): Promise<boolean> {
  const redisKey = `ratelimit:${key}`
  const now = Date.now()
  
  // Usar sliding window log
  const pipeline = redis.pipeline()
  pipeline.zremrangebyscore(redisKey, 0, now - windowMs)
  pipeline.zcard(redisKey)
  pipeline.zadd(redisKey, { score: now, member: `${now}-${Math.random()}` })
  pipeline.expire(redisKey, Math.ceil(windowMs / 1000))
  
  const results = await pipeline.exec()
  const count = results[1] as number
  
  return count < maxRequests
}
```

**🚀 Mejora Extra**: 
- Implementar diferentes límites por tipo de usuario (admin vs vendor)
- Agregar rate limiting por IP además de por usuario
- Implementar exponential backoff

---

### 5. ❌ FALTA VALIDACIÓN DE UUID EN PARÁMETROS DE RUTA

**📍 Dónde está**: `app/api/admin/users/[id]/role/route.ts` (línea 10)

**💥 Impacto Real**:
- No valida que `id` sea un UUID válido
- Permite inyección de valores malformados
- Puede causar errores de base de datos
- Expone información de estructura interna

**✅ Solución**:
```typescript
import { z } from 'zod'

const UUIDParamSchema = z.object({
  id: z.string().uuid('Invalid user ID format'),
})

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const rawParams = await params
    const validation = UUIDParamSchema.safeParse(rawParams)
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid user ID format' },
        { status: 400 }
      )
    }
    
    const { id } = validation.data
    // ... resto del código ...
  }
}
```

---

### 6. ❌ EMAIL TEMPLATES VULNERABLES A XSS

**📍 Dónde está**: `lib/integrations/email.ts` (líneas 84-199)

**💥 Impacto Real**:
- Interpolación directa de `clientName`, `quoteId`, `totalAmount` sin sanitizar
- Si estos valores vienen de la base de datos sin sanitizar, pueden contener HTML/JS malicioso
- Ataques de XSS a través de emails

**✅ Solución**:
```typescript
import DOMPurify from 'isomorphic-dompurify'

// Función helper para sanitizar
function sanitizeForEmail(input: string | number): string {
  const str = String(input)
  // Escapar HTML
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
}

export const emailTemplates = {
  quoteCreated: (quoteId: string, clientName: string, totalAmount: number) => ({
    subject: `Nueva Cotización #${quoteId.slice(0, 8)}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>...</style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Nueva Cotización Creada</h1>
            </div>
            <div class="content">
              <p>Hola ${sanitizeForEmail(clientName)},</p>
              <p>Se ha creado una nueva cotización para ti:</p>
              <ul>
                <li><strong>ID:</strong> ${sanitizeForEmail(quoteId.slice(0, 8))}</li>
                <li><strong>Total:</strong> $${sanitizeForEmail(totalAmount.toLocaleString('es-MX', { minimumFractionDigits: 2 }))}</li>
              </ul>
              <!-- ... -->
            </div>
          </div>
        </body>
      </html>
    `,
  }),
  // ... otros templates
}
```

---

### 7. ❌ FALTA VALIDACIÓN DE PERMISOS EN checkAdmin

**📍 Dónde está**: `lib/api/middleware.ts` (líneas 45-61)

**💥 Impacto Real**:
- No maneja correctamente el enum de PostgreSQL
- Comparación directa `=== 'admin'` puede fallar con enum
- No valida que el perfil exista antes de comparar
- Retorna `false` silenciosamente en caso de error

**✅ Solución**:
```typescript
export async function checkAdmin(userId: string): Promise<boolean> {
  try {
    const supabase = await createClient()
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .maybeSingle()
    
    if (error) {
      logger.error('Auth Middleware', 'Error checking admin role', new Error(error.message), {
        userId,
        errorCode: error.code,
      })
      return false // Fail secure
    }
    
    if (!profile || !profile.role) {
      return false
    }
    
    // Manejar enum de PostgreSQL correctamente
    const roleStr = String(profile.role).trim().toLowerCase()
    return roleStr === 'admin'
  } catch (error) {
    logger.error('Auth Middleware', 'Failed to check admin role', error as Error, {
      userId,
    })
    return false // Fail secure
  }
}
```

---

### 8. ❌ MIDDLEWARE NO PROTEGE RUTAS API

**📍 Dónde está**: `utils/supabase/middleware.ts` (líneas 56-63)

**💥 Impacto Real**:
- Todas las rutas `/api/*` están excluidas del middleware
- No hay protección centralizada para APIs
- Cada endpoint debe implementar su propia autenticación
- Inconsistencia en la protección

**✅ Solución**:
```typescript
export async function updateSession(request: NextRequest) {
  // ... código existente ...
  
  const pathname = request.nextUrl.pathname
  
  // Excluir solo rutas estáticas, NO APIs
  if (
    pathname.startsWith('/_next') ||
    pathname === '/favicon.ico' ||
    pathname.match(/\.(ico|png|jpg|jpeg|svg|gif|webp)$/)
  ) {
    return supabaseResponse
  }
  
  // Para rutas API, verificar autenticación pero no redirigir
  if (pathname.startsWith('/api')) {
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    // Permitir que el endpoint maneje autorización específica
    return supabaseResponse
  }
  
  // ... resto del código para rutas de UI ...
}
```

**🚀 Mejora Extra**: 
- Crear middleware específico para APIs
- Implementar API key validation en middleware para rutas `/api/v1/*`

---

## 🟠 PROBLEMAS DE ALTA PRIORIDAD (Prioridad 2)

### 9. ❌ FALTA VALIDACIÓN DE TAMAÑO DE REQUEST BODY

**📍 Dónde está**: Múltiples endpoints API

**💥 Impacto Real**:
- Permite requests de tamaño ilimitado
- Vulnerable a DoS por payload grande
- Puede causar timeouts y consumo excesivo de memoria

**✅ Solución**:
```typescript
// Agregar validación de tamaño antes de parsear JSON
const MAX_BODY_SIZE = 1024 * 1024 // 1MB

export async function POST(request: NextRequest) {
  const contentLength = request.headers.get('content-length')
  
  if (contentLength && parseInt(contentLength) > MAX_BODY_SIZE) {
    return NextResponse.json(
      { error: 'Request body too large' },
      { status: 413 }
    )
  }
  
  // ... resto del código ...
}
```

---

### 10. ❌ FALTA VALIDACIÓN DE ORIGEN (CORS) EN APIs PÚBLICAS

**📍 Dónde está**: `app/api/v1/quotes/route.ts`

**💥 Impacto Real**:
- API pública sin validación de origen
- Vulnerable a CSRF
- Permite acceso desde cualquier dominio

**✅ Solución**:
```typescript
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS?.split(',') || []

export async function GET(request: NextRequest) {
  const origin = request.headers.get('origin')
  
  if (origin && !ALLOWED_ORIGINS.includes(origin)) {
    return NextResponse.json(
      { error: 'Origin not allowed' },
      { status: 403 }
    )
  }
  
  // ... resto del código ...
  
  const response = NextResponse.json({ data, pagination })
  
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin)
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-key')
  }
  
  return response
}
```

---

### 11. ❌ FALTA TRANSACCIÓN EN CREACIÓN DE COTIZACIÓN

**📍 Dónde está**: `app/api/v1/quotes/route.ts` (líneas 192-233)

**💥 Impacto Real**:
- Si falla la inserción de `quote_services`, la cotización queda huérfana
- No hay rollback automático
- Estado inconsistente de la base de datos

**✅ Solución**:
```typescript
// Usar transacción de Supabase
const { data: quote, error: quoteError } = await supabase
  .rpc('create_quote_with_services', {
    p_client_id: client_id,
    p_vendor_id: userId,
    p_notes: notes || null,
    p_status: 'DRAFT',
    p_total_amount: totalAmount,
    p_services: quoteServices,
  })

// O implementar en la base de datos:
```

```sql
CREATE OR REPLACE FUNCTION create_quote_with_services(
  p_client_id UUID,
  p_vendor_id UUID,
  p_notes TEXT,
  p_status TEXT,
  p_total_amount NUMERIC,
  p_services JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
  v_quote_id UUID;
BEGIN
  -- Crear cotización
  INSERT INTO quotes (client_id, vendor_id, notes, status, total_amount)
  VALUES (p_client_id, p_vendor_id, p_notes, p_status, p_total_amount)
  RETURNING id INTO v_quote_id;
  
  -- Insertar servicios
  INSERT INTO quote_services (quote_id, service_id, quantity, price)
  SELECT 
    v_quote_id,
    (s->>'service_id')::UUID,
    (s->>'quantity')::INTEGER,
    (s->>'price')::NUMERIC
  FROM jsonb_array_elements(p_services) s;
  
  RETURN v_quote_id;
END;
$$;
```

---

### 12. ❌ FALTA VALIDACIÓN DE LÍMITES EN PAGINACIÓN

**📍 Dónde está**: `app/api/v1/quotes/route.ts` (líneas 68-69)

**💥 Impacto Real**:
- Permite `limit` y `offset` sin validación
- Puede causar DoS con queries muy grandes
- Permite valores negativos

**✅ Solución**:
```typescript
const MAX_LIMIT = 100
const DEFAULT_LIMIT = 50

const limit = Math.min(
  Math.max(1, parseInt(searchParams.get('limit') || String(DEFAULT_LIMIT))),
  MAX_LIMIT
)
const offset = Math.max(0, parseInt(searchParams.get('offset') || '0'))
```

---

### 13. ❌ LOGGING DE INFORMACIÓN SENSIBLE

**📍 Dónde está**: Múltiples archivos

**💥 Impacto Real**:
- Logs pueden contener datos sensibles
- Si los logs se exponen, se filtra información

**✅ Solución**:
```typescript
// Crear función helper para sanitizar logs
function sanitizeForLogging(data: Record<string, unknown>): Record<string, unknown> {
  const sensitiveKeys = ['password', 'token', 'api_key', 'secret', 'key']
  const sanitized = { ...data }
  
  for (const key in sanitized) {
    if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk))) {
      sanitized[key] = '[REDACTED]'
    }
  }
  
  return sanitized
}

// Usar en logging
logger.info('API /v1/quotes', 'Quote created', sanitizeForLogging({
  quoteId: quote.id,
  userId,
  totalAmount,
}))
```

---

### 14. ❌ FALTA VALIDACIÓN DE TIPO DE ARCHIVO EN EMAIL ATTACHMENTS

**📍 Dónde está**: `lib/integrations/email.ts` (líneas 48-54)

**💥 Impacto Real**:
- Permite cualquier tipo de archivo
- Puede enviar archivos maliciosos
- No valida tamaño de attachments

**✅ Solución**:
```typescript
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv',
]

const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024 // 10MB

if (options.attachments && options.attachments.length > 0) {
  for (const att of options.attachments) {
    // Validar tamaño
    const size = typeof att.content === 'string' 
      ? Buffer.byteLength(att.content)
      : att.content.length
    
    if (size > MAX_ATTACHMENT_SIZE) {
      throw new Error(`Attachment ${att.filename} exceeds maximum size`)
    }
    
    // Validar tipo MIME
    if (att.contentType && !ALLOWED_MIME_TYPES.includes(att.contentType)) {
      throw new Error(`Attachment type ${att.contentType} not allowed`)
    }
  }
  
  emailData.attachments = options.attachments.map(att => ({
    filename: att.filename,
    content: typeof att.content === 'string' ? Buffer.from(att.content) : att.content,
    contentType: att.contentType,
  }))
}
```

---

### 15. ❌ FALTA VALIDACIÓN DE UUID EN validateApiKey

**📍 Dónde está**: `lib/api/apiKeys.ts` (línea 51)

**💥 Impacto Real**:
- Permite API keys en query params (visible en logs, URLs)
- No valida formato antes de hashear
- Puede causar problemas de rendimiento con keys malformadas

**✅ Solución**:
```typescript
// Remover query params como fuente de API key
const apiKey = 
  request.headers.get('x-api-key') || 
  request.headers.get('authorization')?.replace('Bearer ', '')

if (!apiKey) {
  return {
    valid: false,
    error: 'API key no proporcionada',
  }
}

// Validar formato básico (longitud, caracteres)
if (apiKey.length < 32 || apiKey.length > 256) {
  logger.warn('API Keys', 'Invalid API key format', {
    length: apiKey.length,
  })
  return {
    valid: false,
    error: 'API key inválida',
  }
}

// Validar que solo contenga caracteres alfanuméricos y guiones
if (!/^[a-zA-Z0-9_-]+$/.test(apiKey)) {
  return {
    valid: false,
    error: 'API key inválida',
  }
}
```

---

### 16. ❌ FALTA VALIDACIÓN DE ROL EN checkAdmin CON ENUM

**📍 Dónde está**: `lib/api/middleware.ts` (línea 56)

**💥 Impacto Real**:
- Comparación directa puede fallar con enum de PostgreSQL
- Inconsistente con el manejo en otros lugares del código

**✅ Solución**: Ver problema #7 (ya documentado arriba)

---

### 17. ❌ FALTA SANITIZACIÓN EN NOTES

**📍 Dónde está**: `app/api/v1/quotes/route.ts` (línea 198)

**💥 Impacto Real**:
- `notes` se inserta directamente sin sanitizar
- Vulnerable a XSS si se renderiza en el frontend
- Puede contener SQL injection si se usa incorrectamente

**✅ Solución**:
```typescript
import { sanitizeHTML } from '@/lib/utils/security'

// Antes de insertar
const sanitizedNotes = notes 
  ? sanitizeHTML(notes).substring(0, 5000) // Limitar longitud
  : null

// Insertar sanitizedNotes en lugar de notes
```

---

### 18. ❌ FALTA VALIDACIÓN DE CLIENT_ID PERTENECE AL VENDOR

**📍 Dónde está**: `app/api/v1/quotes/route.ts` (línea 196)

**💥 Impacto Real**:
- Permite crear cotizaciones para clientes de otros vendedores
- Violación de aislamiento de datos
- Puede causar problemas de negocio

**✅ Solución**:
```typescript
// Validar que el cliente pertenece al vendedor o es compartido
const { data: client, error: clientError } = await supabase
  .from('clients')
  .select('id, created_by')
  .eq('id', client_id)
  .single()

if (clientError || !client) {
  return NextResponse.json(
    { error: 'Client not found' },
    { status: 404 }
  )
}

// Si el cliente tiene created_by, verificar que sea del mismo vendedor o admin
if (client.created_by && client.created_by !== userId) {
  // Verificar si el usuario es admin
  const isAdmin = await checkAdmin(userId)
  if (!isAdmin) {
    return NextResponse.json(
      { error: 'Client does not belong to you' },
      { status: 403 }
    )
  }
}
```

---

### 19. ❌ FALTA VALIDACIÓN DE PRECIO EN SERVICES

**📍 Dónde está**: `app/api/v1/quotes/route.ts` (líneas 185-190)

**💥 Impacto Real**:
- Permite precios negativos o cero
- Permite override de precios sin validación
- Puede causar problemas financieros

**✅ Solución**:
```typescript
const totalAmount = services.reduce((sum: number, s) => {
  const service = servicesData?.find((svc) => svc.id === s.service_id)
  const quantity = Math.max(1, Math.min(1000, s.quantity || 1))
  
  // Si se proporciona precio, validar que sea razonable
  let price: number
  if (s.price !== undefined) {
    // Validar que el precio override no sea más del 200% del precio base
    const basePrice = service?.base_price || 0
    const maxPrice = basePrice * 2
    price = Math.max(0, Math.min(maxPrice, s.price))
  } else {
    price = service?.base_price || 0
  }
  
  if (price <= 0) {
    throw new Error(`Invalid price for service ${s.service_id}`)
  }
  
  return sum + (price * quantity)
}, 0)
```

---

### 20. ❌ FALTA HEADERS DE SEGURIDAD EN RESPUESTAS API

**📍 Dónde está**: Todos los endpoints API

**💥 Impacto Real**:
- Falta Content-Security-Policy
- Falta X-Content-Type-Options
- Falta Strict-Transport-Security

**✅ Solución**:
```typescript
// Crear helper para agregar headers de seguridad
function addSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains'
    )
  }
  
  return response
}

// Usar en todos los endpoints
return addSecurityHeaders(NextResponse.json({ data }))
```

---

## 🟡 PROBLEMAS DE PRIORIDAD MEDIA

### 21. Performance: N+1 Queries en useAdvancedMetrics

**📍 Dónde está**: `lib/hooks/useAdvancedMetrics.ts`

**💥 Impacto Real**:
- Query separada para cada cliente (líneas 127-137)
- Puede ser lento con muchos clientes

**✅ Solución**: Usar JOIN o agregar en una sola query

---

### 22. Arquitectura: Duplicación de Lógica de Autenticación

**📍 Dónde está**: Múltiples archivos

**💥 Impacto Real**:
- Código duplicado
- Inconsistencias en validación
- Difícil de mantener

**✅ Solución**: Centralizar en middleware

---

### 23. Performance: Falta Caché en checkAdmin

**📍 Dónde está**: `lib/api/middleware.ts`

**💥 Impacto Real**:
- Query a BD en cada verificación
- Puede ser lento con alto tráfico

**✅ Solución**: Implementar caché con TTL corto

---

### 24. UX: Falta Manejo de Errores en Frontend

**📍 Dónde está**: Componentes del dashboard

**💥 Impacto Real**:
- Errores no se muestran al usuario
- Experiencia pobre

**✅ Solución**: Implementar ErrorBoundary y toast notifications

---

### 25. Seguridad: Falta Rotación de API Keys

**📍 Dónde está**: Sistema de API keys

**💥 Impacto Real**:
- Keys pueden quedar comprometidas
- No hay forma de revocar fácilmente

**✅ Solución**: Implementar expiración automática y rotación

---

## 🟢 MEJORAS RECOMENDADAS (Prioridad Baja)

### 26. Agregar Tests de Seguridad
### 27. Implementar Monitoring y Alerting
### 28. Documentar API con OpenAPI/Swagger
### 29. Agregar Health Check Endpoint
### 30. Implementar Circuit Breaker Pattern
### 31. Agregar Request ID para Tracing
### 32. Implementar Structured Logging
### 33. Agregar Metrics y Observability

---

## 📋 CHECKLIST DE ACCIÓN INMEDIATA

### Crítico (Hacer HOY):
- [ ] Eliminar o proteger endpoint `/api/admin/debug-role`
- [ ] Rotar todas las keys expuestas en documentación
- [ ] Eliminar keys de `GUIA_PRODUCCION.md`
- [ ] Agregar validación Zod a `/api/v1/quotes` POST
- [ ] Implementar rate limiting distribuido (Redis)
- [ ] Agregar validación UUID en parámetros de ruta
- [ ] Sanitizar email templates
- [ ] Corregir checkAdmin para manejar enum

### Alta Prioridad (Esta Semana):
- [ ] Validar tamaño de request body
- [ ] Implementar CORS en APIs públicas
- [ ] Agregar transacciones en creación de cotizaciones
- [ ] Validar límites de paginación
- [ ] Sanitizar logs
- [ ] Validar attachments de email
- [ ] Remover API key de query params
- [ ] Sanitizar notes
- [ ] Validar ownership de client_id
- [ ] Validar precios en services
- [ ] Agregar headers de seguridad

---

## 🎯 MÉTRICAS DE ÉXITO

Después de implementar las correcciones:
- ✅ 0 endpoints de debug en producción
- ✅ 0 secrets en código/documentación
- ✅ 100% de endpoints con validación Zod
- ✅ Rate limiting distribuido funcionando
- ✅ 0 vulnerabilidades XSS conocidas
- ✅ Todas las transacciones atómicas
- ✅ Logs sanitizados

---

**Última actualización**: 2025-01-XX  
**Próxima revisión recomendada**: En 30 días o después de cambios significativos

