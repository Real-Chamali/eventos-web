# ✅ Checklist: Habilitar Protección de Contraseñas

## 🎯 Objetivo
Habilitar la protección contra contraseñas comprometidas (HaveIBeenPwned) en Supabase.

**Tiempo estimado**: 5-10 minutos

---

## 📝 Pasos a Seguir

### 1. Acceder al Dashboard
- [ ] Ir a https://supabase.com/dashboard
- [ ] Iniciar sesión
- [ ] Seleccionar proyecto: `nmcrmgdnpzrrklpcgyzn`

### 2. Navegar a Configuración de Autenticación
- [ ] Click en **"Authentication"** (menú lateral izquierdo)
- [ ] Click en **"Policies"** o **"Settings"**
- [ ] Buscar sección **"Password Security"** o **"Password Requirements"**

### 3. Habilitar Protección
- [ ] Encontrar opción **"Leaked Password Protection"** o **"Check for compromised passwords"**
- [ ] Activar el toggle/switch ✅

### 4. Configurar Requisitos (Recomendado)
- [ ] **Minimum password length**: Establecer en `8` caracteres
- [ ] **Require uppercase**: ✅ Habilitar
- [ ] **Require lowercase**: ✅ Habilitar
- [ ] **Require numbers**: ✅ Habilitar
- [ ] **Require special characters**: ✅ Habilitar (opcional)

### 5. Guardar Cambios
- [ ] Click en **"Save"** o **"Update"**
- [ ] Verificar mensaje de confirmación

### 6. Verificar (Opcional)
- [ ] Intentar crear usuario de prueba con contraseña común (`password123`)
- [ ] Verificar que se rechace la contraseña comprometida
- [ ] Eliminar usuario de prueba

---

## ✅ Completado

Una vez completado este checklist, la protección de contraseñas estará activa para:
- ✅ Nuevos registros de usuario
- ✅ Cambios de contraseña existentes

---

## 📚 Referencias

- **Guía completa**: Ver `GUIA_HABILITAR_PROTECCION_CONTRASEÑAS.md`
- **Documentación Supabase**: https://supabase.com/docs/guides/auth/password-security

---

**Fecha de completado**: _______________

