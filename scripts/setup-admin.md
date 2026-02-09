# 🔧 Configuración de Administrador

## 📋 Credenciales por Defecto

**Email**: `admin@chamali.com`  
**Contraseña**: `Admin2025!`

## 🚀 Configuración Rápida

### Paso 1: Ejecutar Script de Configuración

```bash
# Opción 1: Usar contraseña por defecto
npm run fix-admin

# Opción 2: Especificar contraseña personalizada
node --env-file=.env.local scripts/fix-admin-login.mjs TuContraseñaSegura123!
```

### Paso 2: Verificar en Supabase Dashboard

1. Ve a [https://app.supabase.com](https://app.supabase.com)
2. Selecciona tu proyecto
3. Ve a **Authentication** → **Users**
4. Busca `admin@chamali.com`
5. Verifica que tenga:
   - ✅ Email confirmado
   - ✅ Rol: admin (en tabla profiles)

### Paso 3: Probar Login

1. Ve a `http://localhost:3000/login`
2. Ingresa:
   - Email: `admin@chamali.com`
   - Contraseña: `Admin2025!`
3. Debería redirigirte a `/admin`

## 🔍 Solución de Problemas

### Error: "Usuario no encontrado"

```sql
-- Crear usuario admin manualmente
INSERT INTO auth.users (
  instance_id,
  id,
  email,
  email_confirmed_at,
  phone,
  phone_confirmed_at,
  role,
  created_at,
  updated_at,
  banned_until,
  password_hash
) VALUES (
  '00000000-0000-0000-0000-000000000000', -- instance_id
  gen_random_uuid(), -- ID único
  'admin@chamali.com',
  NOW(),
  NULL,
  NOW(),
  'authenticated',
  NOW(),
  NOW(),
  NULL,
  crypt('Admin2025!', gen_salt('bf'))
);
```

Luego crear el perfil:
```sql
INSERT INTO profiles (id, role, created_at, updated_at)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'admin@chamali.com'),
  'admin',
  NOW(),
  NOW()
);
```

### Error: "Credenciales incorrectas"

Ejecuta el script de reseteo:
```bash
node --env-file=.env.local scripts/fix-admin-login.mjs NuevaContraseña123!
```

### Error: "Acceso denegado"

Verifica que el rol esté configurado correctamente:
```sql
-- Verificar rol del admin
SELECT 
  u.email,
  p.role,
  u.email_confirmed_at
FROM auth.users u
LEFT JOIN profiles p ON p.id = u.id
WHERE u.email = 'admin@chamali.com';
```

### Error: "No se puede conectar a Supabase"

Verifica tus variables de entorno en `.env.local`:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key
```

## 🛡️ Verificaciones de Seguridad

### 1. Restricción de Admin
El sistema tiene restricciones para que solo `admin@chamali.com` pueda ser admin:

```sql
-- Verificar función de seguridad
SELECT proname FROM pg_proc WHERE proname = 'can_be_admin';

-- Debería retornar: can_be_admin
```

### 2. Logs de Auditoría
Revisa los logs de login:
```sql
SELECT * FROM audit_logs 
WHERE table_name = 'auth.users' 
  AND action = 'LOGIN'
ORDER BY created_at DESC 
LIMIT 10;
```

## 📱 Flujo Completo de Login

1. **Usuario ingresa credenciales** en `/login`
2. **Supabase autentica** email y contraseña
3. **Sistema verifica rol** en tabla `profiles`
4. **Redirección automática**:
   - `admin@chamali.com` + role `admin` → `/admin`
   - Cualquier otro usuario → `/dashboard`

## 🔐 Características de Seguridad

- ✅ **Solo admin@chamali.com puede ser admin**
- ✅ **Trigger previene asignación de rol admin**
- ✅ **Logs de auditoría completos**
- ✅ **2FA disponible (opcional)**
- ✅ **Rate limiting en login**

## 🚨 En Caso de Emergencia

### Reset Completo de Admin
```sql
-- Deshabilitar temporalmente
UPDATE auth.users SET banned = 'true' WHERE email = 'admin@chamali.com';

-- Restablecer contraseña
UPDATE auth.users 
SET password_hash = NULL, banned = 'false'
WHERE email = 'admin@chamali.com';

-- Forzar cambio de contraseña en próximo login
UPDATE auth.users 
SET password_hasher = 'bcrypt'
WHERE email = 'admin@chamali.com';
```

### Crear Nuevo Admin (Emergencia)
```sql
-- Solo si el original está comprometido
-- NUNCA usar en producción normalmente
UPDATE profiles 
SET role = 'admin' 
WHERE id = (SELECT id FROM auth.users WHERE email = 'nuevo-admin@dominio.com');
```

## 📞 Soporte y Monitoreo

### Logs Importantes
- **Login attempts**: `/admin/audit-logs`
- **Role changes**: Tabla `audit_logs`
- **Failed logins**: Revisar logs de Supabase

### Métricas de Seguridad
- Intentos de login fallidos
- Cambios de rol
- Accesos desde IPs sospechosas
- Horarios inusuales de acceso

---

**⚠️ IMPORTANTE**: Guarda estas credenciales en un lugar seguro. El acceso de administrador da control total sobre el sistema.
