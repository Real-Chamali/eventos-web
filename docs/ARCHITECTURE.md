# Arquitectura y Decisiones (ADR) - Sistema de Eventos

## ADR-001: Framework y Stack Tecnológico

### Decisión
Se eligió Next.js 16 con React 19 como framework principal.

### Contexto
- Necesidad de aplicación full-stack moderna
- Soporte para SSR y SSG
- Excelente rendimiento
- Comunidad grande y bien mantenida

### Consecuencias
- ✅ API routes integradas
- ✅ Middleware nativo
- ✅ Optimización automática
- ⚠️ Curva de aprendizaje para nuevos dev

---

## ADR-002: Base de Datos - Supabase

### Decisión
Usar Supabase como proveedor de BD y autenticación.

### Contexto
- PostgreSQL como motor subyacente
- Autenticación OAuth integrada
- Realtime subscriptions
- Row Level Security (RLS)

### Consecuencias
- ✅ Menos infraestructura que mantener
- ✅ Escalabilidad automática
- ⚠️ Dependencia de proveedor externo

---

## ADR-003: Validación de Datos con Zod

### Decisión
Usar Zod para validación en cliente y servidor.

### Contexto
- Type-safe validation
- Mensajes de error personalizables
- Pequeño tamaño de bundle

### Consecuencias
- ✅ Previene XSS y inyección de datos
- ✅ Mejor manejo de errores
- ⚠️ Overhead de validación

---

## ADR-004: Estilos con Tailwind CSS

### Decisión
Tailwind CSS para estilos utilitarios.

### Contexto
- Desarrollo rápido
- Consistencia visual
- Bajo mantenimiento

### Consecuencias
- ✅ Clases reutilizables
- ✅ Tema oscuro fácil de implementar
- ⚠️ Archivos HTML verbosos

---

## ADR-005: Manejo de Errores Global

### Decisión
Error Boundary + Logger centralizado para capturar y registrar errores.

### Contexto
- Necesidad de observabilidad en producción
- Prevención de crashes silenciosos
- Debugging facilitado

### Consecuencias
- ✅ Mejor UX ante errores
- ✅ Trazabilidad completa
- ✅ Integración con Sentry

---

## ADR-006: Testing Multi-Nivel

### Decisión
Vitest para unitarios, Playwright para E2E.

### Contexto
- Cobertura completa de código
- Simulación de interacciones reales
- CI/CD integrado

### Consecuencias
- ✅ Confianza en cambios
- ✅ Detección temprana de bugs
- ⚠️ Mantenimiento de tests

---

## ADR-007: Autenticación y Autorización

### Decisión
JWT + Session storage + Role-Based Access Control (RBAC).

### Contexto
- Seguridad de datos
- Control granular de acceso
- Estateless

### Consecuencias
- ✅ Escalable
- ✅ Seguro
- ⚠️ Complejidad adicional

---

## ADR-008: Rate Limiting

### Decisión
Rate limiter en memoria para proteger endpoints.

### Contexto
- Prevención de ataques DDoS
- Control de abuso de API
- Protección de recursos

### Consecuencias
- ✅ Menor carga en BD
- ✅ Experiencia consistente
- ⚠️ Requiere monitoreo

---

## ADR-011: Runtime Configuration

### Decisión
- **Middleware**: Edge Runtime (por defecto en Next.js)
- **API Routes**: Node.js Runtime (por defecto, sin configuración explícita)

### Contexto
- Next.js middleware siempre corre en Edge Runtime para mejor performance
- API routes usan Node.js runtime por defecto para compatibilidad con librerías Node.js
- Migración a Web Crypto API permite compatibilidad con Edge Runtime si es necesario en el futuro

### Configuración Actual

#### Middleware (`middleware.ts`)
- **Runtime**: Edge Runtime (automático, no requiere configuración)
- **Ubicación**: Raíz del proyecto
- **Funcionalidad**: Manejo de sesiones de Supabase, autenticación, redirecciones

#### API Routes (`app/api/**/route.ts`)
- **Runtime**: Node.js Runtime (por defecto)
- **Total de rutas verificadas**: 14 rutas
- **Configuración explícita**: Ninguna (todas usan defaults)
- **Compatibilidad**: 
  - ✅ Compatible con Node.js crypto (legacy, para desencriptación de datos antiguos)
  - ✅ Compatible con Web Crypto API (nuevo, para Edge Runtime si se necesita)
  - ✅ Todas las funciones de seguridad migradas a Web Crypto API

#### Funciones de Seguridad (`lib/utils/security.ts`)
- **Compatibilidad**: Web Crypto API (Edge Runtime compatible)
- **Fallback**: Node.js crypto para datos encriptados con formato legacy
- **Funciones migradas**:
  - `generateCSRFToken()` - Web Crypto API (sync)
  - `generateSecureToken()` - Web Crypto API (sync)
  - `hashSHA256()` - Web Crypto API (async)
  - `encryptData()` - Web Crypto API (async)
  - `decryptData()` - Web Crypto API (async) con fallback a Node.js crypto para legacy

### Consecuencias
- ✅ Middleware rápido (Edge Runtime)
- ✅ API routes con acceso completo a ecosistema Node.js
- ✅ Funciones de seguridad compatibles con ambos runtimes
- ✅ Migración futura a Edge Runtime posible si se necesita
- ⚠️ Si alguna ruta necesita Edge Runtime, debe verificar compatibilidad de dependencias

### Notas Técnicas
- **No se requiere configuración explícita** en las rutas API actuales
- Si en el futuro se necesita Edge Runtime para alguna ruta, agregar:
  ```typescript
  export const runtime = 'edge'
  ```
- Las funciones de seguridad ya están preparadas para Edge Runtime gracias a la migración a Web Crypto API

---

## ADR-009: Notificaciones y Feedback

### Decisión
React Hot Toast para notificaciones y feedback visual.

### Contexto
- UX mejorada
- Feedback inmediato
- No intrusivo

### Consecuencias
- ✅ Mejor UX
- ✅ Menos confusión
- ✅ Fácil de customizar

---

## ADR-010: Exportación de Datos

### Decisión
PDF (jsPDF) y CSV (nativo) para exportación.

### Contexto
- Necesidad de reportes
- Portabilidad de datos
- Requisitos de compliance

### Consecuencias
- ✅ Usuarios pueden exportar
- ✅ Cumple GDPR
- ✅ Integración fácil

---

## Decisiones Futuras

### En Consideración
1. **Microservicios**: Si el sistema crece mucho
2. **GraphQL**: Para queries más eficientes
3. **WebSockets**: Para real-time collaboration
4. **Blockchain**: Para auditoría inmutable (si aplica)
5. **Machine Learning**: Para predictive analytics

---

## Matriz de Decisión

| Aspecto | Seleccionado | Alternativas | Por qué |
|---------|-------------|-------------|--------|
| Frontend | Next.js | Remix, Astro | SSR + API Routes |
| BD | Supabase | Firebase, MongoDB | PostgreSQL + Auth |
| Validación | Zod | Yup, Joi | Mejor TypeScript |
| Testing | Vitest + Playwright | Jest + Cypress | Más rápido, mejor |
| Auth | Supabase Auth | Auth0, Cognito | Integrado |
| Estilos | Tailwind | Bootstrap, Styled Components | Utilidades |
| Cache | In-memory | Redis, Memcached | Simplicidad |

---

Documento generado: 8 de diciembre de 2025
