# 🎯 Próximos Pasos - Plan de Acción

## ✅ Estado Actual

### Completado (92%)
- ✅ Fase 1: SWR, caché, paginación, tipos
- ✅ Fase 2: Context API, optimistic updates, API keys, tests básicos
- ✅ Fase 3: Métricas, accesibilidad, JSDoc

### Pendiente (8%)
- ⏳ Tests E2E completos
- ⏳ Migración de páginas restantes a hooks SWR

---

## 🔥 Prioridad Alta (Esta Semana)

### 1. Corregir y Verificar Build ✅
- [x] Corregir error de TypeScript en `app/admin/events/page.tsx`
- [ ] Verificar que el build compile sin errores
- [ ] Probar la aplicación en desarrollo

### 2. Migrar Páginas Restantes a SWR

#### 2.1 Página de Clientes (`app/dashboard/clients/page.tsx`)
**Acción:** Migrar a usar `useClients` hook

```typescript
// Cambiar de Server Component a Client Component
'use client'
import { useClients } from '@/lib/hooks'

export default function ClientsPage() {
  const { clients, loading, error, refresh } = useClients()
  // ... resto del código
}
```

**Beneficio:** Caché automático, mejor rendimiento

#### 2.2 Página de Eventos Admin (`app/admin/events/page.tsx`)
**Acción:** Crear hook `useAdminEvents` o usar `useEvents`

```typescript
// Crear lib/hooks/useAdminEvents.ts
export function useAdminEvents() {
  // Similar a useEvents pero sin filtro de vendor_id
}
```

**Beneficio:** Consistencia con resto de la app

---

## 📋 Prioridad Media (Próximas 2 Semanas)

### 3. Implementar Optimistic Updates en Mutaciones

#### 3.1 Crear Cotización
**Ubicación:** `app/dashboard/quotes/new/page.tsx`

```typescript
import { useOptimisticMutation } from '@/lib/hooks'
import { useQuotes } from '@/lib/hooks'

export default function NewQuotePage() {
  const { refresh } = useQuotes()
  const { execute: createQuote } = useOptimisticMutation()
  
  const handleSubmit = async (data) => {
    await createQuote({
      swrKey: 'quotes',
      optimisticUpdate: (current) => [
        { ...data, id: 'temp-id', status: 'draft' },
        ...(current || [])
      ],
      mutateFn: async () => {
        const { data } = await supabase.from('quotes').insert(data).select().single()
        return data
      },
      successMessage: 'Cotización creada exitosamente',
    })
    router.push('/dashboard/quotes')
  }
}
```

#### 3.2 Editar Cotización
**Ubicación:** `app/dashboard/quotes/[id]/edit/page.tsx`

#### 3.3 Eliminar Cotización
**Implementar:** Confirmación con optimistic update

---

### 4. Crear Tabla de API Keys en Supabase

**Migración SQL necesaria:**

```sql
-- Crear tabla api_keys
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL UNIQUE,
  permissions TEXT[] DEFAULT ARRAY['read', 'write'],
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own API keys"
  ON api_keys FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own API keys"
  ON api_keys FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own API keys"
  ON api_keys FOR UPDATE
  USING (auth.uid() = user_id);

-- Índices
CREATE INDEX idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX idx_api_keys_key_hash ON api_keys(key_hash);
```

**Luego actualizar:** `lib/api/apiKeys.ts` para usar la tabla real

---

### 5. Agregar Más Tests

#### 5.1 Tests de Componentes
- [ ] `components/dashboard/DashboardStats.test.tsx`
- [ ] `components/dashboard/DashboardRecentQuotes.test.tsx`
- [ ] `components/ui/Card.test.tsx`
- [ ] `components/ui/Button.test.tsx`

#### 5.2 Tests de Hooks
- [ ] `tests/hooks/useQuotes.test.ts`
- [ ] `tests/hooks/useClients.test.ts`
- [ ] `tests/hooks/useOptimisticMutation.test.ts`

#### 5.3 Tests de Utilidades
- [ ] `tests/utils/metrics.test.ts`
- [ ] `tests/utils/apiKeys.test.ts`

---

## 🔮 Prioridad Baja (Próximo Mes)

### 6. Tests E2E con Playwright

**Escenarios críticos a testear:**

1. **Flujo de Login**
   - Login exitoso
   - Login fallido
   - Redirección por rol

2. **Crear Cotización Completa**
   - Seleccionar cliente
   - Agregar servicios
   - Calcular totales
   - Guardar y verificar

3. **Dashboard**
   - Carga de estadísticas
   - Navegación entre secciones
   - Filtros y búsqueda

**Archivo:** `tests/e2e/critical-flows.spec.ts`

---

### 7. Dashboard de Métricas

**Implementar:** Página de admin para ver métricas de rendimiento

```typescript
// app/admin/metrics/page.tsx
'use client'

import { metrics } from '@/lib/utils/metrics'

export default function MetricsPage() {
  const performanceMetrics = metrics.getPerformanceMetrics()
  const businessMetrics = metrics.getBusinessMetrics()
  
  // Mostrar gráficos con recharts
  // Filtrar por fecha
  // Exportar reportes
}
```

---

### 8. Mejoras de Accesibilidad

- [ ] Agregar `aria-label` a todos los botones sin texto
- [ ] Agregar `role` y `aria-live` a regiones dinámicas
- [ ] Mejorar contraste de colores (verificar WCAG AA)
- [ ] Agregar `alt` text a todas las imágenes
- [ ] Testing con screen reader

---

### 9. Documentación Completa

#### 9.1 README por Módulo
- [ ] `lib/hooks/README.md` - Documentar todos los hooks
- [ ] `components/README.md` - Guía de componentes
- [ ] `lib/utils/README.md` - Utilidades disponibles

#### 9.2 JSDoc Completo
- [ ] Documentar todas las funciones públicas
- [ ] Agregar ejemplos de uso
- [ ] Documentar parámetros y retornos

---

## 🚀 Mejoras Opcionales (Futuro)

### 10. Caché Persistente (IndexedDB)
- Cachear datos en IndexedDB
- Funcionalidad offline-first
- Sincronización cuando vuelve online

### 11. Service Worker
- Pre-cache de assets
- Background sync
- Push notifications

### 12. Monitoreo en Producción
- Integrar Sentry completamente
- Dashboard de errores
- Alertas automáticas

---

## 📊 Métricas de Éxito

### Corto Plazo (1 mes)
- ✅ Build sin errores
- ✅ 100% de páginas usando hooks SWR
- ✅ Optimistic updates en mutaciones críticas
- ✅ 50%+ cobertura de tests

### Mediano Plazo (3 meses)
- ✅ Tests E2E para flujos críticos
- ✅ Dashboard de métricas funcionando
- ✅ Tabla de API keys implementada
- ✅ 80%+ cobertura de tests

---

## 🎯 Acción Inmediata

**Para empezar AHORA:**

1. ✅ **Corregir build** (ya hecho)
2. ⏭️ **Migrar página de clientes** a `useClients`
3. ⏭️ **Implementar optimistic update** en crear cotización
4. ⏭️ **Ejecutar tests** y verificar que pasen

---

## 📝 Notas

- Todos los hooks con SWR están listos para usar
- El Context API está disponible pero no es obligatorio usarlo
- Los tests base están creados como ejemplo
- La documentación se puede ir agregando gradualmente

**Orden sugerido de implementación:**
1. Build funcionando ✅
2. Migrar páginas a SWR
3. Optimistic updates
4. Más tests
5. Tabla API keys
6. Tests E2E
