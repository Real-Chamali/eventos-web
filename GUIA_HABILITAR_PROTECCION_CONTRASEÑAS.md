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
2. En el submenú de Authentication, haz clic en **"Policies"** o **"Settings"**
3. Busca la sección **"Password Security"** o **"Password Requirements"**

**Nota**: La ubicación exacta puede variar según la versión del dashboard. Si no encuentras "Password Security", busca en:
- Authentication → Settings → Password
- Authentication → Configuration → Password Security

### Paso 3: Habilitar Leaked Password Protection

1. Busca la opción **"Leaked Password Protection"** o **"Check for compromised passwords"**
2. Activa el toggle/switch para habilitar la protección
3. **Recomendado**: Configura también los requisitos de contraseña:
   - **Minimum password length**: 8 caracteres (mínimo recomendado)
   - **Require uppercase**: ✅ Habilitar
   - **Require lowercase**: ✅ Habilitar
   - **Require numbers**: ✅ Habilitar
   - **Require special characters**: ✅ Habilitar (opcional pero recomendado)

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

## 📋 Checklist Rápido

- [ ] Acceder a Supabase Dashboard
- [ ] Navegar a Authentication → Settings/Configuration
- [ ] Buscar sección "Password Security"
- [ ] Habilitar "Leaked Password Protection"
- [ ] Configurar requisitos mínimos de contraseña
- [ ] Guardar cambios
- [ ] Probar con contraseña común (ej: `password123`) para verificar

**Tiempo estimado**: 5-10 minutos

---

## 🔗 Enlaces Directos

- **Supabase Dashboard Principal**: https://supabase.com/dashboard/project/nmcrmgdnpzrrklpcgyzn
- **Authentication Settings**: https://supabase.com/dashboard/project/nmcrmgdnpzrrklpcgyzn/auth/providers
- **Security Advisors** (verificar estado): https://supabase.com/dashboard/project/nmcrmgdnpzrrklpcgyzn/advisors/security
- **Documentación oficial**: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection

## ✅ Verificación Después de Habilitar

Una vez que hayas habilitado la protección, verifica usando:
- **Script de verificación**: Ver `VERIFICACION_PROTECCION_CONTRASEÑAS.md`
- **Supabase Advisor**: Debe dejar de mostrar el warning "Leaked Password Protection Disabled"

---

**Última actualización**: Diciembre 2024

