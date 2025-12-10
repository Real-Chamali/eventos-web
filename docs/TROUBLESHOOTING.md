# Troubleshooting - Sistema de Eventos

## Problemas Comunes

### 1. Error de Conexión a Supabase

**Síntoma:** `Error: Failed to connect to Supabase`

**Soluciones:**
```bash
# 1. Verificar variables de entorno
cat .env.local

# 2. Asegurar que URLs sean correctas
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxxxx

# 3. Verificar que la red esté disponible
curl https://xxxxx.supabase.co

# 4. Limpiar cache y reiniciar
rm -rf .next
npm run dev
```

### 2. Error de Autenticación (401)

**Síntoma:** `Error: Unauthorized`

**Soluciones:**
```typescript
// 1. Verificar que el token esté guardado
localStorage.getItem('supabase-auth-token')

// 2. Limpiar sesión
localStorage.clear()
// Reiniciar login

// 3. Verificar RLS policies en Supabase
// En dashboard -> Authentication -> Policies
```

### 3. Error de Build

**Síntoma:** `npm run build` falla

**Soluciones:**
```bash
# 1. Limpiar y reinstalar
rm -rf node_modules .next
npm install

# 2. Verificar TypeScript
npm run build -- --debug

# 3. Verificar que todas las importaciones sean correctas
grep -r "from '@/'" --include="*.ts" --include="*.tsx"

# 4. Compilar solo cliente
next build
```

### 4. Error de Performance

**Síntoma:** Página carga lentamente

**Soluciones:**
```typescript
// 1. Usar SWR para caché
import useSWR from 'swr'

// 2. Lazy load componentes
const AdminPanel = dynamic(() => import('@/components/AdminPanel'), {
  loading: () => <Skeleton />,
})

// 3. Reducir queries a BD
.select('id, name') // Solo campos necesarios

// 4. Usar revalidateOnFocus: false
const { data } = useSWR('endpoint', fetcher, {
  revalidateOnFocus: false,
})
```

### 5. Error de Validación

**Síntoma:** Datos rechazados por validación

**Soluciones:**
```typescript
// 1. Revisar errors de validación
const { valid, errors } = validateFormData(schema, data)
if (!valid) {
  console.log('Validation errors:', errors)
}

// 2. Ajustar schema si es necesario
const UpdateSchema = CreateSchema.partial()

// 3. Loguear datos antes de validar
console.log('Before validation:', data)
```

### 6. Error de Logout

**Síntoma:** Usuario no puede cerrar sesión

**Soluciones:**
```typescript
// 1. Verificar que supabase esté inicializado
const supabase = createClient()

// 2. Limpiar storage antes de logout
localStorage.clear()
sessionStorage.clear()

// 3. Forzar redirect después de logout
router.push('/login')
router.refresh()
```

### 7. Error de CORS

**Síntoma:** `CORS error` en consola

**Soluciones:**
```bash
# 1. Verificar CORS headers en next.config.ts
# 2. Usar proxy si es necesario
# 3. En desarrollo, asegurar que API esté en mismo puerto

# API local: http://localhost:3000/api/*
```

### 8. Tests Fallando

**Síntoma:** `npm run test` falla

**Soluciones:**
```bash
# 1. Limpiar cache de test
rm -rf node_modules/.vite

# 2. Reinstalar dependencies
npm install

# 3. Ejecutar test específico
npm run test -- validations.test.ts

# 4. Ver logs detallados
npm run test -- --reporter=verbose
```

### 9. Playwright Tests No Encuentran Elementos

**Síntoma:** `Timeout waiting for selector`

**Soluciones:**
```typescript
// 1. Aumentar timeout
test.setTimeout(60000) // 60 segundos

// 2. Esperar explícitamente
await page.waitForSelector('button:has-text("Click me")')

// 3. Usar selectors más específicos
await page.click('button[aria-label="Close"]')

// 4. Agregar debug mode
await page.pause() // Pausa en ese punto
```

### 10. Dark Mode No Funciona

**Síntoma:** Tema no cambia

**Soluciones:**
```typescript
// 1. Verificar que ThemeProvider esté en root
// En app/layout.tsx debe estar <ThemeProviderWrapper>

// 2. Agregar suppressHydrationWarning
<html lang="es" suppressHydrationWarning>

// 3. Verificar selectors Tailwind en CSS
// global.css debe tener:
@media (prefers-color-scheme: dark) {
  // ...
}

// 4. Forzar regeneración
rm -rf .next
npm run dev
```

## Debugging

### Chrome DevTools
```javascript
// En console
// 1. Ver tokens
localStorage.getItem('supabase-auth-token')

// 2. Ver request/response
// Ir a Network tab y filtrar por API calls

// 3. Debuggear React
// Instalar React Developer Tools extension
```

### VS Code Debugging
```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Next.js",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/node_modules/.bin/next",
      "args": ["dev"],
      "console": "integratedTerminal"
    }
  ]
}
```

### Logger
```typescript
import { logger } from '@/lib/utils/logger'

logger.debug('component', 'Debug info', { data })
logger.info('component', 'Info message')
logger.warn('component', 'Warning message')
logger.error('component', 'Error message', error, { context })
```

## Performance Profiling

```bash
# Next.js analytics
npm run build -- --experimental-app-only

# Bundle analysis
npm install --save-dev @next/bundle-analyzer
# Luego usar en next.config.ts
```

## Contacto y Soporte

- **Email:** support@eventos.com
- **Issues:** GitHub Issues
- **Discussions:** GitHub Discussions
- **Discord:** [Enlace]

---

¿Necesitas más ayuda? Abre un issue en GitHub 🆘
