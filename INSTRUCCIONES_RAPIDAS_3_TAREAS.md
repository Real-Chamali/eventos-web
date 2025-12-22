# ⚡ Instrucciones Rápidas - 3 Tareas Críticas

**Tiempo**: 50 minutos | **Dificultad**: Fácil

---

## 🎯 Resumen Ultra-Rápido

1. **Migración 015** (15 min) → Supabase SQL Editor → Copiar/pegar `015_fix_security_issues.sql`
2. **Protección Contraseñas** (5 min) → Supabase Auth → Password Security → Activar toggle
3. **Resend** (30 min) → Crear cuenta → API key → Vercel env vars → Redeploy

---

## ✅ TAREA 1: Migración 015 (15 min)

### Quick Steps:
1. [Supabase Dashboard](https://supabase.com/dashboard) → SQL Editor
2. Ejecutar: `QUERY_VERIFICACION_MIGRACION_015.sql` (ver si ya está aplicada)
3. Si hay ❌: Copiar TODO `migrations/015_fix_security_issues.sql` → Pegar → Run
4. Verificar de nuevo

**Archivos**:
- Verificación: `QUERY_VERIFICACION_MIGRACION_015.sql`
- Migración: `migrations/015_fix_security_issues.sql`

---

## ✅ TAREA 2: Protección Contraseñas (5 min)

### Quick Steps:
1. Supabase Dashboard → **Authentication** → **Settings/Configuration**
2. Buscar **"Password Security"**
3. Activar **"Leaked Password Protection"** ✅
4. (Opcional) Configurar requisitos mínimos
5. **Save**

**Guía completa**: `GUIA_HABILITAR_PROTECCION_CONTRASEÑAS.md`

---

## ✅ TAREA 3: Resend (30 min)

### Quick Steps:

#### 1. Crear cuenta (5 min)
- [resend.com](https://resend.com) → Sign Up → GitHub/Google/Email

#### 2. API Key (5 min)
- Dashboard → **API Keys** → **Create API Key**
- Name: `Eventos Web Production`
- Permission: **Sending access**
- **Copiar key** (solo se muestra una vez): `re_xxxxxxxxxxxxx`

#### 3. Dominio (10 min) - OPCIONAL
- Dashboard → **Domains** → **Add Domain**
- Agregar registros DNS en tu proveedor
- Verificar

#### 4. Vercel (10 min)
- [Vercel Dashboard](https://vercel.com/dashboard) → Tu proyecto → **Settings** → **Environment Variables**
- Agregar:
  - `RESEND_API_KEY` = `re_xxxxxxxxxxxxx` (la que copiaste)
  - `RESEND_FROM_EMAIL` = `Eventos Web <noreply@tudominio.com>` (opcional)
- Marcar para: Production, Preview, Development
- **Save**

#### 5. Redeploy (2 min)
- Vercel → **Deployments** → Último deployment → **⋯** → **Redeploy**

#### 6. Probar (3 min)
- Crear cotización o usar API
- Verificar en Resend Dashboard → **Emails**

**Guía completa**: `GUIA_CONFIGURAR_RESEND.md`

---

## 📋 Checklist Rápido

- [ ] Migración 015 aplicada (verificar con query)
- [ ] Protección contraseñas activada
- [ ] Resend cuenta creada
- [ ] Resend API key obtenida
- [ ] Variables configuradas en Vercel
- [ ] Redeploy completado
- [ ] Email de prueba enviado

---

## 🆘 Si Algo Falla

### Migración 015:
- Ver `GUIA_APLICAR_MIGRACION_015.md`
- Revisar errores en SQL Editor
- La migración es idempotente (puedes ejecutarla varias veces)

### Protección Contraseñas:
- Buscar en diferentes secciones de Authentication
- Puede estar en "Policies", "Settings", o "Configuration"

### Resend:
- Verificar que API key esté completa (sin espacios)
- Revisar logs en Vercel Dashboard
- Revisar logs en Resend Dashboard → Emails

---

## 📚 Documentación Completa

- **Scripts detallados**: `SCRIPTS_APLICAR_TAREAS_CRITICAS.md`
- **Migración 015**: `GUIA_APLICAR_MIGRACION_015.md`
- **Resend**: `GUIA_CONFIGURAR_RESEND.md`
- **Contraseñas**: `GUIA_HABILITAR_PROTECCION_CONTRASEÑAS.md`
- **Checklist completo**: `CHECKLIST_FINAL_COMPLETO.md`

---

**¡Listo para empezar!** 🚀

