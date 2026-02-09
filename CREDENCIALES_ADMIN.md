# 🔐 Credenciales de Administrador

## 📋 Información de Acceso

### Usuario Administrador
- **Email**: `admin@chamali.com`
- **Contraseña**: Requiere configuración inicial

### ⚠️ Importante

La contraseña por defecto necesita ser configurada. Sigue estos pasos:

## 🛠️ Configuración Inicial

### Opción 1: Via Supabase Dashboard

1. Ve a [https://app.supabase.com](https://app.supabase.com)
2. Inicia sesión con tu cuenta de Supabase
3. Selecciona tu proyecto
4. Ve a **Authentication** → **Users**
5. Busca el usuario `admin@chamali.com`
6. Haz clic en **Reset password**
7. Establece una contraseña segura

### Opción 2: Via Script SQL

Ejecuta este SQL en tu proyecto Supabase:

```sql
-- Establecer contraseña temporal para admin
UPDATE auth.users 
SET encrypted_password = crypt('TempAdmin123!', gen_salt('bf'))
WHERE email = 'admin@chamali.com';

-- Forzar reset de contraseña en próximo login
UPDATE auth.users 
SET password_hash = NULL,
password_hasher = 'bcrypt'
WHERE email = 'admin@chamali.com';
```

Luego inicia sesión con:
- Email: `admin@chamali.com`
- Contraseña: `TempAdmin123!`

El sistema te pedirá cambiarla en el primer login.

## 🔒 Seguridad Implementada

### Restricciones de Administrador
- ✅ Solo `admin@chamali.com` puede tener rol `admin`
- ✅ Trigger previene asignación de rol admin a otros usuarios
- ✅ Verificación doble en base de datos y funciones
- ✅ Logs de auditoría de todos los intentos

### Funciones de Seguridad
```sql
-- Función que verifica si un usuario puede ser admin
CREATE OR REPLACE FUNCTION can_be_admin(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_email TEXT;
BEGIN
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = user_id;
  
  RETURN COALESCE(user_email = 'admin@chamali.com', false);
END;
$$;
```

## 🚀 Acceso al Sistema

### URL de Producción
```
https://tu-dominio.com/login
```

### URL de Desarrollo
```
http://localhost:3000/login
```

## 📱 Flujo de Login

1. **Ingresar credenciales** en `/login`
2. **Verificación 2FA** (si está configurada)
3. **Redirección automática**:
   - Admin → `/admin`
   - Vendor → `/dashboard`

## 🔧 Si Olvidaste la Contraseña

### Método 1: Supabase Dashboard
1. Ve a Authentication → Users
2. Busca `admin@chamali.com`
3. Click en "Reset password"
4. Recibirás email de reseteo

### Método 2: Script de Emergencia
```sql
-- Crear token de reseteo de 24 horas
UPDATE auth.users 
SET password_hash = NULL,
password_hasher = 'bcrypt',
recovery_token = gen_random_bytes(32),
recovery_token_sent_at = NOW()
WHERE email = 'admin@chamali.com';
```

Luego usa: `/reset-password?token=TOKEN_GENERADO`

## 🛡️ Recomendaciones de Seguridad

### Contraseña Fuerte
- Mínimo 12 caracteres
- Incluir mayúsculas, minúsculas, números y símbolos
- Evitar información personal

### Autenticación de Dos Factores
- Configurar Google Authenticator o Authy
- Guardar códigos de recuperación seguros
- Habilitar 2FA para todos los admins

### Monitoreo
- Revisar logs de auditoría regularmente
- Monitorear intentos de login fallidos
- Configurar alertas de seguridad

## 📊 Logs de Auditoría

Todos los accesos de admin son registrados en:
- **Tabla**: `audit_logs`
- **Endpoint**: `/admin/audit-logs`
- **Filtros**: Por usuario, acción, fecha

## 🚨 En Caso de Emergencia

### Bloqueo de Cuenta
Si sospechas compromiso:

```sql
-- Deshabilitar temporalmente
UPDATE auth.users 
SET banned = 'true'
WHERE email = 'admin@chamali.com';
```

### Restablecimiento Completo
```sql
-- Restablecer todo el acceso
UPDATE auth.users 
SET 
  password_hash = NULL,
  password_hasher = 'bcrypt',
  banned = 'false',
  last_sign_in_at = NULL
WHERE email = 'admin@chamali.com';
```

## 📞 Soporte

Si tienes problemas con el acceso:

1. **Revisa logs** en `/admin/audit-logs`
2. **Verifica configuración** en Supabase Dashboard
3. **Contacta al desarrollador** con detalles del error

---

**⚠️ ADVERTENCIA**: Nunca compartas estas credenciales. El acceso de administrador da control total sobre el sistema.
