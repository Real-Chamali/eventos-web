# 🔍 Verificación de 2FA y Notificaciones

**Fecha**: Diciembre 2024  
**Estado**: Verificación completada

---

## ✅ VERIFICACIÓN DE 2FA

### Estado: ✅ **CÓDIGO COMPLETO Y CORRECTO**

### Rutas API Verificadas:

#### 1. `POST /api/auth/2fa/setup` ✅
- **Archivo**: `app/api/auth/2fa/setup/route.ts`
- **Funcionalidad**: Genera secreto TOTP y QR code
- **Verificación**:
  - ✅ Genera secreto TOTP correctamente
  - ✅ Crea QR code con formato correcto
  - ✅ Retorna secret, qrCode y manualEntryKey
  - ✅ Manejo de errores implementado
  - ✅ Autenticación requerida

#### 2. `POST /api/auth/2fa/verify` ✅
- **Archivo**: `app/api/auth/2fa/verify/route.ts`
- **Funcionalidad**: Verifica código TOTP y habilita 2FA
- **Verificación**:
  - ✅ Valida token TOTP con ventana de 1 período
  - ✅ Guarda secreto en metadata del usuario
  - ✅ Marca `two_factor_enabled: true`
  - ✅ Manejo de errores implementado
  - ✅ Validación de parámetros

#### 3. `POST /api/auth/2fa/disable` ✅
- **Archivo**: `app/api/auth/2fa/disable/route.ts`
- **Funcionalidad**: Deshabilita 2FA
- **Verificación**:
  - ✅ Elimina secreto de metadata
  - ✅ Marca `two_factor_enabled: false`
  - ✅ Manejo de errores implementado

#### 4. `GET /api/auth/2fa/check` ✅
- **Archivo**: `app/api/auth/2fa/check/route.ts`
- **Funcionalidad**: Verifica estado de 2FA
- **Verificación**:
  - ✅ Lee metadata del usuario
  - ✅ Retorna estado correcto
  - ✅ Manejo de errores implementado

### Componente UI Verificado:

#### `components/security/SecuritySettings.tsx` ✅
- **Funcionalidades**:
  - ✅ Carga estado inicial de 2FA
  - ✅ Botón para habilitar 2FA
  - ✅ Diálogo con QR code
  - ✅ Código manual alternativo
  - ✅ Campo para código de verificación
  - ✅ Botón para verificar y habilitar
  - ✅ Botón para deshabilitar 2FA
  - ✅ Indicador visual de estado
  - ✅ Manejo de errores con toasts

### ⚠️ PROBLEMA IDENTIFICADO:

**2FA no está integrado en el flujo de login**

**Problema**: El código de 2FA está implementado para habilitar/deshabilitar, pero **no está integrado en el proceso de autenticación**. Cuando un usuario con 2FA habilitado intenta iniciar sesión, el sistema no solicita el código TOTP.

**Solución requerida**:
1. Modificar el flujo de login para verificar si el usuario tiene 2FA habilitado
2. Si está habilitado, solicitar código TOTP después de validar email/password
3. Verificar código TOTP antes de completar el login

**Archivos a modificar**:
- `app/api/auth/login/route.ts` (si existe)
- O middleware de autenticación
- Componente de login

---

## ✅ VERIFICACIÓN DE NOTIFICACIONES

### Estado: ⚠️ **CÓDIGO COMPLETO PERO CON PROBLEMAS**

### Componente Verificado:

#### `components/notifications/NotificationCenter.tsx` ✅
- **Funcionalidades**:
  - ✅ Carga notificaciones iniciales
  - ✅ Suscripción a Supabase Realtime
  - ✅ Filtro por `user_id`
  - ✅ Sonido cuando llega notificación (Web Audio API)
  - ✅ Notificaciones del navegador
  - ✅ Badge animado con contador
  - ✅ Marcar como leído individual
  - ✅ Marcar todas como leídas
  - ✅ UI con colores por tipo
  - ✅ Manejo de errores robusto

### Base de Datos Verificada:

#### Tabla `notifications` ✅
- ✅ Tabla existe
- ✅ RLS habilitado
- ✅ Políticas RLS correctas:
  - `notifications_select_own` - Usuarios pueden leer sus propias notificaciones
  - `notifications_insert_system` - Sistema puede crear notificaciones
  - `notifications_update_own` - Usuarios pueden actualizar sus propias notificaciones
  - `notifications_delete_own_or_admin` - Usuarios pueden eliminar sus propias notificaciones

#### Función `create_notification()` ⚠️
- ✅ Función existe
- ✅ Tiene `search_path` configurado
- ⚠️ **PROBLEMA**: `security_definer: false` (debería ser `true`)

**Problema**: La función `create_notification` necesita ser `SECURITY DEFINER` para poder crear notificaciones desde el código de la aplicación usando el service role de Supabase. Actualmente está como `SECURITY INVOKER`, lo que significa que solo puede crear notificaciones si el usuario autenticado tiene permisos directos.

**Solución**: Cambiar la función a `SECURITY DEFINER` en la migración 015.

### ⚠️ PROBLEMAS IDENTIFICADOS:

#### 1. Función `create_notification` necesita ser SECURITY DEFINER

**Problema**: La función está como `SECURITY INVOKER`, pero necesita ser `SECURITY DEFINER` para funcionar correctamente con el service role.

**Solución**: Actualizar la función en la base de datos.

#### 2. Realtime puede no estar habilitado para la tabla

**Problema**: Necesita verificar que Supabase Realtime está habilitado para la tabla `notifications` en el dashboard.

**Solución**: Verificar en Supabase Dashboard → Database → Replication.

#### 3. No hay código que cree notificaciones automáticamente

**Problema**: No se encontró código que llame a `create_notification()` cuando ocurren eventos importantes (crear cotización, aprobar cotización, etc.).

**Solución**: Agregar llamadas a `create_notification()` en:
- Crear cotización (`app/api/quotes/route.ts`)
- Aprobar cotización (`app/api/quotes/[id]/route.ts`)
- Crear evento (`components/events/CreateEventDialog.tsx`)
- Otros eventos importantes

---

## 📋 CHECKLIST DE VERIFICACIÓN

### 2FA:
- [x] Rutas API implementadas correctamente
- [x] Componente UI completo
- [x] Generación de QR code funciona
- [x] Verificación de código TOTP funciona
- [ ] **Integración en flujo de login** ⚠️

### Notificaciones:
- [x] Componente UI completo
- [x] Suscripción Realtime implementada
- [x] Tabla de notificaciones existe
- [x] Políticas RLS correctas
- [ ] **Función create_notification como SECURITY DEFINER** ⚠️
- [ ] **Realtime habilitado para tabla** ⚠️
- [ ] **Código que crea notificaciones automáticamente** ⚠️

---

## 🔧 CORRECCIONES NECESARIAS

### 1. Corregir función `create_notification` (CRÍTICO)

**Archivo**: Crear nueva migración o actualizar función directamente

```sql
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_type VARCHAR,
  p_title VARCHAR,
  p_message TEXT,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER  -- ← Cambiar a SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  -- Validar tipo
  IF p_type NOT IN ('quote', 'event', 'payment', 'reminder', 'system') THEN
    RAISE EXCEPTION 'Invalid notification type: %', p_type;
  END IF;

  -- Insertar notificación
  INSERT INTO notifications (user_id, type, title, message, metadata)
  VALUES (p_user_id, p_type, p_title, p_message, p_metadata)
  RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$$;
```

### 2. Verificar Realtime en Supabase Dashboard

1. Ir a Supabase Dashboard
2. Database → Replication
3. Verificar que `notifications` está en la lista
4. Si no está, agregarla

### 3. Agregar creación de notificaciones en eventos importantes

**Ejemplo para crear cotización**:

```typescript
// En app/api/quotes/route.ts después de crear la cotización
import { createClient } from '@/utils/supabase/server'

const supabaseAdmin = createClient()
const { data: { user } } = await supabaseAdmin.auth.getUser()

if (user) {
  // Notificar al cliente (si existe)
  if (payload.client_id) {
    await supabaseAdmin.rpc('create_notification', {
      p_user_id: payload.client_id,
      p_type: 'quote',
      p_title: 'Nueva cotización creada',
      p_message: `Se ha creado una nueva cotización para ti`,
      p_metadata: { quote_id: data.id }
    })
  }
  
  // Notificar al vendedor
  await supabaseAdmin.rpc('create_notification', {
    p_user_id: auth.userId,
    p_type: 'quote',
    p_title: 'Cotización creada',
    p_message: `Has creado una nueva cotización`,
    p_metadata: { quote_id: data.id }
  })
}
```

---

## 📊 RESUMEN

### ✅ Lo que funciona:
- 2FA: Código completo para habilitar/deshabilitar
- Notificaciones: UI completa y suscripción Realtime

### ⚠️ Lo que necesita corrección:
- 2FA: Integración en flujo de login
- Notificaciones: Función `create_notification` como SECURITY DEFINER
- Notificaciones: Verificar Realtime habilitado
- Notificaciones: Agregar código que crea notificaciones automáticamente

---

## 🎯 PRÓXIMOS PASOS

1. **Corregir función `create_notification`** (5 min)
2. **Verificar Realtime en Supabase Dashboard** (2 min)
3. **Integrar 2FA en login** (1-2 horas)
4. **Agregar creación automática de notificaciones** (1-2 horas)

---

**Nota**: El código está bien implementado, pero necesita estas correcciones para funcionar completamente en producción.

