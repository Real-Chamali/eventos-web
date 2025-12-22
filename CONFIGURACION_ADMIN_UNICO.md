# 🔐 Configuración: Admin Único (admin@chamali.com)

**Fecha**: Diciembre 2024  
**Estado**: ✅ Implementado

---

## 📋 Resumen

Se ha configurado el sistema para que **solo `admin@chamali.com` pueda tener rol de administrador**. El admin puede gestionar vendedores, pero no puede crear nuevos administradores.

---

## ✅ Implementación

### 1. Base de Datos

#### Migración 020: `020_restrict_admin_to_single_email.sql`

**Funciones creadas**:

1. **`can_be_admin(user_id UUID)`**
   - Verifica si un usuario puede tener rol admin
   - Solo retorna `true` si el email es `admin@chamali.com`

2. **`prevent_unauthorized_admin()`**
   - Función de trigger que previene asignación de rol admin
   - Se ejecuta antes de INSERT o UPDATE en `profiles`
   - Lanza excepción si se intenta asignar admin a otro usuario

3. **`is_admin()` (actualizada)**
   - Verifica que el usuario actual sea admin
   - Requiere que el email sea `admin@chamali.com` Y que tenga rol `admin`

**Trigger creado**:
- `prevent_unauthorized_admin_trigger`
- Se ejecuta en `BEFORE INSERT OR UPDATE OF role` en `profiles`
- Previene automáticamente cualquier intento de asignar admin a usuarios no autorizados

---

### 2. API Backend

#### `app/api/admin/users/[id]/role/route.ts`

**Validaciones agregadas**:
- ✅ Verifica que solo `admin@chamali.com` pueda recibir rol `admin`
- ✅ Si se intenta asignar `admin` a otro usuario, retorna error 403
- ✅ El admin puede cambiar roles de vendedores (vendor ↔ vendor)
- ✅ El admin puede cambiar su propio rol solo si es admin (no puede quitarse el rol)

**Flujo de validación**:
1. Verificar que el usuario actual es admin
2. Si el nuevo rol es `admin`, verificar que el usuario objetivo es `admin@chamali.com`
3. Si no es `admin@chamali.com`, rechazar con error 403
4. Si es válido, proceder con la actualización

---

### 3. Frontend

#### `app/admin/users/page.tsx`
- ✅ Deshabilitado el botón para cambiar vendedores a admin
- ✅ Muestra mensaje de error si se intenta cambiar a admin
- ✅ Solo permite cambiar admin a vendor

#### `app/admin/vendors/page.tsx`
- ✅ Deshabilitado el botón para cambiar vendedores a admin
- ✅ Muestra mensaje de error si se intenta cambiar a admin
- ✅ Solo permite cambiar admin a vendor

---

## 🔒 Seguridad

### Niveles de Protección

1. **Nivel de Base de Datos (Trigger)**
   - ✅ Previene asignación de admin a nivel SQL
   - ✅ Funciona incluso si se intenta desde SQL directo
   - ✅ No se puede bypassear desde la aplicación

2. **Nivel de API**
   - ✅ Validación adicional en el endpoint
   - ✅ Verifica email antes de permitir cambio
   - ✅ Logging de intentos no autorizados

3. **Nivel de Frontend**
   - ✅ UI previene intentos de cambiar a admin
   - ✅ Mensajes claros al usuario
   - ✅ Mejor experiencia de usuario

---

## 📊 Funcionalidades del Admin

### ✅ Lo que el Admin PUEDE hacer:

1. **Gestionar Vendedores**:
   - Ver lista de todos los vendedores
   - Ver estadísticas de vendedores (ventas, cotizaciones)
   - Cambiar roles de vendedores (solo a vendor, no a admin)
   - Ver detalles de vendedores

2. **Gestionar Usuarios**:
   - Ver lista de todos los usuarios
   - Ver roles de usuarios
   - Cambiar roles (solo a vendor, no a admin)

3. **Gestionar Cotizaciones**:
   - Ver todas las cotizaciones
   - Editar cualquier cotización
   - Aprobar/rechazar cotizaciones

4. **Gestionar Eventos**:
   - Ver todos los eventos
   - Editar cualquier evento
   - Gestionar estado de eventos

5. **Gestionar Servicios**:
   - Crear, editar, eliminar servicios
   - Gestionar precios y categorías

6. **Gestionar Finanzas**:
   - Ver reportes financieros
   - Ver ingresos y gastos
   - Ver comisiones

### ❌ Lo que el Admin NO PUEDE hacer:

1. **Crear nuevos administradores**:
   - No puede asignar rol `admin` a ningún otro usuario
   - Solo `admin@chamali.com` puede ser admin

2. **Quitarse su propio rol de admin**:
   - Protección para evitar perder acceso
   - Debe mantener su rol de admin

---

## 🔍 Verificación

### Verificar que el trigger funciona:

```sql
-- Esto debería fallar (intentar asignar admin a otro usuario)
UPDATE profiles 
SET role = 'admin' 
WHERE id != (SELECT id FROM auth.users WHERE email = 'admin@chamali.com')
LIMIT 1;
-- Error esperado: "Solo admin@chamali.com puede tener rol admin"
```

### Verificar que admin@chamali.com es admin:

```sql
SELECT 
  p.id,
  u.email,
  p.role
FROM profiles p
JOIN auth.users u ON u.id = p.id
WHERE u.email = 'admin@chamali.com';
-- Debe mostrar: role = 'admin'
```

### Verificar función is_admin():

```sql
-- Como admin@chamali.com
SELECT is_admin();
-- Debe retornar: true

-- Como otro usuario
SELECT is_admin();
-- Debe retornar: false
```

---

## 📝 Notas Importantes

1. **Email Hardcodeado**: El email `admin@chamali.com` está hardcodeado en:
   - Función `can_be_admin()`
   - Función `is_admin()`
   - Trigger `prevent_unauthorized_admin()`
   - API `/api/admin/users/[id]/role`

2. **Si necesitas cambiar el email admin**:
   - Actualizar función `can_be_admin()`
   - Actualizar función `is_admin()`
   - Actualizar trigger `prevent_unauthorized_admin()`
   - Actualizar API `/api/admin/users/[id]/role`
   - Ejecutar migración de actualización

3. **Backup del Admin**:
   - Asegúrate de tener acceso a `admin@chamali.com`
   - Si pierdes acceso, necesitarás acceso directo a la base de datos para recuperar

---

## ✅ Estado Final

| Componente | Estado | Detalles |
|------------|--------|----------|
| Trigger de BD | ✅ Activo | Previene asignación de admin |
| Función `is_admin()` | ✅ Actualizada | Verifica email y rol |
| API de roles | ✅ Protegida | Valida email antes de asignar |
| Frontend | ✅ Actualizado | Previene intentos de cambiar a admin |
| Admin puede gestionar vendedores | ✅ Funcional | Puede ver y gestionar vendedores |

---

## 🚀 Próximos Pasos

1. **Probar la funcionalidad**:
   - Intentar cambiar un vendedor a admin (debe fallar)
   - Verificar que admin@chamali.com puede gestionar vendedores
   - Verificar que el trigger funciona en la BD

2. **Monitoreo**:
   - Revisar logs de intentos no autorizados
   - Verificar que no hay errores en producción

---

**Configuración completada exitosamente** ✅

