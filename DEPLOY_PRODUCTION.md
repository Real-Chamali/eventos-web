# 🚀 Guía de Despliegue a Producción

**Estado:** ✅ Validación local completada (9 de diciembre de 2025)

---

## 📋 Checklist Pre-Deploy

- ✅ **ESLint**: 0 errores, 0 warnings
- ✅ **Build**: Compilación exitosa (Turbopack optimizado)
- ✅ **Tests Unitarios**: 6/6 pasando (Vitest)
- ✅ **Git**: Repositorio inicializado y configurado
- ✅ **Archivos de Producción**: Creados
  - `.env.production` (con credenciales de Supabase)
  - `vercel.json` (configuración de Vercel)
  - `deploy.sh` (script de validación)

---

## 🔄 Próximos Pasos (Solo 3 pasos)

### Opción A: GitHub + Vercel Auto-Deploy (Recomendado) ⭐

**1. Crear repositorio en GitHub**
```bash
# Crear un nuevo repo llamado "eventos-web" en GitHub.com

# En tu máquina local:
cd /home/voldemort/eventos-web/my-app

# Agregar remoto de GitHub
git remote add origin https://github.com/TU_USERNAME/eventos-web.git
git branch -M main
git push -u origin main
```

**Vercel se desplegará automáticamente** cuando hagas push a `main`.

---

### Opción B: Vercel CLI (Alternativa)

```bash
# Instalar Vercel CLI
npm i -g vercel

# Desplegar a producción
vercel --prod
```

---

## 🗄️ Paso 2: Aplicar Migración BD (Ambas Opciones)

**En Supabase Dashboard:**

1. Ve a **SQL Editor**
2. Crea una **nueva query**
3. Copia/pega el contenido de:
   ```
   /migrations/002_create_quote_versions_table.sql
   ```
4. Presiona **Run**

**Esto crea:**
- Tabla `quote_versions` con versionado de presupuestos
- Triggers automáticos para historial
- Funciones PL/pgSQL para comparar versiones
- Políticas RLS (Row Level Security)

---

## ⚙️ Paso 3: Configurar Variables en Vercel (Ambas Opciones)

**En Vercel Dashboard → Project Settings → Environment Variables:**

Agregar estas variables (tomar valores de `.env.production` o Supabase):

```
NEXT_PUBLIC_SUPABASE_URL = https://nmcrmgdnpzrrklpcgyzn.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = [anon key]
SUPABASE_SERVICE_ROLE_KEY = [service role key]
NEXT_PUBLIC_SENTRY_DSN = [optional - para error tracking]
NODE_ENV = production
```

> **Nota:** Las variables con `NEXT_PUBLIC_` se exponen al cliente. Las otras quedan privadas en servidor.

---

## ✅ Validación Post-Deploy

Después de deployar, ejecuta:

```bash
bash smoke-test.sh
```

O manualmente:

```bash
# Reemplaza con tu dominio de Vercel
curl https://tu-app.vercel.app/api/quotes

# Deberías obtener: {"success": true} o error 401 (sin auth, esperado)
```

---

## 📊 Monitoreo en Producción

### Logs de Vercel
- **Vercel Dashboard → Deployments → View Logs**

### Errores (Sentry - Opcional)
- **Sentry Dashboard → Issues**
- Se reportan automáticamente si `NEXT_PUBLIC_SENTRY_DSN` está configurado

### Base de Datos (Supabase)
- **Supabase Dashboard → Database → Logs**

---

## 🔄 Actualizar Después del Deploy

```bash
# Cambios locales
git add .
git commit -m "feat: describe the feature"
git push origin main

# Vercel se redeploya automáticamente
```

---

## 🚨 Rollback (Si Algo Sale Mal)

### En Vercel:
1. **Vercel Dashboard → Deployments**
2. Haz click en un deployment anterior
3. Click en **Promote to Production**

### En Supabase:
Si aplicas una migración errónea, ejecuta en SQL Editor:
```sql
DROP TABLE quote_versions CASCADE;
-- Luego reaplicar la migración correcta
```

---

## 📞 Troubleshooting

### "Build failed"
```bash
# Verifica localmente
npm run build
```

### "Database error" después de deploy
- Verifica que la migración se aplicó en Supabase
- Valida que las variables de BD están en Vercel

### "Unauthorized" en API
- Checkea token de Supabase en `.env.production`
- Revisa políticas RLS en Supabase Dashboard

---

## 📈 Stack en Producción

- **Framework:** Next.js 16.0.7 (Turbopack)
- **Database:** Supabase PostgreSQL + RLS
- **Auth:** Supabase Auth
- **Deployment:** Vercel
- **Validation:** Zod + React Hook Form
- **Monitoring:** Sentry (opcional)
- **Logging:** Custom logger + Sentry

---

**¿Listo? Ejecuta:**
```bash
git push origin main  # (Opción A)
# o
vercel --prod        # (Opción B)
```

**Tiempo total:** ~5-10 minutos ⏱️
