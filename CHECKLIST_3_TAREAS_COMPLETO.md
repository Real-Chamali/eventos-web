# ✅ Checklist Completo: 3 Tareas de Configuración

**Fecha**: Diciembre 2024  
**Tiempo estimado**: ~45 minutos

---

## 📋 Tarea 1: Configurar CORS en Supabase Dashboard (10 min)

### ✅ Pasos:

1. **Abrir Supabase Dashboard**
   - URL: https://app.supabase.com/project/nmcrmgdnpzrrklpcgyzn/auth/url-configuration

2. **Configurar Site URL**
   - Agregar: `http://localhost:3000`
   - Agregar: `https://eventos-web-lovat.vercel.app`
   - (Si ya están, verificar que estén correctas)

3. **Configurar Redirect URLs**
   - Agregar: `http://localhost:3000/**`
   - Agregar: `https://eventos-web-lovat.vercel.app/**`
   - (El `**` permite cualquier ruta)

4. **Guardar cambios**
   - Clic en "Save"

### ✅ Verificación:
- [ ] Site URLs configuradas
- [ ] Redirect URLs configuradas
- [ ] Cambios guardados

**Enlace directo**: https://app.supabase.com/project/nmcrmgdnpzrrklpcgyzn/auth/url-configuration

---

## 📋 Tarea 2: Habilitar Protección de Contraseñas (5 min)

### ✅ Pasos:

1. **Abrir Supabase Dashboard**
   - URL: https://app.supabase.com/project/nmcrmgdnpzrrklpcgyzn/auth/providers

2. **Ir a Password Security**
   - Buscar sección "Password Security" o "Password Requirements"
   - O ir a: Authentication → Settings → Password Security

3. **Habilitar Leaked Password Protection**
   - Activar toggle "Leaked Password Protection"
   - Esto verifica contraseñas contra HaveIBeenPwned

4. **Configurar Requisitos (Opcional pero recomendado)**
   - Minimum length: `8`
   - Require uppercase: ✅
   - Require lowercase: ✅
   - Require numbers: ✅
   - Require special characters: ⚠️ (opcional, puede ser molesto para usuarios)

5. **Guardar cambios**
   - Clic en "Save"

### ✅ Verificación:
- [ ] Leaked Password Protection habilitado
- [ ] Requisitos mínimos configurados (opcional)
- [ ] Cambios guardados

**Enlace directo**: https://app.supabase.com/project/nmcrmgdnpzrrklpcgyzn/auth/providers

---

## 📋 Tarea 3: Configurar Resend (30 min)

### Paso 1: Crear cuenta en Resend (5 min)

1. **Ir a Resend**
   - URL: https://resend.com

2. **Crear cuenta**
   - Usar GitHub/Google/Email
   - Verificar email si es necesario

### Paso 2: Obtener API Key (5 min)

1. **Ir a API Keys**
   - URL: https://resend.com/api-keys
   - O Dashboard → API Keys

2. **Crear nueva API Key**
   - Name: `Eventos Web Production`
   - Permission: `Sending access`
   - **Copiar la key** (solo se muestra una vez): `re_xxxxxxxxxxxxx`

### Paso 3: Configurar en Vercel (10 min)

1. **Ir a Vercel Dashboard**
   - URL: https://vercel.com/dashboard
   - Seleccionar proyecto: `eventos-web`

2. **Ir a Environment Variables**
   - Settings → Environment Variables
   - O: https://vercel.com/dashboard/[tu-proyecto]/settings/environment-variables

3. **Agregar variables**:
   - **Variable 1**:
     - Name: `RESEND_API_KEY`
     - Value: `re_xxxxxxxxxxxxx` (pegar la key de Resend)
     - Environments: ✅ Production, ✅ Preview, ✅ Development
   
   - **Variable 2** (Opcional pero recomendado):
     - Name: `RESEND_FROM_EMAIL`
     - Value: `Eventos Web <noreply@tudominio.com>` o `noreply@tudominio.com`
     - Environments: ✅ Production, ✅ Preview, ✅ Development

4. **Guardar**
   - Clic en "Save" para cada variable

### Paso 4: Redeploy (2 min)

1. **Ir a Deployments**
   - Vercel Dashboard → Deployments

2. **Redeploy último deployment**
   - Clic en "⋯" (tres puntos) del último deployment
   - Seleccionar "Redeploy"
   - Confirmar

### Paso 5: Probar (3 min)

1. **Crear una cotización** o usar la aplicación
2. **Verificar en Resend Dashboard**
   - URL: https://resend.com/emails
   - Deberías ver el email enviado

### ✅ Verificación:
- [ ] Cuenta de Resend creada
- [ ] API Key obtenida
- [ ] Variables configuradas en Vercel
- [ ] Redeploy completado
- [ ] Email de prueba enviado

**Enlaces útiles**:
- Resend Dashboard: https://resend.com/dashboard
- Resend API Keys: https://resend.com/api-keys
- Vercel Environment Variables: https://vercel.com/dashboard/[tu-proyecto]/settings/environment-variables

---

## 📊 Resumen

| Tarea | Tiempo | Estado | Prioridad |
|-------|--------|--------|-----------|
| 1. CORS en Supabase | 10 min | ⚠️ Pendiente | Alta |
| 2. Protección Contraseñas | 5 min | ⚠️ Pendiente | Alta |
| 3. Configurar Resend | 30 min | ⚠️ Pendiente | Media |

**Total**: ~45 minutos

---

## 🎯 Orden Recomendado

1. **Primero**: Tarea 2 (Protección de contraseñas) - 5 min - Más rápida
2. **Segundo**: Tarea 1 (CORS) - 10 min - Importante para autenticación
3. **Tercero**: Tarea 3 (Resend) - 30 min - Funcionalidad adicional

---

## ✅ Después de Completar

Una vez completadas las 3 tareas:

1. **Probar autenticación** (CORS)
2. **Probar registro con contraseña débil** (Protección)
3. **Probar envío de email** (Resend)

---

**¡Vamos a completarlas!** 🚀

