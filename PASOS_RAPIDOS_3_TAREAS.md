# ⚡ Pasos Rápidos: 3 Tareas de Configuración

**Tiempo total**: ~45 minutos

---

## 🎯 Tarea 1: Configurar CORS (10 min)

### Enlaces Directos:
- **URL Configuration**: https://app.supabase.com/project/nmcrmgdnpzrrklpcgyzn/auth/url-configuration

### URLs a Agregar:

**Site URL**:
- `http://localhost:3000`
- `https://eventos-web-lovat.vercel.app`

**Redirect URLs** (agregar cada una en una línea nueva):
- `http://localhost:3000/**`
- `https://eventos-web-lovat.vercel.app/**`

### Pasos:
1. Abre el enlace de arriba
2. Agrega las URLs en "Site URL" y "Redirect URLs"
3. Clic en "Save"

---

## 🔐 Tarea 2: Protección de Contraseñas (5 min)

### Enlace Directo:
- **Password Security**: https://app.supabase.com/project/nmcrmgdnpzrrklpcgyzn/auth/providers

### Pasos:
1. Abre el enlace de arriba
2. Busca "Password Security" o "Password Requirements"
3. Activa "Leaked Password Protection" ✅
4. (Opcional) Configura requisitos mínimos:
   - Min length: 8
   - Require uppercase: ✅
   - Require lowercase: ✅
   - Require numbers: ✅
5. Clic en "Save"

---

## 📧 Tarea 3: Configurar Resend (30 min)

### Paso 1: Crear cuenta (5 min)
- Ve a: https://resend.com
- Crea cuenta (GitHub/Google/Email)

### Paso 2: Obtener API Key (5 min)
- Ve a: https://resend.com/api-keys
- Clic en "Create API Key"
- Name: `Eventos Web Production`
- Permission: `Sending access`
- **Copia la key**: `re_xxxxxxxxxxxxx`

### Paso 3: Configurar en Vercel (10 min)
- Ve a: https://vercel.com/dashboard
- Tu proyecto → Settings → Environment Variables
- Agrega:
  - `RESEND_API_KEY` = `re_xxxxxxxxxxxxx`
  - `RESEND_FROM_EMAIL` = `Eventos Web <noreply@tudominio.com>` (opcional)
- Marca: Production, Preview, Development
- Save

### Paso 4: Redeploy (2 min)
- Vercel → Deployments → Último → ⋯ → Redeploy

### Paso 5: Probar (3 min)
- Crear cotización o usar la app
- Verificar en: https://resend.com/emails

---

## ✅ Orden Recomendado

1. **Protección de contraseñas** (5 min) - Más rápida
2. **CORS** (10 min) - Importante para auth
3. **Resend** (30 min) - Funcionalidad adicional

---

## 🔗 Todos los Enlaces

- **CORS**: https://app.supabase.com/project/nmcrmgdnpzrrklpcgyzn/auth/url-configuration
- **Protección Contraseñas**: https://app.supabase.com/project/nmcrmgdnpzrrklpcgyzn/auth/providers
- **Resend**: https://resend.com
- **Resend API Keys**: https://resend.com/api-keys
- **Vercel Env Vars**: https://vercel.com/dashboard

---

**¡Vamos a completarlas!** 🚀

