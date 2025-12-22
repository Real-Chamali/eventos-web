# ✅ Script de Verificación: Protección de Contraseñas

## Propósito

Este documento contiene scripts y métodos para verificar que la protección de contraseñas comprometidas esté habilitada en Supabase.

---

## Método 1: Usando Supabase Advisor (Recomendado)

### Verificación Automática

El Supabase Advisor verifica automáticamente el estado de la protección de contraseñas. Puedes verificar usando:

```bash
# Si tienes acceso a Supabase CLI
supabase advisors security
```

O desde el dashboard:
1. Ve a: https://supabase.com/dashboard/project/nmcrmgdnpzrrklpcgyzn/advisors/security
2. Busca el advisor: **"Leaked Password Protection Disabled"**
3. Si NO aparece, significa que está habilitado ✅
4. Si aparece, significa que está deshabilitado ⚠️

---

## Método 2: Verificación Manual desde Dashboard

### Pasos:

1. **Acceder al Dashboard**
   - Ve a: https://supabase.com/dashboard/project/nmcrmgdnpzrrklpcgyzn
   - Inicia sesión si es necesario

2. **Navegar a Authentication Settings**
   - Menú lateral → **Authentication**
   - Submenú → **Settings** o **Configuration**
   - Busca sección: **"Password Security"** o **"Password Requirements"**

3. **Verificar Estado**
   - Busca la opción: **"Leaked Password Protection"** o **"Check for compromised passwords"**
   - **Estado esperado**: Toggle/switch debe estar **ACTIVADO** ✅
   - Si está desactivado, sigue las instrucciones en `GUIA_HABILITAR_PROTECCION_CONTRASEÑAS.md`

---

## Método 3: Prueba Funcional

### Test de Contraseña Comprometida

Puedes verificar que la protección funciona intentando crear un usuario con una contraseña conocida como comprometida:

#### Desde la Aplicación:

1. Intenta crear un nuevo usuario con:
   - Email: `test@ejemplo.com`
   - Contraseña: `password123` (o cualquier contraseña común)

2. **Resultado esperado si está habilitado**:
   - Deberías recibir un error similar a:
     ```
     Password has been found in data breaches. Please choose a different password.
     ```
   - O en español:
     ```
     Esta contraseña ha sido encontrada en filtraciones de datos. Por favor elige una contraseña diferente.
     ```

3. **Resultado si NO está habilitado**:
   - El usuario se creará sin problemas (esto indica que la protección NO está activa)

#### Desde Supabase Dashboard:

1. Ve a: Authentication → Users → Add User
2. Intenta crear usuario con contraseña común
3. Verifica si aparece el error de contraseña comprometida

---

## Método 4: Verificación Programática (Avanzado)

### Usando Supabase Management API

**Nota**: La configuración de protección de contraseñas no está disponible vía API pública, pero puedes verificar el comportamiento:

```typescript
// Ejemplo de verificación en tu aplicación
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Intentar crear usuario con contraseña comprometida
async function testPasswordProtection() {
  try {
    const { data, error } = await supabase.auth.signUp({
      email: 'test-protection@ejemplo.com',
      password: 'password123' // Contraseña comúnmente comprometida
    })
    
    if (error) {
      // Si la protección está habilitada, deberías ver un error específico
      if (error.message.includes('compromised') || 
          error.message.includes('breach') ||
          error.message.includes('pwned')) {
        console.log('✅ Protección de contraseñas está HABILITADA')
        return true
      } else {
        console.log('⚠️ Error diferente:', error.message)
        return false
      }
    } else {
      console.log('⚠️ Usuario creado - Protección puede NO estar habilitada')
      // Limpiar: eliminar usuario de prueba
      return false
    }
  } catch (err) {
    console.error('Error en test:', err)
    return false
  }
}
```

---

## Estado Actual Verificado

**Fecha de verificación**: Diciembre 2024

**Estado**: ⚠️ **DESHABILITADO**

**Confirmado por**: Supabase Security Advisor

**Advisor ID**: `auth_leaked_password_protection`

**Mensaje**: "Leaked password protection is currently disabled."

---

## Checklist de Verificación

Usa este checklist para verificar que la protección está habilitada:

- [ ] Acceder a Supabase Dashboard
- [ ] Navegar a Authentication → Settings
- [ ] Verificar que "Leaked Password Protection" está ACTIVADO
- [ ] Probar crear usuario con contraseña común (`password123`)
- [ ] Confirmar que aparece error de contraseña comprometida
- [ ] Verificar que Supabase Advisor ya NO muestra el warning

---

## Enlaces Directos

- **Supabase Dashboard**: https://supabase.com/dashboard/project/nmcrmgdnpzrrklpcgyzn
- **Authentication Settings**: https://supabase.com/dashboard/project/nmcrmgdnpzrrklpcgyzn/auth/providers
- **Security Advisors**: https://supabase.com/dashboard/project/nmcrmgdnpzrrklpcgyzn/advisors/security
- **Documentación**: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection

---

## Próximos Pasos

Una vez que hayas habilitado la protección:

1. Ejecuta este script de verificación nuevamente
2. Confirma que el Supabase Advisor ya no muestra el warning
3. Prueba crear un usuario con contraseña comprometida
4. Verifica que el error aparece correctamente

---

**Última actualización**: Diciembre 2024

