# 🔐 Guía: Habilitar Protección de Contraseñas Comprometidas

## 📋 Descripción

Esta guía explica cómo habilitar la protección contra contraseñas comprometidas en Supabase. Esta característica verifica si las contraseñas han sido expuestas en filtraciones de datos usando la base de datos de HaveIBeenPwned.

---

## 🎯 ¿Por qué es importante?

La protección de contraseñas comprometidas ayuda a:
- ✅ Prevenir el uso de contraseñas que han sido expuestas en filtraciones de datos
- ✅ Mejorar la seguridad general de las cuentas de usuario
- ✅ Cumplir con mejores prácticas de seguridad

---

## 📝 Pasos para Habilitar

### Paso 1: Acceder al Dashboard de Supabase

1. Ve a [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Inicia sesión con tu cuenta
3. Selecciona tu proyecto: `nmcrmgdnpzrrklpcgyzn`

### Paso 2: Navegar a Authentication Settings

1. En el menú lateral izquierdo, haz clic en **"Authentication"**
2. Luego haz clic en **"Policies"** o busca la sección de **"Password Security"**

### Paso 3: Habilitar Leaked Password Protection

1. Busca la opción **"Leaked Password Protection"** o **"Password Strength"**
2. Activa el toggle para habilitar la protección
3. Opcionalmente, puedes configurar:
   - **Minimum password length**: Longitud mínima de contraseña (recomendado: 8 caracteres)
   - **Require uppercase**: Requerir mayúsculas
   - **Require lowercase**: Requerir minúsculas
   - **Require numbers**: Requerir números
   - **Require special characters**: Requerir caracteres especiales

### Paso 4: Guardar Cambios

1. Haz clic en **"Save"** o **"Update"** para guardar los cambios
2. Los cambios se aplicarán inmediatamente a todos los nuevos registros y cambios de contraseña

---

## 🔍 Verificación

Para verificar que la protección está habilitada:

1. Intenta crear un nuevo usuario con una contraseña común como `password123`
2. Si la protección está habilitada, deberías recibir un error indicando que la contraseña ha sido comprometida
3. También puedes verificar en los logs de Supabase si hay intentos bloqueados

---

## 📚 Referencias

- **Documentación oficial**: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection
- **HaveIBeenPwned**: https://haveibeenpwned.com/

---

## ⚠️ Notas Importantes

1. **No afecta usuarios existentes**: Esta protección solo se aplica a:
   - Nuevos registros de usuario
   - Cambios de contraseña existentes

2. **Privacidad**: Supabase usa la API de HaveIBeenPwned que solo envía un hash parcial de la contraseña, nunca la contraseña completa.

3. **Rendimiento**: La verificación puede agregar un pequeño retraso (milisegundos) al proceso de registro/cambio de contraseña.

---

## ✅ Estado Actual

- **Estado**: ⚠️ Deshabilitado (requiere habilitación manual)
- **Prioridad**: Media (recomendado pero no crítico)
- **Impacto**: Mejora la seguridad general del sistema

---

**Última actualización**: $(date)

