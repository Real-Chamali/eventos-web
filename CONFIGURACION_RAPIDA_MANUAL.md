# ⚡ Configuración Rápida Manual (5 minutos)

Este documento contiene **enlaces directos** y **valores exactos** para configurar las 3 tareas pendientes en menos de 5 minutos.

---

## 🎯 Tarea 1: Configurar CORS (2 minutos)

### Enlace Directo:
👉 **https://app.supabase.com/project/nmcrmgdnpzrrklpcgyzn/auth/url-configuration**

### Valores a Configurar:

**Site URL:**
```
http://localhost:3000
```

**Redirect URLs** (agregar una por línea):
```
http://localhost:3000/**
https://eventos-web.vercel.app/**
```

### Pasos:
1. Clic en el enlace de arriba
2. Pegar los valores
3. Clic en "Save"

---

## 🔒 Tarea 2: Habilitar Protección de Contraseñas (1 minuto)

### Enlace Directo:
👉 **https://app.supabase.com/project/nmcrmgdnpzrrklpcgyzn/auth/providers**

### Pasos:
1. Clic en el enlace de arriba
2. Ir a la sección "Password Security" o "Settings"
3. Activar "Leaked Password Protection"
4. Guardar cambios

---

## 📧 Tarea 3: Configurar Resend (2 minutos)

### Paso 1: Crear cuenta (si no la tienes)
👉 **https://resend.com/signup**

### Paso 2: Obtener API Key
👉 **https://resend.com/api-keys**
- Clic en "Create API Key"
- Copiar la key (empieza con `re_`)

### Paso 3: Configurar en Vercel
👉 **https://vercel.com/[tu-proyecto]/settings/environment-variables**

**Agregar estas variables:**
- Key: `RESEND_API_KEY`
- Value: `re_xxxxxxxxxxxxx` (tu key de Resend)

### Paso 4: Redeploy
👉 **https://vercel.com/[tu-proyecto]/deployments**
- Clic en "Redeploy" en el último deployment

---

## ✅ Verificación Rápida

Después de configurar, ejecuta:
```bash
./scripts/configurar-todo-automatico.sh
```

Este script verificará que todo esté configurado correctamente.

---

## 📝 Notas

- **CORS**: Necesario para que la autenticación funcione
- **Protección de Contraseñas**: Mejora la seguridad
- **Resend**: Habilita envío de emails reales (opcional pero recomendado)

