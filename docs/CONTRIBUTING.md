# Guía de Contribución

## Empezando

1. **Fork el repositorio**
   ```bash
   git clone https://github.com/tuusuario/eventos-web.git
   cd eventos-web/my-app
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno**
   ```bash
   cp .env.local.example .env.local
   # Editar .env.local con tus credenciales
   ```

4. **Iniciar servidor de desarrollo**
   ```bash
   npm run dev
   ```

## Workflow de Contribución

### 1. Crear rama de feature
```bash
git checkout -b feature/mi-nueva-feature
```

### 2. Hacer cambios
- Escribir código limpio y legible
- Seguir las convenciones existentes
- Agregar tipos TypeScript
- Crear tests para nuevas funciones

### 3. Ejecutar tests localmente
```bash
# Tests unitarios
npm run test

# Tests E2E
npm run playwright

# Coverage
npm run test:coverage
```

### 4. Linting
```bash
npm run lint
```

### 5. Commit
```bash
git add .
git commit -m "feat: descripción clara de cambios"
```

Usar convención de commits:
- `feat:` Nueva funcionalidad
- `fix:` Corrección de bug
- `docs:` Cambios en documentación
- `style:` Formato, sin cambios lógicos
- `refactor:` Mejora de código
- `test:` Agregar o mejorar tests
- `perf:` Mejoras de rendimiento

### 6. Push y Pull Request
```bash
git push origin feature/mi-nueva-feature
```

Crear Pull Request en GitHub con:
- Descripción clara de cambios
- Referencia a issues relacionados
- Screenshots/videos si aplica

## Estándares de Código

### TypeScript
```typescript
// ✅ Bueno
interface User {
  id: string
  name: string
  email: string
}

function getUserName(user: User): string {
  return user.name
}

// ❌ Malo
function getUser(u: any): any {
  return u.name
}
```

### React Components
```typescript
// ✅ Bueno
interface ButtonProps {
  label: string
  onClick: () => void
  disabled?: boolean
}

export default function Button({ label, onClick, disabled }: ButtonProps) {
  return (
    <button onClick={onClick} disabled={disabled}>
      {label}
    </button>
  )
}

// ❌ Malo
export default function Button(props: any) {
  return <button {...props}>{props.label}</button>
}
```

### Manejo de Errores
```typescript
// ✅ Bueno
try {
  const data = await fetchData()
  return { success: true, data }
} catch (error) {
  logger.error('fetchData', 'Error fetching', error)
  return { success: false, error: 'Failed to fetch' }
}

// ❌ Malo
const data = await fetchData() // Sin error handling
```

### Validación
```typescript
// ✅ Bueno
const { valid, data, errors } = validateFormData(LoginSchema, formData)

if (!valid) {
  showErrors(errors)
  return
}

// ❌ Malo
const data = formData // Sin validación
```

## Pruebas

### Tests Unitarios
```typescript
import { describe, it, expect } from 'vitest'
import { calculateCommission } from '@/lib/utils/calculations'

describe('calculateCommission', () => {
  it('should calculate 10% commission', () => {
    expect(calculateCommission(100)).toBe(10)
  })

  it('should handle zero amount', () => {
    expect(calculateCommission(0)).toBe(0)
  })
})
```

### Tests E2E
```typescript
import { test, expect } from '@playwright/test'

test('user can create quote', async ({ page }) => {
  await page.goto('/dashboard/quotes/new')
  // ... interactuar y verificar
  await expect(page.locator('text=Success')).toBeVisible()
})
```

## Documentación

- Actualizar README.md para cambios principales
- Agregar comentarios JSDoc en funciones complejas
- Documenter decisiones en docs/ARCHITECTURE.md

```typescript
/**
 * Calcula la comisión de una venta
 * @param amount - Monto de la venta
 * @param rate - Tasa de comisión (default: 0.1)
 * @returns Comisión calculada
 */
function calculateCommission(amount: number, rate: number = 0.1): number {
  return amount * rate
}
```

## Performance

- Usar lazy loading para componentes grandes
- Evitar renders innecesarios (useMemo, useCallback)
- Comprimir imágenes
- Minimizar bundle size

## Seguridad

- Validar siempre entrada de usuario
- Usar HTTPS en producción
- Mantener secrets fuera del código
- Sanitizar HTML cuando aplica

## Reportar Bugs

1. Crear issue con:
   - Descripción clara
   - Pasos para reproducir
   - Comportamiento esperado
   - Screenshots/logs si hay

2. Etiquetas: `bug`, `urgent`, `backend`, etc.

## Solicitar Features

1. Crear issue con:
   - Descripción de feature
   - Caso de uso
   - Mockups/wireframes si hay

2. Etiquetar como `enhancement`

## Preguntas

- Usar GitHub Discussions
- Email: dev@eventos.com
- Discord: [Enlace al servidor]

---

¡Gracias por contribuir! 🚀
